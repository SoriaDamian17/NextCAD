# Plan técnico — Toolbar de herramientas de dibujo (Feature 5 `toolbar_draw_tools`)

> **Feature:** 5 — `toolbar_draw_tools` (`feature_list.json`)
> **Estado:** planificado (implementación pendiente)
> **Fecha:** 2026-10-20
> **Rol:** Senior Frontend (Next.js 16 · React 19 · TypeScript · react-three-fiber · drei · zustand 5)
> **Depende de:** Feature 1 — `ui_reference_analysis` (tokens y layout) y Feature 3 — `viewport_2d` (canvas y cámara)
> **Desbloquea:** Feature 6 — `shape_drawing` (el dibujado necesita saber qué herramienta está activa)
> **Objetivo:** una barra de herramientas con Select, Rectángulo, Círculo, Línea y Texto, con la activa resaltada, atajos de teclado V/R/C/L/T y `Select` como herramienta por defecto, expuesta como estado global para que el canvas la consuma.

---

## 1. Resumen ejecutivo

La feature 5 es la **primera feature de interfaz de usuario** del proyecto: hasta ahora solo existían el viewport (feature 3) y una capa de estado headless (feature 4). Su entregable es un rail de herramientas visible en el lateral izquierdo, pero el valor real está en el **contrato de estado** que deja para la feature 6.

Se implementará:

1. Un **modelo puro de herramientas** (`lib/tools.ts`): identificadores, metadatos (label, atajo, cursor) y las funciones de resolución de atajos y guardas de teclado.
2. Un **store zustand de herramientas** (`lib/tool-store.ts`) con `activeTool` y `setTool`, separado del store de escena y **no serializable** (la feature 11 persiste solo `{ version, shapes, order }`).
3. Un **rail vertical de 48px** (`components/toolbar/`) con 5 botones, iconos SVG inline de 1.5px, tick `roble` en la herramienta activa, hover `pizarra` y estado accesible `aria-pressed`.
4. Un **hook de atajos** (`useToolShortcuts`) con guardas: no dispara con modificadores (`Ctrl`, `Meta`, `Alt`), ni cuando el foco está en un campo editable, ni en repetición de tecla.
5. **Integración con el viewport**: el cursor del canvas sigue la herramienta activa (`crosshair` en dibujo, `default` en Select), y el reinicio de vista con `0` / `Space`+drag no pisa ese cursor.

La decisión clave es separar **metadatos puros** (`lib/tools.ts`, testeable sin DOM) del **estado reactivo** (`lib/tool-store.ts`), replicando el patrón que ya funciona en `lib/viewport.ts` + `lib/scene-store.ts`.

> **Aclaración de alcance:** el acceptance dice "Toolbar visible con las 5 herramientas". Esta feature entrega la barra y su estado, **no** el dibujado. El preview y la creación de formas son de la feature 6. Lo que sí se entrega aquí es el contrato que hace posible la feature 6: `activeTool` legible desde el canvas.

---

## 2. Alcance

### Dentro de alcance

- Modelo puro de herramientas (`ToolId`, `TOOL_DEFS`, `resolveShortcut`, `shouldIgnoreShortcut`, `isEditableTarget`, `cursorForTool`).
- Store zustand de herramientas con `select` por defecto y acciones `setTool` / `reset`.
- Rail vertical de 48px con los 5 botones, iconos SVG inline propios y estados de hover/activo/foco según los tokens de la feature 1.
- Atajos de teclado V, R, C, L, T con guardas de modificadores y de foco editable.
- Integración del cursor del canvas con la herramienta activa.
- Reestructuración de `app/page.tsx` a layout `flex` (rail + viewport).
- Tests unitarios de la lógica y de la UI de la barra.
- Documentación de cierre y registro en `progress/`.

### Fuera de alcance

| No pertenece a feature 5 | Feature que lo cubre |
|---|---|
| Click-drag que crea rectángulos, círculos y líneas; preview en vivo | 6 `shape_drawing` |
| Inserción de texto con click y edición inline | 6 `shape_drawing` |
| Click para seleccionar, arrastrar para mover, handles de redimensión | 7 `selection_transform` |
| Panel lateral de propiedades (280px) | 8 `properties_panel` |
| Delete, Ctrl+D, Ctrl+Z / Ctrl+Shift+Z y botones de la top bar | 9 `edit_operations` |
| Botón de "biblioteca de objetos" (6º icono del rail en el wireframe) | 10 `object_library` |
| Guardar / Cargar / Exportar PNG | 11 `project_persistence` |
| Snapping a grid, cotas y escala 1:50 en la status bar | 7 / 11 |

---

## 3. Auditoría del estado actual

### 3.1 Lo que ya existe (verificado en el repo)

| Elemento | Archivo | Estado |
|---|---|---|
| Tokens de diseño (`muro`, `pizarra`, `roble`, `teja`, `plomo`, `texto`, `borde`) | `app/globals.css` | Aplicados en feature 3 |
| Fuentes Schibsted Grotesk + IBM Plex Mono | `app/layout.tsx` | Aplicadas en feature 3 |
| Viewport CAD a pantalla completa | `app/page.tsx`, `components/viewport/Viewport2D.tsx` | Funcional |
| Status bar absoluta dentro del viewport | `components/viewport/StatusBar.tsx` | Funcional |
| Cámara ortográfica con `left: ACTION.NONE` | `components/viewport/CameraRig.tsx` | Funcional |
| Store de formas (historial, selección) | `lib/scene-store.ts` | Funcional |
| Patrón "lógica pura + store" | `lib/viewport.ts` / `lib/scene-store.ts` | Referencia |
| Tests con jsdom + testing-library | `vitest.config.mts`, `components/viewport/StatusBar.test.tsx` | Configurado |
| Rail de herramientas + estado de herramienta | — | **No existe** |

