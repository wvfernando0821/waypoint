import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Resolves a model-supplied relative path against the project root and
 * verifies it stays inside that root. Throws on any escape attempt
 * (`..`, absolute paths, symlink traversal) rather than silently clamping —
 * the caller decides how to report the error back to the model.
 */
function resolveWithinRoot(rootDir, relativePath) {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedTarget = path.resolve(resolvedRoot, relativePath || ".");
  const relative = path.relative(resolvedRoot, resolvedTarget);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Path "${relativePath}" escapes the project root`);
  }
  return resolvedTarget;
}

/** Tool implementation: list a directory's immediate contents. */
export async function listDirectory(rootDir, relativePath = ".") {
  const target = resolveWithinRoot(rootDir, relativePath);
  const entries = await fs.readdir(target, { withFileTypes: true });
  return entries
    .map((entry) => ({
      name: entry.name,
      type: entry.isDirectory() ? "directory" : "file",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Tool implementation: read a single file's contents as UTF-8 text. */
export async function readFile(rootDir, relativePath) {
  const target = resolveWithinRoot(rootDir, relativePath);
  const stat = await fs.stat(target);
  if (stat.isDirectory()) {
    throw new Error(`"${relativePath}" is a directory, not a file`);
  }
  return fs.readFile(target, "utf-8");
}
