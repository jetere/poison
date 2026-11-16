# Guidance for Codex / coding agents

This repository is an incremental migration of the existing Poison single-HTML game/editor to Electron + Vite.

1. Preserve game behavior, pixel-art renderer, custom objects, editor undo/redo, sky themes, and import/export JSON format.
2. The files in `src/game/parts/` are ordered **source fragments** sharing a lexical closure. They are assembled by `npm run assemble`; they are not independent ES modules yet.
3. **Never edit** `src/generated/poison-runtime.js` directly; edit `src/game/parts/` instead.
4. `src/assets/audio/demo.ogg` replaces the original huge base64 literal in source; assembly embeds it again for offline parity.
5. Keep Electron secure: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`. Expose only narrowly scoped IPC methods from preload.
6. Preserve scene JSON version compatibility, including `theme`, `themeData`, custom themes, prefabs, and custom object components.
7. Game runtime must stop while Creator Studio is open. Object scripts are disabled on import until user approval.
8. For each migration step, run `npm run check`, `npm run build`, and test game, Studio, Galaxy backgrounds, custom object scripts, and JSON round-trip.
9. Don't add native npm addons unless required; the aim is a Windows build without C++ Build Tools.
