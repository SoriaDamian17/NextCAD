# Plan técnico — Store central de la escena (Feature 4 `scene_store`)

> **Feature:** 4 — `scene_store` (`feature_list.json`)
> **Estado:** implementada / cerrada
> **Fecha:** 2026-10-20
> **Rol:** Senior Frontend (Next.js 16 · React 19 · TypeScript · react-three-fiber · drei · zustand 5)
> **Depende de:** Feature 3 — `viewport_2d` (cerrada, ver `docs/plan-viewport-2d.md`)
> **Desbloquea:** Features 5–11 (toolbar, dibujo, selección, propiedades, edición, biblioteca y persistencia)
> **Objetivo:** modelar la escena 2D como datos puros y serializables, con un store zustand que exponga `add`, `update`, `remove` y `select`, y con un historial de estados preparado para undo/redo.

---

## 1. Resumen ejecutivo

La feature 4 es **headless**: no añade UI ni renderiza nada. Su entregable es la capa de estado sobre la que se apoyarán todas las features de dibujo y edición.

Se implementará:

1. Un **modelo discriminado** de formas (`rect`, `circle`, `line`, `text`) con `id`, timestamps, geometría en el plano XY y estilo.
2. Un **store zustand** con las acciones `add`, `update`, `remove`, `select` y `clearSelection`.
3. Una **selección múltiple** (`selectedIds: string[]`) desde el inicio, porque las features 7–9 operan sobre una o varias formas.
4. Un **historial de estados** (`past`/`future`) con `undo`/`redo`, límite de entradas y transacciones para agrupar el drag de la feature 7 en una sola operación.
5. **Tests con Vitest** de toda la lógica, sin React ni WebGL.

La decisión clave es separar **modelo puro** (`lib/scene.ts`) de **estado reactivo** (`lib/scene-store.ts`), replicando el patrón que funcionó en `lib/viewport.ts`: la lógica testeable no depende del canvas.

> **Aclaración de alcance:** el tercer acceptance dice "Persistencia del store preparada para undo/redo (historial de estados)". Aquí "persistencia" significa **historial de estados**, no guardado en `localStorage` ni serialización del proyecto. Eso es la feature 11.

---

## 2. Alcance

### Dentro de alcance

- Tipos TypeScript para `rect`, `circle`, `line` y `text`.
- Fábrica de formas con id único, `createdAt`, `updatedAt` y estilo por defecto.
- Store zustand con `shapes: Record<id, Shape>` + `order: string[]`.
- Acciones `add`, `update`, `remove`, `select`, `clearSelection`.
- Selectores para formas ordenadas, forma por id y formas seleccionadas.
- Historial `past`/`future`, `undo`, `redo`, límite configurable y transacciones.
- Tests unitarios del modelo, del store y del historial.
- Documentación de cierre y registro en `progress/`.

### Fuera de alcance

| No pertenece a feature 4 | Feature que lo cubre |
|---|---|
| Toolbar, herramienta activa, atajos V/R/C/L/T | 5 `toolbar_draw_tools` |
| Render de formas, preview click-drag, edición inline de texto | 6 `shape_drawing` |
| Mover, redimensionar, handles, snapping | 7 `selection_transform` |
| Panel de propiedades y edición numérica | 8 `properties_panel` |
| Delete/Ctrl+D y atajos Ctrl+Z / Ctrl+Shift+Z | 9 `edit_operations` |
| Objetos compuestos (cama, silla, mesa) y rotación de grupos | 10 `object_library` |
| Guardar/cargar en `localStorage`, JSON de proyecto, export PNG | 11 `project_persistence` |
| Migrar el estado de cursor/zoom de la status bar al store | No requerido; deuda de feature 3 |

---

## 3. Auditoría del estado actual

### 3.1 Lo que ya existe (verificado en el repo)

| Elemento | Archivo | Estado |
|---|---|---|
| Next 16 + React 19 + r3f + drei + zustand 5 | `package.json` | Instalado (`zustand@5.0.15`) |
| Viewport CAD con cámara ortográfica | `components/viewport/Viewport2D.tsx` | Funcional |
| Lógica pura de viewport + tests | `lib/viewport.ts`, `lib/viewport.test.ts` | Patrón de referencia |
| Utilidad de formato numérico | `lib/format.ts` | Reutilizable |
| Tokens de diseño y fuentes | `app/globals.css`, `app/layout.tsx` | Aplicados en feature 3 |
| Vitest con jsdom y paths `@/*` | `vitest.config.mts`, `tsconfig.json` | Configurado |
| Historial append-only | `progress/history.md` | Features 1–3 registradas |
| Seguimiento por feature | `progress/feature-viewport_2d.md` | Formato de referencia |
| Store de formas | — | **No existe** |

