const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "store-assets", "promo");
const iconPath = path.join(root, "src", "icons", "icon.svg");

const colors = {
  bg: "#f6f4f0",
  surface: "#ffffff",
  text: "#1a1a1a",
  muted: "#5c5c5c",
  accent: "#2f6b4f",
  del: "#c44b4b",
  ins: "#2f8f5b",
};

function smallTileSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="440" height="280" viewBox="0 0 440 280">
  <rect width="440" height="280" fill="${colors.bg}"/>
  <rect x="18" y="18" width="404" height="244" rx="18" fill="${colors.surface}" stroke="#e4dfd6" stroke-width="1.5"/>
  <rect x="18" y="18" width="404" height="8" rx="4" fill="${colors.accent}" opacity="0.85"/>

  <g transform="translate(42, 78)">
    <rect width="96" height="96" rx="20" fill="#142820"/>
    <rect x="4" y="4" width="88" height="88" rx="16" stroke="#2f6b4f" stroke-width="1.5" fill="none" opacity="0.55"/>
    <rect x="24" y="22" width="12" height="52" rx="6" fill="#a8e0bc"/>
    <rect x="60" y="22" width="12" height="52" rx="6" fill="#a8e0bc"/>
    <rect x="24" y="41" width="48" height="12" rx="6" fill="#7bc995"/>
  </g>

  <text x="162" y="108" font-family="Georgia, 'Times New Roman', serif" font-size="28" font-weight="700" fill="${colors.text}">Humanize</text>
  <text x="162" y="142" font-family="Georgia, 'Times New Roman', serif" font-size="28" font-weight="700" fill="${colors.text}">Copy/Paste</text>
  <text x="162" y="176" font-family="Georgia, 'Times New Roman', serif" font-size="15" fill="${colors.muted}">Subtle AI-tell cleanup on copy</text>
  <text x="162" y="206" font-family="Georgia, 'Times New Roman', serif" font-size="14" fill="${colors.accent}">Right-click → Copy &amp; Humanize</text>
</svg>`;
}

function marqueeTileSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="560" viewBox="0 0 1400 560">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${colors.bg}"/>
      <stop offset="100%" stop-color="#ece7df"/>
    </linearGradient>
  </defs>

  <rect width="1400" height="560" fill="url(#bgGrad)"/>
  <rect x="0" y="0" width="1400" height="10" fill="${colors.accent}"/>

  <g transform="translate(72, 118)">
    <rect width="148" height="148" rx="32" fill="#142820"/>
    <rect x="6" y="6" width="136" height="136" rx="26" stroke="#2f6b4f" stroke-width="2.5" fill="none" opacity="0.55"/>
    <rect x="37" y="34" width="18" height="80" rx="9" fill="#a8e0bc"/>
    <rect x="93" y="34" width="18" height="80" rx="9" fill="#a8e0bc"/>
    <rect x="37" y="63" width="74" height="18" rx="9" fill="#7bc995"/>
  </g>

  <text x="72" y="320" font-family="Georgia, 'Times New Roman', serif" font-size="54" font-weight="700" fill="${colors.text}">Humanize Copy/Paste</text>
  <text x="72" y="372" font-family="Georgia, 'Times New Roman', serif" font-size="26" fill="${colors.muted}">Copy selected text with subtle cleanup of common AI writing tells.</text>
  <text x="72" y="418" font-family="Georgia, 'Times New Roman', serif" font-size="22" fill="${colors.accent}">Right-click any selection → Copy &amp; Humanize</text>

  <rect x="760" y="72" width="588" height="416" rx="22" fill="${colors.surface}" stroke="#e4dfd6" stroke-width="2"/>
  <text x="792" y="118" font-family="Georgia, 'Times New Roman', serif" font-size="18" font-weight="700" letter-spacing="1.5" fill="${colors.muted}">CHANGES</text>

  <text x="792" y="168" font-family="Georgia, 'Times New Roman', serif" font-size="22" fill="${colors.del}">
    <tspan text-decoration="line-through">In today's fast-paced digital landscape,</tspan>
    <tspan fill="${colors.ins}" font-weight="700"> many</tspan>
    <tspan fill="${colors.text}"> teams rely on AI drafts.</tspan>
  </text>

  <text x="792" y="228" font-family="Georgia, 'Times New Roman', serif" font-size="22" fill="${colors.text}">
    <tspan fill="${colors.del}" text-decoration="line-through">Hot take:</tspan>
    <tspan> The tool is a </tspan>
    <tspan fill="${colors.del}" text-decoration="line-through">collaborator</tspan>
    <tspan fill="${colors.ins}" font-weight="700"> helper</tspan>
    <tspan> also.</tspan>
  </text>

  <text x="792" y="288" font-family="Georgia, 'Times New Roman', serif" font-size="22" fill="${colors.text}">
    <tspan>Replace </tspan>
    <tspan fill="${colors.del}" text-decoration="line-through">em dashes—like this—</tspan>
    <tspan fill="${colors.ins}" font-weight="700"> with commas</tspan>
    <tspan> and trim filler phrases.</tspan>
  </text>

  <text x="792" y="348" font-family="Georgia, 'Times New Roman', serif" font-size="22" fill="${colors.text}">
    <tspan>Keep meaning and structure. Toggle each cleanup rule in </tspan>
    <tspan fill="${colors.accent}" font-weight="700">Settings</tspan>
    <tspan>.</tspan>
  </text>

  <rect x="792" y="390" width="132" height="34" rx="17" fill="#e8f5ec"/>
  <text x="812" y="413" font-family="Georgia, 'Times New Roman', serif" font-size="15" font-weight="700" fill="${colors.accent}">ON CLIPBOARD</text>
</svg>`;
}

async function renderTile(sharp, svg, filename, width, height) {
  const outPath = path.join(outDir, filename);
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(outPath);
  console.log(`Wrote ${path.relative(root, outPath)} (${width}x${height})`);
}

async function main() {
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    console.error("Run: npm install --save-dev sharp");
    process.exit(1);
  }

  if (!fs.existsSync(iconPath)) {
    console.error(`Missing icon: ${path.relative(root, iconPath)}`);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  await renderTile(sharp, smallTileSvg(), "promo-small.jpg", 440, 280);
  await renderTile(sharp, marqueeTileSvg(), "promo-marquee.jpg", 1400, 560);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
