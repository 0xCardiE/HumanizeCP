import { humanize, DEFAULT_SETTINGS } from "./humanize.js";
import { formatForPaste } from "./richFormat.js";
import { pasteTextFromClipboard } from "./htmlToMarkdown.js";
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
const clipboardNote = document.getElementById("clipboard-note");
const copyTime = document.getElementById("copy-time");
const changeStats = document.getElementById("change-stats");
const diffView = document.getElementById("diff-view");
const originalText = document.getElementById("original-text");
const humanizedText = document.getElementById("humanized-text");
const openSettings = document.getElementById("open-settings");
const pasteInput = document.getElementById("paste-input");
const plainTextBtn = document.getElementById("plain-text-btn");

let currentEntry = null;
let lastTimestamp = null;
let revertedChanges = new Set();
let cachedSettings = { ...DEFAULT_SETTINGS };
let isProcessingPaste = false;
let copyFeedbackTimer = null;
const COPY_BTN_LABEL = "Copy for Socials";

function setClipboardNote(copied, { updated = false, social = false } = {}) {
  clipboardNote.classList.remove(
    "clipboard-note--muted",
    "clipboard-note--error",
    "status-chip--pulse"
  );

  if (social) {
    clipboardNote.textContent = "Copied for Socials — paste into Gmail, Docs, or social apps.";
    return;
  }

  if (copied === false) {
    clipboardNote.textContent = "Could not copy to clipboard. Select and copy the text above manually.";
    clipboardNote.classList.add("clipboard-note--error");
    return;
  }

  clipboardNote.textContent = updated
    ? "Updated on your clipboard — ready to paste anywhere."
    : "On your clipboard — ready to paste anywhere.";
}

function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (stored) => {
      cachedSettings = { ...DEFAULT_SETTINGS, ...stored };
      resolve(cachedSettings);
    });
  });
}

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

async function copyForPaste(plain, html) {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/plain": new Blob([plain], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" }),
      }),
    ]);
    return true;
  } catch {
    return copyToClipboard(plain);
  }
}

function resetRevertsIfNewCopy(entry) {
  if (entry?.timestamp !== lastTimestamp) {
    revertedChanges = new Set();
    lastTimestamp = entry?.timestamp ?? null;
  }
}

function getHumanizedBaseText(entry) {
  const { original, humanized } = entry;
  const baseSegments = diffWords(original, humanized);
  const changeGroups = groupChanges(baseSegments);
  return buildDisplayText(baseSegments, changeGroups, revertedChanges);
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
  const displayText = getHumanizedBaseText(entry);
  const remainingChanges = countWordChanges(changeGroups, revertedChanges);
  const changed = hasChanges(original, humanized);

  copyTime.textContent = formatTime(timestamp);
  originalText.textContent = original;
  humanizedText.textContent = displayText;
  plainTextBtn.disabled = !displayText.trim();

  if (!changed) {
    changeStats.textContent = "No changes — text was already clean.";
    diffView.textContent = displayText;
    setClipboardNote(copied);
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

  setClipboardNote(copied, { updated: revertedChanges.size > 0 });
}

async function processPastedText(text) {
  const original = text.trim();
  if (!original || isProcessingPaste) return;

  isProcessingPaste = true;
  try {
    const settings = await getSettings();
    const humanized = humanize(original, settings);
    const { plain, html } = formatForPaste(humanized);
    const copied = await copyForPaste(plain, html);
    const entry = {
      original,
      humanized,
      copied,
      timestamp: Date.now(),
      source: "paste",
    };

    pasteInput.value = "";
    chrome.storage.local.set({ [STORAGE_KEY]: entry });
    renderCopy(entry);
  } finally {
    isProcessingPaste = false;
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

  const displayText = getHumanizedBaseText(currentEntry);

  renderCopy({ ...currentEntry, copied: true });
  const { plain, html } = formatForPaste(displayText);
  await copyForPaste(plain, html);
}

function resetCopyButtonFeedback() {
  plainTextBtn.textContent = COPY_BTN_LABEL;
  plainTextBtn.classList.remove("plain-text-btn--copied", "plain-text-btn--failed");
  if (currentEntry) {
    setClipboardNote(currentEntry.copied !== false, {
      updated: revertedChanges.size > 0,
    });
  }
}

function showCopyFeedback(copied) {
  resetCopyButtonFeedback();

  if (copied) {
    plainTextBtn.textContent = "Copied!";
    plainTextBtn.classList.add("plain-text-btn--copied");
    setClipboardNote(true, { social: true });
  } else {
    plainTextBtn.textContent = "Copy failed";
    plainTextBtn.classList.add("plain-text-btn--failed");
    setClipboardNote(false);
  }

  clipboardNote.classList.add("status-chip--pulse");

  clearTimeout(copyFeedbackTimer);
  copyFeedbackTimer = setTimeout(resetCopyButtonFeedback, 2000);
}

async function copyPlainText() {
  if (!currentEntry) return;

  const base = getHumanizedBaseText(currentEntry);
  if (!base.trim()) return;

  plainTextBtn.classList.add("plain-text-btn--active");
  const { plain, html } = formatForPaste(base);
  const copied = await copyForPaste(plain, html);
  plainTextBtn.classList.remove("plain-text-btn--active");
  showCopyFeedback(copied);
}

function loadLatestCopy() {
  chrome.storage.local.get(STORAGE_KEY, (stored) => {
    renderCopy(stored[STORAGE_KEY]);
  });
}

openSettings.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

pasteInput.addEventListener("paste", (event) => {
  event.preventDefault();
  const text = pasteTextFromClipboard(event.clipboardData);
  processPastedText(text);
});

pasteInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    processPastedText(pasteInput.value);
  }
});

diffView.addEventListener("click", (event) => {
  const button = event.target.closest(".diff-change");
  if (!button) return;
  toggleChange(button.dataset.changeId);
});

plainTextBtn.addEventListener("click", () => {
  copyPlainText();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync") {
    getSettings();
    return;
  }

  if (area === "local" && changes[STORAGE_KEY]) {
    renderCopy(changes[STORAGE_KEY].newValue);
  }
});

getSettings();
loadLatestCopy();
