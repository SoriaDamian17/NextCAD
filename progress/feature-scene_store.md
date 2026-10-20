# Seguimiento — Feature 4 `scene_store`

> Documento de trabajo de la feature. Principios heredados de `progress/current.md`:
> mantenerlo actualizado **en tiempo real** (no al final); al cerrar la sesión,
> su resumen se mueve a `progress/history.md` (append-only).

- **Feature en curso:** — (cerrada)
- **Inicio / cierre:** 2026-10-20
- **Agente:** Plan → implementación
- **Plan técnico:** `docs/plan-scene-store.md`

## Plan

- **F4.1** Modelo y fábrica en `lib/scene.ts` (`Shape`, `ShapeInput`, `ShapePatch`, `SceneSnapshot`, `createShape`, `snapshotScene`) + `lib/scene.test.ts`.
- **F4.2** Store base en `lib/scene-store.ts` (`add`, `update`, `remove`, `select`, `clearSelection`, `reset`) + selectores + `lib/scene-store.test.ts`.
- **F4.3** Historial y transacciones (`past`/`future`, `undo`/`redo`, `beginTransaction`/`commitTransaction`/`cancelTransaction`, `HISTORY_LIMIT`).
- **F4.4** Casos límite y selectores (ids duplicados/inexistentes, no-ops, remove múltiple, poda de selección).
- **F4.5** Verificación: `pnpm build` → `tsc --noEmit` → `lint` → `test`.
- **F4.6** Cierre documental: evidencias en el plan, `current.md`, `history.md` y `feature_list.json`.

## Bitácora

- 2026-10-20: Analizado `feature_list.json` y el estado de las features 1–3.
- 2026-10-20: Redactado el plan técnico en `docs/plan-scene-store.md`.
- 2026-10-20: Creado este documento de seguimiento con el plan y la tabla de tasks.
- 2026-10-20: **F4.1** `lib/scene.ts` + `lib/scene.test.ts` (7 tests).
- 2026-10-20: **F4.2** `lib/scene-store.ts` + `lib/scene-store.test.ts` (26 tests).
- 2026-10-20: **F4.3** historial `past`/`future`, `undo`/`redo` y transacciones; tests de agrupación y límite.
- 2026-10-20: **F4.4** no-ops, remove múltiple y poda de selección cubiertos.
- 2026-10-20: **F4.5** `build`, `tsc`, `lint` y suite completa en verde (6 archivos / 42 tests).
- 2026-10-20: **F4.6** cierre documental y `scene_store.status = "done"`.
- 2026-10-20: Prueba negativa: se rompió a propósito un assert y la suite falló; revertido.

## Próximo paso

_Feature 4 cerrada. La siguiente es la feature 5 `toolbar_draw_tools`._

## Historial de tasks completadas

| Task | Estado | Fecha | Nota |
|---|---|---|---|
| Redacción del plan (`docs/plan-scene-store.md`) | ✅ | 2026-10-20 | 13 secciones, código y tests propuestos |
| F4.1 Modelo y fábrica | ✅ | 2026-10-20 | `lib/scene.ts` + 7 tests |
| F4.2 Store base | ✅ | 2026-10-20 | `lib/scene-store.ts` + selectores |
| F4.3 Historial y transacciones | ✅ | 2026-10-20 | `past`/`future`, undo/redo, transacciones |
| F4.4 Casos límite y selectores | ✅ | 2026-10-20 | no-ops, remove múltiple, poda de selección |
| F4.5 Build/tsc/lint/test | ✅ | 2026-10-20 | 6 archivos / 42 tests |
| F4.6 Cierre documental | ✅ | 2026-10-20 | `history.md` + `feature_list.json` |
