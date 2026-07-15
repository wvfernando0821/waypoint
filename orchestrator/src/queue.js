import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { structuralPass } from "waypoint-engine/structuralPass";
import { getAdapterById } from "waypoint-engine/adapters";
import { analyze } from "waypoint-engine/analyze";
import { summarize } from "waypoint-engine/summarize";
import { getJob, updateJob, getProject, saveReport } from "./db.js";
import { publishProgress } from "./progressBus.js";

// BullMQ manages blocking Redis commands itself and requires this exact
// setting on the connection it's handed.
const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });

export const analyzeQueue = new Queue("analyze", { connection });

/**
 * Spec §4.4 Steps 1-5, wrapped as a BullMQ job instead of the M1/M2 CLI.
 * Calls the exact same engine functions the CLI uses — no duplicated logic.
 */
export function startWorker() {
  const worker = new Worker(
    "analyze",
    async (bullJob) => {
      const { jobId, projectId } = bullJob.data;

      await updateJob(jobId, { status: "running", started_at: new Date() });
      publishProgress(jobId, { phase: "analyze", status: "running", message: "Structural pass..." });

      // Detection already happened at upload time (M4) — look up the
      // adapter that was matched then, rather than re-detecting here.
      const project = await getProject(projectId);
      const adapter = getAdapterById(project.source_type);
      if (!adapter) {
        const message = `Project has no valid detected adapter (source_type: ${project.source_type}).`;
        await updateJob(jobId, { status: "failed", completed_at: new Date(), error_message: message });
        publishProgress(jobId, { phase: "analyze", status: "failed", message });
        return;
      }

      const inventory = await structuralPass(project.source_path);
      publishProgress(jobId, {
        phase: "analyze",
        status: "running",
        message: `${inventory.fileCount} files found. Adapter: ${adapter.displayName}`,
      });

      const report = await analyze(project.source_path, inventory, adapter);
      publishProgress(jobId, { phase: "analyze", status: "running", message: "Generating summary..." });

      const summary = await summarize(report);

      await saveReport({ jobId, report });
      await updateJob(jobId, { status: "done", completed_at: new Date() });
      publishProgress(jobId, { phase: "analyze", status: "done", message: summary });
    },
    { connection },
  );

  worker.on("failed", async (bullJob, err) => {
    if (!bullJob) return;
    const { jobId } = bullJob.data;
    const existing = await getJob(jobId);
    if (existing && existing.status !== "failed") {
      await updateJob(jobId, { status: "failed", completed_at: new Date(), error_message: err.message });
    }
    publishProgress(jobId, { phase: "analyze", status: "failed", message: err.message });
  });

  return worker;
}
