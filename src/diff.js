function tokenize(text) {
  const tokens = [];
  const re = /(\s+|[^\s]+)/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    tokens.push(match[0]);
  }
  return tokens;
}

function lcsTable(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

export function diffWords(original, modified) {
  const a = tokenize(original);
  const b = tokenize(modified);
  const dp = lcsTable(a, b);
  const segments = [];

  let i = a.length;
  let j = b.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      segments.unshift({ type: "equal", text: a[i - 1] });
      i -= 1;
      j -= 1;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      segments.unshift({ type: "insert", text: b[j - 1] });
      j -= 1;
    } else {
      segments.unshift({ type: "delete", text: a[i - 1] });
      i -= 1;
    }
  }

  return mergeAdjacent(segments);
}

function mergeAdjacent(segments) {
  if (!segments.length) return segments;

  const merged = [{ ...segments[0] }];
  for (let idx = 1; idx < segments.length; idx += 1) {
    const current = segments[idx];
    const last = merged[merged.length - 1];
    if (last.type === current.type) {
      last.text += current.text;
    } else {
      merged.push({ ...current });
    }
  }
  return merged;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderDiffHtml(segments) {
  return segments
    .map((segment) => {
      const text = escapeHtml(segment.text);
      if (segment.type === "delete") {
        return `<span class="diff-del">${text}</span>`;
      }
      if (segment.type === "insert") {
        return `<span class="diff-ins">${text}</span>`;
      }
      return text;
    })
    .join("");
}

export function countChanges(segments) {
  return segments.filter(
    (segment) =>
      segment.type !== "equal" && segment.text.trim().length > 0
  ).length;
}

export function hasChanges(original, modified) {
  return original !== modified;
}
