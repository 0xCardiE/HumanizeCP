const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "store-screenshots");
const bg = "#f6f4f0";
const width = 1280;
const height = 800;
const padding = 64;

const sources = [
  {
    src: path.join(
      root,
      "assets",
      "screenshots",
      "raw",
      "01-humanized-text.png"
    ),
    out: "01-humanized-text.jpg",
  },
  {
    src: path.join(root, "assets", "screenshots", "raw", "02-settings.png"),
    out: "02-settings.jpg",
  },
  {
    src: path.join(root, "assets", "screenshots", "raw", "03-sidebar.png"),
    out: "03-sidebar.jpg",
  },
  {
    src: path.join(root, "assets", "screenshots", "raw", "04-changes-diff.png"),
    out: "04-changes-diff.jpg",
  },
  {
    src: path.join(root, "assets", "screenshots", "raw", "Right_click.png"),
    out: "05-right-click.jpg",
  },
];

async function formatScreenshot(sharp, { src, out }) {
  const maxW = width - padding * 2;
  const maxH = height - padding * 2;

  const resized = await sharp(src)
    .resize(maxW, maxH, { fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();

  const meta = await sharp(resized).metadata();
  const left = Math.round((width - meta.width) / 2);
  const top = Math.round((height - meta.height) / 2);

  const outPath = path.join(outDir, out);
  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: bg,
    },
  })
    .composite([{ input: resized, left, top }])
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

  fs.mkdirSync(outDir, { recursive: true });

  for (const item of sources) {
    if (!fs.existsSync(item.src)) {
      console.error(`Missing source: ${path.relative(root, item.src)}`);
      process.exit(1);
    }
    await formatScreenshot(sharp, item);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
