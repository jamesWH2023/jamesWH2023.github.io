import { store } from "./store.js";
import { createRunner, TASK_STEPS } from "./runner.js";

const runner = createRunner();
const activeRuns = new Map();

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function toast(message) {
  const region = $("#toasts");
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  region.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function openDrawer(name) {
  closeDrawers();
  const drawer = $(`#drawer-${name}`);
  const backdrop = $("#drawer-backdrop");
  if (!drawer) return;
  drawer.hidden = false;
  backdrop.hidden = false;
  document.body.style.overflow = "hidden";
  if (name === "task") renderAssigneeChecks();
  if (name === "agents") renderAgentList();
}

function closeDrawers() {
  $$(".drawer").forEach((d) => {
    d.hidden = true;
  });
  $("#drawer-backdrop").hidden = true;
  document.body.style.overflow = "";
}

function initials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

function agentBusyMap() {
  const map = new Map();
  for (const task of store.listTasks()) {
    if (task.status !== "running" && task.status !== "queued") continue;
    for (const id of task.agentIds || []) {
      map.set(id, task);
    }
  }
  return map;
}

function renderFloor() {
  const floor = $("#office-floor");
  const agents = store.listAgents();
  const busy = agentBusyMap();
  const slots = Math.max(agents.length + 1, 4);

  floor.innerHTML = "";

  agents.forEach((agent) => {
    const task = busy.get(agent.id);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "station";
    btn.setAttribute("role", "listitem");
    btn.dataset.agentId = agent.id;
    if (task) {
      btn.classList.add(task.status === "done" ? "done" : "busy");
    }
    const progress = task?.progress ?? 0;
    const statusLabel = task
      ? task.step || task.status
      : "idle";
    btn.innerHTML = `
      <div class="agent-avatar accent-${agent.accent || "copper"}">${initials(agent.name)}</div>
      <div class="station-desk"></div>
      <p class="station-name">${escapeHtml(agent.name)}</p>
      <p class="station-role">${escapeHtml(agent.role)}</p>
      <div class="station-status"><span class="status-dot"></span>${escapeHtml(statusLabel)}</div>
      <div class="station-progress" aria-hidden="true"><span style="width:${progress}%"></span></div>
    `;
    btn.addEventListener("click", () => showInspector(agent.id));
    floor.appendChild(btn);
  });

  for (let i = agents.length; i < slots; i++) {
    const empty = document.createElement("button");
    empty.type = "button";
    empty.className = "station empty";
    empty.setAttribute("role", "listitem");
    empty.textContent = "Open desk — hire agent";
    empty.addEventListener("click", () => openDrawer("agents"));
    floor.appendChild(empty);
  }

  const running = store.listTasks().filter((t) => t.status === "running" || t.status === "queued").length;
  $("#floor-stats").innerHTML = `<strong>${agents.length}</strong> agents · <strong>${running}</strong> active tasks`;
}

function showInspector(agentId) {
  const agent = store.getAgent(agentId);
  if (!agent) return;
  const busy = agentBusyMap().get(agentId);
  const panel = $("#inspector");
  const body = $("#inspector-body");
  body.innerHTML = `
    <h3>${escapeHtml(agent.name)}</h3>
    <p class="meta">${escapeHtml(agent.role)}</p>
    <p class="brief">${escapeHtml(agent.instructions)}</p>
    ${
      busy
        ? `<p class="meta">Working on <strong>${escapeHtml(busy.title)}</strong> · ${escapeHtml(busy.step)} (${busy.progress}%)</p>`
        : `<p class="meta">Desk is clear — ready for a brief.</p>`
    }
    <div class="row-actions">
      <button type="button" class="btn secondary" data-edit="${agent.id}">Edit</button>
      <button type="button" class="btn secondary" data-assign="${agent.id}">Assign task</button>
      <button type="button" class="btn danger" data-delete="${agent.id}">Remove</button>
    </div>
  `;
  panel.hidden = false;

  body.querySelector("[data-edit]")?.addEventListener("click", () => {
    fillAgentForm(agent);
    openDrawer("agents");
  });
  body.querySelector("[data-assign]")?.addEventListener("click", () => {
    openDrawer("task");
    const box = $(`#assignee-checks input[value="${agent.id}"]`);
    if (box) box.checked = true;
  });
  body.querySelector("[data-delete]")?.addEventListener("click", () => {
    if (!confirm(`Remove ${agent.name} from the office?`)) return;
    store.deleteAgent(agent.id);
    panel.hidden = true;
    toast(`${agent.name} left the loft`);
    refresh();
  });
}

function fillAgentForm(agent) {
  $("#agent-id").value = agent?.id || "";
  $("#agent-name").value = agent?.name || "";
  $("#agent-role").value = agent?.role || "";
  $("#agent-instructions").value = agent?.instructions || "";
  $("#agent-accent").value = agent?.accent || "copper";
  $("#agent-submit").textContent = agent?.id ? "Update agent" : "Save agent";
}

function resetAgentForm() {
  fillAgentForm(null);
  $("#agent-form").reset();
  $("#agent-id").value = "";
  $("#agent-submit").textContent = "Save agent";
}

function renderAgentList() {
  const list = $("#agent-list");
  const agents = store.listAgents();
  if (!agents.length) {
    list.innerHTML = `<li class="empty-board">No agents yet — hire your first.</li>`;
    return;
  }
  list.innerHTML = agents
    .map(
      (a) => `
    <li>
      <div class="name">${escapeHtml(a.name)}</div>
      <div class="meta">${escapeHtml(a.role)}</div>
      <div class="actions">
        <button type="button" class="btn ghost" data-edit-list="${a.id}">Edit</button>
        <button type="button" class="btn danger" data-del-list="${a.id}">Remove</button>
      </div>
    </li>`
    )
    .join("");

  list.querySelectorAll("[data-edit-list]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const agent = store.getAgent(btn.dataset.editList);
      fillAgentForm(agent);
    });
  });
  list.querySelectorAll("[data-del-list]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const agent = store.getAgent(btn.dataset.delList);
      if (!agent) return;
      if (!confirm(`Remove ${agent.name}?`)) return;
      store.deleteAgent(agent.id);
      toast(`${agent.name} removed`);
      refresh();
      renderAgentList();
    });
  });
}

