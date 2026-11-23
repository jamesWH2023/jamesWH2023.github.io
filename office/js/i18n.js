/** Lightweight i18n for Agent Office — zh-CN + en. */

const LOCALE_KEY = "agent-office:locale";

const en = {
  "meta.title": "Agent Office · jamesWH",
  "meta.description":
    "A 3D agent office for jamesWH — hire custom agents, assign complex tasks, watch them work in the loft.",
  "nav.agents": "Agents",
  "nav.task": "Assign task",
  "nav.settings": "Settings",
  "nav.guide": "How it works",
  "nav.lang": "中文",
  "nav.langTitle": "Switch to Chinese",
  "brand.home": "Agent Office home",
  "brand.text": "Agent Office",
  "hero.eyebrow": "jamesWH · personal loft",
  "hero.title": "Agent Office",
  "hero.lede":
    "A copper-lit 3D loft. Hire agents to desks, assign complex briefs, and watch the room work.",
  "hero.hire": "Hire an agent",
  "hero.enter": "Enter the loft",
  "hero.orbit": "Drag to orbit · pinch / scroll to zoom · tap a desk",
  "hud.taskBoard": "Task board",
  "hud.new": "New",
  "hud.stats": "{agents} agents · {running} active · {model}",
  "canvas.label": "3D Agent Office loft",
  "close": "Close",
  "close.inspector": "Close inspector",

  "agents.title": "Agents",
  "agents.name": "Name",
  "agents.namePh": "e.g. Cartographer",
  "agents.role": "Role / brief",
  "agents.rolePh": "Maps research into clear plans",
  "agents.instructions": "Capabilities / instructions",
  "agents.instructionsPh": "What this agent is good at, how it should work…",
  "agents.accent": "Desk accent",
  "accent.copper": "Copper",
  "accent.verdigris": "Verdigris",
  "accent.slate": "Slate",
  "accent.clay": "Clay",
  "accent.ink": "Ink",
  "agents.save": "Save agent",
  "agents.update": "Update agent",
  "agents.clear": "Clear form",
  "agents.empty": "No agents yet — hire your first.",
  "agents.edit": "Edit",
  "agents.remove": "Remove",
  "agents.hireFirst": "Hire an agent before assigning work.",
  "agents.removed": "{name} removed",
  "agents.left": "{name} left the loft",
  "agents.updated": "Updated {name}",
  "agents.hired": "{name} took a desk",
  "agents.confirmRemove": "Remove {name}?",
  "agents.confirmRemoveOffice": "Remove {name} from the office?",
  "agents.deskClear": "Desk is clear — ready for a brief.",
  "agents.workingOn": "Working on {title} · {step} ({progress}%)",
  "agents.assign": "Assign task",
  "agents.model": "Model: {model}",

  "task.title": "Assign a task",
  "task.titleLabel": "Title",
  "task.titlePh": "Ship a landing page audit",
  "task.brief": "Brief",
  "task.briefPh": "Describe the complex work. Break it into what success looks like…",
  "task.assignTo": "Assign to",
  "task.start": "Start work",
  "task.modelHint": "Model: {model} — change in Settings",
  "task.empty": "No tasks yet. Assign work to agents in the loft.",
  "task.selectAgent": "Select at least one agent",
  "task.started": "Task “{title}” · {model}",
  "task.boardHeader": "TASK BOARD",

  "settings.title": "Model settings",
  "settings.warn":
    "API keys are stored only in this browser’s localStorage (not on a server). Anyone with device access can read them. Prefer scoped keys; clear settings on shared machines.",
  "settings.useLive": "Use live / mock models for tasks (off = pure local simulation)",
  "settings.active": "Active profile",
  "settings.profileName": "Profile name",
  "settings.profileNamePh": "Work OpenAI",
  "settings.provider": "Provider",
  "settings.baseUrl": "Base URL",
  "settings.apiKey": "API key",
  "settings.apiKeyPh": "sk-… (leave blank to keep existing)",
  "settings.modelId": "Model id",
  "settings.modelSuggest": "Suggested models",
  "settings.modelCustom": "Custom / type below…",
  "settings.save": "Save profile",
  "settings.update": "Update profile",
  "settings.test": "Test call",
  "settings.new": "New profile",
  "settings.delete": "Delete",
  "settings.keySaved": "Saved key: {mask} — leave blank to keep",
  "settings.keyMock": "Mock profile needs no API key.",
  "settings.keyNone": "No key saved yet.",
  "settings.ready": "ready",
  "settings.noKey": "no key",
  "settings.use": "Use",
  "settings.edit": "Edit",
  "settings.testing": "Testing…",
  "settings.testOk": "OK — {preview}",
  "settings.testFail": "Failed — {error}",
  "settings.testSuccessToast": "Model call succeeded",
  "settings.testFailToast": "Model call failed",
  "settings.saved": "Saved {name}",
  "settings.deleted": "Profile deleted",
  "settings.selectDelete": "Select a saved profile to delete",
  "settings.confirmDelete": "Delete this model profile?",
  "settings.activeToast": "Active model: {model}",
  "settings.liveOn": "Live models on · {model}",
  "settings.liveOff": "Using local simulation",
  "settings.simulated": "simulated (live models off)",
  "provider.openai": "OpenAI",
  "provider.anthropic": "Anthropic",
  "provider.google": "Google (OpenAI-compatible)",
  "provider.deepseek": "DeepSeek",
  "provider.custom": "Custom (OpenAI-compatible)",
  "provider.mock": "Mock (offline demo)",

  "guide.title": "How it works",
  "guide.loft.h": "3D loft",
  "guide.loft.p":
    "The room, desks, agents, lamps, and wall board are WebGL meshes (Three.js). HTML overlays handle forms and task status.",
  "guide.settings.h": "Model settings",
  "guide.settings.p":
    "Open Settings to add OpenAI-compatible, Anthropic, Google, or custom profiles (base URL + API key + model). Keys stay in localStorage. Mock profile works offline. Active profile drives task stages via LlmRunner.",
  "guide.agents.h": "Add agents",
  "guide.agents.p":
    "Open Agents, set name, role, and instructions, pick an accent, save. Data lives in localStorage under agent-office:v1. Tap a desk in the scene to inspect.",
  "guide.tasks.h": "Assign tasks",
  "guide.tasks.p":
    "Open Assign task, write a brief, select agents, start. Lamps glow while the active model (or simulation) advances stages on the HUD board.",
  "guide.sdk.h": "Wire real Cursor agents",
  "guide.sdk.p":
    "createRunner() in js/runner.js still exposes a Cursor SDK stub — see office/README.md.",
  "guide.lang.h": "Language",
  "guide.lang.p":
    "Use the language toggle in the top bar to switch between 中文 and English. Preference is saved in this browser.",

  "step.queued": "Waiting at the desk…",
  "step.researching": "Scout notes pinned to the board.",
  "step.drafting": "First pass taking shape.",
  "step.reviewing": "Polish pass before handoff.",
  "step.done": "Work delivered.",
  "runner.queuedOn": "Queued on {model}",
  "runner.calling": "{name}: calling {model} ({step})…",
  "runner.error": "{name}: model error — {error}. Using local note: {fallback}",
  "runner.delivered": "{name}: Work delivered via {model}.",
  "runner.cancelled": "Task cancelled",
  "status.queued": "queued",
  "status.researching": "researching",
  "status.drafting": "drafting",
  "status.reviewing": "reviewing",
  "status.done": "done",
  "status.running": "running",
  "status.failed": "failed",
  "status.cancelled": "cancelled",
  "status.idle": "idle",
};

