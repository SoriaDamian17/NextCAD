# Seguimiento — Feature 3 `viewport_2d`

> Documento de trabajo de la feature. Principios heredados de `progress/current.md`:
> mantenerlo actualizado **en tiempo real** (no al final); al cerrar la sesión,
> su resumen se mueve a `progress/history.md` (append-only).

- **Feature en curso:** — (cerrada)
- **Inicio / cierre:** 2026-10-19
- **Agente:** implementación (feature 3)
- **Plan técnico:** `docs/plan-viewport-2d.md`

## Plan

- **F3.1** Aplicar tokens de diseño y fuentes (Schibsted Grotesk + IBM Plex Mono) en `app/globals.css` y `app/layout.tsx`.
- **F3.2** Crear `lib/viewport.ts` con la lógica pura (`DEFAULT_VIEW`, `screenToWorld`, `zoomPercent`, `clamp`) + tests.
- **F3.3** Crear `components/viewport/CadGrid.tsx` (drei `<Grid>` en XY con tokens).
- **F3.4** Crear `components/viewport/CameraRig.tsx` (`CameraControls`: `dollyToCursor`, `mouseButtons`, `space`+drag, reset con `0`).
- **F3.5** Crear `StatusBar.tsx` + tracker de cursor/zoom; **F3.6** `Viewport2D.tsx` + `app/page.tsx`; **F3.7** eliminar `components/dev/`.
- **F3.8** Tests (mover smoke r3f, `lib/viewport.test.ts`, `StatusBar.test.tsx`).
- **F3.9** `build` → `tsc` → `lint` → `test`; cierre (`feature_list.json`, `current.md`, `history.md`).

## Bitácora

- Plan técnico redactado en `docs/plan-viewport-2d.md`.
- F3.1 Tokens de diseño en `app/globals.css` y fuentes Schibsted Grotesk + IBM Plex Mono en `app/layout.tsx`.
- F3.2 `lib/viewport.ts` + `lib/viewport.test.ts` (math pura: `screenToWorld`, `zoomPercent`, `clamp`).
- F3.3 `components/viewport/CadGrid.tsx` (drei `<Grid>` rotado a XY, tokens, `raycast` anulado).
- F3.4 `components/viewport/CameraRig.tsx` (`dollyToCursor`, `mouseButtons`, `space`+drag, reset con `0`; sin rotación).
- F3.5 `StatusBar.tsx` (+ test) y `ViewportStateTracker.tsx`.
- F3.6 `Viewport2D.tsx` + `app/page.tsx`.
- F3.7 Eliminado `components/dev/` (TestCanvas y su test).
- F3.8 Tests: `lib/viewport.test.ts`, `StatusBar.test.tsx`, `r3f-smoke.test.tsx` (movido).
- F3.9 Verificado: `build`, `tsc`, `lint`, `test` en verde; dev sirve `GET / 200`.

## Próximo paso

_Feature 3 cerrada. La siguiente es la feature 4 `scene_store` (store zustand de formas)._

## Historial de tasks completadas

| Task | Estado | Fecha | Nota |
|---|---|---|---|
| Redacción del plan (`docs/plan-viewport-2d.md`) | ✅ | 2026-10-19 | — |
| F3.1 Tokens y fuentes | ✅ | 2026-10-19 | globals.css + layout.tsx |
| F3.2 `lib/viewport.ts` + tests | ✅ | 2026-10-19 | math pura testeable |
| F3.3 `CadGrid.tsx` | ✅ | 2026-10-19 | grid XY |
| F3.4 `CameraRig.tsx` | ✅ | 2026-10-19 | CameraControls |
| F3.5 `StatusBar.tsx` + tracker | ✅ | 2026-10-19 | X/Y + zoom% |
| F3.6 `Viewport2D.tsx` + `app/page.tsx` | ✅ | 2026-10-19 | ortográfica + papel |
| F3.7 Eliminar `components/dev/` | ✅ | 2026-10-19 | — |
| F3.8 Tests | ✅ | 2026-10-19 | 4 archivos / 9 tests |
| F3.9 Build/tsc/lint/test + cierre | ✅ | 2026-10-19 | todo verde |
