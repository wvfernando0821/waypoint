import { Router } from "express";
import { createProject, getProject, getLatestJobForProject, getReportForJob } from "../db.js";

export const projectsRouter = Router();

projectsRouter.post("/", async (req, res) => {
  const { name, sourcePath } = req.body;
  if (!name || !sourcePath) {
    return res.status(400).json({ error: "name and sourcePath are required" });
  }
  const project = await createProject({ name, sourcePath });
  res.status(201).json(project);
});

projectsRouter.get("/:id", async (req, res) => {
  const project = await getProject(req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });

  const job = await getLatestJobForProject(project.id);
  const report = job ? await getReportForJob(job.id) : null;

  res.json({ project, job, report });
});