### 3.2 Brechas frente a los acceptance

| # | Acceptance de feature 4 | ¿Cumple hoy? | Brecha |
|---|---|---|---|
| A1 | Tipos TypeScript para cada forma con id único y timestamps | ❌ | No hay modelo de formas |
| A2 | Store con `add`, `update`, `remove`, `select` | ❌ | No hay store |
| A3 | Historial de estados preparado para undo/redo | ❌ | No hay `past`/`future` ni `undo`/`redo` |

### 3.3 Restricciones heredadas de la feature 3

- La status bar sigue usando estado local de React; **no se migra** en esta feature.
- La verificación visual WebGL sigue siendo manual y no aplica aquí (feature headless).
- `camera-controls` se consume vía drei; no afecta al store.
- Orden de verificación del repo: `pnpm build` → `pnpm exec tsc --noEmit` → `pnpm lint` → `pnpm test` (el typecheck depende de `.next/types`).

---

## 4. Decisiones de diseño

### 4.1 Modelo discriminado por `type` (decidido)

```ts
type Shape = RectShape | CircleShape | LineShape | TextShape;
```

Cada variante lleva sus propios campos geométricos. Ventajas:

- TypeScript estrecha el tipo con `shape.type` sin casts.
- El render de la feature 6 puede hacer `switch (shape.type)`.
- La feature 10 puede añadir `GroupShape` a la unión sin romper lo existente.

**Geometría elegida (unidades del plano, 1 unidad = 1 mm conceptual):**

| Forma | Campos |
|---|---|
| `rect` | `x`, `y` (esquina), `width`, `height` |
| `circle` | `cx`, `cy`, `radius` |
| `line` | `x1`, `y1`, `x2`, `y2` |
| `text` | `x`, `y` (ancla), `content`, `fontSize`, `rotation` |

Se usa esquina + tamaño para `rect` porque es lo que consumen los inputs del panel de propiedades (An/Al) y los handles de la feature 7. La normalización de anchos negativos al arrastrar corresponde a la feature 6, no al modelo.

### 4.2 Contenedor `Record` + `order` (decidido)

```ts
type SceneSnapshot = {
  shapes: Record<ShapeId, Shape>;
  order: ShapeId[];
};
```

- `shapes` da acceso O(1) por id (selección, panel, updates).
- `order` conserva el orden de render y permite z-order futuro.
- Las actualizaciones son inmutables: se reemplaza el objeto de la forma y el mapa, nunca se muta in place. Esto hace que los snapshots del historial compartan referencias de forma segura.
- Alternativa descartada: `Shape[]`. Es más simple, pero cada `update`/`remove` es O(n) y el orden depende de la posición en el array.

### 4.3 Selección múltiple desde el inicio (decidido)

`selectedIds: string[]`, no `selectedId`. La feature 9 elimina "la(s) forma(s) seleccionada(s)" y la feature 8 puede mostrar selección múltiple. Cambiar esto después obligaría a tocar features ya cerradas.

- `select(id)` reemplaza la selección.
- `select(id, { additive: true })` alterna ese id.
- `select(null)` y `clearSelection()` vacían la selección.
- Un id inexistente se ignora (no rompe).
- La selección **no** genera entradas de historial: Ctrl+Z debe deshacer geometría, no cambios de foco.

### 4.4 Undo/redo manual, sin dependencia nueva (decidido)

Se implementa un historial propio (`past`/`future`) en lugar de instalar `zundo`:

- No añade dependencias.
- Es testeable con Vitest sin React.
- Se controla exactamente qué entra en el historial (solo `shapes` + `order`).
- `HISTORY_LIMIT = 50` evita crecimiento infinito.
- `undo` mueve el estado actual a `future`; `redo` lo devuelve a `past`.
- Al hacer una acción nueva, `future` se vacía.
- Los snapshots son superficiales: `{ shapes, order }` comparte referencias porque las mutaciones son inmutables.

Si en el futuro se necesita persistencia del historial entre sesiones, se evalúa `zundo` o serialización propia en la feature 11.

### 4.5 Transacciones para el drag (decidido)

La feature 7 actualizará la posición de una forma en cada `pointermove`. Si cada `update` empuja historial, un solo drag generaría decenas de entradas y Ctrl+Z movería la forma milímetro a milímetro.

