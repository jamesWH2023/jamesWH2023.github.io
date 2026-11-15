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

Tanks use multi-part meshes (tracks/wheels, glacis, faceted turret, muzzle brake). The alley adds sidewalks, lit/dark windows, awnings, dumpsters, barriers, and street-lamp arms — collider footprints stay simple for performance.

## Tech

- Three.js (ES module via CDN)
- No build step — open with a static server (required for ES modules)
