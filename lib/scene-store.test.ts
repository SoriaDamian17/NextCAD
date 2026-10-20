import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HISTORY_LIMIT, createShape, type RectShape } from "@/lib/scene";
import {
  selectCanRedo,
  selectCanUndo,
  selectOrderedShapes,
  selectSelectedShapes,
  selectShape,
  useSceneStore,
} from "@/lib/scene-store";

function rect(id = "r1", now = 1_000): RectShape {
  return createShape(
    { type: "rect", x: 0, y: 0, width: 10, height: 10 },
    { id, now },
  ) as RectShape;
}

function getRect(id = "r1"): RectShape {
  const shape = useSceneStore.getState().shapes[id];
  if (!shape || shape.type !== "rect") {
    throw new Error(`No existe un rectángulo con id "${id}"`);
  }
  return shape;
}

beforeEach(() => {
  useSceneStore.getState().reset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("scene store: formas", () => {
  it("add agrega la forma, respeta el orden y devuelve el id", () => {
    const store = useSceneStore.getState();

    expect(store.add(rect("a"))).toBe("a");
    store.add(rect("b"));

    const state = useSceneStore.getState();
    expect(state.order).toEqual(["a", "b"]);
    expect(selectOrderedShapes(state).map((shape) => shape.id)).toEqual(["a", "b"]);
  });

  it("add con id duplicado no duplica ni pisa la forma existente", () => {
    const store = useSceneStore.getState();
    store.add(rect("a", 1_000));
    store.add(rect("a", 2_000));

    const state = useSceneStore.getState();
    expect(state.order).toEqual(["a"]);
    expect(getRect("a").createdAt).toBe(1_000);
  });

  it("update aplica parches parciales y actualiza updatedAt", () => {
    const store = useSceneStore.getState();
    store.add(rect());

    vi.spyOn(Date, "now").mockReturnValue(2_000);
    store.update("r1", { x: 50 });

    const shape = getRect();
    expect(shape.x).toBe(50);
    expect(shape.width).toBe(10);
    expect(shape.updatedAt).toBe(2_000);
  });

  it("update hace merge del estilo sin borrar el resto", () => {
    const store = useSceneStore.getState();
    store.add(rect());

    store.update("r1", { style: { stroke: "#b2553a" } });

    expect(getRect().style).toMatchObject({
      stroke: "#b2553a",
      fill: null,
      strokeWidth: 1.5,
      opacity: 1,
    });
  });

  it("update sin cambios reales no genera historial ni cambia updatedAt", () => {
    const store = useSceneStore.getState();
    store.add(rect());
    const historyBefore = useSceneStore.getState().past.length;

    store.update("r1", { x: 0, style: { stroke: "#3a372f" } });

    expect(useSceneStore.getState().past.length).toBe(historyBefore);
    expect(getRect().updatedAt).toBe(1_000);
  });

  it("update de un id inexistente no hace nada", () => {
    const store = useSceneStore.getState();
    const historyBefore = useSceneStore.getState().past.length;

    store.update("missing", { x: 50 });

    expect(useSceneStore.getState().past.length).toBe(historyBefore);
    expect(useSceneStore.getState().shapes.missing).toBeUndefined();
  });

  it("remove elimina la forma, su orden y su selección", () => {
    const store = useSceneStore.getState();
    store.add(rect("a"));
    store.add(rect("b"));
    store.select("a");

    store.remove("a");

    const state = useSceneStore.getState();
    expect(state.shapes.a).toBeUndefined();
    expect(state.order).toEqual(["b"]);
    expect(state.selectedIds).toEqual([]);
  });

  it("remove acepta varios ids en una sola operación", () => {
    const store = useSceneStore.getState();
    store.add(rect("a"));
    store.add(rect("b"));
    store.add(rect("c"));
    store.select("a");
    store.select("b", { additive: true });

    store.remove(["a", "b"]);

    const state = useSceneStore.getState();
    expect(state.order).toEqual(["c"]);
    expect(state.selectedIds).toEqual([]);
    expect(state.shapes.c).toBeDefined();
  });

  it("remove de ids inexistentes no hace nada", () => {
    const store = useSceneStore.getState();
    store.add(rect("a"));
    const historyBefore = useSceneStore.getState().past.length;

    store.remove(["missing", "also-missing"]);

    expect(useSceneStore.getState().past.length).toBe(historyBefore);
    expect(useSceneStore.getState().order).toEqual(["a"]);
  });
});

describe("scene store: selección", () => {
  it("select reemplaza la selección por defecto", () => {
    const store = useSceneStore.getState();
    store.add(rect("a"));
    store.add(rect("b"));

    store.select("a");
    expect(useSceneStore.getState().selectedIds).toEqual(["a"]);

    store.select("b");
    expect(useSceneStore.getState().selectedIds).toEqual(["b"]);
  });

  it("select con additive alterna ids y permite selección múltiple", () => {
    const store = useSceneStore.getState();
    store.add(rect("a"));
    store.add(rect("b"));
    store.add(rect("c"));

    store.select("a");
    store.select("b", { additive: true });
    store.select("c", { additive: true });
    expect(useSceneStore.getState().selectedIds).toEqual(["a", "b", "c"]);

    store.select("b", { additive: true });
    expect(useSceneStore.getState().selectedIds).toEqual(["a", "c"]);
  });

  it("select(null) y clearSelection vacían la selección", () => {
    const store = useSceneStore.getState();
    store.add(rect("a"));
    store.select("a");

    store.select(null);
    expect(useSceneStore.getState().selectedIds).toEqual([]);

    store.select("a");
    store.clearSelection();
    expect(useSceneStore.getState().selectedIds).toEqual([]);
  });

  it("select de un id inexistente se ignora", () => {
    const store = useSceneStore.getState();
    store.add(rect("a"));
    store.select("a");

    store.select("missing");

    expect(useSceneStore.getState().selectedIds).toEqual(["a"]);
  });

  it("la selección no genera entradas de historial", () => {
    const store = useSceneStore.getState();
    store.add(rect("a"));
    store.add(rect("b"));
    const historyBefore = useSceneStore.getState().past.length;

    store.select("a");
    store.select("b", { additive: true });
    store.clearSelection();

    expect(useSceneStore.getState().past.length).toBe(historyBefore);
  });
});

describe("scene store: undo/redo", () => {
  it("undo y redo revierten add", () => {
    const store = useSceneStore.getState();
    store.add(rect("a"));

    useSceneStore.getState().undo();
    expect(useSceneStore.getState().shapes.a).toBeUndefined();
    expect(useSceneStore.getState().order).toEqual([]);

    useSceneStore.getState().redo();
    expect(useSceneStore.getState().shapes.a).toBeDefined();
    expect(useSceneStore.getState().order).toEqual(["a"]);
  });

  it("undo y redo revierten update", () => {
    const store = useSceneStore.getState();
    store.add(rect());
    store.update("r1", { x: 99 });
    expect(getRect().x).toBe(99);

    useSceneStore.getState().undo();
    expect(getRect().x).toBe(0);

    useSceneStore.getState().redo();
    expect(getRect().x).toBe(99);
  });

  it("undo y redo revierten remove", () => {
    const store = useSceneStore.getState();
    store.add(rect("a"));
    store.remove("a");
    expect(useSceneStore.getState().shapes.a).toBeUndefined();

    useSceneStore.getState().undo();
    expect(useSceneStore.getState().shapes.a).toBeDefined();

    useSceneStore.getState().redo();
    expect(useSceneStore.getState().shapes.a).toBeUndefined();
  });

  it("una acción nueva vacía el futuro del redo", () => {
    const store = useSceneStore.getState();
    store.add(rect("a"));
    store.update("a", { x: 10 });

    useSceneStore.getState().undo();
    expect(useSceneStore.getState().future.length).toBeGreaterThan(0);

    useSceneStore.getState().add(rect("b"));
    expect(useSceneStore.getState().future).toEqual([]);
  });

  it("respeta el límite del historial", () => {
    const store = useSceneStore.getState();
    store.add(rect());

    for (let i = 1; i <= HISTORY_LIMIT + 5; i += 1) {
      useSceneStore.getState().update("r1", { x: i });
    }

    expect(useSceneStore.getState().past.length).toBe(HISTORY_LIMIT);
  });

  it("poda la selección cuando undo elimina la forma seleccionada", () => {
    const store = useSceneStore.getState();
    store.add(rect("a"));
    store.select("a");

    useSceneStore.getState().undo();

    expect(useSceneStore.getState().shapes.a).toBeUndefined();
    expect(useSceneStore.getState().selectedIds).toEqual([]);
  });
});

describe("scene store: transacciones", () => {
  it("agrupa varios updates transitorios en una sola entrada de historial", () => {
    const store = useSceneStore.getState();
    store.add(rect());
    const historyBefore = useSceneStore.getState().past.length;

    useSceneStore.getState().beginTransaction();
    useSceneStore.getState().update("r1", { x: 10 }, { transient: true });
    useSceneStore.getState().update("r1", { x: 20 }, { transient: true });
    useSceneStore.getState().update("r1", { x: 30 }, { transient: true });
    useSceneStore.getState().commitTransaction();

    expect(useSceneStore.getState().past.length).toBe(historyBefore + 1);

    useSceneStore.getState().undo();
    expect(getRect().x).toBe(0);
  });

  it("cancelTransaction restaura el estado previo sin dejar historial", () => {
    const store = useSceneStore.getState();
    store.add(rect());
    const historyBefore = useSceneStore.getState().past.length;

    useSceneStore.getState().beginTransaction();
    useSceneStore.getState().update("r1", { x: 50 }, { transient: true });
    useSceneStore.getState().cancelTransaction();

    expect(getRect().x).toBe(0);
    expect(useSceneStore.getState().past.length).toBe(historyBefore);
    expect(useSceneStore.getState().pending).toBeNull();
  });

  it("commit sin cambios no genera historial", () => {
    const store = useSceneStore.getState();
    store.add(rect());
    const historyBefore = useSceneStore.getState().past.length;

    useSceneStore.getState().beginTransaction();
    useSceneStore.getState().commitTransaction();

    expect(useSceneStore.getState().past.length).toBe(historyBefore);
    expect(useSceneStore.getState().pending).toBeNull();
  });
});

describe("scene store: selectores", () => {
  it("selectOrderedShapes respeta el orden y selectShape busca por id", () => {
    const store = useSceneStore.getState();
    store.add(rect("a"));
    store.add(rect("b"));

    const state = useSceneStore.getState();
    expect(selectOrderedShapes(state).map((shape) => shape.id)).toEqual(["a", "b"]);
    expect(selectShape("b")(state)?.id).toBe("b");
  });

  it("selectSelectedShapes devuelve solo las formas seleccionadas", () => {
    const store = useSceneStore.getState();
    store.add(rect("a"));
    store.add(rect("b"));
    store.select("a");
    store.select("b", { additive: true });

    expect(
      selectSelectedShapes(useSceneStore.getState()).map((shape) => shape.id),
    ).toEqual(["a", "b"]);
  });

  it("selectCanUndo y selectCanRedo reflejan las pilas", () => {
    const store = useSceneStore.getState();
    expect(selectCanUndo(useSceneStore.getState())).toBe(false);
    expect(selectCanRedo(useSceneStore.getState())).toBe(false);

    store.add(rect("a"));
    expect(selectCanUndo(useSceneStore.getState())).toBe(true);

    useSceneStore.getState().undo();
    expect(selectCanRedo(useSceneStore.getState())).toBe(true);

    useSceneStore.getState().redo();
    expect(selectCanRedo(useSceneStore.getState())).toBe(false);
  });
});
