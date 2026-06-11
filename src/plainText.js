function stripLineMarkdown(line) {
  let result = line.replace(/\s+$/, "");

  result = result.replace(/^#{1,6}\s+/, "");
  result = result.replace(/^>\s?/, "");
  result = result.replace(/^[\-*+]\s+/, "");
  result = result.replace(/^\d+\.\s+/, "");

  return result;
}

function stripInlineMarkdown(text) {
  return text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

export function stripMarkdownForPaste(text) {
  if (!text) return "";

  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const stripped = lines.map(stripLineMarkdown).map(stripInlineMarkdown);

  let result = stripped.join("\n");

  // Drop empty lines, then join with single breaks (Twitter-friendly spacing)
  result = result
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  return result.trim();
}
