import { store } from "./store.js";
import { createRunner, TASK_STEPS } from "./runner.js";
import { OfficeScene } from "./scene.js";
import { settingsStore, PROVIDER_PRESETS } from "./settings.js";
import { testProfile } from "./llm.js";
import { t, applyDomI18n, getLocale, setLocale } from "./i18n.js";

let runner = createRunner();
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
  if (name === "task") {
    renderAssigneeChecks();
    renderTaskModelHint();
  }
  if (name === "agents") renderAgentList();
  if (name === "settings") renderSettings();
}

function closeDrawers() {
  $$(".drawer").forEach((d) => {
    d.hidden = true;
  });
  $("#drawer-backdrop").hidden = true;
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

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function activeModelLabel() {
  if (!settingsStore.getUseLiveModels()) return t("settings.simulated");
  const p = settingsStore.getActiveProfile();
  if (!p) return "—";
  return `${p.name} · ${p.model || p.provider}`;
}

function statusLabel(key) {
  const k = `status.${key}`;
  const translated = t(k);
  return translated === k ? key : translated;
}

function renderTaskModelHint() {
  const el = $("#task-model-hint");
  if (!el) return;
  el.innerHTML = t("task.modelHint", {
    model: `<strong>${escapeHtml(activeModelLabel())}</strong>`,
  });
}

function fillAgentForm(agent) {
  $("#agent-id").value = agent?.id || "";
  $("#agent-name").value = agent?.name || "";
  $("#agent-role").value = agent?.role || "";
  $("#agent-instructions").value = agent?.instructions || "";
  $("#agent-accent").value = agent?.accent || "copper";
  $("#agent-submit").textContent = agent?.id ? t("agents.update") : t("agents.save");
}

function resetAgentForm() {
  fillAgentForm(null);
  $("#agent-form").reset();
  $("#agent-id").value = "";
  $("#agent-submit").textContent = t("agents.save");
}

function renderAgentList() {
  const list = $("#agent-list");
  const agents = store.listAgents();
  if (!agents.length) {
    list.innerHTML = `<li class="empty-board">${escapeHtml(t("agents.empty"))}</li>`;
    return;
  }
  list.innerHTML = agents
    .map(
      (a) => `
    <li>
      <div class="name">${escapeHtml(a.name)}</div>
      <div class="meta">${escapeHtml(a.role)}</div>
      <div class="actions">
        <button type="button" class="btn ghost" data-edit-list="${a.id}">${escapeHtml(t("agents.edit"))}</button>
        <button type="button" class="btn danger" data-del-list="${a.id}">${escapeHtml(t("agents.remove"))}</button>
      </div>
    </li>`
    )
    .join("");

  list.querySelectorAll("[data-edit-list]").forEach((btn) => {
    btn.addEventListener("click", () => {
      fillAgentForm(store.getAgent(btn.dataset.editList));
    });
  });
  list.querySelectorAll("[data-del-list]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const agent = store.getAgent(btn.dataset.delList);
      if (!agent) return;
      if (!confirm(t("agents.confirmRemove", { name: agent.name }))) return;
      store.deleteAgent(agent.id);
      toast(t("agents.removed", { name: agent.name }));
      refresh();
      renderAgentList();
    });
  });
}