function renderAssigneeChecks() {
  const wrap = $("#assignee-checks");
  const agents = store.listAgents();
  if (!agents.length) {
    wrap.innerHTML = `<p class="meta">Hire an agent before assigning work.</p>`;
    return;
  }
  wrap.innerHTML = agents
    .map(
      (a) => `
    <label>
      <input type="checkbox" name="assignees" value="${a.id}" />
      ${escapeHtml(a.name)} <span class="meta">· ${escapeHtml(a.role)}</span>
    </label>`
    )
    .join("");
}

function renderBoard() {
  const board = $("#task-board");
  const tasks = store.listTasks();
  if (!tasks.length) {
    board.innerHTML = `<div class="empty-board">No tasks yet. Assign complex work to one or more agents.</div>`;
    return;
  }

  board.innerHTML = tasks
    .map((task) => {
      const names = (task.agentIds || [])
        .map((id) => store.getAgent(id)?.name || "—")
        .join(", ");
      const steps = TASK_STEPS.map((s) => {
        const idx = TASK_STEPS.indexOf(s);
        const cur = TASK_STEPS.indexOf(task.step || "queued");
        let cls = "";
        if (idx < cur || task.status === "done") cls = "done";
        if (s === task.step && task.status !== "done") cls = "active";
        return `<li class="${cls}">${s}</li>`;
      }).join("");
      const statusLabel =
        task.status === "done" || task.status === "failed" || task.status === "cancelled"
          ? task.status
          : task.step || task.status;
      return `
      <article class="task-card ${escapeHtml(task.status)}" data-task="${task.id}">
        <h3>${escapeHtml(task.title)}</h3>
        <div class="task-meta">
          <span>${escapeHtml(statusLabel)}</span>
          <span>${escapeHtml(names)}</span>
        </div>
        <div class="task-progress"><span style="width:${task.progress || 0}%"></span></div>
        <ul class="task-steps">${steps}</ul>
        <p class="meta">${escapeHtml(task.log?.at(-1)?.message || task.brief.slice(0, 120))}</p>
      </article>`;
    })
    .join("");
}

function onProgress(evt) {
  const patch = {
    status: evt.status,
    step: evt.step,
    progress: evt.progress,
  };
  store.updateTask(evt.taskId, patch);
  if (evt.message) store.appendTaskLog(evt.taskId, evt.message);
  refresh();
}

function startTask(task) {
  const agents = (task.agentIds || [])
    .map((id) => store.getAgent(id))
    .filter(Boolean);
  const handle = runner.start(task, agents, { onProgress });
  activeRuns.set(task.id, handle);
}

function resumeRunningTasks() {
  for (const task of store.listTasks()) {
    if (task.status === "queued" || task.status === "running") {
      // Re-seed incomplete prototype runs after reload.
      if (task.progress < 100 && task.status !== "done") {
        store.updateTask(task.id, { status: "queued", step: "queued", progress: 0 });
        const fresh = store.getTask(task.id);
        startTask(fresh);
      }
    }
  }
}

function refresh() {
  renderFloor();
  renderBoard();
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function bindUi() {
  $$("[data-open]").forEach((el) => {
    el.addEventListener("click", () => openDrawer(el.dataset.open));
  });
  $$("[data-close]").forEach((el) => {
    el.addEventListener("click", closeDrawers);
  });
  $("#drawer-backdrop").addEventListener("click", closeDrawers);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDrawers();
      $("#inspector").hidden = true;
    }
  });

  $$("[data-scroll]").forEach((el) => {
    el.addEventListener("click", () => {
      const target = $(`#${el.dataset.scroll}`);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  $("#inspector-close").addEventListener("click", () => {
    $("#inspector").hidden = true;
  });

  $("#agent-reset").addEventListener("click", resetAgentForm);

  $("#agent-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const payload = {
      id: $("#agent-id").value || undefined,
      name: $("#agent-name").value,
      role: $("#agent-role").value,
      instructions: $("#agent-instructions").value,
      accent: $("#agent-accent").value,
    };
    const saved = store.upsertAgent(payload);
    toast(payload.id ? `Updated ${saved.name}` : `${saved.name} took a desk`);
    resetAgentForm();
    refresh();
    renderAgentList();
  });

  $("#task-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const agentIds = $$('#assignee-checks input[name="assignees"]:checked').map(
      (i) => i.value
    );
    if (!agentIds.length) {
      toast("Select at least one agent");
      return;
    }
    const task = store.createTask({
      title: $("#task-title").value,
      brief: $("#task-brief").value,
      agentIds,
    });
    $("#task-form").reset();
    closeDrawers();
    toast(`Task “${task.title}” is on the floor`);
    startTask(task);
    refresh();
    $("#floor")?.scrollIntoView({ behavior: "smooth" });
  });
}

function boot() {
  // Seed default agents on first visit
  const state = store.load();
  if (!localStorage.getItem(store.key)) {
    store.save(state);
  }
  bindUi();
  refresh();
  resumeRunningTasks();
}

boot();
