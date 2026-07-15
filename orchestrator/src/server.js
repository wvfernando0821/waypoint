import express from "express";
import { projectsRouter } from "./routes/projects.js";
import { jobsRouter } from "./routes/jobs.js";
import { startWorker } from "./queue.js";

const app = express();
app.use(express.json());

app.use("/projects", projectsRouter);
app.use("/projects", jobsRouter);

// API and the BullMQ worker share one process in this skeleton — splitting
// them into a separate worker process later is a small BullMQ-native
// change (same job handler, run from its own entrypoint), not a redesign.
startWorker();

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Waypoint orchestrator listening on :${port}`);
});