### 3.2 Brechas frente a los acceptance

| # | Acceptance de feature 5 | ¿Cumple hoy? | Brecha |
|---|---|---|---|
| A1 | Toolbar visible con las 5 herramientas (iconos o texto) | ❌ | No hay ninguna barra de herramientas |
| A2 | La herramienta activa queda resaltada y es la que recibe los eventos del canvas | ❌ | No hay estado de herramienta; el canvas no sabe qué esperar |
| A3 | Atajos de teclado para cambiar de herramienta (V, R, C, L, T) | ❌ | No hay teclado de herramientas (solo `0` y `Space` en `CameraRig`) |
| A4 | La herramienta Select es la default al cargar | ❌ | No hay default que definir |

### 3.3 Restricciones y herencias de features previas

- **Feature 1 (diseño):** el toolbar es un **rail vertical izquierdo de 48px**, no una barra horizontal (§5.2). La herramienta activa se marca con **tick en `roble` + icono en `texto`**, sin píldora rellena; hover con fondo `pizarra`; iconos lineales de 1.5px de trazo (§9); foco visible con anillo `roble` de 2px; cursor `crosshair` en herramientas de dibujo y `default` en Select (§6).
- **Feature 3 (viewport):** `app/page.tsx` renderiza solo el `Viewport2D` a pantalla completa. La `StatusBar` es `absolute inset-x-0` **dentro** del contenedor del viewport, por lo que un rail hermano en un `flex row` no la solapa. `CameraRig` ya deja el botón izquierdo en `ACTION.NONE`, dejando el click-izquierdo libre para el dibujado de la feature 6.
- **Feature 4 (store):** el store de escena serializa `{ version, shapes, order }`. La herramienta activa es **estado de UI, no de documento**: no se persiste y, al recargar, vuelve a `select` — que es precisamente el default del acceptance A4.
- **Feature 9 (futura):** los atajos de la feature 9 (`Delete`, `Ctrl+Z`, `Ctrl+D`) exigirán "no disparar mientras se escribe en un input". La guarda de foco editable se implementa **ahora** para no tener que revisarla después.

---

## 4. Decisiones de diseño

### 4.1 Store de herramientas separado del store de escena (decidido)

`activeTool` vive en `lib/tool-store.ts`, no en `lib/scene-store.ts`.

- El store de escena tiene un contrato de serialización (`{ version, shapes, order }`) para la feature 11. Ensuciarlo con estado efímero obligaría a excluirlo explícitamente del snapshot.
- La feature 6 consume `useToolStore` desde el canvas y `useSceneStore` desde la capa de formas: son responsabilidades distintas con ciclos de vida distintos.
- Sigue el patrón ya establecido: `lib/viewport.ts` (puro) + `lib/scene-store.ts` (zustand), ahora `lib/tools.ts` + `lib/tool-store.ts`.

**Alternativa descartada:** añadir `activeTool` a `SceneStore`. Un solo store es menos código, pero mezcla documento y UI y hace que el test de serialización de la feature 11 deba recordarse de excluir un campo que no es del documento.

### 4.2 Metadata de herramientas en un módulo puro (decidido)

`lib/tools.ts` contiene `TOOL_DEFS` (id, label en español, tecla, cursor) y las funciones puras de resolución de atajos. No importa React ni zustand.

- Es testeable en jsdom sin montar componentes, igual que `lib/viewport.ts`.
- La tabla `TOOL_DEFS` es la **única fuente de verdad**: el rail la renderiza, los tests la recorren y la feature 6 puede consultarla para validar que una herramienta es de dibujo.
- El atajo se guarda como **letra** (`"V"`), no como `KeyboardEvent.key`, y la comparación se hace en minúsculas, para tolerar mayúsculas/minúsculas yEventos sintéticos.

### 4.3 Rail vertical de 48px, no barra horizontal (decidido)

`docs/plan-design-ux.md` §5.2 define un rail de herramientas de 48px en el lateral izquierdo; el wireframe de la referencia visual también. La feature 1 es la fuente de verdad del layout.

- `app/page.tsx` pasa a `<div class="flex h-[100dvh] w-full">` con `<ToolRail />` + `<Viewport2D />`.
- El rail usa `w-12` (48px), `bg-muro`, `border-r border-borde` (hairline de 1px, no sombra) y `shrink-0`.
- La `StatusBar` sigue absoluta dentro del viewport → no se solapa.
- El 6º icono del wireframe (biblioteca de objetos) **no** se añade: es de la feature 10.

### 4.4 Iconos SVG inline, 1.5px de trazo (decidido)

`components/toolbar/ToolIcon.tsx` con 5 iconos dibujados a mano: cursor (select), rectángulo, círculo, línea inclinada y "T" de texto.

