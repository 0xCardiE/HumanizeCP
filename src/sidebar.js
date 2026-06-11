import {
  diffWords,
  groupChanges,
  buildDisplayText,
  renderInteractiveDiffHtml,
  countWordChanges,
  hasChanges,
  isWordChange,
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

let currentEntry = null;
let lastTimestamp = null;
let revertedChanges = new Set();

function formatTime(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "copyText",
        text,
      });
      return response?.ok === true;
    } catch {
      return false;
    }
  }
}

function resetRevertsIfNewCopy(entry) {
  if (entry?.timestamp !== lastTimestamp) {
    revertedChanges = new Set();
    lastTimestamp = entry?.timestamp ?? null;
  }
}

function renderCopy(entry) {
  if (!entry?.original && !entry?.humanized) {
    currentEntry = null;
    emptyState.hidden = false;
    copyPanel.hidden = true;
    return;
  }

  resetRevertsIfNewCopy(entry);
  currentEntry = entry;

  emptyState.hidden = true;
  copyPanel.hidden = false;

  const { original, humanized, timestamp, copied } = entry;
  const baseSegments = diffWords(original, humanized);
  const changeGroups = groupChanges(baseSegments);
  const displayText = buildDisplayText(
    baseSegments,
    changeGroups,
    revertedChanges
  );
  const remainingChanges = countWordChanges(changeGroups, revertedChanges);
  const changed = hasChanges(original, humanized);

  copyTime.textContent = formatTime(timestamp);
  originalText.textContent = original;
  humanizedText.textContent = displayText;

  if (!changed) {
    changeStats.textContent = "No changes — text was already clean.";
    diffView.textContent = displayText;
    clipboardStatus.textContent = copied === false ? "Not copied" : "On clipboard";
    return;
  }

  if (remainingChanges === 0) {
    changeStats.textContent = "All word changes reverted.";
  } else {
    const revertedCount = changeGroups.filter(
      (group, index) => isWordChange(group) && revertedChanges.has(index)
    ).length;
    const stats = `${remainingChanges} change${remainingChanges === 1 ? "" : "s"}`;
    changeStats.textContent =
      revertedCount > 0
        ? `${stats} remaining · ${revertedCount} reverted`
        : `${stats} · click highlighted words to revert`;
  }

  diffView.innerHTML = renderInteractiveDiffHtml(
    baseSegments,
    changeGroups,
    revertedChanges
  );

  if (revertedChanges.size > 0) {
    clipboardStatus.textContent = copied === false ? "Not copied" : "Updated on clipboard";
  } else {
    clipboardStatus.textContent = copied === false ? "Not copied" : "On clipboard";
  }
}

async function toggleChange(changeId) {
  if (!currentEntry) return;

  const parsedId = Number(changeId);
  if (Number.isNaN(parsedId)) return;

  if (revertedChanges.has(parsedId)) {
    revertedChanges.delete(parsedId);
  } else {
    revertedChanges.add(parsedId);
  }

  const { original, humanized } = currentEntry;
  const baseSegments = diffWords(original, humanized);
  const changeGroups = groupChanges(baseSegments);
  const displayText = buildDisplayText(
    baseSegments,
    changeGroups,
    revertedChanges
  );

  renderCopy({ ...currentEntry, copied: true });
  await copyToClipboard(displayText);
}

function loadLatestCopy() {
  chrome.storage.local.get(STORAGE_KEY, (stored) => {
    renderCopy(stored[STORAGE_KEY]);
  });
}

openSettings.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

diffView.addEventListener("click", (event) => {
  const button = event.target.closest(".diff-change");
  if (!button) return;
  toggleChange(button.dataset.changeId);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[STORAGE_KEY]) {
    renderCopy(changes[STORAGE_KEY].newValue);
  }
});

loadLatestCopy();
