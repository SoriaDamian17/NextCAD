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