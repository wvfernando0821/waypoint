import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import extractZip from "extract-zip";
import { structuralPass } from "waypoint-engine/structuralPass";
import { detectAdapter } from "waypoint-engine/adapters";
import { updateProject } from "./db.js";

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Holds arbitrary user-supplied code — gitignored, no retention policy yet
// (spec §5 flags this; deliberately not built in this milestone).
const STORAGE_ROOT = path.join(__dirname, "..", "storage");

export function projectStorageDir(projectId) {
  return path.join(STORAGE_ROOT, projectId);
}

/**
 * extract-zip guards against zip-slip (entries escaping destDir)
 * internally — a trust boundary worth stating plainly. Revisit with our
 * own explicit path-confinement check (see engine/src/fileTools.js) if
 * this ever handles untrusted uploads at real stakes.
 */
export async function extractZipUpload(zipPath, destDir) {
  await fs.mkdir(destDir, { recursive: true });
  await extractZip(zipPath, { dir: destDir });
}

export async function cloneGitRepo(gitUrl, destDir) {
  if (!/^https:\/\//i.test(gitUrl)) {
    throw new Error("Only https:// Git URLs are supported.");
  }
  await fs.mkdir(STORAGE_ROOT, { recursive: true });
  // destDir must not already exist — git clone creates it itself.
  await execFileAsync("git", ["clone", "--depth", "1", gitUrl, destDir]);
}

/**
 * Spec §3 phase 1: run structural pass + adapter detection right at
 * upload/ingest time, and persist the result on the project. Shared by
 * all three ingestion paths (zip, git, dev sourcePath shortcut) — whatever
 * got the source onto disk, this is the same next step.
 */
export async function finalizeProjectSource(projectId, sourcePath) {
  const inventory = await structuralPass(sourcePath);
  const adapter = detectAdapter(inventory);

  if (!adapter) {
    await updateProject(projectId, { status: "detection_failed" });
    return { adapter: null };
  }

  await updateProject(projectId, {
    source_path: sourcePath,
    source_type: adapter.id,
    status: "ready",
  });
  return { adapter };
}
