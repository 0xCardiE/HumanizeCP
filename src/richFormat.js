import { stripMarkdownForPaste } from "./plainText.js";

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/~~([^~]+)~~/g, "<s>$1</s>");
}

export function markdownToHtml(text) {
  if (!text) return "";

  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const parts = [];
  let listType = null;
  let paragraphLines = [];

  function flushParagraph() {
    if (!paragraphLines.length) return;
    parts.push(`<p>${paragraphLines.map(inlineMarkdown).join("<br>")}</p>`);
    paragraphLines = [];
  }

  function closeList() {
    if (!listType) return;
    parts.push(`</${listType}>`);
    listType = null;
  }

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushParagraph();
      closeList();
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      parts.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      flushParagraph();
      closeList();
      parts.push(
        `<blockquote><p>${inlineMarkdown(trimmed.replace(/^>\s?/, ""))}</p></blockquote>`
      );
      continue;
    }

    const bullet = trimmed.match(/^[\-*+]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      if (listType !== "ul") {
        closeList();
        parts.push("<ul>");
        listType = "ul";
      }
      parts.push(`<li>${inlineMarkdown(bullet[1])}</li>`);
      continue;
    }

    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      if (listType !== "ol") {
        closeList();
        parts.push("<ol>");
        listType = "ol";
      }
      parts.push(`<li>${inlineMarkdown(ordered[1])}</li>`);
      continue;
    }

    closeList();
    paragraphLines.push(trimmed);
  }

  flushParagraph();
  closeList();

  return `<html><body>${parts.join("")}</body></html>`;
}

export function formatForPaste(text) {
  return {
    plain: stripMarkdownForPaste(text),
    html: markdownToHtml(text),
  };
}
