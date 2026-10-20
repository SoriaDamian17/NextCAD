# Bitácora histórica (append-only)

> Cada vez que se cierra una sesión, su resumen se añade aquí.
> No edites entradas anteriores. Solo añades al final.

---

## Feature 3 — `viewport_2d` (2026-10-19)

**Estado:** `done`. **Plan:** `docs/plan-viewport-2d.md`. **Seguimiento:** `progress/feature-viewport_2d.md`.

**Qué se hizo:** viewport CAD ortográfico sobre el plano XY con `drei <CameraControls>`
(zoom centrado en el cursor vía `dollyToCursor`, pan con middle-click o `space`+drag, reset con `0`),
grid de fondo en XY con los tokens de diseño, y status bar mínima (X/Y + zoom %).

**Tasks completadas:** F3.1 tokens/fuentes · F3.2 `lib/viewport.ts` + tests · F3.3 `CadGrid` ·
F3.4 `CameraRig` · F3.5 `StatusBar` + tracker · F3.6 `Viewport2D` + `app/page.tsx` ·
F3.7 eliminar `components/dev/` · F3.8 tests · F3.9 verificación y cierre.

**Verificación:** `pnpm build`, `pnpm exec tsc --noEmit`, `pnpm lint` sin errores;
`pnpm exec vitest run` → 4 archivos / 9 tests en verde; `pnpm dev` + `GET /` → 200.

**Notas:** `camera-controls` se usa a través de drei (`CameraControlsImpl`), no por import directo
(dependencia transitiva con pnpm). Pendiente: verificación visual en navegador (WebGL).

**Siguiente:** feature 4 `scene_store`.

---

## Feature 4 — `scene_store` (2026-10-20)

**Estado:** `done`. **Plan:** `docs/plan-scene-store.md`. **Seguimiento:** `progress/feature-scene_store.md`.

**Qué se hizo:** modelo discriminado de formas (`rect`, `circle`, `line`, `text`) con id, timestamps
y estilo en `lib/scene.ts`; store zustand en `lib/scene-store.ts` con `shapes` + `order`,
selección múltiple (`selectedIds`), acciones `add`/`update`/`remove`/`select`/`clearSelection`,
historial `past`/`future` con `undo`/`redo` (límite 50) y transacciones para agrupar el drag.
Estado JSON-plano preparado para la persistencia de la feature 11.

**Tasks completadas:** F4.1 modelo/fábrica · F4.2 store base · F4.3 historial/transacciones ·
F4.4 casos límite/selectores · F4.5 verificación · F4.6 cierre documental.

**Verificación:** `pnpm build`, `pnpm exec tsc --noEmit` y `pnpm lint` sin errores;
`pnpm test` → 6 archivos / 42 tests en verde (33 nuevos: 7 de `scene` + 26 de `scene-store`).
Prueba negativa ejecutada y revertida.

**Notas:** feature headless, sin cambios en `app/` ni `components/`. La verificación visual
de formas queda para la feature 6. `feature_list.json` → `scene_store: done`.

**Siguiente:** feature 5 `toolbar_draw_tools`.

---