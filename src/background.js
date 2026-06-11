import { humanize, DEFAULT_SETTINGS } from "./humanize.js";

const MENU_ID = "humanize-copy";
const LATEST_COPY_KEY = "latestCopy";

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

  const write = () => {
    if (navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(text).catch(() => {
        if (restricted) {
          throw new Error("restricted-page");
        }
        return copyViaPage(tab.id, text);
      });
    }

    if (restricted) {
      return Promise.reject(new Error("restricted-page"));
    }

    return copyViaPage(tab.id, text);
  };

  return write().catch((err) => {
    if (err?.message === "restricted-page") {
      console.error(
        "Humanize Copy: cannot run on browser pages (chrome://, etc.). Use a normal website."
      );
      return false;
    }
    console.error("Humanize Copy failed:", err);
    return false;
  });
}

function saveLatestCopy({ original, humanized, copied, tabId }) {
  const entry = {
    original,
    humanized,
    copied,
    timestamp: Date.now(),
  };

  chrome.storage.local.set({ [LATEST_COPY_KEY]: entry });

  if (tabId) {
    chrome.sidePanel.open({ tabId }).catch(() => {});
  }
}

function configureSidePanel() {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
}

// info.selectionText flattens all whitespace to single spaces, so line breaks
// are lost. Read the real selection from the page to keep the structure.
async function getSelectionFromPage(tab) {
  if (isRestrictedPage(tab.url)) return null;
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString() ?? "",
    });
    return result?.result || null;
  } catch {
    return null;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "Copy && Humanize",
    contexts: ["selection"],
  });
  configureSidePanel();
  refreshSettings();
});

chrome.runtime.onStartup.addListener(() => {
  configureSidePanel();
  refreshSettings();
});

chrome.storage.onChanged.addListener((_, area) => {
  if (area === "sync") refreshSettings();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "copyText") return;

  const write = () => {
    if (navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(message.text);
    }
    return Promise.reject(new Error("clipboard-unavailable"));
  };

  write()
    .then(() => sendResponse({ ok: true }))
    .catch(() => sendResponse({ ok: false }));

  return true;
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;

  const original = (await getSelectionFromPage(tab)) ?? info.selectionText ?? "";
  const humanized = humanize(original, cachedSettings);
  const copied = await copyText(tab, humanized);

  saveLatestCopy({
    original,
    humanized,
    copied: copied !== false,
    tabId: tab.id,
  });
});
