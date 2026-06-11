const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const src = path.join(root, "src");

function runExport() {
  execSync("npm run export", { cwd: root, stdio: "inherit" });
}

let timer;
function scheduleExport() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    console.log("Source changed — exporting...");
    runExport();
  }, 150);
}

runExport();
fs.watch(src, { recursive: true }, scheduleExport);
console.log("Watching src/ — extension/ will rebuild on changes");
