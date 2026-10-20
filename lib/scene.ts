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

type CreateShapeOptions = { id?: ShapeId; now?: number };

export function createShapeId(): ShapeId {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }
  return `shape-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

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
      return {
        ...base,
        type: "rect",
        x: input.x,
        y: input.y,
        width: input.width,
        height: input.height,
      };
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
