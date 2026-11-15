# Agent Office (3D)

A WebGL loft for [jamesWH2023.github.io](https://jameswh2023.github.io/) where custom agents sit at 3D desks, take complex briefs, and show progress on a wall board and HUD.

Live path on GitHub Pages: **`/office/`**

## Stack

- Plain HTML / CSS / ES modules (no build step)
- [Three.js](https://threejs.org/) `0.170` via CDN import map + `OrbitControls`
- Same subdirectory pattern as `/tank-alley/` — does not modify the root SPA

## Run locally

```bash
cd office
npm start
# → http://localhost:5184
```

Any static server works:

```bash
python3 -m http.server 5184
npx --yes serve -l 5184 office
```

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
3. Save. Agents persist in `localStorage` under `agent-office:v1` and appear as 3D figures at desks.

## Assign tasks

1. Open **Assign task** (or tap the wall board).
2. Write a title + brief, select one or more agents → **Start work**.
3. Desk lamps glow, agents animate, and the HUD / 3D board advance through:

`queued → researching → drafting → reviewing → done`

Default engine: **simulated runner** in `js/runner.js`.

## Wire real Cursor / Agent SDK agents

```js
// js/runner.js
runner.start(task, agents, {
  onProgress({ taskId, status, step, progress, message, agentId }) { … }
})
// returns { cancel() }
```

1. Implement streaming against your host (or Cursor Agent SDK).
2. Map remote events onto `TASK_STEPS`.
3. Switch the factory:

```js
export function createRunner() {
  return new CursorAgentSdkRunner({ endpoint: "https://your.host/agents/run" });
}
```

`CursorAgentSdkRunner` ships as a documented stub.

## Files

| Path | Role |
| --- | --- |
| `js/scene.js` | Three.js room, desks, agents, board, orbit |
| `js/store.js` | localStorage persistence |
| `js/runner.js` | SimulatedRunner + SDK stub |
| `js/main.js` | HTML overlays + wiring |
| `css/office.css` | Overlay chrome |
