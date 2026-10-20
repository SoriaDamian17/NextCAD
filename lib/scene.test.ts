import { describe, expect, it } from "vitest";
import {
  DEFAULT_SHAPE_STYLE,
  createShape,
  snapshotScene,
  type SceneSnapshot,
} from "@/lib/scene";

describe("createShape", () => {
  it("crea un rectángulo con id, timestamps y estilo por defecto", () => {
    const shape = createShape(
      { type: "rect", x: 10, y: 20, width: 100, height: 50 },
      { id: "rect-1", now: 1_000 },
    );

    expect(shape).toMatchObject({
      id: "rect-1",
      type: "rect",
      x: 10,
      y: 20,
      width: 100,
      height: 50,
      createdAt: 1_000,
      updatedAt: 1_000,
      style: DEFAULT_SHAPE_STYLE,
    });
  });

  it("crea un círculo con su geometría", () => {
    const shape = createShape(
      { type: "circle", cx: 30, cy: 40, radius: 15 },
      { id: "circle-1", now: 2_000 },
    );

    expect(shape).toMatchObject({
      id: "circle-1",
      type: "circle",
      cx: 30,
      cy: 40,
      radius: 15,
      createdAt: 2_000,
      updatedAt: 2_000,
    });
  });

  it("crea una línea con sus dos extremos", () => {
    const shape = createShape(
      { type: "line", x1: 0, y1: 0, x2: 100, y2: 50 },
      { id: "line-1", now: 3_000 },
    );

    expect(shape).toMatchObject({
      id: "line-1",
      type: "line",
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 50,
    });
  });

  it("crea un texto con defaults de tamaño y rotación", () => {
    const shape = createShape(
      { type: "text", x: 5, y: 10, content: "Sala" },
      { id: "text-1", now: 4_000 },
    );

    expect(shape).toMatchObject({
      id: "text-1",
      type: "text",
      x: 5,
      y: 10,
      content: "Sala",
      fontSize: 16,
      rotation: 0,
    });
  });

  it("genera ids únicos cuando no se pasan explícitamente", () => {
    const first = createShape({ type: "circle", cx: 0, cy: 0, radius: 5 });
    const second = createShape({ type: "circle", cx: 0, cy: 0, radius: 5 });

    expect(first.id).not.toBe(second.id);
  });

  it("hace merge del estilo parcial con el estilo por defecto", () => {
    const shape = createShape({
      type: "rect",
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      style: { stroke: "#b2553a", fill: "#efebe3" },
    });

    expect(shape.style).toEqual({
      ...DEFAULT_SHAPE_STYLE,
      stroke: "#b2553a",
      fill: "#efebe3",
    });
  });
});

describe("snapshotScene", () => {
  it("conserva las referencias de shapes y order", () => {
    const shape = createShape(
      { type: "rect", x: 0, y: 0, width: 10, height: 10 },
      { id: "rect-1", now: 1_000 },
    );
    const scene: SceneSnapshot = {
      shapes: { [shape.id]: shape },
      order: [shape.id],
    };

    const snapshot = snapshotScene(scene);

    expect(snapshot).toEqual(scene);
    expect(snapshot.shapes).toBe(scene.shapes);
    expect(snapshot.order).toBe(scene.order);
  });
});