Solución: primitivas de transacción en el store.

- `beginTransaction()` guarda un snapshot en `pending`.
- Mientras `pending` existe, **ninguna** mutación empuja historial.
- `update(..., { transient: true })` permite saltar el historial fuera de una transacción.
- `commitTransaction()` empuja **un solo** snapshot (el de antes de empezar) si hubo cambios.
- `cancelTransaction()` restaura el snapshot y descarta la transacción.

La feature 7 solo tendrá que llamar `beginTransaction()` al empezar el drag, actualizar con `{ transient: true }` y `commitTransaction()` al soltar.

### 4.6 IDs y timestamps (decidido)

- `id`: `crypto.randomUUID()` con fallback para entornos sin esa API (jsdom).
- `createdAt` / `updatedAt`: epoch en milisegundos (`Date.now()`), JSON-friendly.
- La fábrica acepta `{ id?, now? }` para tests deterministas.
- `updatedAt` se actualiza en cada `update` real; un patch sin cambios no genera historial ni timestamp nuevo.

### 4.7 SSR y límites de cliente (decidido)

El store es un singleton de módulo. Para evitar estado compartido entre requests:

- `lib/scene-store.ts` es cliente (`"use client"`) y solo se consume desde componentes cliente.
- No se importa desde `app/page.tsx` ni desde server components.
- La feature 4 no toca `app/`; el consumo empieza en la feature 5/6.

### 4.8 Serialización y versionado (decidido)

El estado persistible es `{ version: 1, shapes, order }`. `past`, `future`, `selectedIds` y `pending` **no** se serializan.

Aunque la persistencia sea feature 11, el modelo se define ahora como JSON-plano: sin funciones, clases, `Map` ni `Set`. Esto evita una migración traumática.

### 4.9 Extensibilidad para features futuras (decidido)

- **Feature 6:** consume `order` + `shapes` para renderizar; usa `add`.
- **Feature 7:** usa `select`, `update` y transacciones.
- **Feature 8:** usa `update` con `style: Partial<ShapeStyle>`.
- **Feature 9:** conecta teclado a `undo`/`redo` y `remove`.
- **Feature 10:** añade `GroupShape` o un campo `groupId`; el modelo no se cierra a nuevas variantes.
- **Feature 11:** serializa `{ version, shapes, order }`.

---

## 5. Plan de implementación paso a paso

Cada paso es verificable de forma aislada. La feature no toca `app/` ni `components/`, salvo una sonda temporal opcional descrita en §10.

### F4.1 — Modelo y fábrica (`lib/scene.ts` + tests)

- Definir `ShapeId`, `ShapeStyle`, `ShapeBase`, `RectShape`, `CircleShape`, `LineShape`, `TextShape`, `Shape`, `ShapeInput`, `ShapePatch`, `SceneSnapshot`.
- Definir `DEFAULT_SHAPE_STYLE`, `HISTORY_LIMIT`, `createShapeId`, `createShape`, `snapshotScene`.
- Tests de fábrica, ids únicos, defaults y overrides.

**Verificación:** `pnpm exec vitest run lib/scene.test.ts`.

### F4.2 — Store base (`lib/scene-store.ts` + tests)

- Crear `useSceneStore` con `shapes`, `order`, `selectedIds`, `past`, `future`, `pending`.
- Implementar `add`, `update`, `remove`, `select`, `clearSelection`, `reset`.
- Implementar selectores `selectOrderedShapes`, `selectShape`, `selectSelectedShapes`, `selectCanUndo`, `selectCanRedo`.
- Tests de add/update/remove/select y no-ops.

**Verificación:** `pnpm exec vitest run lib/scene-store.test.ts`.

### F4.3 — Historial y transacciones

- `pushHistory` con límite y limpieza de `future`.
- `undo`, `redo`, poda de `selectedIds` tras restaurar.
- `beginTransaction`, `commitTransaction`, `cancelTransaction`.
- Tests de undo/redo, límite y agrupación de updates.

**Verificación:** tests de historial en verde; comprobar que un drag simulado de 3 updates produce **una** entrada.

### F4.4 — Casos límite y selectores

- Id duplicado en `add`: no-op.
- `update`/`remove` con id inexistente: no-op.
- `update` sin cambios reales: no-op (sin historial ni `updatedAt`).
- `remove([])` y `remove` múltiple.
- Selección tras `remove`, `undo` y `redo`.
- Tests de los selectores.

**Verificación:** suite completa en verde.