function renderAssigneeChecks() {
  const wrap = $("#assignee-checks");
  const agents = store.listAgents();
  if (!agents.length) {
    wrap.innerHTML = `<p class="meta">${escapeHtml(t("agents.hireFirst"))}</p>`;
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

function syncModelSuggestions(provider, selectedModel) {
  const preset = PROVIDER_PRESETS[provider] || PROVIDER_PRESETS.custom;
  const models = Array.isArray(preset.models) ? preset.models : [];
  const suggest = $("#profile-model-suggest");
  const list = $("#profile-model-list");
  const model = selectedModel || $("#profile-model").value || preset.model || "";

  if (suggest) {
    suggest.innerHTML =
      `<option value="">${escapeHtml(t("settings.modelCustom"))}</option>` +
      models
        .map(
          (m) =>
            `<option value="${escapeHtml(m)}" ${m === model ? "selected" : ""}>${escapeHtml(m)}</option>`
        )
        .join("");
    if (models.includes(model)) {
      suggest.value = model;
    } else {
      suggest.value = "";
    }
  }
  if (list) {
    list.innerHTML = models.map((m) => `<option value="${escapeHtml(m)}"></option>`).join("");
  }
}

function fillProfileForm(profile) {
  $("#profile-id").value = profile?.id || "";
  $("#profile-name").value = profile?.name || "";
  $("#profile-provider").value = profile?.provider || "custom";
  $("#profile-base-url").value = profile?.baseUrl || "";
  $("#profile-api-key").value = "";
  $("#profile-model").value = profile?.model || "";
  syncModelSuggestions(profile?.provider || "custom", profile?.model || "");
  const hint = $("#profile-key-hint");
  if (profile?.apiKey) {
    hint.textContent = t("settings.keySaved", {
      mask: settingsStore.maskKey(profile.apiKey),
    });
  } else if (profile?.provider === "mock") {
    hint.textContent = t("settings.keyMock");
  } else {
    hint.textContent = t("settings.keyNone");
  }
  $("#profile-test-result").textContent = "";
  $("#profile-submit").textContent = profile?.id ? t("settings.update") : t("settings.save");
  const needsUrl = profile?.provider !== "mock";
  $("#profile-base-url").disabled = !needsUrl;
  $("#profile-api-key").disabled = profile?.provider === "mock";
}

function applyProviderPreset(provider) {
  const preset = PROVIDER_PRESETS[provider] || PROVIDER_PRESETS.custom;
  $("#profile-base-url").value = preset.baseUrl || "";
  if (!$("#profile-model").value || provider === "mock" || provider === "deepseek") {
    $("#profile-model").value = preset.model || "";
  }
  $("#profile-base-url").disabled = provider === "mock";
  $("#profile-api-key").disabled = provider === "mock";
  const hint = $("#profile-key-hint");
  if (provider === "mock") {
    hint.textContent = t("settings.keyMock");
  } else if (!$("#profile-id").value) {
    hint.textContent = t("settings.keyNone");
  } else {
    const existing = settingsStore.listProfiles().find((p) => p.id === $("#profile-id").value);
    if (existing?.apiKey) {
      hint.textContent = t("settings.keySaved", {
        mask: settingsStore.maskKey(existing.apiKey),
      });
    } else {
      hint.textContent = t("settings.keyNone");
    }
  }
  syncModelSuggestions(provider, $("#profile-model").value);
}

function renderSettings() {
  const s = settingsStore.load();
  $("#settings-use-live").checked = !!s.useLiveModels;

  const activeSel = $("#settings-active");
  activeSel.innerHTML = s.profiles
    .map(
      (p) =>
        `<option value="${p.id}" ${p.id === s.activeProfileId ? "selected" : ""}>${escapeHtml(p.name)} (${escapeHtml(p.model || p.provider)})</option>`
    )
    .join("");

  const list = $("#profile-list");
  list.innerHTML = s.profiles
    .map(
      (p) => `
    <li class="${p.id === s.activeProfileId ? "profile-active" : ""}">
      <div class="name">${escapeHtml(p.name)}</div>
      <div class="meta">${escapeHtml(p.provider)} · ${escapeHtml(p.model || "—")} · ${p.apiKey || p.provider === "mock" ? t("settings.ready") : t("settings.noKey")}</div>
      <div class="actions">
        <button type="button" class="btn ghost" data-edit-profile="${p.id}">${escapeHtml(t("settings.edit"))}</button>
        <button type="button" class="btn secondary" data-activate-profile="${p.id}">${escapeHtml(t("settings.use"))}</button>
      </div>
    </li>`
    )
    .join("");

  list.querySelectorAll("[data-edit-profile]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const profile = settingsStore.listProfiles().find((p) => p.id === btn.dataset.editProfile);
      fillProfileForm(profile);
    });
  });
  list.querySelectorAll("[data-activate-profile]").forEach((btn) => {
    btn.addEventListener("click", () => {
      settingsStore.setActiveProfileId(btn.dataset.activateProfile);
      runner = createRunner();
      toast(t("settings.activeToast", { model: activeModelLabel() }));
      renderSettings();
      refresh();
    });
  });

  const active = settingsStore.getActiveProfile();
  fillProfileForm(active);
}

