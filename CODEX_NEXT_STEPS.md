# Suggested Codex task

Refactor Poison Creator Studio from the current ordered legacy source sections into genuine TypeScript ES modules **incrementally**, preserving all behavior.

- First, establish browser integration tests for startup, open/close Studio, runtime stop, level editor, Theme Workshop (Moon, Sun, Multi-moon, Galaxy), save/load and JSON import/export.
- Add a typed `PoisonScene` interface matching the current `serialize()` output and use it in the Electron IPC bridge.
- Extract pure functions first (colors, helpers, serialization validation), then input/physics/rendering, then Studio UI.
- Introduce explicit shared state interfaces rather than global closure variables. Keep the existing `window.poisonStudio` compatibility bridge until migration is complete.
- Maintain current HTML/CSS appearance, and keep desktop native File Open/Save/Save As.
- Avoid changing scene formats without migration code.
- After each module extraction, test and confirm the game still runs and Creator Studio completely stops the game runtime.

Start by inspecting `src/game/parts/` and `scripts/assemble.mjs` and running `npm run check` and `npm run dev`.