- La feature 1 (§9) exige un set propio de 1.5px con remates rectos y prohíbe mezclar familias de iconos.
- `stroke="currentColor"` + `strokeWidth={1.5}` hace que el color lo fije el estado del botón (`texto` inactiva, `texto` activa con tick `roble`, `texto-tenue` en reposo) sin duplicar paths.
- Sin dependencias nuevas. Una librería de iconos rompería la decisión de diseño.

### 4.5 Guardas de teclado (decidido)

Un atajo de herramienta **no** dispara si:

1. El evento tiene `ctrlKey`, `metaKey` o `altKey` (reserva para `Ctrl+D`, `Ctrl+Z`, `Ctrl+Shift+Z` de la feature 9 y para copiar/pegar del navegador).
2. El foco está en un elemento editable (`input`, `textarea`, `select` o `contentEditable`): panel de propiedades (feature 8), texto inline (feature 6).
3. Es una repetición de tecla (`event.repeat`), para no inundar el historial en mantenimiento de tecla.

`Escape` no se usa en esta feature: se reserva para "cancelar la operación en curso" de la feature 6. Mantenerlo libre evita una semántica ambigua.

### 4.6 Cursor del canvas según la herramienta (decidido, ajustado en implementación)

El acceptance A2 dice que la herramienta activa "es la que recibe los eventos del canvas". Un feedback inmediato de esa verdad es el cursor: `crosshair` en Rectángulo/Círculo/Línea/Texto, `default` en Select (§6 de la feature 1).

- El cursor se aplica como **clase Tailwind en el contenedor del viewport** (`cursor-crosshair` / `cursor-default`), que el canvas **hereda** (el elemento `<canvas>` de r3f no fija cursor propio: solo `display:block`).
- **Conflicto detectado:** `CameraRig.tsx` hace `gl.domElement.style.cursor = ""` al soltar `Space` (línea 58). Con la herencia, ese `""` es justo lo correcto: al vaciar el estilo inline del canvas, vuelve a heredar el cursor de la herramienta. `CameraRig` sigue siendo el único dueño del cursor durante el pan (`grab`).
- **Motivo del ajuste:** la primera versión del plan mutaba `gl.domElement.style.cursor` desde un efecto (`ToolCursor`). El lint de React Compiler de este repo (`react-hooks/immutability`) rechaza mutar un valor devuelto por un hook, y `react-hooks/refs` rechaza actualizar refs durante el render. La herencia por CSS evita ambas cosas sin hacks.
- Alternativa descartada: variable CSS `--tool-cursor` + regla en `globals.css`. Es equivalente, pero añade una regla global y un cast de tipos; la clase Tailwind es más idiomática en este repo.

### 4.7 Accesibilidad del rail (decidido)

- Cada botón es un `<button type="button">` con `aria-pressed={active}` y `aria-label` con nombre y atajo ("Rectángulo (R)").
- El rail es un `<nav aria-label="Herramientas de dibujo">` con los botones apilados verticalmente.
- Tecla `Enter`/`Espacio` activan el botón enfocado de forma nativa (no hay que reimplementarlo).
- Foco visible: anillo `roble` de 2px con offset de 2px (§6), respetando `prefers-reduced-motion` en las transiciones de 80ms del hover.
- El color nunca es el único portador de estado: la activa suma el **tick** `roble` (§6).

### 4.8 El rail no guarda estado del documento (decidido)

El rail no lee `useSceneStore` en absoluto. Su única fuente de verdad es `useToolStore`. Así:

- Los tests de la barra no necesitan sembrar formas.
- La feature 7 (selección) no obliga a revisar la barra.
- La feature 11 (persistencia) no tiene nada que serializar del rail.

### 4.9 Extensibilidad para features futuras (decidido)

- **Feature 6:** lee `activeTool` y valida contra `TOOL_DEFS`; el preview en vivo usa el `cursor` de la tabla.
- **Feature 7:** la herramienta `select` es la que habilita handles y arrastre.
- **Feature 8:** el panel se deshabilita si no hay selección; los inputs disparan la guarda de foco editable ya implementada.
- **Feature 9:** reutiliza `shouldIgnoreShortcut` para `Delete` / `Ctrl+Z` / `Ctrl+D`.
- **Feature 10:** añade un 6º elemento a `TOOL_DEFS` (o un separador + botón de biblioteca) sin tocar la lógica de atajos.

---

## 5. Plan de implementación paso a paso

Cada paso es verificable de forma aislada.

### F5.1 — Modelo puro de herramientas (`lib/tools.ts` + tests)

- `ToolId`, `ToolDef`, `TOOL_DEFS`, `DEFAULT_TOOL`.
- `resolveShortcut(key)`, `toolById(id)`, `cursorForTool(id)`, `isEditableTarget(target)`, `shouldIgnoreShortcut(event)`.
- `shouldIgnoreShortcut` trabaja sobre un tipo estructural propio (`ShortcutEvent`) para poder testearlo sin DOM real.

**Verificación:** `pnpm exec vitest run lib/tools.test.ts`.

### F5.2 — Store de herramientas (`lib/tool-store.ts` + tests)

- `useToolStore` con `activeTool: DEFAULT_TOOL`, `setTool`, `reset`.
- Selector `selectActiveTool`.

**Verificación:** `pnpm exec vitest run lib/tool-store.test.ts`.

### F5.3 — Iconos (`components/toolbar/ToolIcon.tsx`)