### F4.5 — Typecheck, lint, build

```powershell
pnpm build
pnpm exec tsc --noEmit
pnpm lint
pnpm test
```

- `build` primero para generar `.next/types`.
- Sin cambios en `app/`, el build no debería verse afectado.
- Si se usó la sonda temporal de §10, eliminarla antes de este paso.

**Verificación:** los cuatro comandos en verde.

### F4.6 — Cierre documental

- Registrar evidencias en §13 de este documento.
- Actualizar `progress/feature-scene_store.md` y `progress/current.md`.
- Añadir la entrada a `progress/history.md` (append-only).
- Marcar `scene_store.status = "done"` en `feature_list.json` **solo** tras §12.

**Verificación:** `feature_list.json` válido, historial con la entrada nueva y `current.md` cerrado.

---

## 6. Estructura de archivos propuesta

```text
NextCAD/
├─ lib/
│  ├─ scene.ts               # ✏️ tipos, defaults, fábrica, snapshot
│  ├─ scene.test.ts          # ✏️ tests del modelo
│  ├─ scene-store.ts         # ✏️ store zustand + historial + selectores
│  └─ scene-store.test.ts    # ✏️ tests del store y undo/redo
├─ docs/
│  └─ plan-scene-store.md    # ← este documento
├─ progress/
│  ├─ current.md             # ✏️ actualizar durante la implementación
│  ├─ feature-scene_store.md # ✏️ seguimiento de la feature
│  └─ history.md            # ✏️ append-only al cerrar
└─ feature_list.json         # ✏️ in_progress → done
```

**Sin cambios en `app/` ni `components/`** en esta feature.

---

## 7. Tipos y código propuesto

> Los fragmentos son ilustrativos. Pueden ajustarse en implementación siempre que se respeten las decisiones de §4 y los tests de §8.

### 7.1 `lib/scene.ts`

```ts
// Modelo de la escena 2D. Lógica pura: sin React, zustand ni WebGL.
// 1 unidad = 1 mm conceptual (ver docs/plan-viewport-2d.md §4.6).

export type ShapeId = string;

export type ShapeStyle = {
  stroke: string;
  fill: string | null;
  strokeWidth: number;
  opacity: number;
};

type ShapeBase = {
  id: ShapeId;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  style: ShapeStyle;
};

export type RectShape = ShapeBase & {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CircleShape = ShapeBase & {
  type: "circle";
  cx: number;
  cy: number;
  radius: number;
};

export type LineShape = ShapeBase & {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type TextShape = ShapeBase & {
  type: "text";
  x: number;
  y: number;
  content: string;
  fontSize: number;
  rotation: number; // radianes
};

export type Shape = RectShape | CircleShape | LineShape | TextShape;

export type ShapeInput =
  | { type: "rect"; x: number; y: number; width: number; height: number; style?: Partial<ShapeStyle> }
  | { type: "circle"; cx: number; cy: number; radius: number; style?: Partial<ShapeStyle> }
  | { type: "line"; x1: number; y1: number; x2: number; y2: number; style?: Partial<ShapeStyle> }
  | {
      type: "text";
      x: number;
      y: number;
      content: string;
      fontSize?: number;
      rotation?: number;
      style?: Partial<ShapeStyle>;
    };

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type ShapePatch = Partial<
  DistributiveOmit<Shape, "id" | "type" | "createdAt" | "updatedAt" | "style">
> & {
  style?: Partial<ShapeStyle>;
};

export type SceneSnapshot = {
  shapes: Record<ShapeId, Shape>;
  order: ShapeId[];
};

export const HISTORY_LIMIT = 50;

export const DEFAULT_SHAPE_STYLE: ShapeStyle = {
  stroke: "#3a372f", // pizarra; teja queda reservado a la selección
  fill: null,
  strokeWidth: 1.5,
  opacity: 1,
};

export function createShapeId(): ShapeId {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }
  return `shape-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

type CreateShapeOptions = { id?: ShapeId; now?: number };

export function createShape(input: ShapeInput, options: CreateShapeOptions = {}): Shape {
  const now = options.now ?? Date.now();
  const base = {
    id: options.id ?? createShapeId(),
    createdAt: now,
    updatedAt: now,
    style: { ...DEFAULT_SHAPE_STYLE, ...input.style },
  };

  switch (input.type) {
    case "rect":
      return { ...base, type: "rect", x: input.x, y: input.y, width: input.width, height: input.height };
    case "circle":
      return { ...base, type: "circle", cx: input.cx, cy: input.cy, radius: input.radius };
    case "line":
      return { ...base, type: "line", x1: input.x1, y1: input.y1, x2: input.x2, y2: input.y2 };
    case "text":
      return {
        ...base,
        type: "text",
        x: input.x,
        y: input.y,
        content: input.content,
        fontSize: input.fontSize ?? 16,
        rotation: input.rotation ?? 0,
      };
  }
}

