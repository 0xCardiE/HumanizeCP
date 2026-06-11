# Privacy Policy — Humanize Copy/Paste

**Last updated:** June 11, 2026

Humanize Copy/Paste ("the extension") is a Chrome browser extension that cleans up common AI writing tells in text you copy. This policy explains what data the extension uses and how it is handled.

## Summary

- All text processing happens **locally in your browser**.
- The extension **does not send your text** to any server.
- The extension **does not collect**, sell, or share personal data with third parties.
- The extension **does not use analytics** or advertising.

## Data the extension uses

### Text you select or paste

When you use **Copy & Humanize**, paste text into the side panel, or copy cleaned output, the extension reads that text only to apply cleanup rules on your device. Text is not transmitted off your device for processing or storage by us.

### Settings

Your cleanup rule preferences (which rules are on or off) are saved using Chrome’s built-in storage APIs (`chrome.storage.sync` and `chrome.storage.local`). If you are signed into Chrome and have sync enabled, settings may sync across your devices through Google’s Chrome sync service, subject to [Google’s privacy policy](https://policies.google.com/privacy).

### Recent copy (local only)

The side panel may store your most recent copy session (original text, cleaned text, and timestamp) in **local storage on your device** so you can review changes. This data stays on your device and is not sent to us.

## Permissions

The extension requests permissions needed to work on pages where you select or paste text:

| Permission | Why it is used |
|------------|----------------|
| `contextMenus` | Adds the **Copy & Humanize** right-click action |
| `storage` | Saves your rule settings and recent copy session locally |
| `scripting` | Reads selected text and writes to the clipboard on the active page |
| `sidePanel` | Shows the review panel with diffs and paste-to-clean |
| `activeTab` | Grants temporary access to the current tab when you use Copy & Humanize or click the extension |

These permissions are used only to provide the extension’s features. They are not used to track browsing history or collect data for advertising.

## Third parties

The extension does not integrate third-party analytics, advertising, or remote APIs. No third party receives your text or browsing data from the extension.

## Children’s privacy

The extension is not directed at children under 13, and we do not knowingly collect personal information from children.

## Changes to this policy

We may update this policy from time to time. The **Last updated** date at the top will reflect the latest version. Continued use of the extension after changes means you accept the updated policy.

## Contact

For privacy questions about Humanize Copy/Paste, open an issue on the project repository:

https://github.com/0xCardiE/HumanizeCP/issues
