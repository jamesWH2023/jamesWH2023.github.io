# Agent Office (3D)

A WebGL loft for [jamesWH2023.github.io](https://jameswh2023.github.io/) where custom agents sit at 3D desks, take complex briefs, and call configurable LLM profiles.

Live path on GitHub Pages: **`/office/`**

## Language / 语言

UI supports **中文 (zh-CN)** and **English (en)** via `js/i18n.js`.

- Default: saved preference, otherwise **zh-CN**
- Toggle: top-bar **中文 / EN** button (persists in `localStorage` as `agent-office:locale`)
- Covers nav, hero, drawers (agents / tasks / settings / guide), empty states, toasts, HUD, and 3D wall-board title

默认中文；顶栏可切换英文。偏好保存在本浏览器。

## Stack

- Plain HTML / CSS / ES modules (no build step)
- [Three.js](https://threejs.org/) `0.170` via CDN import map + `OrbitControls`
- Browser-side LLM calls (OpenAI-compatible fetch; Anthropic Messages; mock offline)
- Same subdirectory pattern as `/tank-alley/` — does not modify the root SPA

## Run locally

```bash
cd office
npm start
# → http://localhost:5184
```

## Model settings

Open **Settings** in the nav.

1. Toggle **Use live / mock models** (off = pure local `SimulatedRunner`).
2. Pick or create a **profile**: provider, base URL, API key, model id.
3. **Test call** pings the model (or mock).
4. **Use** sets the active profile for new tasks.

### Providers

| Provider | Style | Notes |
| --- | --- | --- |
| OpenAI | OpenAI-compatible | `https://api.openai.com/v1` + model e.g. `gpt-4o-mini` |
| Google | OpenAI-compatible | Gemini OpenAI endpoint preset |
| DeepSeek | OpenAI-compatible | First-class preset — see below |
| Custom | OpenAI-compatible | Any `/chat/completions` host |
| Anthropic | Native Messages API | Browser may hit CORS; use a gateway base URL if needed |
| Mock | Offline | No key / network — canned replies for demos |

### DeepSeek setup

1. In Settings, select the **DeepSeek** profile (or provider **DeepSeek** on a new profile).
2. Base URL defaults to `https://api.deepseek.com` (OpenAI-compatible `/v1/chat/completions` via the client’s `/chat/completions` join).
3. Pick a suggested model: **`deepseek-chat`** or **`deepseek-reasoner`** (or type another id).
4. Paste your DeepSeek API key in the key field — it stays in this browser’s `localStorage` only. Never commit keys.

**Security:** API keys are stored only in this browser’s `localStorage` (`agent-office:settings:v1`). There is no server. Prefer scoped keys; clear Settings on shared machines.

Agents + tasks still persist under `agent-office:v1`.

## Controls

| Input | Action |
| --- | --- |
| Drag | Orbit camera |
| Scroll / pinch | Zoom |
| Tap / click desk | Inspect agent (or hire if empty) |
| Tap wall task board | Open assign-task drawer |

## Add agents

1. Open **Agents** (or tap an empty desk).
2. Set **name**, **role/brief**, **capabilities/instructions**, and desk **accent**.
3. Save — figures appear at desks.

## Assign tasks

1. Open **Assign task**.
2. Write a title + brief, select agents → **Start work**.
3. Stages run through the **active model profile** (`LlmRunner`) when live models are on:

`queued → researching → drafting → reviewing → done`

Each stage prompts an assigned agent’s instructions + the brief. Soft-fallback to local notes if a call fails.

## Wire real Cursor / Agent SDK agents

```js
// js/runner.js
export function createRunner() {
  // return new CursorAgentSdkRunner({ endpoint: "https://your.host/agents/run" });
  if (settingsStore.getUseLiveModels()) return new LlmRunner();
  return new SimulatedRunner();
}
```

`CursorAgentSdkRunner` remains a documented stub.

## Files

| Path | Role |
| --- | --- |
| `js/scene.js` | Three.js room, desks, agents, board |
| `js/i18n.js` | zh-CN + en strings + locale toggle |
| `js/settings.js` | Model profiles in localStorage |
| `js/llm.js` | OpenAI-compatible / Anthropic / mock client |
| `js/store.js` | Agents + tasks persistence |
| `js/runner.js` | LlmRunner + SimulatedRunner + SDK stub |
| `js/main.js` | Overlays + wiring |
| `css/office.css` | Overlay chrome |
