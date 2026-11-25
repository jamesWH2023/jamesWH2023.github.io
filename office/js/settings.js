/** LLM settings persistence (browser localStorage — keys never leave the client). */

const SETTINGS_KEY = "agent-office:settings:v1";

export const PROVIDER_PRESETS = {
  openai: {
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    apiStyle: "openai",
    models: ["gpt-4o-mini", "gpt-4o"],
  },
  anthropic: {
    label: "Anthropic",
    baseUrl: "https://api.anthropic.com",
    model: "claude-3-5-haiku-latest",
    apiStyle: "anthropic",
    models: ["claude-3-5-haiku-latest", "claude-sonnet-4-5"],
  },
  google: {
    label: "Google (OpenAI-compatible)",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-2.0-flash",
    apiStyle: "openai",
    models: ["gemini-2.0-flash", "gemini-2.5-flash"],
  },
  deepseek: {
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-chat",
    apiStyle: "openai",
    models: ["deepseek-chat", "deepseek-reasoner"],
  },
  custom: {
    label: "Custom (OpenAI-compatible)",
    baseUrl: "https://api.example.com/v1",
    model: "your-model-id",
    apiStyle: "openai",
    models: [],
  },
  mock: {
    label: "Mock (offline demo)",
    baseUrl: "",
    model: "mock-demo",
    apiStyle: "mock",
    models: ["mock-demo"],
  },
};

export function deepseekDefaultProfile() {
  return {
    id: "profile-deepseek",
    name: "DeepSeek",
    provider: "deepseek",
    baseUrl: PROVIDER_PRESETS.deepseek.baseUrl,
    apiKey: "",
    model: PROVIDER_PRESETS.deepseek.model,
    apiStyle: "openai",
  };
}

function uid(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}`;
}

function defaultProfiles() {
  return [
    {
      id: "profile-mock",
      name: "Mock demo",
      provider: "mock",
      baseUrl: "",
      apiKey: "",
      model: "mock-demo",
      apiStyle: "mock",
    },
    {
      id: "profile-openai",
      name: "OpenAI",
      provider: "openai",
      baseUrl: PROVIDER_PRESETS.openai.baseUrl,
      apiKey: "",
      model: PROVIDER_PRESETS.openai.model,
      apiStyle: "openai",
    },
    {
      id: "profile-anthropic",
      name: "Anthropic",
      provider: "anthropic",
      baseUrl: PROVIDER_PRESETS.anthropic.baseUrl,
      apiKey: "",
      model: PROVIDER_PRESETS.anthropic.model,
      apiStyle: "anthropic",
    },
    {
      id: "profile-google",
      name: "Google Gemini",
      provider: "google",
      baseUrl: PROVIDER_PRESETS.google.baseUrl,
      apiKey: "",
      model: PROVIDER_PRESETS.google.model,
      apiStyle: "openai",
    },
    deepseekDefaultProfile(),
  ];
}

function emptySettings() {
  return {
    activeProfileId: "profile-mock",
    useLiveModels: true,
    profiles: defaultProfiles(),
  };
}

function ensureDeepSeekProfile(settings) {
  const hasDeepSeek = settings.profiles.some(
    (p) => p.provider === "deepseek" || p.id === "profile-deepseek"
  );
  if (!hasDeepSeek) {
    settings.profiles.push(deepseekDefaultProfile());
    return { settings, migrated: true };
  }
  return { settings, migrated: false };
}

function readRaw() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return emptySettings();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.profiles)) return emptySettings();
    const merged = {
      ...emptySettings(),
      ...parsed,
      profiles: parsed.profiles,
    };
    const { settings, migrated } = ensureDeepSeekProfile(merged);
    if (migrated) writeRaw(settings);
    return settings;
  } catch {
    return emptySettings();
  }
}

function writeRaw(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export const settingsStore = {
  key: SETTINGS_KEY,

  load() {
    return readRaw();
  },

  save(settings) {
    writeRaw(settings);
  },

  listProfiles() {
    return readRaw().profiles;
  },

  getActiveProfile() {
    const s = readRaw();
    return s.profiles.find((p) => p.id === s.activeProfileId) || s.profiles[0] || null;
  },

  getActiveProfileId() {
    return readRaw().activeProfileId;
  },

  setActiveProfileId(id) {
    const s = readRaw();
    if (!s.profiles.some((p) => p.id === id)) throw new Error("Profile not found");
    s.activeProfileId = id;
    writeRaw(s);
    return s;
  },

  getUseLiveModels() {
    return !!readRaw().useLiveModels;
  },

  setUseLiveModels(flag) {
    const s = readRaw();
    s.useLiveModels = !!flag;
    writeRaw(s);
    return s;
  },

  upsertProfile(input) {
    const s = readRaw();
    const preset = PROVIDER_PRESETS[input.provider] || PROVIDER_PRESETS.custom;
    const apiStyle =
      input.provider === "mock"
        ? "mock"
        : input.apiStyle || preset.apiStyle || "openai";
    const baseUrl =
      input.provider === "mock"
        ? ""
        : (input.baseUrl || "").trim().replace(/\/$/, "");
    if (input.id) {
      const idx = s.profiles.findIndex((p) => p.id === input.id);
      if (idx === -1) throw new Error("Profile not found");
      s.profiles[idx] = {
        ...s.profiles[idx],
        name: input.name.trim(),
        provider: input.provider,
        baseUrl,
        apiKey: input.provider === "mock" ? "" : input.apiKey ?? s.profiles[idx].apiKey,
        model: input.model.trim(),
        apiStyle,
      };
      writeRaw(s);
      return s.profiles[idx];
    }
    const profile = {
      id: uid("profile"),
      name: input.name.trim(),
      provider: input.provider || "custom",
      baseUrl: baseUrl || (preset.baseUrl || "").replace(/\/$/, ""),
      apiKey: input.provider === "mock" ? "" : input.apiKey || "",
      model: (input.model || preset.model || "").trim(),
      apiStyle,
    };
    s.profiles.push(profile);
    writeRaw(s);
    return profile;
  },

  deleteProfile(id) {
    const s = readRaw();
    if (s.profiles.length <= 1) throw new Error("Keep at least one profile");
    s.profiles = s.profiles.filter((p) => p.id !== id);
    if (s.activeProfileId === id) s.activeProfileId = s.profiles[0].id;
    writeRaw(s);
  },

  /** Masked key for UI display */
  maskKey(key) {
    if (!key) return "";
    if (key.length <= 8) return "••••••••";
    return `${key.slice(0, 3)}…${key.slice(-4)}`;
  },
};
