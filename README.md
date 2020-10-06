<h2 align="center">Aging Lines</h2>

<p align="center">A POC extension for Visual Studio Code that lets you style source code lines by their commit age</p>

## Table of Contents

- [About](#about)
- [Usage](#usage)
- [Prerequisite](#prerequisite)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [License](#license)

![Screenshot of the extension in use](https://raw.githubusercontent.com/kodanbce/aging-lines-vscode/master/screenshot.png)

## About <a name = "about"></a>

Software bugs are often caused by recently introduced changes. Therefore, when hunting down bugs, it is usually helpful to refer to `git log` and look for anything suspicious. However, perusing commits one-by-one is mentally taxing since you often need to keep all the diffs, line numbers and commit messages in your memory and it's easy to lose track of things.

This extension colors lines' backgrounds based on when they were last changed. In other words, it lets you see the annual rings of a file and thus gain a high-level understanding of its changes. Seeing the volatility of lines with your eyes might let you notice things – and bugs – you might not be able to spot in plain logs.

## Usage <a name = "usage"></a>

Open up VSCode, press `Ctrl+P` and paste this in: `ext install firoxer.aging-lines-vscode`. Press `Ctrl+Shift+P` and type in "Toggle Aging Lines" to enable the extension. You can change the age and style settings with `Ctrl+,`. The settings format should be fairly obvious. The styles you can set are documented [here](https://code.visualstudio.com/api/references/vscode-api#DecorationRenderOptions).

## Prerequisite <a name = "prerequisite"></a>

You need to have `git` executable from the command line.

## :hammer: Development <a name = "development"></a>

Clone this repo, open it up in VSCode and hit F5 to spawn a debug window with the extension enabled.

You can modify the extension in the first window and hit `Ctrl+Shift+F5` to respawn the debug window.

When using the debug window, remember to enable the plugin's functionality via `Ctrl+Shift+P` with the command name "Toggle Aging Lines".

## :tada: Deployment <a name = "deployment"></a>

You can publish a new version of the code with the `vsce` tool. See [here](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).

## :page_with_curl: License <a name = "license"></a>

MIT
