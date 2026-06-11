# Humanize Copy/Paste

Chrome extension v1.1 — right-click → **Copy & Humanize** → paste cleaned text.

Based on [How to spot when writing is AI](https://huntingthemuse.net/library/how-to-tell-if-writing-is-ai) and [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing).

## Install

```bash
npm run export
```

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the **`extension/`** folder
4. Reload the extension after updates (`npm run export`, then click reload on `chrome://extensions`)

## Development

After any change to `src/`, export before reloading in Chrome:

```bash
npm run export
```

Or auto-export on save:

```bash
npm run watch
```

## Use

Select text → right-click → **Copy & Humanize** → paste.

Click the extension icon to toggle cleanup rules.

## Privacy

[Privacy Policy](PRIVACY.md)
