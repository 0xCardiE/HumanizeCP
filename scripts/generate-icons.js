const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const iconsDir = path.join(root, "src", "icons");
const svgPath = path.join(iconsDir, "icon.svg");
const sizes = [16, 48, 128];

async function main() {
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    console.error("Run: npm install --save-dev sharp");
    process.exit(1);
  }

  const svg = fs.readFileSync(svgPath);
  for (const size of sizes) {
    const out = path.join(iconsDir, `icon${size}.png`);
    await sharp(svg).resize(size, size).png({ compressionLevel: 9 }).toFile(out);
    console.log(`Wrote ${path.relative(root, out)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
