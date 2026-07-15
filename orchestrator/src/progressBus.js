import { EventEmitter } from "node:events";

// In-process only — fine while the API and the BullMQ worker share one
// process (this skeleton). Splitting them into separate processes later
// would need Redis pub/sub here instead.
const emitters = new Map();

function getEmitter(jobId) {
  let emitter = emitters.get(jobId);
  if (!emitter) {
    emitter = new EventEmitter();
    emitters.set(jobId, emitter);
  }
  return emitter;
}

export function publishProgress(jobId, event) {
  getEmitter(jobId).emit("progress", event);
}

export function subscribeProgress(jobId, listener) {
  const emitter = getEmitter(jobId);
  emitter.on("progress", listener);
  return () => emitter.off("progress", listener);
}
