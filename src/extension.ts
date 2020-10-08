import { execFile } from 'child_process';
import { dirname } from 'path';
import { promisify } from 'util';

const execFileP = promisify(execFile);

import * as vscode from 'vscode';

async function findModificationTimeByLine(path: string) {
  let blameOutput;
  try {
    blameOutput = await execFileP(
      'git',
      ['blame', '-t', path],
      { cwd: dirname(path) },
    );
  } catch (e) {
    console.error(`Could not run git blame: ${e.message}`);
    return [];
  }

  const times = blameOutput.stdout.split('\n').map((line) => {
    const timestampMatch = line.match(/\d{10}/);

    if (timestampMatch === null) {
      // That's weird
      return null;
    }

    return parseInt(timestampMatch[0]) * 1000;
  });

  return times;
}

interface CategoryConfig {
  startsFromDay: number,
  decorationRenderOptions: Partial<vscode.DecorationRenderOptions>
}

function readCategoryConfigs(): CategoryConfig[] {
  return (vscode.workspace.getConfiguration().get('agingLines.categories') as CategoryConfig[])
    .sort((categoryA, categoryB) => categoryA.startsFromDay - categoryB.startsFromDay);
}

let categoryConfigs = readCategoryConfigs();

const decorationTypes = new Map();
function matchTimeSinceModificationToDecorationType(timeSinceModification: number) {
  const daysSinceTimestamp = timeSinceModification / (24 * 60 * 60 * 1000);

  let decorationRenderOptions;
  for (const categoryConfig of categoryConfigs) {
    if (daysSinceTimestamp >= categoryConfig.startsFromDay) {
      decorationRenderOptions = categoryConfig.decorationRenderOptions;
    }
  }

  if (!decorationTypes.has(decorationRenderOptions)) {
    // We could simplify this and just create a new TextEditorDecorationType
    // every time this function is called, but this singleton technique should
    // provide us with better VSCode performance
    decorationTypes.set(
      decorationRenderOptions,
      vscode.window.createTextEditorDecorationType({
        ...decorationRenderOptions,
        isWholeLine: true,
      })
    );
  }

  return decorationTypes.get(decorationRenderOptions);
}

export function activate(context: vscode.ExtensionContext) {
  let activeEditor = vscode.window.activeTextEditor;

  const showDecorations = async (editor: vscode.TextEditor) => {
    const modificationTimeByLine =
      await findModificationTimeByLine(editor.document.uri.fsPath);
    const latestModificationTime =
      Math.max(...modificationTimeByLine.filter((time) => time !== null) as number[]);

    const decorationsByDecorationType = new Map();

    for (const [lineNumber, modificationTime] of modificationTimeByLine.entries()) {
      if (modificationTime === null) {
        continue;
      }

      const decorationType = matchTimeSinceModificationToDecorationType(latestModificationTime - modificationTime);

      if (!decorationsByDecorationType.has(decorationType)) {
        decorationsByDecorationType.set(decorationType, []);
      }

      const decoration = { range: new vscode.Range(lineNumber, 0, lineNumber, 0) };
      decorationsByDecorationType.get(decorationType).push(decoration);
    }

    for (const [decorationType, decorations] of decorationsByDecorationType.entries()) {
      editor.setDecorations(decorationType, decorations);
    }
  };

  const hideDecorations = (editor: vscode.TextEditor) => {
    for (const decorationType of decorationTypes.values()) {
      editor.setDecorations(decorationType, []);
    }
  };

  let enabled = false;

  vscode.commands.registerCommand('agingLines.toggle', () => {
    enabled = !enabled;
    updateDecorations();
  });

  const updateDecorations = async () => {
    if (!activeEditor) {
      return;
    }

    if (enabled) {
      showDecorations(activeEditor);
    } else {
      hideDecorations(activeEditor);
    }
  };

  let timeout: NodeJS.Timer | undefined = undefined;

  const triggerUpdateDecorations = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
    timeout = setTimeout(updateDecorations, 500);
  };

  if (activeEditor) {
    triggerUpdateDecorations();
  }

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    activeEditor = editor;
    if (editor) {
      triggerUpdateDecorations();
    }
  }, null, context.subscriptions);

  vscode.workspace.onDidChangeTextDocument((event) => {
    if (activeEditor && event.document === activeEditor.document) {
      triggerUpdateDecorations();
    }
  }, null, context.subscriptions);

  vscode.workspace.onDidChangeConfiguration((event) => {
    categoryConfigs = readCategoryConfigs();
  });
}
