import * as vscode from 'vscode';
import { OpenInVSCodeProtocolHandler } from './protocol';

export function activate(context: vscode.ExtensionContext) {

  const logger = vscode.window.createOutputChannel('DevTools <=> VSCode', { log: true });
  logger.info(`OpenInVSCodeProtocolHandler.activate()`);

  context.subscriptions.push(logger);
  context.subscriptions.push(new OpenInVSCodeProtocolHandler(logger));
}

export function deactivate() {}
