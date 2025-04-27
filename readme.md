# Open in VS Code

Jump from Chrome Devtools to VS Code with a single click.

## Usage

[![GIF](./open-in-vscode.gif)](./open-in-vscode.gif)

## How it works

Chrome allows you to register a callback for this purpose called [`setOpenResourceHandler`](https://developer.chrome.com/docs/extensions/reference/api/devtools/panels#method-setOpenResourceHandler). This provides a URL and line number whenever a "linkified" resource is clicked inside a dev tools panel, for example on an error stack trace or console message. By default it opens the Sources panel, but extensions can register themselves as alternative handlers.

The chrome extension registers itself as a handler and constructs a `vscode://` protocol URI ([`devtools.ts`](./chrome-extension/src/devtools.ts)):

```ts
chrome.devtools.panels.setOpenResourceHandler(
  ((resource: chrome.devtools.inspectedWindow.Resource, lineNumber: number) => {
    const filePath = resource.url.split('/').slice(3).join('/'); // strip https://localhost:123/
    let url = `vscode://open-in-vscode.uri-handler/${filePath}`;
    if (lineNumber) url += `:${lineNumber}`;

    chrome.scripting.executeScript({
      target: { tabId: chrome.devtools.inspectedWindow.tabId },
      func: (url) => {
        window.open(url, '_blank');
      },
      args: [url],
    });
  }) as unknown as Parameters<typeof chrome.devtools.panels.setOpenResourceHandler>[0],
);
```

A couple things to note:

- The types and API docs are missing the `lineNumber` callback param
- The custom URI authority must be `[publisher].[identifier]` in order for the VS Code extension to receive the custom URI event
- `chrome.scripting` is used instead of `chrome.tabs.update` because it gives the user the option of selecting "Always open in VS Code" on a per-domain basis, although it requires the `scripting` permission in the manifest
- It's only configured to work on `localhost` domains, both for security and because remote production domains are unlikely to have a sourcemap pointing to anything relevant on the local filesystem
  - **todo:** fall back to default "Open in source panel" behavior there (PR welcome)

On the other end, the VS Code extension listens for custom URI events and interpets them as workspace file URLs ([`protocol.ts`](./vscode-extension/src/protocol.ts)):

```ts
handleUri(uri: Uri): void {
    this.logger.info(`OpenInVSCodeProtocolHandler.handleUri(${uri.toString(true)})`);

    const [filePath, lineNumber] = uri.toString(true).replace(urlPrefix, '').split(':');
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
```

## Installation

- Download the latest release
- Install the VS Code plugin ("Install from VSIX…")
- Install the Chrome extension (["Load unpacked"](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked))
- Open Devtools settings and set "Open in VS Code" as the default link handler:

![Devtools link handling](link-handling.png)

You an also right click on any resource link and choose "Open with Open in VS Code" on a case-by-case basis.

## Development

1. Build and install VS Code extension to handle the custom URI
    - In `vscode-extension` run `pnpm vsce prepare`
2. Build and install the Chrome extension
    - In `chrome-extension` run `pnpm build`

## Contributing

Let me know if this is useful and I'll publish the extensions to Chrome and
VS Code marketplaces.

Open an issue or PR if you have any suggestions or improvements.
