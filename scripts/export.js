const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const src = path.join(root, "src");
const out = path.join(root, "extension");

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

function buildSelectionMarkdownInjected() {
  const corePath = path.join(src, "htmlToMarkdownCore.js");
  const core = fs
    .readFileSync(corePath, "utf8")
    .replace(/export async function /g, "async function ")
    .replace(/export function /g, "function ");
  const injected = `${core}
async function getSelectionMarkdown() {
  return getSelectionMarkdownFromDom();
}
`;

  fs.writeFileSync(path.join(src, "selectionMarkdownInjected.js"), injected);
  fs.writeFileSync(path.join(out, "selectionMarkdownInjected.js"), injected);
}

fs.rmSync(out, { recursive: true, force: true });
copyDir(src, out);
buildSelectionMarkdownInjected();
console.log("Exported extension to extension/");
