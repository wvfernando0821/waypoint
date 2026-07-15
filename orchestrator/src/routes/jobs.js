import { Router } from "express";
import { analyzeQueue } from "../queue.js";
import { createJob, getProject, getJob } from "../db.js";
import { subscribeProgress } from "../progressBus.js";

export const jobsRouter = Router();

jobsRouter.post("/:projectId/analyze", async (req, res) => {
  const project = await getProject(req.params.projectId);
  if (!project) return res.status(404).json({ error: "Project not found" });

  const job = await createJob({ projectId: project.id, phase: "analyze" });
  await analyzeQueue.add("analyze", {
    jobId: job.id,
    projectId: project.id,
    sourcePath: project.source_path,
  });

  res.status(202).json(job);
});

// Server-Sent Events stream of job progress.
jobsRouter.get("/:projectId/jobs/:jobId/events", async (req, res) => {
  const job = await getJob(req.params.jobId);
  if (!job) return res.status(404).end();

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const send = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`);

  send({ phase: job.phase, status: job.status });
  if (job.status === "done" || job.status === "failed") {
    res.end();
    return;
  }

  const unsubscribe = subscribeProgress(job.id, (event) => {
    send(event);
    if (event.status === "done" || event.status === "failed") {
      res.end();
    }
  });

  req.on("close", unsubscribe);
});
