import { parentPort } from "node:worker_threads";

import { executeJob } from "./worker.js";

async function runJobsUntilIdle() {
  try {
    while (await executeJob()) {
      // Keep draining the queue until no runnable jobs remain.
    }
    parentPort?.postMessage({ type: "done" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown worker error";
    parentPort?.postMessage({ type: "error", error: { message } });
  }
}

if (parentPort) {
  parentPort.on("message", (message) => {
    if (message?.type === "run") {
      void runJobsUntilIdle();
    }
  });
} else {
  void runJobsUntilIdle();
}
