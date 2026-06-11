import {
  diffWords,
  renderDiffHtml,
  countChanges,
  hasChanges,
} from "./diff.js";

const STORAGE_KEY = "latestCopy";

const emptyState = document.getElementById("empty-state");
const copyPanel = document.getElementById("copy-panel");
const clipboardStatus = document.getElementById("clipboard-status");
const copyTime = document.getElementById("copy-time");
const changeStats = document.getElementById("change-stats");
const diffView = document.getElementById("diff-view");
const originalText = document.getElementById("original-text");
const humanizedText = document.getElementById("humanized-text");
const openSettings = document.getElementById("open-settings");

function formatTime(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function renderCopy(entry) {
  if (!entry?.original && !entry?.humanized) {
    emptyState.hidden = false;
    copyPanel.hidden = true;
    return;
  }

  emptyState.hidden = true;
  copyPanel.hidden = false;

  const { original, humanized, timestamp, copied } = entry;
  const segments = diffWords(original, humanized);
  const changes = countChanges(segments);
  const changed = hasChanges(original, humanized);

  copyTime.textContent = formatTime(timestamp);
  clipboardStatus.textContent = copied === false ? "Not copied" : "On clipboard";
  clipboardStatus.hidden = false;

  if (!changed) {
    changeStats.textContent = "No changes — text was already clean.";
    diffView.textContent = humanized;
  } else {
    changeStats.textContent = `${changes} change${changes === 1 ? "" : "s"} · ${original.length} → ${humanized.length} characters`;
    diffView.innerHTML = renderDiffHtml(segments);
  }

  originalText.textContent = original;
  humanizedText.textContent = humanized;
}

function loadLatestCopy() {
  chrome.storage.local.get(STORAGE_KEY, (stored) => {
    renderCopy(stored[STORAGE_KEY]);
  });
}

openSettings.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[STORAGE_KEY]) {
    renderCopy(changes[STORAGE_KEY].newValue);
  }
});

loadLatestCopy();
