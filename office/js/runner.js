/**
 * AgentRunner — progress engine for office tasks.
 *
 * Prototype: SimulatedRunner advances through stages locally.
 * Extension: implement the same interface against Cursor Agent SDK / your API.
 *
 *   interface AgentRunner {
 *     start(task, agents, { onProgress }): { cancel(): void }
 *   }
 *
 * onProgress payload:
 *   { taskId, status, step, progress, message, agentId? }
 */

export const TASK_STEPS = [
  "queued",
  "researching",
  "drafting",
  "reviewing",
  "done",
];

const STEP_MESSAGES = {
  queued: "Waiting at the desk…",
  researching: "Scout notes pinned to the board.",
  drafting: "First pass taking shape.",
  reviewing: "Polish pass before handoff.",
  done: "Work delivered.",
};

/**
 * Simulated multi-agent runner.
 * Replace this class (or swap `createRunner`) to call real agents.
 */
export class SimulatedRunner {
  /**
   * @param {object} task
   * @param {object[]} agents
   * @param {{ onProgress: (evt: object) => void }} hooks
   */
  start(task, agents, { onProgress }) {
    let cancelled = false;
    const timers = [];
    const assignees = agents.length ? agents : [];

    const schedule = (ms, fn) => {
      const id = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timers.push(id);
    };

    // Staggered stage advances (~2s each) so desks visibly work through the brief.
    const stageMs = 2000;
    TASK_STEPS.forEach((step, i) => {
      if (step === "queued") {
        onProgress({
          taskId: task.id,
          status: "queued",
          step,
          progress: 0,
          message: STEP_MESSAGES.queued,
          agentId: assignees[0]?.id,
        });
        return;
      }
      schedule(stageMs * i, () => {
        const progress =
          step === "done" ? 100 : Math.round((i / (TASK_STEPS.length - 1)) * 100);
        const agent = assignees[i % Math.max(assignees.length, 1)];
        const status = step === "done" ? "done" : "running";
        const nameHint = agent ? `${agent.name}: ` : "";
        onProgress({
          taskId: task.id,
          status,
          step,
          progress,
          message: `${nameHint}${STEP_MESSAGES[step]}`,
          agentId: agent?.id,
        });
      });
    });

    return {
      cancel() {
        cancelled = true;
        timers.forEach(clearTimeout);
        onProgress({
          taskId: task.id,
          status: "cancelled",
          step: "queued",
          progress: 0,
          message: "Task cancelled",
        });
      },
    };
  }
}

/**
 * Stub for a real Cursor / Agent SDK backend.
 * Documented extension point — not used by default.
 *
 * Expected flow when you wire it:
 * 1. POST task + agent profiles to your host.
 * 2. Stream progress (SSE/WebSocket) into onProgress.
 * 3. Map remote statuses onto TASK_STEPS (or extend the list).
 */
export class CursorAgentSdkRunner {
  constructor(options = {}) {
    this.endpoint = options.endpoint || "/api/agents/run";
  }

  async start(task, agents, { onProgress }) {
    onProgress({
      taskId: task.id,
      status: "failed",
      step: "queued",
      progress: 0,
      message:
        "CursorAgentSdkRunner is a stub. Set createRunner() to your live client and implement streaming in js/runner.js.",
    });
    return { cancel() {} };
  }
}

/** Factory — swap return value when real agents are available. */
export function createRunner() {
  // return new CursorAgentSdkRunner({ endpoint: "https://your.host/agents/run" });
  return new SimulatedRunner();
}
