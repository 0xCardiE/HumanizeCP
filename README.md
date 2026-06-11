# Humanize Copy

Chrome extension that adds a **Copy & Humanize** option to the right-click menu. It copies selected text with subtle cleanup of common AI writing tells — em dashes, buzzwords, clichés, and formulaic phrases — without rewriting whole sentences.

Based on [How to spot when writing is AI](https://huntingthemuse.net/library/how-to-tell-if-writing-is-ai).

## Install (unpacked)

1. Run `npm install && npm run build`
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select the `dist/` folder

## Use

1. Select text on any page
2. Right-click → **Copy & Humanize**
3. Paste — the cleaned text is already on your clipboard

Click the extension icon to open settings and toggle individual cleanup rules.

## Development

```bash
npm install
npm run build      # build to dist/
npm run watch      # rebuild on changes
```

## Rules

Each rule can be enabled or disabled in settings:

- **Em dashes** — replace `—` with commas
- **Forced sass** — tone down "But here's the thing:", "Hot take:", etc.
- **AI buzzwords** — swap delve, leverage, unlock, tapestry, navigate, etc.
- **Cliché openers** — trim "In today's fast-paced digital landscape", etc.
- **Formulaic structures** — simplify "It's not just X. It's also Y."
- **Filler phrases** — remove "Here's why that matters", "The result?", etc.
- **Double punctuation** — fix `!!` and `??`