function renderBoard() {
  const board = $("#task-board");
  const tasks = store.listTasks();
  if (!tasks.length) {
    board.innerHTML = `<div class="empty-board">${escapeHtml(t("task.empty"))}</div>`;
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
        return `<li class="${cls}">${escapeHtml(statusLabel(s))}</li>`;
      }).join("");
      const rawStatus =
        task.status === "done" || task.status === "failed" || task.status === "cancelled"
          ? task.status
          : task.step || task.status;
      const model = task.modelLabel ? ` · ${escapeHtml(task.modelLabel)}` : "";
      return `
      <article class="task-card ${escapeHtml(task.status)}" data-task="${task.id}">
        <h3>${escapeHtml(task.title)}</h3>
        <div class="task-meta">
          <span>${escapeHtml(statusLabel(rawStatus))}${model}</span>
          <span>${escapeHtml(names)}</span>
        </div>
        <div class="task-progress"><span style="width:${task.progress || 0}%"></span></div>
        <ul class="task-steps">${steps}</ul>
        <p class="meta">${escapeHtml(task.log?.at(-1)?.message || task.brief.slice(0, 100))}</p>
      </article>`;
    })
    .join("");
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
        ? `<p class="meta">${t("agents.workingOn", {
            title: `<strong>${escapeHtml(busy.title)}</strong>`,
            step: escapeHtml(statusLabel(busy.step)),
            progress: busy.progress,
          })}</p>`
        : `<p class="meta">${escapeHtml(t("agents.deskClear"))}</p>`
    }
    <p class="meta">${t("agents.model", { model: escapeHtml(activeModelLabel()) })}</p>
    <div class="row-actions">
      <button type="button" class="btn secondary" data-edit="${agent.id}">${escapeHtml(t("agents.edit"))}</button>
      <button type="button" class="btn secondary" data-assign="${agent.id}">${escapeHtml(t("agents.assign"))}</button>
      <button type="button" class="btn danger" data-delete="${agent.id}">${escapeHtml(t("agents.remove"))}</button>
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
    if (!confirm(t("agents.confirmRemoveOffice", { name: agent.name }))) return;
    store.deleteAgent(agent.id);
    panel.hidden = true;
    toast(t("agents.left", { name: agent.name }));
    refresh();
  });
}

function onProgress(evt) {
  const patch = {
    status: evt.status,
    step: evt.step,
    progress: evt.progress,
  };
  if (evt.modelLabel) patch.modelLabel = evt.modelLabel;
  store.updateTask(evt.taskId, patch);
  if (evt.message) store.appendTaskLog(evt.taskId, evt.message);
  if (evt.agentId) {
    const busy = evt.status === "running" || evt.status === "queued";
    office?.setAgentBusy(evt.agentId, busy && evt.status !== "done", evt.progress);
  }
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
    if ((task.status === "queued" || task.status === "running") && task.progress < 100) {
      store.updateTask(task.id, { status: "queued", step: "queued", progress: 0 });
      startTask(store.getTask(task.id));
    }
  }
}

let office;

function refresh() {
  const agents = store.listAgents();
  const busy = agentBusyMap();
  const running = store
    .listTasks()
    .filter((t) => t.status === "running" || t.status === "queued").length;
  $("#floor-stats").innerHTML = t("hud.stats", {
    agents: `<strong>${agents.length}</strong>`,
    running: `<strong>${running}</strong>`,
    model: `<strong>${escapeHtml(activeModelLabel())}</strong>`,
  });
  renderBoard();
  office?.syncAgents(agents, busy);
  office?.syncTasks(store.listTasks());
  office?.setBoardTitle(t("task.boardHeader"));
}

function tuckHero() {
  $("#hero-overlay")?.classList.add("tucked");
  office?.focusLoft();
}

function applyLocale() {
  applyDomI18n(document);
  refresh();
  if (!$("#drawer-agents").hidden) renderAgentList();
  if (!$("#drawer-settings").hidden) renderSettings();
  if (!$("#drawer-task").hidden) {
    renderAssigneeChecks();
    renderTaskModelHint();
  }
}

function toggleLocale() {
  setLocale(getLocale() === "zh-CN" ? "en" : "zh-CN");
  applyLocale();
}

