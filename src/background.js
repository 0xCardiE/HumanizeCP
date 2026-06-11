import { humanize, DEFAULT_SETTINGS } from "./humanize.js";

const MENU_ID = "humanize-copy";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "Copy & Humanize",
    contexts: ["selection"],
  });

  chrome.storage.sync.get(DEFAULT_SETTINGS, (stored) => {
    chrome.storage.sync.set({ ...DEFAULT_SETTINGS, ...stored });
  });
});

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, resolve);
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;

  const selection = info.selectionText || "";
  const settings = await getSettings();
  const cleaned = humanize(selection, settings);

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: "MAIN",
    func: (text) => {
      const copy = (value) => {
        const el = document.createElement("textarea");
        el.value = value;
        el.style.position = "fixed";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(el);
        return ok;
      };

      if (navigator.clipboard?.writeText) {
        return navigator.clipboard.writeText(text).catch(() => copy(text));
      }
      return copy(text);
    },
    args: [cleaned],
  });
});
