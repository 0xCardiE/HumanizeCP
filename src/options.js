import {
  humanize,
  DEFAULT_SETTINGS,
  RULE_LABELS,
} from "./humanize.js";

const form = document.getElementById("settings-form");
const rulesList = document.getElementById("rules-list");
const statusEl = document.getElementById("status");
const previewInput = document.getElementById("preview-input");
const previewOutput = document.getElementById("preview-output");
const previewBtn = document.getElementById("preview-btn");
const enableAllBtn = document.getElementById("enable-all");
const disableAllBtn = document.getElementById("disable-all");

let saveTimer;

function showStatus(message) {
  statusEl.textContent = message;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    statusEl.textContent = "";
  }, 2000);
}

function readFormSettings() {
  const settings = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(RULE_LABELS)) {
    const input = form.querySelector(`[name="${key}"]`);
    settings[key] = input ? input.checked : DEFAULT_SETTINGS[key];
  }
  return settings;
}

function renderRules(settings) {
  rulesList.innerHTML = "";
  for (const [key, meta] of Object.entries(RULE_LABELS)) {
    const li = document.createElement("li");
    li.className = "rule-item";
    li.innerHTML = `
      <label>
        <input type="checkbox" name="${key}" ${settings[key] ? "checked" : ""} />
        <span>
          <span class="rule-name">${meta.name}</span>
          <span class="rule-desc">${meta.description}</span>
        </span>
      </label>
    `;
    rulesList.appendChild(li);
  }
}

function saveSettings(settings) {
  chrome.storage.sync.set(settings, () => {
    showStatus("Settings saved.");
  });
}

function runPreview() {
  const settings = readFormSettings();
  previewOutput.textContent = humanize(previewInput.value, settings);
}

function setAll(enabled) {
  for (const key of Object.keys(RULE_LABELS)) {
    const input = form.querySelector(`[name="${key}"]`);
    if (input) input.checked = enabled;
  }
  saveSettings(readFormSettings());
  runPreview();
}

chrome.storage.sync.get(DEFAULT_SETTINGS, (stored) => {
  const settings = { ...DEFAULT_SETTINGS, ...stored };
  renderRules(settings);
  runPreview();
});

form.addEventListener("change", () => {
  const settings = readFormSettings();
  saveSettings(settings);
  runPreview();
});

previewBtn.addEventListener("click", runPreview);
enableAllBtn.addEventListener("click", () => setAll(true));
disableAllBtn.addEventListener("click", () => setAll(false));
