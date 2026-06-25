const searchInput = document.getElementById("search");
const snippetList = document.getElementById("snippetList");
const emptyState = document.getElementById("emptyState");
const countEl = document.getElementById("count");

let allSnippets = [];

// ── Load snippets on open ──
chrome.storage.local.get({ snippets: [] }, (data) => {
  allSnippets = data.snippets;
  render(allSnippets);
});

// ── Search ──
searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase().trim();
  const filtered = allSnippets.filter(s =>
    s.code.toLowerCase().includes(q) ||
    s.tag.toLowerCase().includes(q) ||
    s.note.toLowerCase().includes(q) ||
    s.title.toLowerCase().includes(q)
  );
  render(filtered);
});

// ── Render ──
function render(snippets) {
  // Remove existing cards (keep emptyState)
  [...snippetList.querySelectorAll(".card")].forEach(c => c.remove());

  countEl.textContent = `${allSnippets.length} snippet${allSnippets.length !== 1 ? "s" : ""}`;

  if (snippets.length === 0) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  snippets.forEach(snippet => {
    snippetList.appendChild(createCard(snippet));
  });
}

// ── Create card DOM ──
function createCard(snippet) {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.id = snippet.id;

  const date = new Date(snippet.date).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric"
  });

  const hostname = (() => {
    try { return new URL(snippet.url).hostname; }
    catch { return snippet.url; }
  })();

  card.innerHTML = `
    <div class="card-meta">
      <span class="card-source">
        <a href="${escHtml(snippet.url)}" target="_blank" title="${escHtml(snippet.url)}">${escHtml(hostname)}</a>
      </span>
      <span class="card-date">${date}</span>
    </div>
    <div class="card-code">${escHtml(snippet.code)}</div>
    <div class="card-fields">
      <div class="field-row">
        <span class="field-label">tag</span>
        <input class="field-input tag-input" type="text" placeholder="e.g. javascript, css…" value="${escHtml(snippet.tag)}" maxlength="40" />
      </div>
      <div class="field-row">
        <span class="field-label">note</span>
        <input class="field-input note-input" type="text" placeholder="Add a note…" value="${escHtml(snippet.note)}" maxlength="200" />
      </div>
    </div>
    <div class="card-actions">
      <button class="btn-delete">Delete</button>
    </div>
  `;

  // Save tag on change
  card.querySelector(".tag-input").addEventListener("change", (e) => {
    updateSnippet(snippet.id, { tag: e.target.value.trim() });
  });

  // Save note on change
  card.querySelector(".note-input").addEventListener("change", (e) => {
    updateSnippet(snippet.id, { note: e.target.value.trim() });
  });

  // Delete
  card.querySelector(".btn-delete").addEventListener("click", () => {
    deleteSnippet(snippet.id);
    card.remove();
    allSnippets = allSnippets.filter(s => s.id !== snippet.id);
    countEl.textContent = `${allSnippets.length} snippet${allSnippets.length !== 1 ? "s" : ""}`;
    if (snippetList.querySelectorAll(".card").length === 0) {
      emptyState.style.display = "block";
    }
  });

  return card;
}

// ── Storage helpers ──
function updateSnippet(id, fields) {
  allSnippets = allSnippets.map(s => s.id === id ? { ...s, ...fields } : s);
  chrome.storage.local.set({ snippets: allSnippets });
}

function deleteSnippet(id) {
  const updated = allSnippets.filter(s => s.id !== id);
  chrome.storage.local.set({ snippets: updated });
}

// ── Escape HTML ──
function escHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
