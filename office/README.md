# Agent Office

A visual loft for [jamesWH2023.github.io](https://jameswh2023.github.io/) where custom agents sit at desks, take complex briefs, and show progress in the room.

Live path on GitHub Pages: **`/office/`**

## Run locally

```bash
cd office
npm start
# → http://localhost:5184
```

Any static server works:

```bash
python3 -m http.server 5184
# or from repo root
npx --yes serve -l 5184 office
```

## Add agents

1. Open **Agents** (nav or “Hire an agent”).
2. Set **name**, **role/brief**, **capabilities/instructions**, and a desk **accent**.
3. Save. Agents persist in `localStorage` under the key `agent-office:v1`.

Edit or remove agents from the Agents drawer or by clicking their desk inspector.

## Assign tasks

1. Open **Assign task**.
2. Write a title and a complex brief.
3. Select one or more agents → **Start work**.
4. Watch desks pulse and the **Task board** advance through:

`queued → researching → drafting → reviewing → done`

The default engine is a **simulated runner** (`js/runner.js`) so the office is interactive without a backend.

## Wire real Cursor / Agent SDK agents

The UI already talks to an `AgentRunner` interface:

```js
// js/runner.js
runner.start(task, agents, {
  onProgress({ taskId, status, step, progress, message, agentId }) { … }
})
// returns { cancel() }
```

To connect live agents:

1. Implement streaming against your host (or Cursor Agent SDK) in a new class next to `SimulatedRunner`.
2. Map remote events onto `TASK_STEPS` (or extend that list).
3. Switch the factory:

```js
export function createRunner() {
  return new CursorAgentSdkRunner({ endpoint: "https://your.host/agents/run" });
}
```

`CursorAgentSdkRunner` is shipped as a documented stub. Keep agent profiles (`name`, `role`, `instructions`) in the payload you send upstream — the office already stores them.

Persistence stays client-side unless you replace `js/store.js` with an API.

## Stack notes

- Plain HTML / CSS / ES modules — same pattern as `/tank-alley/`, no build step.
- Does not modify the root 山水评课 SPA; only adds the `office/` directory.
- Typography: Bricolage Grotesque + Literata. Palette: copper loft / slate walls / lamp light.
