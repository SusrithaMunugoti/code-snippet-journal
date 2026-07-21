// Create context menu item on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveSnippet",
    title: "Save to Code Snippet Journal",
    contexts: ["selection"]
  });
});

// Runs INSIDE the page. Reads the real DOM range instead of the
// browser's rendered/collapsed selection string, so indentation,
// tabs, and line breaks from the original source are preserved.
function getFormattedSelection() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;

  const range = sel.getRangeAt(0);
  const startEl = range.startContainer.nodeType === 3
    ? range.startContainer.parentElement
    : range.startContainer;
  const codeAncestor = startEl && startEl.closest ? startEl.closest("pre, code") : null;

  const fragment = range.cloneContents();
  const container = document.createElement("div");
  container.appendChild(fragment);

  if (codeAncestor) {
    // Inside a <pre>/<code> block: textContent already holds the
    // exact original whitespace, untouched by CSS collapsing.
    return container.textContent;
  }

  // Fallback for code not wrapped in <pre>/<code>: turn line-breaking
  // elements into real newlines before reading textContent.
  container.querySelectorAll("br").forEach(br => br.replaceWith("\n"));
  container.querySelectorAll("div, p, li, tr").forEach(el => {
    el.insertAdjacentText("afterend", "\n");
  });
  return container.textContent;
}

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "saveSnippet" && info.selectionText) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getFormattedSelection
    }).then((results) => {
      const extracted = results && results[0] ? results[0].result : null;
      const code = (extracted && extracted.trim().length > 0) ? extracted : info.selectionText;
      saveSnippet(code, tab);
    }).catch(() => {
      // If script injection fails (e.g. restricted page), fall back to the raw selection
      saveSnippet(info.selectionText, tab);
    });
  }
});

function saveSnippet(code, tab) {
  const snippet = {
    id: Date.now().toString(),
    code,
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
