import { humanize, DEFAULT_SETTINGS } from "./humanize.js";

const MENU_ID = "humanize-copy";

let cachedSettings = { ...DEFAULT_SETTINGS };

function refreshSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (stored) => {
    cachedSettings = { ...DEFAULT_SETTINGS, ...stored };
  });
}

function isRestrictedPage(url) {
  return (
    !url ||
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:")
  );
}

function copyViaPage(tabId, text) {
  return chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: (value) => {
      const fallback = () => {
        const el = document.createElement("textarea");
        el.value = value;
        el.setAttribute("readonly", "");
        el.style.cssText = "position:fixed;top:0;left:0;opacity:0";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      };

      if (navigator.clipboard?.writeText) {
        return navigator.clipboard.writeText(value).catch(fallback);
      }
      return fallback();
    },
    args: [text],
  });
}

function copyText(tab, text) {
  const restricted = isRestrictedPage(tab.url);

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {
      if (restricted) {
        console.error(
          "Humanize Copy: cannot run on browser pages (chrome://, etc.). Use a normal website."
        );
        return;
      }
      copyViaPage(tab.id, text).catch((err) => {
        console.error("Humanize Copy failed:", err);
      });
    });
    return;
  }

  if (restricted) {
    console.error(
      "Humanize Copy: cannot run on browser pages (chrome://, etc.). Use a normal website."
    );
    return;
  }

  copyViaPage(tab.id, text).catch((err) => {
    console.error("Humanize Copy failed:", err);
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "Copy & Humanize",
    contexts: ["selection"],
  });
  refreshSettings();
});

chrome.runtime.onStartup.addListener(refreshSettings);

chrome.storage.onChanged.addListener((_, area) => {
  if (area === "sync") refreshSettings();
});

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;

  const cleaned = humanize(info.selectionText || "", cachedSettings);
  copyText(tab, cleaned);
});
