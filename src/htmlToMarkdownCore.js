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

function isHeadingClass(className) {
  return /\b(h1|h2|h3|h4|h5|h6|heading|headline|text-4xl|text-3xl|text-2xl|text-xl)\b/i.test(
    className
  );
}

function headingLevelFromClass(className) {
  if (/\b(h1|text-4xl)\b/i.test(className)) return 1;
  if (/\b(h2|text-3xl)\b/i.test(className)) return 2;
  if (/\b(h3|text-2xl)\b/i.test(className)) return 3;
  if (/\b(h4|text-xl)\b/i.test(className)) return 4;
  return 2;
}

function isUiElement(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  const tag = node.tagName.toLowerCase();
  if (tag === "button" || tag === "svg" || tag === "path") return true;
  const className = typeof node.className === "string" ? node.className : "";
  const role = node.getAttribute("role") || "";
  return (
    role === "button" ||
    /\b(btn|button|toolbar|action|menu|popover|tooltip)\b/i.test(className)
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

  if (isUiElement(node)) {
    return "";
  }

  const tag = node.tagName.toLowerCase();
  const role = node.getAttribute("role") || "";
  const className = typeof node.className === "string" ? node.className : "";

  if (tag === "script" || tag === "style" || tag === "meta" || tag === "head") {
    return "";
  }

  if (role === "heading") {
    const level = Math.min(Math.max(Number(node.getAttribute("aria-level")) || 2, 1), 6);
    const inner = childrenToMarkdown(node, context).trim();
    return inner ? `${"#".repeat(level)} ${inner}\n\n` : "";
  }

  switch (tag) {
    case "br":
      return "\n";
    case "hr":
      return "\n---\n\n";
    case "p": {
      const inner = childrenToMarkdown(node, context).trim();
      if (!inner) return "";
      const bulletMatch = inner.match(/^[•●○▪-]\s+(.+)$/);
      if (bulletMatch) return `- ${bulletMatch[1]}\n`;
      if (isHeadingClass(className) && inner.length < 200) {
        const level = headingLevelFromClass(className);
        return `${"#".repeat(level)} ${inner}\n\n`;
      }
      return `${inner}\n\n`;
    }
    case "div": {
      const inner = childrenToMarkdown(node, context).trim();
      if (!inner) return "";
      if (isHeadingClass(className) && inner.length < 200) {
        const level = headingLevelFromClass(className);
        return `${"#".repeat(level)} ${inner}\n\n`;
      }
      if (role === "listitem") {
        return inner;
      }
      return `${inner}\n\n`;
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
      const items = Array.from(node.children).filter((child) => {
        const childTag = child.tagName?.toLowerCase();
        return childTag === "li" || child.getAttribute("role") === "listitem";
      });
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
  return normalizeMarkdown(markdown);
}

function hasMarkdownStructure(text) {
  if (!text) return false;
  return (
    /^(#{1,6}\s|[-*+]\s|\d+\.\s|> )/m.test(text) ||
    /\*\*[^*]+\*\*/.test(text) ||
    /`[^`]+`/.test(text)
  );
}

function structureScore(text) {
  if (!text) return 0;

  let score = 0;
  score += (text.match(/^#{1,6}\s/gm) || []).length * 4;
  score += (text.match(/^[-*+]\s/gm) || []).length * 2;
  score += (text.match(/^\d+\.\s/gm) || []).length * 2;
  score += (text.match(/\*\*[^*]+\*\*/g) || []).length * 2;
  score += text.split("\n").length;
  return score;
}

function looksLikeHeading(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 70) return false;
  if (/[.!?]$/.test(trimmed)) return false;
  if (/^(examples?|note|tips?|summary|introduction|conclusion):?$/i.test(trimmed)) {
    return false;
  }

  const words = trimmed.split(/\s+/);
  const hasLowercaseWord = words.some((word, index) => {
    if (index === 0) return false;
    return /^[a-z]/.test(word) && !/^(of|the|a|an|and|or|in|on|at|to|for|is|ai|vs)$/i.test(word);
  });
  if (hasLowercaseWord && words.length >= 3) return false;

  return /^[A-Z]/.test(trimmed);
}

function looksLikeListItem(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 160) return false;
  if (/[.!?]$/.test(trimmed) && trimmed.length > 80) return false;
  if (/^(examples?|note|tips?|summary):?$/i.test(trimmed)) return false;
  return true;
}

export function inferMarkdownFromPlain(plain) {
  if (!plain?.trim()) return plain ?? "";

  const lines = plain.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let index = 0;
  let usedTitle = false;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      out.push("");
      index += 1;
      continue;
    }

    if (!usedTitle && looksLikeHeading(trimmed) && index === 0) {
      out.push(`# ${trimmed}`);
      usedTitle = true;
      index += 1;
      continue;
    }

    if (trimmed.endsWith(":") && index + 1 < lines.length) {
      const items = [];
      let cursor = index + 1;
      while (cursor < lines.length) {
        const candidate = lines[cursor].trim();
        if (!candidate) break;
        if (candidate.endsWith(":") && items.length === 0) break;
        if (!looksLikeListItem(candidate)) break;
        items.push(candidate);
        cursor += 1;
      }

      if (items.length >= 2) {
        out.push(trimmed);
        for (const item of items) {
          out.push(`- ${item}`);
        }
        index = cursor;
        continue;
      }
    }

    if (looksLikeHeading(trimmed)) {
      const nextLine = lines.slice(index + 1).find((entry) => entry.trim());
      if (nextLine && nextLine.trim().length > trimmed.length + 10) {
        out.push(`## ${trimmed}`);
        index += 1;
        continue;
      }
    }

    out.push(trimmed);
    index += 1;
  }

  return normalizeMarkdown(out.join("\n"));
}

export function pickBestMarkdown(...candidates) {
  let best = "";
  let bestScore = -1;

  for (const candidate of candidates) {
    if (!candidate?.trim()) continue;
    const score = structureScore(candidate) + (hasMarkdownStructure(candidate) ? 1000 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best;
}

export function markdownFromSelection(html, plain) {
  const fromHtml = html?.trim() ? htmlToMarkdown(html) : "";
  const fromPlain = plain?.trim() ? inferMarkdownFromPlain(plain) : "";

  if (fromHtml && hasMarkdownStructure(fromHtml)) {
    return fromHtml;
  }

  // Trust HTML conversion over plain heuristics when it produced real content.
  if (fromHtml.trim()) {
    if (!fromPlain || structureScore(fromHtml) >= structureScore(fromPlain)) {
      return fromHtml;
    }
  }

  return fromPlain || fromHtml || "";
}

async function readClipboardHtml() {
  if (!navigator.clipboard?.read) return "";

  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      if (item.types.includes("text/html")) {
        return await (await item.getType("text/html")).text();
      }
    }
  } catch {
    return "";
  }

  return "";
}

export async function getSelectionMarkdownFromDom() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return "";

  const range = selection.getRangeAt(0);
  if (range.collapsed) return "";

  const plain = selection.toString();
  let html = "";

  function onCopy(event) {
    html = event.clipboardData?.getData("text/html") || "";
  }

  // Same rich HTML as paste: native copy, then read clipboard HTML.
  document.addEventListener("copy", onCopy, true);
  document.execCommand("copy");
  document.removeEventListener("copy", onCopy, true);

  if (!html.trim()) {
    html = await readClipboardHtml();
  }

  if (html.trim()) {
    return markdownFromSelection(html, plain);
  }

  const container = document.createElement("div");
  container.appendChild(range.cloneContents());
  return markdownFromSelection(container.innerHTML, plain);
}
