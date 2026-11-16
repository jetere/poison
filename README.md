# Poison Creator Studio — Electron desktop project

This is the **Electron + Vite + TypeScript shell** for the existing Poison game and Creator Studio, based on the latest **Rename Themes** HTML version. It preserves the custom renderer, game physics, object scripts, saved scenes, Theme Workshop, Sun/Moon/Multi-moon/Galaxy sky designer, and parallax mountains.

## Requirements (Windows 10/11, 64-bit)

- **Node.js LTS** (includes npm)
- **VS Code** (recommended, not required)

No separate Rust toolchain, Microsoft C++ Build Tools, or WebView2 installation is required for this JavaScript-only Electron app. Electron bundles Chromium. Windows builds should be made on Windows.

## Run in development

Easiest on Windows: double-click `RUN_POISON_WINDOWS.bat`.

Or open this folder in VS Code, then open **Terminal → New Terminal**:

```powershell
npm install
npm run dev
```

The development command assembles the original game source, starts Vite, and opens the Electron window. To run just the browser version, use `npm run dev:web`.

To run the built desktop app, use `npm start`; it builds the frontend first. Do not open the root `index.html` directly: its TypeScript entry point requires Vite. The standalone original is preserved in `extra_imp/Poison_7.html`.

Both Windows batch launchers detect Node in its standard installation directory even if the terminal has an outdated PATH. They check the required packages and the actual Electron executable, repairing missing dependencies instead of assuming an existing `node_modules` folder is complete.

## Build Windows EXE

```powershell
npm run dist:win
```

Easiest on Windows: double-click `BUILD_WINDOWS_EXE.bat`.

The resulting installer and portable `.exe` will appear in `release/` (after a successful Windows build). Alternatively:

```powershell
npm run dist:win:installer
npm run dist:win:portable
```

**Important:** This ZIP contains **source code, not a precompiled Windows EXE**. It has not been compiled on Windows here. Unsigned installers may show a Windows SmartScreen warning. Do not bypass warnings for unknown software.

## Native desktop file commands

The **File** menu in the Electron window adds:

- **Open Scene…** — select a Poison `.json` scene and open it in Studio.
- **Save Scene to File** — save the current scene as JSON; reuses the selected path.
- **Save Scene As…** — choose a new path.

The existing Studio save/load library and import/export buttons still work. Those use browser storage or downloaded JSON; the new **File** menu uses real Windows file dialogs. Project *folders* with separate per-object files are a later migration, not yet implemented.

## Project structure

```text
Poison_Creator_Studio_Electron/
├── index.html                    # UI markup only
├── package.json                  # npm and Windows build commands
├── vite.config.ts                # Vite, relative file:// asset paths
├── tsconfig.json
├── electron/
│   ├── main.cjs                  # Windows window, File menu, native dialogs
│   └── preload.cjs               # limited safe IPC bridge
├── src/
│   ├── main.ts                   # frontend entry point
│   ├── desktop/integration.ts    # TypeScript desktop File-menu handling
│   ├── styles/                   # base, Studio, desktop styles
│   ├── assets/audio/demo.ogg     # extracted from original inline audio
│   ├── game/parts/               # ordered original runtime/editor source sections
│   └── generated/poison-runtime.js # assembled output; do not edit directly
├── reference/Original_Poison_Studio.html # original backup
└── scripts/
    ├── assemble.mjs              # combines legacy sections + embeds audio
    └── parts.json                # source section order
```

## Migration status / limitations

**Working foundation:** The large inline HTML was separated into markup, CSS, audio, ordered game sections, a Vite entry, and an Electron desktop shell. Game and editor logic are preserved rather than rewritten.

**Not yet a fully modular TypeScript game engine:** The existing JavaScript sections still share one outer lexical scope. `scripts/assemble.mjs` joins them in their original order. This deliberate compatibility step avoids breaking cross-section references. `src/desktop/integration.ts` and `vite.config.ts` are TypeScript; the core game can be migrated module by module later.

**Compatibility:** Existing `.json` scene exports remain usable. Theme data, objects, prefabs, and custom script permissions follow the original game's handling. The embedded OGG audio is extracted as a source asset, then embedded back during build so offline playback still behaves as before. Google Fonts require internet; fallback fonts are used offline.

**Security:** Electron's renderer has no Node.js integration and uses context isolation + sandbox. File reads/writes happen only through native dialogs and a limited preload bridge. Imported object scripts remain disabled until enabled by the user inside Studio.

## Verify source

```powershell
npm run check
npm run build
npm run test:smoke
```

The smoke test runs Electron in a hidden window with temporary browser storage. It checks startup and canvas rendering, pause/resume/restart, Studio stopping the runtime, Galaxy themes, undo/redo, custom objects, script approval and shutdown, and JSON round-trips including custom themes and prefabs. It does not change your saved scenes.

If `npm install` fails due to PowerShell execution policy, run the commands in Command Prompt or use `npm.cmd` rather than changing system-wide security settings.

## Continue in Codex

Open this project folder in Codex or VS Code. Read `AGENTS.md` and `CODEX_NEXT_STEPS.md` first. The next major task is extracting real ES modules and TypeScript interfaces from the ordered legacy sections without breaking gameplay.