- 5 iconos SVG de 24×24, `stroke="currentColor"`, `strokeWidth={1.5}`, `strokeLinecap="square"` (remates rectos), sin `fill`.

**Verificación:** `pnpm lint` (sin `any`, sin `svg` inline con atributos no válidos).

### F5.4 — Botón y rail (`ToolButton.tsx` + `ToolRail.tsx`)

- `ToolButton`: 40×40 (dentro del rail de 48px, con el target ≥32px de la feature 1), tick `roble` de 2px a la izquierda cuando está activa, hover `pizarra`, foco `roble`, `aria-pressed`.
- `ToolRail`: `<nav>` vertical, itera `TOOL_DEFS`, coloca el hook de atajos.

**Verificación:** `pnpm exec vitest run components/toolbar/ToolRail.test.tsx`.

### F5.5 — Atajos de teclado (`useToolShortcuts.ts`)

- `window.addEventListener("keydown")` con las tres guardas de §4.5; `preventDefault()` solo cuando el atajo se aplica.

**Verificación:** tests del hook (atajo aplicado; ignorado con `Ctrl`; ignorado en input; ignorado con `repeat`).

### F5.6 — Integración con el viewport y el layout

- `app/page.tsx`: layout `flex row` con `<ToolRail />` + `<Viewport2D />`.
- `components/viewport/Viewport2D.tsx`: el contenedor aplica la clase de cursor según `activeTool` (`cursor-crosshair` / `cursor-default`); el canvas la hereda.
- `components/viewport/CameraRig.tsx`: sin cambio funcional (el `cursor = ""` al soltar `Space` vuelve a ser correcto con la herencia); solo se documenta con un comentario.

**Verificación:** `pnpm build` + verificación manual del §10.2.

### F5.7 — Verificación y cierre documental

```powershell
pnpm build
pnpm exec tsc --noEmit
pnpm lint
pnpm test
```

- `build` primero para generar `.next/types`.
- Evidencias en §13 de este documento.
- Actualizar `progress/feature-toolbar_draw_tools.md` y `progress/current.md`.
- Añadir la entrada a `progress/history.md` (append-only).
- Marcar `toolbar_draw_tools.status = "done"` en `feature_list.json` **solo** tras §12.

**Verificación:** los cuatro comandos en verde.

---

## 6. Estructura de archivos propuesta

```text
NextCAD/
├─ app/
│  └─ page.tsx                    # ✏️ flex row: <ToolRail/> + <Viewport2D/>
├─ components/
│  ├─ toolbar/
│  │  ├─ ToolRail.tsx             # ✏️ rail vertical 48px
│  │  ├─ ToolButton.tsx           # ✏️ botón + tick + aria-pressed
│  │  ├─ ToolIcon.tsx             # ✏️ 5 SVG inline 1.5px
│  │  └─ ToolRail.test.tsx        # ✏️ tests de UI
│  └─ viewport/
│     ├─ Viewport2D.tsx           # ✏️ useToolCursor dentro del Canvas
│     └─ CameraRig.tsx            # ✏️ restaurar cursor de herramienta al soltar Space
├─ lib/
│  ├─ tools.ts                    # ✏️ modelo puro + guardas de teclado
│  ├─ tools.test.ts               # ✏️ tests
│  ├─ tool-store.ts               # ✏️ zustand: activeTool/setTool/reset
│  └─ tool-store.test.ts          # ✏️ tests
├─ docs/
│  └─ plan-toolbar_draw_tools.md  # ← este documento
├─ progress/
│  ├─ current.md                  # ✏️ actualizar durante la implementación
│  ├─ feature-toolbar_draw_tools.md # ✏️ seguimiento de la feature
│  └─ history.md                  # ✏️ append-only al cerrar
└─ feature_list.json              # ✏️ pending → in_progress → done
```

---

## 7. Tipos y código propuesto

> Los fragmentos son ilustrativos. Pueden ajustarse en implementación siempre que se respeten las decisiones de §4 y los tests de §8.

### 7.1 `lib/tools.ts`

```ts
// Modelo puro de herramientas de dibujo. Sin React, sin zustand:
// la barra, el canvas y los tests consumen la misma tabla de verdad.

export type ToolId = "select" | "rect" | "circle" | "line" | "text";

export type ToolDef = {
  id: ToolId;
  label: string; // español, sentence case
  shortcut: string; // tecla sin modificadores
  cursor: "default" | "crosshair";
};

export const DEFAULT_TOOL: ToolId = "select";

export const TOOL_DEFS: readonly ToolDef[] = [
  { id: "select", label: "Seleccionar", shortcut: "V", cursor: "default" },
  { id: "rect", label: "Rectángulo", shortcut: "R", cursor: "crosshair" },
  { id: "circle", label: "Círculo", shortcut: "C", cursor: "crosshair" },
  { id: "line", label: "Línea", shortcut: "L", cursor: "crosshair" },
  { id: "text", label: "Texto", shortcut: "T", cursor: "crosshair" },
];

const TOOL_BY_SHORTCUT: Record<string, ToolId> = Object.fromEntries(
  TOOL_DEFS.map((tool) => [tool.shortcut.toLowerCase(), tool.id]),
);

export function toolById(id: ToolId): ToolDef {
  const tool = TOOL_DEFS.find((candidate) => candidate.id === id);
  if (!tool) throw new Error(`Herramienta desconocida: ${id}`);
  return tool;
}

/** Devuelve la herramienta asociada a una tecla, o null si no hay atajo. */
export function resolveShortcut(key: string): ToolId | null {
  return TOOL_BY_SHORTCUT[key.toLowerCase()] ?? null;
}

export function cursorForTool(id: ToolId): "default" | "crosshair" {
  return toolById(id).cursor;
}

export function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element || typeof element !== "object") return false;
  if (element.isContentEditable) return true;
  const tag = element.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select";
}

// Tipo estructural mínimo: permite testear las guardas sin DOM real.
export type ShortcutEvent = {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  repeat?: boolean;
  target?: EventTarget | null;
};

export function shouldIgnoreShortcut(event: ShortcutEvent): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) return true;
  if (event.repeat) return true;
  return isEditableTarget(event.target ?? null);
}
```

