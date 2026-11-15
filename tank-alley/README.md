# Tank Alley (巷战)

A playable 3D tank alley-combat browser prototype built with [Three.js](https://threejs.org/).

Drive through narrow urban alleys, rotate your turret, fire shells, and clear enemy tanks.

## How to run

From this folder:

```bash
npm start
```

Then open **http://localhost:5173** in your browser.

Any static file server works (the game is plain HTML/JS with a CDN import for Three.js):

```bash
# Python
python3 -m http.server 5173

# Or from the repo root
npx --yes serve -l 5173 tank-alley
```

On GitHub Pages, open `/tank-alley/` on the published site.

## Desktop shortcut (international icon)

English **Tank Alley** brand mark + install helpers live in [`desktop/`](desktop/).

**Windows (one-click):** open `desktop/`, double-click `create-desktop-shortcut.vbs` → a **Tank Alley** icon appears on your Desktop (starts the local server + browser).

中文：打开 `desktop/`，双击 `create-desktop-shortcut.vbs`，桌面会出现国际风英文图标快捷方式。

Icons: `desktop/icons/tank-alley.ico` (Windows), `tank-alley-256.png` / `512.png`, `tank-alley.svg`.  
Full steps (Windows / macOS / Linux): see [`desktop/README.md`](desktop/README.md).

## Controls

| Input | Action |
| --- | --- |
| **W / ↑** | Drive forward |
| **S / ↓** | Drive backward |
| **A / ←** | Turn hull left |
| **D / →** | Turn hull right |
| **Q / E** | Rotate turret |
| **Mouse move** | Aim turret (when pointer locked) |
| **Space / Left click** | Fire |
| **R** | Restart after win/lose |
| **Esc** | Pause / unlock pointer |

## Goal

Destroy all enemy tanks without losing your own. Buildings block movement and shells.

## Visuals

Stylized low-poly WWII-inspired tanks (original geometry, not CAD assets):

| Role | Type | Notes |
| --- | --- | --- |
| Player | **M4 Sherman** | Rounded turret, Allied olive |
| Enemy | **Pz.Kpfw. IV** | Box turret, long barrel |
| Enemy | **T-34** | Steep glacis, hex turret |
| Enemy | **Tiger I** | Heavy hull, thick long gun |
| Enemy | **M3 Stuart** | Light / fast / fragile |

The alley adds sidewalks, lit windows, dumpsters, barriers — collider footprints stay simple for performance.

## Tech

- Three.js (ES module via CDN)
- No build step — open with a static server (required for ES modules)
