import { execFile } from 'child_process';
import { dirname } from 'path';
import { promisify } from 'util';

const execFileP = promisify(execFile);

import * as vscode from 'vscode';

async function findModificationTimeByLine(path: string) {
  const blameOutput = await execFileP(
    'git',
    ['blame', '-t', path],
    { cwd: dirname(path) },
  );

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

const oldDecorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: 'rgba(255, 0, 0, 0.2)',
  isWholeLine: true,
});
const middleDecorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: 'rgba(255, 255, 0, 0.2)',
  isWholeLine: true,
});
const freshDecorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: 'rgba(0, 255, 0, 0.2)',
  isWholeLine: true,
});

export function activate(context: vscode.ExtensionContext) {
  let activeEditor = vscode.window.activeTextEditor;

  const updateDecorations = async () => {
    if (!activeEditor) {
      return;
    }

    const modificationTimeByLine = await findModificationTimeByLine(activeEditor.document.uri.fsPath);

    const linesOlderThanSixMonths: vscode.DecorationOptions[] = [];
    const linesOlderThanOneMonth: vscode.DecorationOptions[] = [];
    const freshLines: vscode.DecorationOptions[] = [];

    const sixMonthsAgo =
      new Date().valueOf() - (6 * 30 * 24 * 60 * 60 * 1000);
    const oneMonthAgo =
      new Date().valueOf() - (1 * 30 * 24 * 60 * 60 * 1000);

    for (const [lineNumber, modificationTime] of modificationTimeByLine.entries()) {
      if (modificationTime === null) {
        continue;
      }

      const decoration = { range: new vscode.Range(lineNumber, 0, lineNumber, 0) };

      if (modificationTime < sixMonthsAgo) {
        linesOlderThanSixMonths.push(decoration);
      } else if (modificationTime < oneMonthAgo) {
        linesOlderThanOneMonth.push(decoration);
      } else {
        freshLines.push(decoration);
      }
    }

    activeEditor.setDecorations(oldDecorationType, linesOlderThanSixMonths);
    activeEditor.setDecorations(middleDecorationType, linesOlderThanOneMonth);
    activeEditor.setDecorations(freshDecorationType, freshLines);
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
}
