# Desktop shortcut — Tank Alley

International brand mark (**English “Tank Alley”**) plus helpers to pin the game on your Desktop.

> This cloud environment cannot write to your personal Windows Desktop. Use the helpers below on your machine.

## Icon files

| File | Use |
| --- | --- |
| `icons/tank-alley.ico` | Windows shortcut icon |
| `icons/tank-alley-256.png` / `tank-alley-512.png` | PNG sizes |
| `icons/tank-alley.svg` | Vector source (optional) |
| `icons/tank-alley.png` | 512×512 master preview |

## Windows（推荐 / Recommended）

1. Install [Node.js](https://nodejs.org/) if needed.
2. Clone/open this repo and open the `tank-alley/desktop/` folder.
3. **One-click install** — double-click either:
   - `create-desktop-shortcut.vbs` (simplest), or
   - `create-desktop-shortcut.ps1` (Right‑click → Run with PowerShell)
4. A **Tank Alley** icon appears on your Desktop.
5. Double-click it: starts `npm start` and opens `http://localhost:5173/`.

**Already running the server?** Copy `Tank-Alley.url` to Desktop (opens the URL; may keep the default browser icon unless you assign `icons/tank-alley.ico` manually).

中文简述：在本机打开 `tank-alley/desktop/`，双击 `create-desktop-shortcut.vbs`，桌面会出现带国际风图标的 **Tank Alley** 快捷方式；之后双击即可启动本地服务并打开游戏。

## macOS

```bash
chmod +x desktop/Tank-Alley.command
# optional: drag Tank-Alley.command to Desktop or Dock
open desktop/Tank-Alley.command
```

To use the PNG as the icon: Get Info on the `.command` / alias → paste `icons/tank-alley-512.png` onto the small icon in the Info panel.

## Linux

```bash
chmod +x desktop/Tank-Alley.command   # same bash launcher works
# or copy the .desktop entry and set an absolute Icon= path:
cp desktop/tank-alley.desktop ~/Desktop/
# edit Icon= to the absolute path of icons/tank-alley-512.png
```

## Brand notes

- Wordmark: **TANK ALLEY** (English) — international desktop look.
- Motif: stylized WWII medium-tank silhouette on a dark slate tile with gold trim (matches in-game olive / accent palette).
