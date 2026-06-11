import { humanize, DEFAULT_SETTINGS } from "./humanize.js";

const MENU_ID = "humanize-copy";
const SITE_ACCESS = { origins: ["<all_urls>"] };

let cachedSettings = { ...DEFAULT_SETTINGS };
let hasSiteAccess = false;

function refreshSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (stored) => {
    cachedSettings = { ...DEFAULT_SETTINGS, ...stored };
  });
}

function refreshSiteAccess() {
  chrome.permissions.contains(SITE_ACCESS, (granted) => {
    hasSiteAccess = granted;
  });
}

function copyViaPage(tabId, text) {
  return chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: (value) => {
      const el = document.createElement("textarea");
      el.value = value;
      el.setAttribute("readonly", "");
      el.style.cssText = "position:fixed;top:0;left:0;opacity:0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    },
    args: [text],
  });
}

function copyText(tabId, text) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => copyViaPage(tabId, text));
    return;
  }
  copyViaPage(tabId, text);
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "Copy & Humanize",
    contexts: ["selection"],
  });
  refreshSettings();
  refreshSiteAccess();
});

chrome.runtime.onStartup.addListener(() => {
  refreshSettings();
  refreshSiteAccess();
});

chrome.storage.onChanged.addListener((_, area) => {
  if (area === "sync") refreshSettings();
});

chrome.permissions.onAdded.addListener(refreshSiteAccess);
chrome.permissions.onRemoved.addListener(refreshSiteAccess);

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;

  const cleaned = humanize(info.selectionText || "", cachedSettings);

  if (!hasSiteAccess) {
    chrome.permissions.request(SITE_ACCESS, (granted) => {
      hasSiteAccess = granted;
      if (granted) copyText(tab.id, cleaned);
    });
    return;
  }

  copyText(tab.id, cleaned);
});