function bindSettingsUi() {
  $("#settings-use-live")?.addEventListener("change", (e) => {
    settingsStore.setUseLiveModels(e.target.checked);
    runner = createRunner();
    toast(
      e.target.checked
        ? t("settings.liveOn", { model: activeModelLabel() })
        : t("settings.liveOff")
    );
    refresh();
  });

  $("#settings-active")?.addEventListener("change", (e) => {
    settingsStore.setActiveProfileId(e.target.value);
    runner = createRunner();
    const profile = settingsStore.getActiveProfile();
    fillProfileForm(profile);
    toast(t("settings.activeToast", { model: activeModelLabel() }));
    renderSettings();
    refresh();
  });

  $("#profile-provider")?.addEventListener("change", (e) => {
    applyProviderPreset(e.target.value);
  });

  $("#profile-model-suggest")?.addEventListener("change", (e) => {
    const value = e.target.value;
    if (value) {
      $("#profile-model").value = value;
    }
  });

  $("#profile-new")?.addEventListener("click", () => {
    fillProfileForm({
      id: "",
      name: "",
      provider: "custom",
      baseUrl: PROVIDER_PRESETS.custom.baseUrl,
      apiKey: "",
      model: "",
    });
    $("#profile-name").focus();
  });

  $("#profile-delete")?.addEventListener("click", () => {
    const id = $("#profile-id").value;
    if (!id) {
      toast(t("settings.selectDelete"));
      return;
    }
    if (!confirm(t("settings.confirmDelete"))) return;
    try {
      settingsStore.deleteProfile(id);
      runner = createRunner();
      toast(t("settings.deleted"));
      renderSettings();
      refresh();
    } catch (err) {
      toast(err.message);
    }
  });

  $("#profile-test")?.addEventListener("click", async () => {
    const resultEl = $("#profile-test-result");
    resultEl.textContent = t("settings.testing");
    const existing = settingsStore.listProfiles().find((p) => p.id === $("#profile-id").value);
    const provider = $("#profile-provider").value;
    const preset = PROVIDER_PRESETS[provider] || PROVIDER_PRESETS.custom;
    const keyInput = $("#profile-api-key").value;
    const profile = {
      id: $("#profile-id").value || "draft",
      name: $("#profile-name").value || "draft",
      provider,
      baseUrl: $("#profile-base-url").value.trim(),
      apiKey: keyInput || existing?.apiKey || "",
      model: $("#profile-model").value.trim(),
      apiStyle: preset.apiStyle,
    };
    try {
      const res = await testProfile(profile);
      resultEl.textContent = t("settings.testOk", { preview: res.preview });
      toast(t("settings.testSuccessToast"));
    } catch (err) {
      resultEl.textContent = t("settings.testFail", { error: err.message });
      toast(t("settings.testFailToast"));
    }
  });

  $("#settings-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const provider = $("#profile-provider").value;
    const preset = PROVIDER_PRESETS[provider] || PROVIDER_PRESETS.custom;
    const existing = settingsStore.listProfiles().find((p) => p.id === $("#profile-id").value);
    const keyInput = $("#profile-api-key").value;
    const saved = settingsStore.upsertProfile({
      id: $("#profile-id").value || undefined,
      name: $("#profile-name").value,
      provider,
      baseUrl: $("#profile-base-url").value,
      apiKey: keyInput !== "" ? keyInput : existing?.apiKey || "",
      model: $("#profile-model").value,
      apiStyle: preset.apiStyle,
    });
    if (!$("#profile-id").value) {
      settingsStore.setActiveProfileId(saved.id);
    }
    runner = createRunner();
    toast(t("settings.saved", { name: saved.name }));
    renderSettings();
    refresh();
  });
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

  $("#btn-lang")?.addEventListener("click", toggleLocale);

  $("#btn-enter")?.addEventListener("click", tuckHero);
  $("#brand-home")?.addEventListener("click", (e) => {
    e.preventDefault();
    $("#hero-overlay")?.classList.remove("tucked");
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
    toast(
      payload.id
        ? t("agents.updated", { name: saved.name })
        : t("agents.hired", { name: saved.name })
    );
    resetAgentForm();
    refresh();
    renderAgentList();
    tuckHero();
  });

  $("#task-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const agentIds = $$('#assignee-checks input[name="assignees"]:checked').map(
      (i) => i.value
    );
    if (!agentIds.length) {
      toast(t("task.selectAgent"));
      return;
    }
    const profile = settingsStore.getActiveProfile();
    const task = store.createTask({
      title: $("#task-title").value,
      brief: $("#task-brief").value,
      agentIds,
      modelProfileId: profile?.id || null,
      modelLabel: activeModelLabel(),
    });
    $("#task-form").reset();
    closeDrawers();
    toast(t("task.started", { title: task.title, model: activeModelLabel() }));
    startTask(task);
    refresh();
    tuckHero();
  });

  bindSettingsUi();
}

function showBootError(err) {
  console.error("[Agent Office] boot failed", err);
  const box = document.createElement("div");
  box.setAttribute("role", "alert");
  box.style.cssText =
    "position:fixed;inset:12px;z-index:9999;max-width:560px;margin:auto;padding:1rem 1.2rem;" +
    "background:#1a2228;color:#e8eef1;border:1px solid #b56a3a;border-radius:8px;" +
    "font:14px/1.5 system-ui,sans-serif;white-space:pre-wrap;";
  box.textContent =
    "智能体办公室启动失败 / Boot failed\n\n" +
    String(err?.message || err) +
    "\n\n请硬刷新，或打开开发者工具查看控制台。";
  document.body.appendChild(box);
}

function boot() {
  const state = store.load();
  if (!localStorage.getItem(store.key)) {
    store.save(state);
  }
  if (!localStorage.getItem(settingsStore.key)) {
    settingsStore.save(settingsStore.load());
  }

  applyDomI18n(document);

  const canvas = $("#office-canvas");
  if (!canvas) throw new Error("Missing #office-canvas");

  office = new OfficeScene(canvas, {
    onSelectDesk(_idx, agentId) {
      showInspector(agentId);
      tuckHero();
    },
    onSelectEmpty() {
      openDrawer("agents");
      tuckHero();
    },
    onSelectBoard() {
      openDrawer("task");
      tuckHero();
    },
  });

  bindUi();
  refresh();
  resumeRunningTasks();
}

try {
  boot();
} catch (err) {
  showBootError(err);
}