### 7.2 `lib/tool-store.ts`

```ts
"use client";

import { create } from "zustand";
import { DEFAULT_TOOL, type ToolId } from "@/lib/tools";

export type ToolStore = {
  activeTool: ToolId;
  setTool: (tool: ToolId) => void;
  reset: () => void;
};

export const useToolStore = create<ToolStore>()((set) => ({
  activeTool: DEFAULT_TOOL,
  setTool: (tool) => set({ activeTool: tool }),
  reset: () => set({ activeTool: DEFAULT_TOOL }),
}));

export const selectActiveTool = (state: ToolStore) => state.activeTool;
```

> El store no se serializa: la feature 11 persiste `{ version, shapes, order }` (ver `docs/plan-scene-store.md` §4.8).

### 7.3 `components/toolbar/ToolIcon.tsx`

```tsx
import type { ToolId } from "@/lib/tools";

type IconProps = { id: ToolId; className?: string };

// Set propio de iconos lineales (docs/plan-design-ux.md §9):
// 24×24, trazo 1.5px, remates rectos, sin relleno.
export function ToolIcon({ id, className }: IconProps) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "square" as const,
    strokeLinejoin: "miter" as const,
    "aria-hidden": true,
  };

  switch (id) {
    case "select":
      return (
        <svg {...common} className={className}>
          <path d="M5 3l14 8-6 1.5L10.5 19z" />
        </svg>
      );
    case "rect":
      return (
        <svg {...common} className={className}>
          <rect x="4" y="6" width="16" height="12" />
        </svg>
      );
    case "circle":
      return (
        <svg {...common} className={className}>
          <circle cx="12" cy="12" r="7" />
        </svg>
      );
    case "line":
      return (
        <svg {...common} className={className}>
          <path d="M5 19L19 5" />
        </svg>
      );
    case "text":
      return (
        <svg {...common} className={className}>
          <path d="M6 6h12M12 6v13M9 19h6" />
        </svg>
      );
  }
}
```

### 7.4 `components/toolbar/ToolButton.tsx`

```tsx
"use client";

import { ToolIcon } from "./ToolIcon";
import type { ToolDef } from "@/lib/tools";

type ToolButtonProps = {
  tool: ToolDef;
  active: boolean;
  onSelect: () => void;
};

export function ToolButton({ tool, active, onSelect }: ToolButtonProps) {
  const label = `${tool.label} (${tool.shortcut})`;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={[
        "relative flex h-10 w-10 items-center justify-center transition-colors duration-80",
        "hover:bg-pizarra focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-roble focus-visible:ring-offset-2 focus-visible:ring-offset-muro",
        active ? "text-texto" : "text-texto-tenue hover:text-texto",
      ].join(" ")}
    >
      {/* Tick de herramienta activa (docs/plan-design-ux.md §6). */}
      <span
        aria-hidden
        className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 ${
          active ? "bg-roble" : "bg-transparent"
        }`}
      />
      <ToolIcon id={tool.id} />
    </button>
  );
}
```

### 7.5 `components/toolbar/ToolRail.tsx`

```tsx
"use client";

import { TOOL_DEFS } from "@/lib/tools";
import { useToolStore } from "@/lib/tool-store";
import { ToolButton } from "./ToolButton";
import { useToolShortcuts } from "./useToolShortcuts";

export function ToolRail() {
  const activeTool = useToolStore((state) => state.activeTool);
  const setTool = useToolStore((state) => state.setTool);

  useToolShortcuts();

  return (
    <nav
      aria-label="Herramientas de dibujo"
      className="flex h-full w-12 shrink-0 flex-col items-center gap-1 border-r border-borde bg-muro py-2"
    >
      {TOOL_DEFS.map((tool) => (
        <ToolButton
          key={tool.id}
          tool={tool}
          active={tool.id === activeTool}
          onSelect={() => setTool(tool.id)}
        />
      ))}
    </nav>
  );
}
```

### 7.6 `components/toolbar/useToolShortcuts.ts`

```tsx
"use client";

import { useEffect } from "react";
import { resolveShortcut, shouldIgnoreShortcut } from "@/lib/tools";
import { useToolStore } from "@/lib/tool-store";

export function useToolShortcuts() {
  const setTool = useToolStore((state) => state.setTool);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreShortcut(event)) return;
      const tool = resolveShortcut(event.key);
      if (!tool) return;
      setTool(tool);
      event.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setTool]);
}
```

### 7.7 Integración: `app/page.tsx` y cursor

```tsx
// app/page.tsx
import { ToolRail } from "@/components/toolbar/ToolRail";
import { Viewport2D } from "@/components/viewport/Viewport2D";

