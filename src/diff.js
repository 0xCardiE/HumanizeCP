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

export function groupChanges(segments) {
  const groups = [];
  let index = 0;

  while (index < segments.length) {
    if (segments[index].type === "equal") {
      index += 1;
      continue;
    }

    const group = { deleteText: "", insertText: "" };
    while (index < segments.length && segments[index].type !== "equal") {
      if (segments[index].type === "delete") {
        group.deleteText += segments[index].text;
      } else {
        group.insertText += segments[index].text;
      }
      index += 1;
    }
    groups.push(group);
  }

  return groups;
}

export function isWordChange(group) {
  return group.deleteText.trim().length > 0 || group.insertText.trim().length > 0;
}

export function buildDisplayText(segments, groups, revertedChanges) {
  let output = "";
  let groupIndex = 0;
  let segmentIndex = 0;

  while (segmentIndex < segments.length) {
    if (segments[segmentIndex].type === "equal") {
      output += segments[segmentIndex].text;
      segmentIndex += 1;
      continue;
    }

    const group = groups[groupIndex];
    const reverted =
      isWordChange(group) && revertedChanges.has(groupIndex);
    output += reverted ? group.deleteText : group.insertText;

    while (
      segmentIndex < segments.length &&
      segments[segmentIndex].type !== "equal"
    ) {
      segmentIndex += 1;
    }
    groupIndex += 1;
  }

  return output;
}

export function renderInteractiveDiffHtml(segments, groups, revertedChanges) {
  let html = "";
  let groupIndex = 0;
  let segmentIndex = 0;

  while (segmentIndex < segments.length) {
    if (segments[segmentIndex].type === "equal") {
      html += escapeHtml(segments[segmentIndex].text);
      segmentIndex += 1;
      continue;
    }

    const group = groups[groupIndex];
    const isWord = isWordChange(group);
    const reverted = isWord && revertedChanges.has(groupIndex);

    if (!isWord) {
      html += escapeHtml(group.insertText);
    } else if (reverted) {
      html += `<button type="button" class="diff-change diff-change-reverted" data-change-id="${groupIndex}" title="Click to re-apply change">${escapeHtml(group.deleteText)}</button>`;
    } else {
      html += `<button type="button" class="diff-change" data-change-id="${groupIndex}" title="Click to revert change">`;
      if (group.deleteText) {
        html += `<span class="diff-del">${escapeHtml(group.deleteText)}</span>`;
      }
      if (group.insertText) {
        html += `<span class="diff-ins">${escapeHtml(group.insertText)}</span>`;
      }
      html += "</button>";
    }

    while (
      segmentIndex < segments.length &&
      segments[segmentIndex].type !== "equal"
    ) {
      segmentIndex += 1;
    }
    groupIndex += 1;
  }

  return html;
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

export function countWordChanges(groups, revertedChanges = new Set()) {
  return groups.filter(
    (group, index) =>
      isWordChange(group) && !revertedChanges.has(index)
  ).length;
}

export function hasChanges(original, modified) {
  return original !== modified;
}
