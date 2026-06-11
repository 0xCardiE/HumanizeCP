import { humanize, DEFAULT_SETTINGS, RULE_GROUPS, RULE_LABELS } from "./humanize.js";

const form = document.getElementById("settings-form");
const rulesList = document.getElementById("rules-list");
const previewInput = document.getElementById("preview-input");
const previewOutput = document.getElementById("preview-output");
function readFormSettings() {
  const settings = { ...DEFAULT_SETTINGS };
  for (const group of RULE_GROUPS) {
    for (const key of group.rules) {
      const input = form.querySelector(`[name="${key}"]`);
      settings[key] = input ? input.checked : DEFAULT_SETTINGS[key];
    }
  }
  return settings;
}

function renderRules(settings) {
  rulesList.innerHTML = "";
  for (const group of RULE_GROUPS) {
    const groupEl = document.createElement("li");
    groupEl.className = "rule-group";
    groupEl.innerHTML = `<h3 class="rule-group-name">${group.name}</h3>`;

    const items = document.createElement("ul");
    items.className = "rule-group-list";

    for (const key of group.rules) {
      const meta = RULE_LABELS[key];
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
      items.appendChild(li);
    }

    groupEl.appendChild(items);
    rulesList.appendChild(groupEl);
  }
}

function saveSettings(settings) {
  chrome.storage.sync.set(settings);
}

function runPreview() {
  previewOutput.textContent = humanize(previewInput.value, readFormSettings());
}

function fitPreviewInput() {
  previewInput.style.height = "auto";
  previewInput.style.height = `${previewInput.scrollHeight}px`;
}

chrome.storage.sync.get(DEFAULT_SETTINGS, (stored) => {
  const settings = { ...DEFAULT_SETTINGS, ...stored };
  renderRules(settings);
  runPreview();
  fitPreviewInput();
});

form.addEventListener("change", () => {
  saveSettings(readFormSettings());
  runPreview();
});

previewInput.addEventListener("input", () => {
  fitPreviewInput();
  runPreview();
});

window.addEventListener("resize", fitPreviewInput);
