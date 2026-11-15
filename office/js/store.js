/** Persistent store for Agent Office (localStorage). */

const STORAGE_KEY = "agent-office:v1";

const DEFAULT_AGENTS = [
  {
    id: "agent-scout",
    name: "Scout",
    role: "Research & reconnaissance",
    instructions:
      "Gather sources, map unknowns, and surface risks before others draft. Prefer primary references and short findings.",
    accent: "verdigris",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "agent-drafter",
    name: "Drafter",
    role: "Writes clear first passes",
    instructions:
      "Turn briefs into structured drafts. Keep tone human, cut fluff, leave TODOs where facts are missing.",
    accent: "copper",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

function uid(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}`;
}

function emptyState() {
  return {
    agents: JSON.parse(JSON.stringify(DEFAULT_AGENTS)),
    tasks: [],
  };
}

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.agents) || !Array.isArray(parsed.tasks)) {
      return emptyState();
    }
    return parsed;
  } catch {
    return emptyState();
  }
}

function writeRaw(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const store = {
  key: STORAGE_KEY,

  load() {
    return readRaw();
  },

  save(state) {
    writeRaw(state);
  },

  listAgents() {
    return readRaw().agents;
  },

  getAgent(id) {
    return readRaw().agents.find((a) => a.id === id) || null;
  },

  upsertAgent(input) {
    const state = readRaw();
    const now = new Date().toISOString();
    if (input.id) {
      const idx = state.agents.findIndex((a) => a.id === input.id);
      if (idx === -1) throw new Error("Agent not found");
      state.agents[idx] = {
        ...state.agents[idx],
        name: input.name.trim(),
        role: input.role.trim(),
        instructions: input.instructions.trim(),
        accent: input.accent || "copper",
        updatedAt: now,
      };
      writeRaw(state);
      return state.agents[idx];
    }
    const agent = {
      id: uid("agent"),
      name: input.name.trim(),
      role: input.role.trim(),
      instructions: input.instructions.trim(),
      accent: input.accent || "copper",
      createdAt: now,
    };
    state.agents.push(agent);
    writeRaw(state);
    return agent;
  },

  deleteAgent(id) {
    const state = readRaw();
    state.agents = state.agents.filter((a) => a.id !== id);
    writeRaw(state);
  },

  listTasks() {
    return readRaw().tasks;
  },

  getTask(id) {
    return readRaw().tasks.find((t) => t.id === id) || null;
  },

  createTask({ title, brief, agentIds, modelProfileId, modelLabel }) {
    const state = readRaw();
    const task = {
      id: uid("task"),
      title: title.trim(),
      brief: brief.trim(),
      agentIds: [...agentIds],
      modelProfileId: modelProfileId || null,
      modelLabel: modelLabel || null,
      status: "queued",
      step: "queued",
      progress: 0,
      log: [{ at: new Date().toISOString(), message: "Task queued" }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.tasks.unshift(task);
    writeRaw(state);
    return task;
  },

  updateTask(id, patch) {
    const state = readRaw();
    const idx = state.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    state.tasks[idx] = {
      ...state.tasks[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    writeRaw(state);
    return state.tasks[idx];
  },

  appendTaskLog(id, message) {
    const state = readRaw();
    const idx = state.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    state.tasks[idx].log = [
      ...(state.tasks[idx].log || []),
      { at: new Date().toISOString(), message },
    ];
    state.tasks[idx].updatedAt = new Date().toISOString();
    writeRaw(state);
    return state.tasks[idx];
  },
};

export { DEFAULT_AGENTS };
