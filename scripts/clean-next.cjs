/**
 * Remove Next.js dev/build caches (fixes corrupt .next / vendor-chunks errors on any OS).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function rm(name) {
  const p = path.join(root, ...name.split("/"));
  try {
    fs.rmSync(p, { recursive: true, force: true });
    console.log("Removed", path.relative(root, p) || ".");
  } catch (e) {
    if (e && e.code !== "ENOENT") console.error(e.message);
  }
}

rm(".next");
rm("node_modules/.cache");
console.log("Next cache clean done.");
