import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(__dirname, "..", "out");
const dest = path.resolve(__dirname, "..", "..", "server", "public");

if (!fs.existsSync(src)) {
  console.error(
    `[sync-public] ERROR: ${src} does not exist. Run "next build" with NEXT_OUTPUT_EXPORT=1 first.`
  );
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });

function countFiles(dir) {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += countFiles(full);
    } else {
      count += 1;
    }
  }
  return count;
}

const total = countFiles(dest);
console.log(`[sync-public] copied ${total} file(s) from ${src} to ${dest}`);