const zh = {
  "meta.title": "智能体办公室 · jamesWH",
  "meta.description": "jamesWH 的三维智能体办公室——雇佣自定义智能体、分配复杂任务、在阁楼中查看进度。",
  "nav.agents": "智能体",
  "nav.task": "分配任务",
  "nav.settings": "设置",
  "nav.guide": "使用说明",
  "nav.lang": "EN",
  "nav.langTitle": "切换到英文",
  "brand.home": "智能体办公室首页",
  "brand.text": "智能体办公室",
  "hero.eyebrow": "jamesWH · 个人阁楼",
  "hero.title": "智能体办公室",
  "hero.lede": "铜光映照的三维阁楼。把智能体请到工位，下达复杂任务，看着整间办公室运转起来。",
  "hero.hire": "雇佣智能体",
  "hero.enter": "进入阁楼",
  "hero.orbit": "拖动环视 · 捏合/滚轮缩放 · 点击工位",
  "hud.taskBoard": "任务看板",
  "hud.new": "新建",
  "hud.stats": "{agents} 个智能体 · {running} 进行中 · {model}",
  "canvas.label": "三维智能体办公室阁楼",
  "close": "关闭",
  "close.inspector": "关闭详情",

  "agents.title": "智能体",
  "agents.name": "名称",
  "agents.namePh": "例如：制图员",
  "agents.role": "角色 / 简介",
  "agents.rolePh": "把调研整理成清晰计划",
  "agents.instructions": "能力 / 指令",
  "agents.instructionsPh": "这位智能体擅长什么、应如何工作…",
  "agents.accent": "工位配色",
  "accent.copper": "铜色",
  "accent.verdigris": "铜绿",
  "accent.slate": "石板灰",
  "accent.clay": "陶土",
  "accent.ink": "墨色",
  "agents.save": "保存智能体",
  "agents.update": "更新智能体",
  "agents.clear": "清空表单",
  "agents.empty": "还没有智能体——先雇佣一位。",
  "agents.edit": "编辑",
  "agents.remove": "移除",
  "agents.hireFirst": "请先雇佣智能体再分配任务。",
  "agents.removed": "已移除 {name}",
  "agents.left": "{name} 已离开阁楼",
  "agents.updated": "已更新 {name}",
  "agents.hired": "{name} 已入座",
  "agents.confirmRemove": "移除 {name}？",
  "agents.confirmRemoveOffice": "将 {name} 移出办公室？",
  "agents.deskClear": "工位空闲——可以接下新任务。",
  "agents.workingOn": "正在处理 {title} · {step}（{progress}%）",
  "agents.assign": "分配任务",
  "agents.model": "模型：{model}",

  "task.title": "分配任务",
  "task.titleLabel": "标题",
  "task.titlePh": "例如：落地页可用性审计",
  "task.brief": "任务说明",
  "task.briefPh": "描述复杂工作内容，以及怎样算完成…",
  "task.assignTo": "指派给",
  "task.start": "开始工作",
  "task.modelHint": "模型：{model} — 可在设置中更改",
  "task.empty": "还没有任务。请在阁楼中给智能体分配工作。",
  "task.selectAgent": "请至少选择一位智能体",
  "task.started": "任务「{title}」· {model}",
  "task.boardHeader": "任务看板",

  "settings.title": "模型设置",
  "settings.warn":
    "API 密钥仅保存在本浏览器的 localStorage（不会上传到服务器）。任何能使用本设备的人都能读取。请优先使用权限受限的密钥；共用电脑请清除设置。",
  "settings.useLive": "任务使用在线/模拟模型（关闭 = 纯本地模拟）",
  "settings.active": "当前配置",
  "settings.profileName": "配置名称",
  "settings.profileNamePh": "工作用 OpenAI",
  "settings.provider": "服务商",
  "settings.baseUrl": "接口地址",
  "settings.apiKey": "API 密钥",
  "settings.apiKeyPh": "sk-…（留空则保留已有密钥）",
  "settings.modelId": "模型 ID",
  "settings.modelSuggest": "推荐模型",
  "settings.modelCustom": "自定义 / 在下方填写…",
  "settings.save": "保存配置",
  "settings.update": "更新配置",
  "settings.test": "测试调用",
  "settings.new": "新建配置",
  "settings.delete": "删除",
  "settings.keySaved": "已保存密钥：{mask} — 留空则保留",
  "settings.keyMock": "模拟配置无需 API 密钥。",
  "settings.keyNone": "尚未保存密钥。",
  "settings.ready": "就绪",
  "settings.noKey": "无密钥",
  "settings.use": "使用",
  "settings.edit": "编辑",
  "settings.testing": "测试中…",
  "settings.testOk": "成功 — {preview}",
  "settings.testFail": "失败 — {error}",
  "settings.testSuccessToast": "模型调用成功",
  "settings.testFailToast": "模型调用失败",
  "settings.saved": "已保存 {name}",
  "settings.deleted": "配置已删除",
  "settings.selectDelete": "请先选择要删除的配置",
  "settings.confirmDelete": "删除此模型配置？",
  "settings.activeToast": "当前模型：{model}",
  "settings.liveOn": "已启用在线模型 · {model}",
  "settings.liveOff": "使用本地模拟",
  "settings.simulated": "模拟（在线模型已关闭）",
  "provider.openai": "OpenAI",
  "provider.anthropic": "Anthropic",
  "provider.google": "Google（OpenAI 兼容）",
  "provider.deepseek": "DeepSeek",
  "provider.custom": "自定义（OpenAI 兼容）",
  "provider.mock": "模拟（离线演示）",

  "guide.title": "使用说明",
  "guide.loft.h": "三维阁楼",
  "guide.loft.p":
    "房间、工位、智能体、台灯与墙面看板均为 WebGL 网格（Three.js）。表单与任务状态由 HTML 浮层处理。",
  "guide.settings.h": "模型设置",
  "guide.settings.p":
    "打开「设置」可添加 OpenAI 兼容、Anthropic、Google 或自定义配置（接口地址 + API 密钥 + 模型）。密钥保存在 localStorage。模拟配置可离线使用。当前配置通过 LlmRunner 驱动任务阶段。",
  "guide.agents.h": "添加智能体",
  "guide.agents.p":
    "打开「智能体」，填写名称、角色与指令，选择配色后保存。数据保存在 localStorage 的 agent-office:v1。点击场景中的工位可查看详情。",
  "guide.tasks.h": "分配任务",
  "guide.tasks.p":
    "打开「分配任务」，撰写说明并选择智能体后开始。台灯会亮起，当前模型（或本地模拟）会在看板上推进阶段。",
  "guide.sdk.h": "接入真实 Cursor 智能体",
  "guide.sdk.p":
    "js/runner.js 中的 createRunner() 仍保留 Cursor SDK 扩展桩——详见 office/README.md。",
  "guide.lang.h": "语言",
  "guide.lang.p": "使用顶栏语言切换在中文与英文之间切换。偏好会保存在本浏览器。",

  "step.queued": "在工位等候…",
  "step.researching": "调研笔记已钉在看板上。",
  "step.drafting": "初稿正在成形。",
  "step.reviewing": "交付前的润色检查。",
  "step.done": "工作已交付。",
  "runner.queuedOn": "已排队 · {model}",
  "runner.calling": "{name}：正在调用 {model}（{step}）…",
  "runner.error": "{name}：模型错误 — {error}。改用本地备注：{fallback}",
  "runner.delivered": "{name}：已通过 {model} 交付。",
  "runner.cancelled": "任务已取消",
  "status.queued": "排队",
  "status.researching": "调研",
  "status.drafting": "起草",
  "status.reviewing": "审阅",
  "status.done": "完成",
  "status.running": "进行中",
  "status.failed": "失败",
  "status.cancelled": "已取消",
  "status.idle": "空闲",
};

