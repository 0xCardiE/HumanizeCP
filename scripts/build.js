const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

async function build() {
  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(dist, { recursive: true });

  await esbuild.build({
    entryPoints: [
      path.join(root, "src/background.js"),
      path.join(root, "src/options.js"),
    ],
    bundle: true,
    outdir: dist,
    format: "iife",
    target: ["chrome100"],
    logLevel: "info",
  });

  copyFile(path.join(root, "manifest.json"), path.join(dist, "manifest.json"));
  copyFile(path.join(root, "src/options.html"), path.join(dist, "options.html"));
  copyFile(path.join(root, "src/options.css"), path.join(dist, "options.css"));
  copyDir(path.join(root, "icons"), path.join(dist, "icons"));

  console.log("Built extension to dist/");
}

const watch = process.argv.includes("--watch");
if (watch) {
  esbuild
    .context({
      entryPoints: [
        path.join(root, "src/background.js"),
        path.join(root, "src/options.js"),
      ],
      bundle: true,
      outdir: dist,
      format: "iife",
      target: ["chrome100"],
      logLevel: "info",
    })
    .then((ctx) => {
      ctx.watch();
      console.log("Watching for changes...");
    });
} else {
  build().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