// Copia superficial: las actualizaciones del store son inmutables,
// así que los snapshots comparten shapes/order sin riesgo de mutación.
export function snapshotScene(scene: SceneSnapshot): SceneSnapshot {
  return { shapes: scene.shapes, order: scene.order };
}
```

### 7.2 `lib/scene-store.ts`

```ts
"use client";

import { create } from "zustand";
import {
  HISTORY_LIMIT,
  snapshotScene,
  type SceneSnapshot,
  type Shape,
  type ShapeId,
  type ShapePatch,
  type ShapeStyle,
} from "@/lib/scene";

export type SceneData = SceneSnapshot & {
  selectedIds: ShapeId[];
  past: SceneSnapshot[];
  future: SceneSnapshot[];
  pending: SceneSnapshot | null;
};

export type SceneActions = {
  add: (shape: Shape) => ShapeId;
  update: (id: ShapeId, patch: ShapePatch, options?: { transient?: boolean }) => void;
  remove: (ids: ShapeId | ShapeId[]) => void;
  select: (id: ShapeId | null, options?: { additive?: boolean }) => void;
  clearSelection: () => void;
  undo: () => void;
  redo: () => void;
  beginTransaction: () => void;
  commitTransaction: () => void;
  cancelTransaction: () => void;
  reset: () => void;
};

export type SceneStore = SceneData & SceneActions;

const INITIAL_SCENE: SceneData = {
  shapes: {},
  order: [],
  selectedIds: [],
  past: [],
  future: [],
  pending: null,
};

function pushHistory(state: SceneData): Partial<Pick<SceneData, "past" | "future">> {
  // Durante una transacción, el commit es el único que empuja historial.
  if (state.pending) return {};
  return {
    past: [...state.past, snapshotScene(state)].slice(-HISTORY_LIMIT),
    future: [],
  };
}

function patchIsNoop(shape: Shape, patch: ShapePatch): boolean {
  return Object.entries(patch).every(([key, value]) => {
    if (key === "style") {
      const style = value as Partial<ShapeStyle>;
      return Object.entries(style).every(
        ([styleKey, styleValue]) =>
          shape.style[styleKey as keyof ShapeStyle] === styleValue,
      );
    }
    return (shape as unknown as Record<string, unknown>)[key] === value;
  });
}

function pruneSelection(
  selectedIds: ShapeId[],
  shapes: Record<ShapeId, Shape>,
): ShapeId[] {
  return selectedIds.filter((id) => Boolean(shapes[id]));
}

