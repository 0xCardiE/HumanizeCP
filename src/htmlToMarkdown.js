import { markdownFromSelection } from "./htmlToMarkdownCore.js";

export { htmlToMarkdown, markdownFromSelection } from "./htmlToMarkdownCore.js";

export function pasteTextFromClipboard(clipboardData) {
  const html = clipboardData.getData("text/html");
  const plain = clipboardData.getData("text/plain");

  return markdownFromSelection(html, plain);
}
