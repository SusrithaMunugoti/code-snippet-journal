// Create context menu item on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveSnippet",
    title: "Save to Code Snippet Journal",
    contexts: ["selection"]
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "saveSnippet" && info.selectionText) {
    const snippet = {
      id: Date.now().toString(),
      code: info.selectionText,
      url: tab.url,
      title: tab.title,
      date: new Date().toISOString(),
      tag: "",
      note: ""
    };

    chrome.storage.local.get({ snippets: [] }, (data) => {
      const snippets = [snippet, ...data.snippets];
      chrome.storage.local.set({ snippets }, () => {
        // Notify the tab that the snippet was saved
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const toast = document.createElement("div");
            toast.textContent = "✓ Saved to Code Snippet Journal";
            toast.style.cssText = `
              position: fixed; bottom: 24px; right: 24px; z-index: 999999;
              background: #1a1a2e; color: #a78bfa; font-family: monospace;
              font-size: 13px; padding: 10px 16px; border-radius: 8px;
              border: 1px solid #a78bfa44; box-shadow: 0 4px 20px #0008;
              animation: fadeIn 0.2s ease;
            `;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2500);
          }
        });
      });
    });
  }
});