export const useSceneStore = create<SceneStore>()((set) => ({
  ...INITIAL_SCENE,

  add: (shape) => {
    set((state) => {
      if (state.shapes[shape.id]) return state; // id duplicado: no-op
      return {
        shapes: { ...state.shapes, [shape.id]: shape },
        order: [...state.order, shape.id],
        ...pushHistory(state),
      };
    });
    return shape.id;
  },

  update: (id, patch, options) => {
    set((state) => {
      const current = state.shapes[id];
      if (!current || patchIsNoop(current, patch)) return state;

      const next = {
        ...current,
        ...patch,
        style: patch.style ? { ...current.style, ...patch.style } : current.style,
        updatedAt: Date.now(),
      } as Shape;

      return {
        shapes: { ...state.shapes, [id]: next },
        ...(options?.transient ? {} : pushHistory(state)),
      };
    });
  },

  remove: (ids) => {
    const list = Array.isArray(ids) ? ids : [ids];
    set((state) => {
      const existing = list.filter((id) => Boolean(state.shapes[id]));
      if (existing.length === 0) return state;

      const shapes = { ...state.shapes };
      for (const id of existing) delete shapes[id];
      const removed = new Set(existing);

      return {
        shapes,
        order: state.order.filter((id) => !removed.has(id)),
        selectedIds: state.selectedIds.filter((id) => !removed.has(id)),
        ...pushHistory(state),
      };
    });
  },

  select: (id, options) => {
    set((state) => {
      if (id === null) {
        return state.selectedIds.length === 0 ? state : { selectedIds: [] };
      }
      if (!state.shapes[id]) return state;

      if (options?.additive) {
        const selected = state.selectedIds.includes(id);
        return {
          selectedIds: selected
            ? state.selectedIds.filter((selectedId) => selectedId !== id)
            : [...state.selectedIds, id],
        };
      }

      if (state.selectedIds.length === 1 && state.selectedIds[0] === id) return state;
      return { selectedIds: [id] };
    });
  },

  clearSelection: () => {
    set((state) => (state.selectedIds.length === 0 ? state : { selectedIds: [] }));
  },

  undo: () => {
    set((state) => {
      const previous = state.past.at(-1);
      if (!previous) return state;
      return {
        ...previous,
        selectedIds: pruneSelection(state.selectedIds, previous.shapes),
        past: state.past.slice(0, -1),
        future: [snapshotScene(state), ...state.future].slice(0, HISTORY_LIMIT),
        pending: null,
      };
    });
  },

  redo: () => {
    set((state) => {
      const next = state.future[0];
      if (!next) return state;
      return {
        ...next,
        selectedIds: pruneSelection(state.selectedIds, next.shapes),
        past: [...state.past, snapshotScene(state)].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
        pending: null,
      };
    });
  },

  beginTransaction: () => {
    set((state) => (state.pending ? state : { pending: snapshotScene(state) }));
  },

  commitTransaction: () => {
    set((state) => {
      const pending = state.pending;
      if (!pending) return state;

      const changed = pending.shapes !== state.shapes || pending.order !== state.order;
      if (!changed) return { pending: null };

      return {
        pending: null,
        past: [...state.past, pending].slice(-HISTORY_LIMIT),
        future: [],
      };
    });
  },

  cancelTransaction: () => {
    set((state) => {
      const pending = state.pending;
      if (!pending) return state;
      return {
        ...pending,
        selectedIds: pruneSelection(state.selectedIds, pending.shapes),
        pending: null,
      };
    });
  },

  reset: () => set({ ...INITIAL_SCENE }),
}));
```

### 7.3 Selectores

```ts
export const selectCanUndo = (state: SceneStore) => state.past.length > 0;
export const selectCanRedo = (state: SceneStore) => state.future.length > 0;
export const selectShape = (id: ShapeId) => (state: SceneStore) => state.shapes[id];
export const selectSelectedIds = (state: SceneStore) => state.selectedIds;

export const selectOrderedShapes = (state: SceneStore): Shape[] =>
  state.order
    .map((id) => state.shapes[id])
    .filter((shape): shape is Shape => Boolean(shape));

export const selectSelectedShapes = (state: SceneStore): Shape[] =>
  state.selectedIds
    .map((id) => state.shapes[id])
    .filter((shape): shape is Shape => Boolean(shape));
```

> **Importante para componentes:** `selectOrderedShapes` y `selectSelectedShapes` devuelven un array nuevo en cada llamada. En componentes se deben consumir con `useShallow` para evitar re-renders infinitos:
>
> ```tsx
> import { useShallow } from "zustand/react/shallow";
> const shapes = useSceneStore(useShallow(selectOrderedShapes));
> ```

### 7.4 Patrón de consumo (feature 6 en adelante)

```tsx
"use client";

import { useShallow } from "zustand/react/shallow";
import {
  selectOrderedShapes,
  useSceneStore,
} from "@/lib/scene-store";

