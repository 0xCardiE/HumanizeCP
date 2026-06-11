function isBoldStyle(style) {
  if (!style) return false;
  return /font-weight:\s*(bold|[6-9]00)/i.test(style);
}

function isItalicStyle(style) {
  if (!style) return false;
  return /font-style:\s*italic/i.test(style);
}

function isStrikeStyle(style) {
  if (!style) return false;
  return (
    /text-decoration:\s*[^;]*line-through/i.test(style) ||
    /text-decoration-line:\s*line-through/i.test(style)
  );
}

function wrapInline(text, wrapper) {
  const trimmed = text.trim();
  if (!trimmed) return text;
  return text.replace(trimmed, `${wrapper}${trimmed}${wrapper}`);
}

function childrenToMarkdown(node, context) {
  return Array.from(node.childNodes)
    .map((child) => nodeToMarkdown(child, context))
    .join("");
}

function nodeToMarkdown(node, context = {}) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent.replace(/\u00a0/g, " ");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const tag = node.tagName.toLowerCase();

  if (tag === "script" || tag === "style" || tag === "meta" || tag === "head") {
    return "";
  }

  switch (tag) {
    case "br":
      return "\n";
    case "hr":
      return "\n---\n\n";
    case "p":
    case "div": {
      const inner = childrenToMarkdown(node, context).trim();
      return inner ? `${inner}\n\n` : "";
    }
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6": {
      const level = Number(tag[1]);
      const inner = childrenToMarkdown(node, context).trim();
      return inner ? `${"#".repeat(level)} ${inner}\n\n` : "";
    }
    case "strong":
    case "b": {
      const inner = childrenToMarkdown(node, context);
      return inner.trim() ? wrapInline(inner, "**") : inner;
    }
    case "em":
    case "i": {
      const inner = childrenToMarkdown(node, context);
      return inner.trim() ? wrapInline(inner, "*") : inner;
    }
    case "u": {
      return childrenToMarkdown(node, context);
    }
    case "s":
    case "del":
    case "strike": {
      const inner = childrenToMarkdown(node, context);
      return inner.trim() ? wrapInline(inner, "~~") : inner;
    }
    case "a": {
      const href = node.getAttribute("href")?.trim() || "";
      const text = childrenToMarkdown(node, context).trim();
      if (!text) return "";
      if (href && !href.startsWith("javascript:")) {
        return `[${text}](${href})`;
      }
      return text;
    }
    case "code": {
      const inner = childrenToMarkdown(node, context);
      if (inner.includes("\n")) {
        return `\`\`\`\n${inner.trim()}\n\`\`\``;
      }
      return `\`${inner}\``;
    }
    case "pre": {
      const code = node.querySelector("code");
      const inner = (code ? code.textContent : node.textContent).replace(/\n$/, "");
      return `\`\`\`\n${inner}\n\`\`\`\n\n`;
    }
    case "blockquote": {
      const inner = childrenToMarkdown(node, context).trim();
      if (!inner) return "";
      return `${inner
        .split("\n")
        .map((line) => (line ? `> ${line}` : ">"))
        .join("\n")}\n\n`;
    }
    case "ul":
    case "ol": {
      const items = Array.from(node.children).filter(
        (child) => child.tagName?.toLowerCase() === "li"
      );
      const lines = items.map((li, index) => {
        const prefix = tag === "ol" ? `${index + 1}. ` : "- ";
        return `${prefix}${childrenToMarkdown(li, context).trim()}`;
      });
      return lines.length ? `${lines.join("\n")}\n\n` : "";
    }
    case "li":
      return childrenToMarkdown(node, context);
    case "span": {
      const style = node.getAttribute("style") || "";
      let inner = childrenToMarkdown(node, context);
      if (isBoldStyle(style)) {
        inner = inner.trim() ? wrapInline(inner, "**") : inner;
      }
      if (isItalicStyle(style)) {
        inner = inner.trim() ? wrapInline(inner, "*") : inner;
      }
      if (isStrikeStyle(style)) {
        inner = inner.trim() ? wrapInline(inner, "~~") : inner;
      }
      return inner;
    }
    default:
      return childrenToMarkdown(node, context);
  }
}

function normalizeMarkdown(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function htmlToMarkdown(html) {
  if (!html?.trim()) return "";

  const cleaned = html
    .replace(/<!--StartFragment-->|<!--EndFragment-->/g, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  const doc = new DOMParser().parseFromString(cleaned, "text/html");
  const markdown = nodeToMarkdown(doc.body);
  const result = normalizeMarkdown(markdown);

  return result;
}

export function pasteTextFromClipboard(clipboardData) {
  const html = clipboardData.getData("text/html");
  const plain = clipboardData.getData("text/plain");

  if (html?.trim()) {
    const fromHtml = htmlToMarkdown(html);
    if (fromHtml) return fromHtml;
  }

  return plain;
}
