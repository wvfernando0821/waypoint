import { promises as fs } from "node:fs";
import { Router } from "express";
import multer from "multer";
import { createProject, getProject, getLatestJobForProject, getReportForJob } from "../db.js";
import { projectStorageDir, extractZipUpload, cloneGitRepo, finalizeProjectSource } from "../sourceIngest.js";

export const projectsRouter = Router();

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB — generous for these fixtures, not unbounded
});

// Always multipart/form-data: `name` plus exactly one of `archive` (zip),
// `gitUrl` (https:// only), or `sourcePath` (dev-only shortcut — a path
// already on the orchestrator's own disk, documented in README.md).
projectsRouter.post("/", upload.single("archive"), async (req, res) => {
  const { name, gitUrl, sourcePath } = req.body;

  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }
  if (!req.file && !gitUrl && !sourcePath) {
    return res.status(400).json({ error: "one of archive, gitUrl, or sourcePath is required" });
  }

  const project = await createProject({ name });
  const destDir = projectStorageDir(project.id);

  try {
    if (req.file) {
      await extractZipUpload(req.file.path, destDir);
    } else if (gitUrl) {
      await cloneGitRepo(gitUrl, destDir);
    } else {
      // Dev-only: sourcePath is used as-is, nothing is copied into storage/.
      await finalizeProjectSource(project.id, sourcePath);
      const updated = await getProject(project.id);
      return res.status(201).json(updated);
    }

    await finalizeProjectSource(project.id, destDir);
    const updated = await getProject(project.id);
    res.status(201).json(updated);
  } catch (error) {
    res.status(422).json({ error: error.message, project: await getProject(project.id) });
  } finally {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
  }
});

projectsRouter.get("/:id", async (req, res) => {
  const project = await getProject(req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });

  const job = await getLatestJobForProject(project.id);
  const report = job ? await getReportForJob(job.id) : null;

  res.json({ project, job, report });
});
