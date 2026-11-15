/**
 * Browser-side LLM client.
 * Prefer OpenAI-compatible chat completions so custom base URLs work.
 * Anthropic uses its Messages API when apiStyle === "anthropic".
 * Mock returns canned text (no network) for demos without keys.
 */

function joinUrl(base, path) {
  const b = (base || "").replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function extractOpenAiText(data) {
  const choice = data?.choices?.[0];
  if (!choice) return "";
  if (typeof choice.message?.content === "string") return choice.message.content;
  if (Array.isArray(choice.message?.content)) {
    return choice.message.content.map((c) => c.text || c.content || "").join("");
  }
  return choice.text || "";
}

async function chatOpenAiCompatible({ baseUrl, apiKey, model, messages, signal }) {
  const url = joinUrl(baseUrl, "/chat/completions");
  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.5,
      max_tokens: 800,
    }),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Bad JSON from ${url} (${res.status})`);
  }
  if (!res.ok) {
    const errMsg = data?.error?.message || data?.message || text.slice(0, 200);
    throw new Error(`LLM ${res.status}: ${errMsg}`);
  }
  const content = extractOpenAiText(data).trim();
  if (!content) throw new Error("Empty model response");
  return content;
}

async function chatAnthropic({ baseUrl, apiKey, model, messages, signal }) {
  const url = joinUrl(baseUrl || "https://api.anthropic.com", "/v1/messages");
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const anthropicMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));
  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      system: system || undefined,
      messages: anthropicMessages.length ? anthropicMessages : [{ role: "user", content: "Hello" }],
    }),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Bad JSON from Anthropic (${res.status})`);
  }
  if (!res.ok) {
    const errMsg = data?.error?.message || text.slice(0, 200);
    throw new Error(`Anthropic ${res.status}: ${errMsg}`);
  }
  const content = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  if (!content) throw new Error("Empty Anthropic response");
  return content;
}

function mockChat({ model, messages }) {
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const snippet = lastUser.replace(/\s+/g, " ").slice(0, 120);
  return Promise.resolve(
    `[${model}] Mock reply (no network). Heard: “${snippet}${lastUser.length > 120 ? "…" : ""}” — outline next steps and flag risks.`
  );
}

/**
 * @param {object} profile settings profile
 * @param {{ role: string, content: string }[]} messages
 * @param {{ signal?: AbortSignal }} [opts]
 */
export async function chatCompletion(profile, messages, opts = {}) {
  if (!profile) throw new Error("No model profile selected");
  const style = profile.apiStyle || "openai";

  if (style === "mock" || profile.provider === "mock") {
    return mockChat({ model: profile.model || "mock-demo", messages });
  }

  if (!profile.apiKey?.trim()) {
    throw new Error("API key missing — add one in Settings (stored only in this browser).");
  }
  if (!profile.model?.trim()) {
    throw new Error("Model id missing");
  }

  if (style === "anthropic") {
    return chatAnthropic({
      baseUrl: profile.baseUrl,
      apiKey: profile.apiKey.trim(),
      model: profile.model.trim(),
      messages,
      signal: opts.signal,
    });
  }

  if (!profile.baseUrl?.trim()) {
    throw new Error("Base URL missing");
  }

  return chatOpenAiCompatible({
    baseUrl: profile.baseUrl.trim(),
    apiKey: profile.apiKey.trim(),
    model: profile.model.trim(),
    messages,
    signal: opts.signal,
  });
}

/** Lightweight connectivity check for Settings UI. */
export async function testProfile(profile, opts = {}) {
  const content = await chatCompletion(
    profile,
    [
      { role: "system", content: "Reply with exactly: OK" },
      { role: "user", content: "ping" },
    ],
    opts
  );
  return { ok: true, preview: content.slice(0, 160) };
}

export function buildAgentMessages(agent, task, step) {
  const system = [
    `You are ${agent?.name || "an agent"} — ${agent?.role || "office collaborator"}.`,
    agent?.instructions || "Be concise and useful.",
    `Current stage: ${step}.`,
    "Respond in 2–5 short paragraphs or bullets. No markdown tables.",
  ].join("\n");

  const user = [
    `Task: ${task.title}`,
    "",
    task.brief,
    "",
    `Produce the ${step} contribution for this brief.`,
  ].join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}