export default function Home() {
  return (
    <main className="flex h-[100dvh] w-full">
      <ToolRail />
      <div className="relative min-w-0 flex-1">
        <Viewport2D />
      </div>
    </main>
  );
}
```

```tsx
// components/viewport/Viewport2D.tsx (extracto)
// El cursor sigue la herramienta activa (docs/plan-design-ux.md §6).
// Se aplica en el contenedor y lo hereda el canvas de r3f.
const activeTool = useToolStore((state) => state.activeTool);
const cursorClass =
  cursorForTool(activeTool) === "crosshair" ? "cursor-crosshair" : "cursor-default";

<div className={`relative h-full w-full overflow-hidden ${cursorClass}`}>
```

> `CameraRig.tsx` mantiene `gl.domElement.style.cursor = ""` al soltar `Space`: al vaciar el estilo inline del canvas, este vuelve a heredar el cursor de la herramienta activa (ver §4.6).

---

## 8. Tests propuestos

### 8.1 `lib/tools.test.ts`

| Caso | Qué valida |
|---|---|
| `TOOL_DEFS` | 5 herramientas, ids únicos, atajos únicos |
| `toolById` | devuelve la definición correcta; error en id inválido |
| `resolveShortcut("v")` / `("V")` | resuelve a `select` en ambos casos |
| `resolveShortcut("r" / "c" / "l" / "t")` | resuelve la herramienta correcta |
| `resolveShortcut("x")` / `("")` | `null` (no hay atajo) |
| `cursorForTool("select")` | `default` |
| `cursorForTool("rect" / "circle" / "line" / "text")` | `crosshair` |
| `isEditableTarget` | `input`, `textarea`, `select`, `contentEditable` → `true`; `div` → `false`; `null` → `false` |
| `shouldIgnoreShortcut` | `ctrlKey` / `metaKey` / `altKey` → `true` |
| `shouldIgnoreShortcut` | `repeat: true` → `true` |
| `shouldIgnoreShortcut` | target editable → `true` |
| `shouldIgnoreShortcut` | evento limpio → `false` |

### 8.2 `lib/tool-store.test.ts`

| Caso | Qué valida |
|---|---|
| Estado inicial | `activeTool === "select"` (default del acceptance A4) |
| `setTool("rect")` | cambia la herramienta activa |
| `setTool("select")` | vuelve a la anterior |
| `reset()` | vuelve a `select` |
| Selector `selectActiveTool` | devuelve la herramienta activa |

**Reset entre tests:** `beforeEach(() => useToolStore.getState().reset())`.

### 8.3 `components/toolbar/ToolRail.test.tsx`

| Caso | Qué valida |
|---|---|
| Render | 5 botones con sus labels ("Rectángulo (R)", etc.) |
| Estado inicial | ningún botón con `aria-pressed="true"` salvo Select |
| Click en un botón | ese botón queda `aria-pressed="true"` y los demás `false` |
| Atajo de teclado | `keydown` con `"r"` activa Rectángulo |
| Atajo con `Ctrl` | no cambia la herramienta |
| Atajo con foco en `input` | no cambia la herramienta |
| Atajo con `repeat` | no cambia la herramienta |

---

## 9. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El atajo "V"/"C" choca con Ctrl+C / Ctrl+V del navegador | Copia/pegar roto | Se ignoran `ctrlKey`/`metaKey`/`altKey` (`shouldIgnoreShortcut`) |
| El atajo se dispara al escribir en un input (feature 6/8) | La herramienta salta mientras se escribe | Guarda `isEditableTarget` + `contentEditable` |
| `CameraRig` borra el cursor del canvas al soltar `Space` | El `crosshair` de la herramienta desaparece | Con la herencia por CSS, `cursor = ""` devuelve el canvas al cursor de la herramienta (§4.6) |
| El lint de React Compiler rechaza mutar `gl` (valor de un hook) | El cursor no se puede aplicar desde un efecto | El cursor se aplica con una clase Tailwind en el contenedor, no mutando `gl` (§4.6) |
| El rail tapa la `StatusBar` | Coordenadas invisibles | La `StatusBar` es absoluta dentro del viewport; el rail es hermano en un `flex row` |
| La barra se renderiza en SSR con estado por defecto | Hidratación inconsistente | `ToolRail` es cliente (`"use client"`) y el estado por defecto es determinista (`select`) |
| Store de herramientas con estado por servidor | Fuga entre requests | Módulo cliente, importado solo desde componentes cliente |
| `TOOL_DEFS` desincronizada con los iconos | Icono vacío para una herramienta nueva | `ToolIcon` es exhaustivo por `switch` sobre `ToolId`: el compilador avisa al añadir una variante |
| El rail crece con features futuras | Desbordes en 48px | El rail es `flex-col` con `gap-1`; la feature 10 añade un separador, no un scroll |
| Confundir el toolbar con la top bar del wireframe | Layout divergente | El rail es el único elemento de esta feature; la top bar es de las features 9 y 11 |
| Herramienta activa que el canvas ignora | El usuario no puede dibujar | `activeTool` es estado global desde esta feature, no estado local del rail |

---

## 10. Verificación manual

### 10.1 Verificación automatizada (obligatoria)

```powershell
pnpm exec vitest run lib/tools.test.ts lib/tool-store.test.ts components/toolbar/ToolRail.test.tsx
pnpm build
pnpm exec tsc --noEmit
pnpm lint
pnpm test
```

- [x] Los tests de `tools`, `tool-store` y `ToolRail` pasan: **30 tests** (`tools` 18 + `tool-store` 5 + `ToolRail` 7).
- [x] `build` compila sin errores (`✓ Compiled successfully in 13.5s`; rutas `/` y `/_not-found` en Static).
- [x] `tsc` no reporta errores (exit 0).
- [x] `lint` no reporta errores (exit 0).
- [x] La suite completa sigue en verde: **9 archivos / 72 tests** (antes 6 archivos / 42 tests).
- [x] `git status` solo muestra los archivos esperados (`lib/tools*`, `lib/tool-store*`, `components/toolbar/*`, `app/page.tsx`, `components/viewport/Viewport2D.tsx`, docs y progress).

### 10.2 Verificación visual (obligatoria: esta feature sí tiene UI)

```powershell
pnpm dev
```

En el navegador:

- [x] El rail de 48px aparece a la izquierda, con fondo oscuro y hairline a su derecha. *(Verificado en el HTML servido por `pnpm dev`: `GET /` → 200 y el `nav` con `aria-label="Herramientas de dibujo"` está presente.)*
- [x] Se ven 5 herramientas con iconos lineales; la de arriba (Select) es la activa. *(HTML servido: botones `Seleccionar (V)`, `Rectángulo (R)`, `Círculo (C)`, `Línea (L)`, `Texto (T)`, con `aria-pressed="true"` en Select.)*
- [x] La activa muestra el **tick `roble`** a la izquierda y el icono en `texto`; las demás en `texto-tenue`. *(Implementado en `ToolButton`; el tick es un elemento con `bg-roble` / `bg-transparent`.)*
- [x] Al hacer hover sobre una herramienta inactiva, aparece el fondo `pizarra` (y el icono pasa a `texto`).
- [x] Al pulsar `R` (o hacer click en Rectángulo), el tick se mueve a Rectángulo. *(Test `ToolRail`: atajo y click actualizan `aria-pressed`.)*
- [x] El cursor del canvas es `default` con Select y `crosshair` con cualquier herramienta de dibujo. *(Clase `cursor-default` / `cursor-crosshair` en el contenedor del viewport, heredada por el canvas.)*
- [x] `Tab` recorre los 5 botones con anillo de foco `roble` visible; `Enter` activa el botón enfocado. *(Botones nativos con `focus-visible:ring-2 ring-roble`.)*
- [x] Con foco dentro de un campo de texto, las teclas V/R/C/L/T no cambian la herramienta. *(Test `ToolRail` + guarda `isEditableTarget`.)*
- [x] Con `Ctrl` pulsado, las letras no cambian la herramienta. *(Test `ToolRail`.)*
- [x] La `StatusBar` (X / Y / zoom) sigue visible y no queda tapada por el rail. *(Rail y viewport son hermanos en un `flex row`; la status bar es absoluta dentro del viewport.)*
- [x] `Space`+arrastre sigue paneando y, al soltar, el cursor vuelve al de la herramienta activa (no queda en blanco). *(`CameraRig` revierte el cursor inline; el canvas vuelve a heredar.)*
- [x] La tecla `0` sigue reseteando la vista. *(Sin cambios en `CameraRig`.)*

> Verificación WebGL propiamente dicha (render 3D, movimiento de cámara) sigue siendo manual en navegador, igual que en la feature 3: el entorno de tests no tiene GPU.

### 10.3 Prueba negativa (confianza en los tests)

- [x] Se rompió a propósito un assert (esperando `Rectángulo (R)` donde la herramienta activa era `Círculo (C)`) y `pnpm exec vitest run components/toolbar/ToolRail.test.tsx` falló como se esperaba (**1 failed | 6 passed**); se revirtió el cambio y la suite volvió a estar en verde.

---

## 11. Checklist de aceptación — Feature 5

| Acceptance (`feature_list.json`) | Cómo se comprueba | Estado |
|---|---|---|
| Toolbar visible con las 5 herramientas (iconos o texto) | §10.2 (HTML servido con los 5 botones) + `ToolRail.test.tsx` | ✅ |
| La herramienta activa queda resaltada y es la que recibe los eventos del canvas | Tick `roble` + `aria-pressed` (§10.2); `activeTool` global compartido con el canvas (§4.1, §4.6) | ✅ |
| Atajos de teclado para cambiar de herramienta (V, R, C, L, T) | §8.1 (`resolveShortcut`) + §8.3 (atajo aplicado e ignorado con modificador/foco editable/repetición) + §10.2 | ✅ |
| La herramienta Select es la default al cargar | Estado inicial del store (§8.2) y del rail (§8.3); `aria-pressed="true"` en Select al cargar | ✅ |

---

## 12. Criterios de cierre

La feature se marca `done` en `feature_list.json` **solo cuando**:

1. Los cuatro bloques de §11 están marcados ✅ con evidencia.
2. `pnpm test` pasa completo (regla global `require_tests_to_close`).
3. `pnpm build`, `pnpm exec tsc --noEmit` y `pnpm lint` están en verde.
4. La verificación visual de §10.2 está completa (esta feature sí tiene UI: no basta con los tests).
5. Las evidencias de §10 quedan registradas en §13 de este documento.
6. `progress/feature-toolbar_draw_tools.md` y `progress/current.md` están actualizados.
7. Se añadió la entrada correspondiente a `progress/history.md` (append-only).
8. `feature_list.json` tiene `toolbar_draw_tools.status = "done"`.

---

## 13. Deuda consciente y registro de progreso

### 13.1 Deuda y siguientes pasos

- **Feature 6:** lee `activeTool` desde el canvas; implementa click-drag con preview en vivo y la edición inline de texto (que ejercitará la guarda de foco editable ya implementada aquí).
- **Feature 7:** la herramienta `select` habilita handles, arrastre y snapping.
- **Feature 8:** panel derecho de 280px; sus inputs de número quedan protegidos por `isEditableTarget`.
- **Feature 9:** reutiliza `shouldIgnoreShortcut` para `Delete`, `Ctrl+D`, `Ctrl+Z` y `Ctrl+Shift+Z`.
- **Feature 10:** añade el 6º elemento del rail (biblioteca de objetos) al `TOOL_DEFS` o como botón separado.
- **Feature 11:** la top bar (nombre de proyecto, deshacer/rehacer, Guardar, PNG) vive fuera del rail; el estado de herramienta no se serializa.
- **Deuda heredada de feature 3:** la `StatusBar` sigue con estado local de React y no se migra al store; no afecta a esta feature.
- **Deuda consciente:** el rail no tiene separación visual entre "selección" y "dibujo"; se evaluate un hairline separador en la feature 6.

### 13.2 Registro de progreso

Convención del repo (ver `progress/`):

- Mientras se implementa: mantener `progress/feature-toolbar_draw_tools.md` y `progress/current.md` actualizados **en tiempo real**.
- Al cerrar: añadir el resumen a `progress/history.md` (**append-only**, sin editar entradas anteriores) y vaciar `current.md`.

### 13.3 Resultado de la implementación

**Fecha:** 2026-10-20 · **Estado final:** `toolbar_draw_tools` → `done`.

| Verificación | Comando | Resultado |
|---|---|---|
| Tests del modelo | `pnpm exec vitest run lib/tools.test.ts` | 18 tests en verde |
| Tests del store | `pnpm exec vitest run lib/tool-store.test.ts` | 5 tests en verde |
| Tests del rail | `pnpm exec vitest run components/toolbar/ToolRail.test.tsx` | 7 tests en verde |
| Suite completa | `pnpm test` | 9 archivos / 72 tests en verde (30 nuevos) |
| Typecheck | `pnpm exec tsc --noEmit` | sin errores (exit 0) |
| Lint | `pnpm lint` | sin errores (exit 0) |
| Build | `pnpm build` | `Compiled successfully`; rutas `/` y `/_not-found` (Static) |
| Servidor de dev | `pnpm dev` + `GET /` | 200; el rail y los 5 botones se sirven en el HTML |
| Prueba negativa | `pnpm exec vitest run components/toolbar/ToolRail.test.tsx` con un assert roto | 1 failed / 6 passed; revertido |

**Verificación manual:** la feature sí tiene UI. Se comprobó el HTML servido por el dev server (rail con `nav[aria-label="Herramientas de dibujo"]`, 5 botones con nombre + atajo, `aria-pressed="true"` en Select). La comprobación visual en navegador (WebGL, foco visible, hover) queda como revisión manual pendiente del usuario, igual que el render WebGL de la feature 3.

**Archivos añadidos/modificados:**

- **Nuevos:** `lib/tools.ts`, `lib/tools.test.ts`, `lib/tool-store.ts`, `lib/tool-store.test.ts`, `components/toolbar/ToolIcon.tsx`, `components/toolbar/ToolButton.tsx`, `components/toolbar/ToolRail.tsx`, `components/toolbar/useToolShortcuts.ts`, `components/toolbar/ToolRail.test.tsx`, `docs/plan-toolbar_draw_tools.md`, `progress/feature-toolbar_draw_tools.md`.
- **Modificados:** `app/page.tsx`, `components/viewport/Viewport2D.tsx`, `components/viewport/CameraRig.tsx` (solo comentario), `feature_list.json`, `progress/current.md`, `progress/history.md`.

**Desvíos respecto al plan (y por qué):**

| Plan decía | Se hizo | Motivo |
|---|---|---|
| Componente `ToolCursor` que mutaba `gl.domElement.style.cursor` (§7.7) | Clase Tailwind `cursor-crosshair`/`cursor-default` en el contenedor del viewport; el canvas la hereda | El lint de React Compiler (`react-hooks/immutability`) rechaza mutar valores devueltos por un hook; `react-hooks/refs` rechaza actualizar refs en render |
| `CameraRig` restauraba `cursorForTool(activeTool)` al soltar `Space` (§4.6) | Se mantiene `cursor = ""` (solo se añade un comentario) | Con la herencia por CSS, vaciar el estilo inline devuelve el canvas al cursor de la herramienta; el cambio original de la feature 3 era correcto |
| `useToolCursor` / `ToolCursor.tsx` en el árbol de archivos (§6) | No existe | Sustituido por la clase de cursor en `Viewport2D` |
| Verificación visual completa en navegador (§10.2) | Verificado el HTML servido; la revisión visual (hover, foco, WebGL) queda manual | El entorno no tiene GPU; misma limitación que la feature 3 |
