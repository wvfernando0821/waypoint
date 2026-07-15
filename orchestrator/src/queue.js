import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { structuralPass } from "waypoint-engine/structuralPass";
import { detectAdapter } from "waypoint-engine/adapters";
import { analyze } from "waypoint-engine/analyze";
import { summarize } from "waypoint-engine/summarize";
import { getJob, updateJob, updateProjectSourceType, saveReport } from "./db.js";
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
      const { jobId, projectId, sourcePath } = bullJob.data;

      await updateJob(jobId, { status: "running", started_at: new Date() });
      publishProgress(jobId, { phase: "analyze", status: "running", message: "Structural pass..." });

      const inventory = await structuralPass(sourcePath);
      publishProgress(jobId, {
        phase: "analyze",
        status: "running",
        message: `${inventory.fileCount} files found.`,
      });

      const adapter = detectAdapter(inventory);
      if (!adapter) {
        const message = "No known adapter matched this codebase.";
        await updateJob(jobId, { status: "failed", completed_at: new Date(), error_message: message });
        publishProgress(jobId, { phase: "analyze", status: "failed", message });
        return;
      }
      await updateProjectSourceType(projectId, adapter.id);
      publishProgress(jobId, {
        phase: "analyze",
        status: "running",
        message: `Detected adapter: ${adapter.displayName}`,
      });

      const report = await analyze(sourcePath, inventory, adapter);
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
