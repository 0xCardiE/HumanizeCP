import { humanize, DEFAULT_SETTINGS } from "./humanize.js";
import { formatForPaste } from "./richFormat.js";
import { inferMarkdownFromPlain } from "./htmlToMarkdownCore.js";

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

async function copyRichViaPage(tabId, plain, html) {
  return chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: (plainValue, htmlValue) => {
      const fallback = () => {
        const el = document.createElement("textarea");
        el.value = plainValue;
        el.setAttribute("readonly", "");
        el.style.cssText = "position:fixed;top:0;left:0;opacity:0";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      };

      if (navigator.clipboard?.write) {
        return navigator.clipboard
          .write([
            new ClipboardItem({
              "text/plain": new Blob([plainValue], { type: "text/plain" }),
              "text/html": new Blob([htmlValue], { type: "text/html" }),
            }),
          ])
          .catch(fallback);
      }

      if (navigator.clipboard?.writeText) {
        return navigator.clipboard.writeText(plainValue).catch(fallback);
      }

      return fallback();
    },
    args: [plain, html],
  });
}

async function copyFormattedText(tab, text) {
  const { plain, html } = formatForPaste(text);
  const restricted = isRestrictedPage(tab.url);

  const writeRich = async () => {
    if (navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": new Blob([plain], { type: "text/plain" }),
          "text/html": new Blob([html], { type: "text/html" }),
        }),
      ]);
      return true;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(plain);
      return true;
    }

    if (restricted) {
      throw new Error("restricted-page");
    }

    await copyRichViaPage(tab.id, plain, html);
    return true;
  };

  try {
    return await writeRich();
  } catch (err) {
    if (err?.message === "restricted-page") {
      console.error(
        "Humanize Copy: cannot run on browser pages (chrome://, etc.). Use a normal website."
      );
      return false;
    }

    try {
      if (restricted) {
        throw new Error("restricted-page");
      }
      await copyViaPage(tab.id, plain);
      return true;
    } catch (fallbackErr) {
      if (fallbackErr?.message === "restricted-page") {
        console.error(
          "Humanize Copy: cannot run on browser pages (chrome://, etc.). Use a normal website."
        );
        return false;
      }
      console.error("Humanize Copy failed:", fallbackErr);
      return false;
    }
  }
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

async function getSelectionPlainFromPage(tab) {
  if (isRestrictedPage(tab.url)) return null;
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString() ?? "",
    });
    return result?.result ?? null;
  } catch {
    return null;
  }
}

// Convert the selection to markdown inside the page, where DOMParser works.
// executeScript rejects calls passing both `files` and `func`, so inject the
// helpers first, then invoke them in a second call.
async function getSelectionMarkdownFromPage(tab) {
  if (isRestrictedPage(tab.url)) return null;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: "MAIN",
      files: ["selectionMarkdownInjected.js"],
    });

    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: "MAIN",
      func: () => getSelectionMarkdownFromDom(),
    });

    const markdown = result?.result;
    return typeof markdown === "string" && markdown.trim() ? markdown : null;
  } catch (err) {
    console.error("Humanize Copy: selection markdown failed:", err);
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

  let original = await getSelectionMarkdownFromPage(tab);
  if (original == null || !original.trim()) {
    const plain = (await getSelectionPlainFromPage(tab)) ?? info.selectionText ?? "";
    original = inferMarkdownFromPlain(plain);
  }
  const humanized = humanize(original, cachedSettings);
  const copied = await copyFormattedText(tab, humanized);

  saveLatestCopy({
    original,
    humanized,
    copied: copied !== false,
    tabId: tab.id,
  });
});
