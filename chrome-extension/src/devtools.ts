chrome.devtools.panels.setOpenResourceHandler(
  ((resource: chrome.devtools.inspectedWindow.Resource, lineNumber: number) => {
    const filePath = resource.url.split('/').slice(3).join('/');
    let url = `vscode://open-in-vscode.uri-handler/${filePath}`;
    if (lineNumber) url += `:${lineNumber}`;
    console.log({ resource, lineNumber, filePath, url });

    // chrome.tabs.update({ url })

    chrome.scripting.executeScript({
      target: { tabId: chrome.devtools.inspectedWindow.tabId },
      func: (url) => {
        window.open(url, '_blank');
      },
      args: [url],
    });
  }) as unknown as Parameters<typeof chrome.devtools.panels.setOpenResourceHandler>[0],
);
