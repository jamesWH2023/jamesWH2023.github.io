/**
 * AgentRunner — progress engine for office tasks.
 *
 *   interface AgentRunner {
 *     start(task, agents, { onProgress }): { cancel(): void }
 *   }
 *
 * onProgress:
 *   { taskId, status, step, progress, message, agentId?, modelLabel? }
 *
 * createRunner() picks LlmRunner when Settings has live models enabled
 * (uses the active profile — mock / OpenAI-compatible / Anthropic).
 * Falls back to SimulatedRunner if live is off.
 * CursorAgentSdkRunner remains a documented stub extension point.
 */

import { settingsStore } from "./settings.js";
import { chatCompletion, buildAgentMessages } from "./llm.js";

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
 * Simulated multi-agent runner (no network).
 */
export class SimulatedRunner {
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
          modelLabel: "simulated",
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
          modelLabel: "simulated",
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
 * Calls the active Settings LLM profile through staged agent prompts.
 * Uses mock / OpenAI-compatible / Anthropic via js/llm.js.
 * On hard failure mid-run, falls back to simulated stage messages.
 */
export class LlmRunner {
  start(task, agents, { onProgress }) {
    const controller = new AbortController();
    let cancelled = false;
    const assignees = agents.length ? agents : [];
    const profile = settingsStore.getActiveProfile();
    const modelLabel = profile
      ? `${profile.name} · ${profile.model || profile.provider}`
      : "none";

    const workSteps = TASK_STEPS.filter((s) => s !== "queued" && s !== "done");

    const run = async () => {
      onProgress({
        taskId: task.id,
        status: "queued",
        step: "queued",
        progress: 0,
        message: `Queued on ${modelLabel}`,
        agentId: assignees[0]?.id,
        modelLabel,
      });

      for (let i = 0; i < workSteps.length; i++) {
        if (cancelled) return;
        const step = workSteps[i];
        const agent = assignees[i % Math.max(assignees.length, 1)] || {
          name: "Office",
          role: "generalist",
          instructions: "Help with the brief.",
        };
        const progress = Math.round(((i + 1) / (workSteps.length + 1)) * 100);

        onProgress({
          taskId: task.id,
          status: "running",
          step,
          progress: Math.max(progress - 10, 5),
          message: `${agent.name}: calling ${modelLabel} (${step})…`,
          agentId: agent.id,
          modelLabel,
        });

        try {
          const messages = buildAgentMessages(agent, task, step);
          const reply = await chatCompletion(profile, messages, {
            signal: controller.signal,
          });
          if (cancelled) return;
          const short = reply.replace(/\s+/g, " ").slice(0, 220);
          onProgress({
            taskId: task.id,
            status: "running",
            step,
            progress,
            message: `${agent.name}: ${short}${reply.length > 220 ? "…" : ""}`,
            agentId: agent.id,
            modelLabel,
          });
        } catch (err) {
          if (cancelled || err?.name === "AbortError") return;
          // Soft-fallback for this stage so the office still completes
          onProgress({
            taskId: task.id,
            status: "running",
            step,
            progress,
            message: `${agent.name}: model error — ${err.message}. Using local note: ${STEP_MESSAGES[step]}`,
            agentId: agent.id,
            modelLabel,
          });
        }
      }

      if (cancelled) return;
      onProgress({
        taskId: task.id,
        status: "done",
        step: "done",
        progress: 100,
        message: `${assignees.at(-1)?.name || "Team"}: Work delivered via ${modelLabel}.`,
        agentId: assignees.at(-1)?.id || assignees[0]?.id,
        modelLabel,
      });
    };

    run();

    return {
      cancel() {
        cancelled = true;
        controller.abort();
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
 * Stub for a hosted Cursor / Agent SDK backend.
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
        "CursorAgentSdkRunner is a stub. Prefer LlmRunner via Settings, or wire your host in js/runner.js.",
    });
    return { cancel() {} };
  }
}

/** Factory — Settings-driven LLM when live models enabled; else simulated. */
export function createRunner() {
  // return new CursorAgentSdkRunner({ endpoint: "https://your.host/agents/run" });
  if (settingsStore.getUseLiveModels()) {
    return new LlmRunner();
  }
  return new SimulatedRunner();
}
