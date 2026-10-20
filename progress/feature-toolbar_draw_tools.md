# Seguimiento — Feature 5 `toolbar_draw_tools`

> Documento de trabajo de la feature. Principios heredados de `progress/current.md`:
> mantenerlo actualizado **en tiempo real** (no al final); al cerrar la sesión,
> su resumen se mueve a `progress/history.md` (append-only).

- **Feature en curso:** 5 — `toolbar_draw_tools`
- **Inicio / cierre:** 2026-10-20
- **Agente:** Plan → implementación
- **Plan técnico:** `docs/plan-toolbar_draw_tools.md`

## Plan

- **F5.1** Modelo puro en `lib/tools.ts` (`ToolId`, `TOOL_DEFS`, `resolveShortcut`, `cursorForTool`, `isEditableTarget`, `shouldIgnoreShortcut`) + `lib/tools.test.ts`.
- **F5.2** Store zustand en `lib/tool-store.ts` (`activeTool`, `setTool`, `reset`; default `select`) + `lib/tool-store.test.ts`.
- **F5.3** Iconos SVG inline de 1.5px en `components/toolbar/ToolIcon.tsx` (select, rect, circle, line, text).
- **F5.4** `ToolButton.tsx` (tick `roble`, hover `pizarra`, `aria-pressed`, foco visible) + `ToolRail.tsx` (rail vertical 48px) + `components/toolbar/ToolRail.test.tsx`.
- **F5.5** `useToolShortcuts.ts`: atajos V/R/C/L/T con guardas de modificadores, foco editable y `repeat`.
- **F5.6** Integración: `app/page.tsx` a layout flex (rail + viewport) y cursor del canvas según la herramienta activa.
- **F5.7** Verificación: `build` → `tsc --noEmit` → `lint` → `test` + verificación visual manual (§10.2 del plan) + cierre documental.

## Bitácora

- 2026-10-20: Analizado `feature_list.json` y el estado de las features 1–4.
- 2026-10-20: Redactado el plan técnico en `docs/plan-toolbar_draw_tools.md` (13 secciones, código y tests propuestos).
- 2026-10-20: Creado este documento de seguimiento con el plan y la tabla de tasks.
- 2026-10-20: Decisiones confirmadas con el usuario: store de herramientas separado, iconos SVG inline propios y rail vertical de 48px.
- 2026-10-20: **F5.1** `lib/tools.ts` + `lib/tools.test.ts` (18 tests).
- 2026-10-20: **F5.2** `lib/tool-store.ts` + `lib/tool-store.test.ts` (5 tests).
- 2026-10-20: **F5.3** `components/toolbar/ToolIcon.tsx` con 5 iconos SVG de 1.5px.
- 2026-10-20: **F5.4** `ToolButton.tsx` + `ToolRail.tsx` + `ToolRail.test.tsx` (7 tests).
- 2026-10-20: **F5.5** `useToolShortcuts.ts` con las tres guardas (modificadores, `repeat`, foco editable).
- 2026-10-20: **F5.6** `app/page.tsx` a layout flex; cursor del canvas por clase heredada. Desvío: el lint de React Compiler rechaza mutar `gl` (`react-hooks/immutability`), así que el cursor se aplica en el contenedor y lo hereda el canvas. `CameraRig` conserva `cursor = ""` al soltar `Space` (correcto con la herencia).
- 2026-10-20: **F5.7** `build`, `tsc`, `lint` y suite completa en verde (9 archivos / 72 tests); `pnpm dev` sirve el rail (GET / → 200). Prueba negativa ejecutada y revertida.
- 2026-10-20: Cierre documental: entrada en `history.md` y `toolbar_draw_tools.status = "done"`.

## Próximo paso

_Feature 5 cerrada. La siguiente es la feature 6 `shape_drawing` (click-drag con preview en vivo)._

## Historial de tasks completadas

| Task | Estado | Fecha | Nota |
|---|---|---|---|
| Redacción del plan (`docs/plan-toolbar_draw_tools.md`) | ✅ | 2026-10-20 | 13 secciones, código y tests propuestos |
| F5.1 Modelo puro de herramientas | ✅ | 2026-10-20 | `lib/tools.ts` + 18 tests |
| F5.2 Store de herramientas | ✅ | 2026-10-20 | `lib/tool-store.ts` + 5 tests |
| F5.3 Iconos SVG | ✅ | 2026-10-20 | set propio 1.5px, `currentColor` |
| F5.4 Botón y rail | ✅ | 2026-10-20 | rail 48px, tick `roble`, `aria-pressed` |
| F5.5 Atajos de teclado | ✅ | 2026-10-20 | V/R/C/L/T con 3 guardas |
| F5.6 Integración con viewport y layout | ✅ | 2026-10-20 | flex row + cursor heredado |
| F5.7 Build/tsc/lint/test + cierre | ✅ | 2026-10-20 | 9 archivos / 72 tests; dev 200 |
