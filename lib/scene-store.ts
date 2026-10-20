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
