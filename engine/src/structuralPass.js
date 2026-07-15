import { promises as fs } from "node:fs";
import path from "node:path";

const SKIP_DIRS = new Set(["node_modules", ".git", "bin", "obj"]);

/**
 * Step 1 (spec §4.4) — deterministic, no LLM call. Walks the project tree
 * and returns a flat file inventory so the agent gets a map to work from
 * instead of the raw tree dumped into its prompt.
 */
export async function structuralPass(rootDir) {
  const files = [];

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        await walk(path.join(currentDir, entry.name));
        continue;
      }
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(rootDir, fullPath).split(path.sep).join("/");
      const stat = await fs.stat(fullPath);
      files.push({
        path: relativePath,
        extension: path.extname(entry.name),
        sizeBytes: stat.size,
      });
    }
  }

  await walk(rootDir);
  files.sort((a, b) => a.path.localeCompare(b.path));

  const byExtension = {};
  for (const file of files) {
    byExtension[file.extension] = (byExtension[file.extension] || 0) + 1;
  }

  return { fileCount: files.length, byExtension, files };
}