export function ShapeLayer() {
  const shapes = useSceneStore(useShallow(selectOrderedShapes));
  const add = useSceneStore((state) => state.add);

  // render de shapes...
  return null;
}
```

> Las acciones (`add`, `update`, etc.) son estables; seleccionarlas por separado evita re-renders innecesarios.

---

## 8. Tests propuestos

### 8.1 `lib/scene.test.ts`

| Caso | Qué valida |
|---|---|
| `createShape` con `rect` | id, tipo, geometría, timestamps y estilo por defecto |
| `createShape` con `circle`, `line`, `text` | campos específicos y defaults (`fontSize`, `rotation`) |
| `createShape` con `{ id, now }` | ids/timestamps deterministas |
| `createShape` sin opciones | ids únicos entre llamadas |
| Override parcial de `style` | merge con `DEFAULT_SHAPE_STYLE` |
| `snapshotScene` | conserva `shapes` y `order` |

### 8.2 `lib/scene-store.test.ts`

| Caso | Qué valida |
|---|---|
| `add` | agrega forma, respeta `order`, devuelve id |
| `add` con id duplicado | no-op (no duplica en `order`) |
| `update` parcial | cambia solo los campos enviados y actualiza `updatedAt` |
| `update` de estilo | merge de `style` sin borrar el resto |
| `update` sin cambios | no-op, sin entrada de historial |
| `update`/`remove` con id inexistente | no-op |
| `remove` simple y múltiple | elimina de `shapes`, `order` y `selectedIds` |
| `select` simple | reemplaza la selección |
| `select` additive | alterna ids y permite selección múltiple |
| `select(null)` / `clearSelection` | vacía la selección |
| `undo`/`redo` de add | crea y elimina la forma |
| `undo`/`redo` de update | restaura el valor anterior |
| `undo`/`redo` de remove | restaura la forma |
| Transacción con 3 updates | una sola entrada de historial |
| `cancelTransaction` | restaura el estado previo |
| Límite de historial | `past.length <= HISTORY_LIMIT` |
| Selectores | formas ordenadas, seleccionadas y `canUndo`/`canRedo` |

**Reset entre tests:** `beforeEach(() => useSceneStore.getState().reset())`.

**Timestamps deterministas:** `vi.setSystemTime(...)` o `vi.spyOn(Date, "now")`.

---

## 9. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Una entrada de historial por frame durante el drag | Ctrl+Z inutilizable | `beginTransaction`/`commitTransaction`; `update(..., { transient: true })` |
| Cambios de selección contaminan el historial | Ctrl+Z cambia el foco en vez de la geometría | `select`/`clearSelection` no llaman a `pushHistory` |
| Selectores que devuelven arrays nuevos | Re-renders infinitos en zustand 5 | `useShallow` en componentes; documentado en §7.3 |
| Estado singleton compartido en SSR | Fuga de estado entre requests | Store cliente (`"use client"`), sin import desde server components |
| `crypto.randomUUID` ausente en jsdom | Tests fallan al crear formas | Fallback en `createShapeId` + opción `id` explícita |
| Snapshots mutados por accidente | Undo/redo inconsistente | Updates inmutables; nunca mutar `shapes`/`order` in place |
| Historial crece sin límite | Memoria | `HISTORY_LIMIT = 50` |
| `update` con campos de otra variante | Datos inválidos | Tipo distributivo + validación en la feature 8; tests de casos reales |
| Persistencia confundida con `localStorage` | Scope creep hacia feature 11 | Estado JSON-plano y `version: 1`, pero sin middleware `persist` |
| `tsc --noEmit` falla en checkout limpio | Falso negativo | `pnpm build` antes de `tsc` |
| Sonda temporal olvidada en `app/` | Cambio no deseado en una feature headless | §10 exige eliminarla y verificar `git status` |

---

## 10. Verificación manual

La feature 4 no tiene UI, así que la verificación principal es automatizada. Se distinguen dos niveles.

### 10.1 Verificación headless (obligatoria)

```powershell
pnpm exec vitest run lib/scene.test.ts lib/scene-store.test.ts
pnpm build
pnpm exec tsc --noEmit
pnpm lint
pnpm test
```

- [x] Los tests de `scene` y `scene-store` pasan: **33 tests** (7 + 26).
- [x] `build` compila sin errores (`Compiled successfully in 2.8s`).
- [x] `tsc` no reporta errores.
- [x] `lint` no reporta errores.
- [x] La suite completa sigue en verde: **6 archivos / 42 tests**.
- [x] `git status` solo muestra los archivos esperados (`lib/scene*`, docs y progress).

### 10.2 Verificación visual opcional (sonda temporal, no se commitea)

**Resultado en esta implementación:** no se usó la sonda. La feature es headless y la verificación visual se pospone a la feature 6, cuando las formas se rendericen.

Como no hay UI, para inspeccionar el store en el navegador se puede crear una sonda temporal y eliminarla antes del cierre:

1. Crear `components/dev/SceneStoreProbe.tsx` con botones "Add rect", "Add circle", "Undo", "Redo" y contadores de `order`/`selectedIds`.
2. Montarla temporalmente en `app/page.tsx` como overlay.
3. Verificar en el navegador:
   - [ ] Agregar dos formas incrementa el contador.
   - [ ] Undo elimina la última; Redo la recupera.
   - [ ] Seleccionar una forma la marca; seleccionar otra con `additive` suma.
   - [ ] Eliminar una forma la quita de la selección.
4. **Eliminar** `components/dev/SceneStoreProbe.tsx` y revertir `app/page.tsx`.
5. Confirmar con `git status` que no quedan restos.

> Si se opta por no usar la sonda, la verificación visual se pospone a la feature 6, cuando las formas se rendericen. La ausencia de UI no bloquea el cierre de la feature 4.

### 10.3 Prueba negativa (confianza en los tests)

- [x] Se cambió a propósito `width: 100` por `width: 101` en `lib/scene.test.ts`; `pnpm exec vitest run lib/scene.test.ts` falló como se esperaba (1 failed | 6 passed) y se revirtió el cambio.

---

## 11. Checklist de aceptación — Feature 4

| Acceptance (`feature_list.json`) | Cómo se comprueba | Estado |
|---|---|---|
| Tipos TypeScript para cada forma con id único y timestamps | §8.1 + `pnpm exec tsc --noEmit` | ✅ |
| Store expone `add`, `update`, `remove`, `select` | §8.2 | ✅ |
| Persistencia preparada para undo/redo (historial de estados) | `past`/`future`, `undo`/`redo`, transacciones y tests §8.2 | ✅ |

---

## 12. Criterios de cierre

La feature se marca `done` en `feature_list.json` **solo cuando**:

1. Los tres bloques de §11 están marcados ✅ con evidencia.
2. `pnpm test` pasa completo (regla global `require_tests_to_close`).
3. `pnpm build`, `pnpm exec tsc --noEmit` y `pnpm lint` están en verde.
4. Las evidencias de §10 quedan registradas en §13 de este documento.
5. `progress/feature-scene_store.md` y `progress/current.md` están actualizados.
6. Se añadió la entrada correspondiente a `progress/history.md` (append-only).
7. `feature_list.json` tiene `scene_store.status = "done"`.

---

## 13. Deuda consciente y registro de progreso

### 13.1 Deuda y siguientes pasos

- **Feature 5:** toolbar; todavía no consume el store.
- **Feature 6:** renderiza `shapes` en `order`; usa `add` y `createShape`.
- **Feature 7:** usa `select`, `update` y las transacciones para el drag.
- **Feature 8:** usa `update` con `style` parcial.
- **Feature 9:** conecta Ctrl+Z / Ctrl+Shift+Z a `undo`/`redo`; Delete a `remove`.
- **Feature 10:** añade objetos compuestos; la unión `Shape` es extensible.
- **Feature 11:** serializa `{ version, shapes, order }`; no persiste `past`/`future`/`selectedIds`.
- **Status bar:** sigue con estado local; no se migra en esta feature.
- **Rotación de formas básicas:** solo `text` tiene `rotation`; si la feature 10 la necesita para grupos, se añade entonces.

### 13.2 Registro de progreso

Convención del repo (ver `progress/`):

- Mientras se implementa: mantener `progress/feature-scene_store.md` y `progress/current.md` actualizados **en tiempo real**.
- Al cerrar: añadir el resumen a `progress/history.md` (**append-only**, sin editar entradas anteriores) y vaciar `current.md`.

### 13.3 Resultado de la implementación

**Fecha:** 2026-10-20 · **Estado final:** `scene_store` → `done`.

| Verificación | Comando | Resultado |
|---|---|---|
| Tests del modelo | `pnpm exec vitest run lib/scene.test.ts` | 7 tests en verde |
| Tests del store | `pnpm exec vitest run lib/scene-store.test.ts` | 26 tests en verde |
| Suite completa | `pnpm test` | 6 archivos / 42 tests en verde |
| Typecheck | `pnpm exec tsc --noEmit` | sin errores (exit 0) |
| Lint | `pnpm lint` | sin errores (exit 0) |
| Build | `pnpm build` | `Compiled successfully`; rutas `/` y `/_not-found` (Static) |
| Prueba negativa | `pnpm exec vitest run lib/scene.test.ts` con un assert roto | 1 failed / 6 passed; revertido |

**Verificación manual:** feature headless; no hay UI que inspeccionar. La sonda temporal de §10.2 no se usó. La verificación visual de formas queda para la feature 6.

**Archivos añadidos/modificados:**

- **Nuevos:** `lib/scene.ts`, `lib/scene.test.ts`, `lib/scene-store.ts`, `lib/scene-store.test.ts`, `docs/plan-scene-store.md`, `progress/feature-scene_store.md`.
- **Modificados:** `feature_list.json`, `progress/current.md`, `progress/history.md`.

**Desvíos respecto al plan (y por qué):**

| Plan decía | Se hizo | Motivo |
|---|---|---|
| Sonda temporal opcional (§10.2) | No se usó | Feature headless; la verificación visual se difiere a la feature 6 |
