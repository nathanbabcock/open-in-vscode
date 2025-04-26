/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { UriHandler, Uri, window, Disposable, LogOutputChannel, workspace, Selection, Position } from 'vscode';

import { name, publisher } from '../package.json';

const urlPrefix = `vscode://${publisher}.${name}/`;

export class OpenInVSCodeProtocolHandler implements UriHandler {

	private disposables: Disposable[] = [];

	constructor(private readonly logger: LogOutputChannel) {
    this.logger.info(`OpenInVSCodeProtocolHandler constructor()`);
		this.disposables.push(window.registerUriHandler(this));
	}

	handleUri(uri: Uri): void {
		this.logger.info(`OpenInVSCodeProtocolHandler.handleUri(${uri.toString(true)})`);

    const [filePath, lineNumber] = uri.toString(true).replace(urlPrefix, '').split(':');

    this.logger.info("stuff:", { uri, filePath, lineNumber });

    const position = lineNumber ? new Position(Number(lineNumber) - 1, 0) : undefined;
    const selection = position ? new Selection(position, position) : undefined;

    // Open file path in workspace
    const workspaceFolders = workspace.workspaceFolders;
    for (const workspaceFolder of workspaceFolders ?? []) {
      const fileUri = Uri.joinPath(workspaceFolder.uri, filePath);
      window.showTextDocument(fileUri, { selection }).then(() => {
        this.logger.info(`Opened file: ${fileUri.toString()}`);
      }, (error) => {
        this.logger.error(`Failed to open file: ${error}`);
        window.showErrorMessage(`Can't find ${fileUri.toString()}`);
      });
    }
  }

	dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
	}
}