const catalogs = { en, "zh-CN": zh };

function detectLocale() {
  try {
    const saved = localStorage.getItem(LOCALE_KEY);
    if (saved === "en" || saved === "zh-CN") return saved;
  } catch {
    /* ignore */
  }
  // First visit defaults to Chinese; English via top-bar toggle (persists).
  return "zh-CN";
}

let current = detectLocale();

export function getLocale() {
  return current;
}

export function setLocale(locale) {
  current = locale === "en" ? "en" : "zh-CN";
  try {
    localStorage.setItem(LOCALE_KEY, current);
  } catch {
    /* ignore */
  }
  return current;
}

/** Interpolate `{name}` placeholders. */
export function t(key, vars = {}) {
  const table = catalogs[current] || zh;
  let str = table[key] ?? catalogs.en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replaceAll(`{${k}}`, String(v ?? ""));
  }
  return str;
}

/** Apply data-i18n / data-i18n-placeholder / data-i18n-aria / data-i18n-title on the document. */
export function applyDomI18n(root = document) {
  const doc = root.documentElement ? root : document;
  doc.documentElement.setAttribute("lang", current === "zh-CN" ? "zh-CN" : "en");

  const scope = root.body ? root : document;
  scope.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    el.textContent = t(key);
  });
  scope.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    if (!key) return;
    el.innerHTML = t(key);
  });
  scope.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (!key) return;
    el.setAttribute("placeholder", t(key));
  });
  scope.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (!key) return;
    el.setAttribute("aria-label", t(key));
  });
  scope.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (!key) return;
    el.setAttribute("title", t(key));
  });

  const titleEl = doc.querySelector("title");
  if (titleEl) titleEl.textContent = t("meta.title");
  const desc = doc.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", t("meta.description"));
}

export { LOCALE_KEY };
