import { describe, expect, it } from "vitest";
import {
  DEFAULT_TOOL,
  TOOL_DEFS,
  cursorForTool,
  isEditableTarget,
  resolveShortcut,
  shouldIgnoreShortcut,
  toolById,
} from "@/lib/tools";

describe("TOOL_DEFS", () => {
  it("define las 5 herramientas del MVP", () => {
    expect(TOOL_DEFS.map((tool) => tool.id)).toEqual([
      "select",
      "rect",
      "circle",
      "line",
      "text",
    ]);
  });

  it("no repite ids ni atajos", () => {
    expect(new Set(TOOL_DEFS.map((tool) => tool.id)).size).toBe(TOOL_DEFS.length);
    expect(new Set(TOOL_DEFS.map((tool) => tool.shortcut)).size).toBe(
      TOOL_DEFS.length,
    );
  });

  it("usa Select como herramienta por defecto", () => {
    expect(DEFAULT_TOOL).toBe("select");
  });
});

describe("toolById", () => {
  it("devuelve la definición de la herramienta", () => {
    expect(toolById("rect")).toMatchObject({
      id: "rect",
      label: "Rectángulo",
      shortcut: "R",
    });
  });

  it("lanza con un id desconocido", () => {
    // @ts-expect-error id inválido a propósito
    expect(() => toolById("triangle")).toThrow();
  });
});

describe("resolveShortcut", () => {
  it("resuelve cada atajo V/R/C/L/T", () => {
    expect(resolveShortcut("v")).toBe("select");
    expect(resolveShortcut("r")).toBe("rect");
    expect(resolveShortcut("c")).toBe("circle");
    expect(resolveShortcut("l")).toBe("line");
    expect(resolveShortcut("t")).toBe("text");
  });

  it("tolera mayúsculas y minúsculas", () => {
    expect(resolveShortcut("V")).toBe("select");
    expect(resolveShortcut("R")).toBe("rect");
  });

  it("devuelve null si la tecla no tiene atajo", () => {
    expect(resolveShortcut("x")).toBeNull();
    expect(resolveShortcut("")).toBeNull();
  });
});

describe("cursorForTool", () => {
  it("usa el cursor default en Select", () => {
    expect(cursorForTool("select")).toBe("default");
  });

  it("usa crosshair en las herramientas de dibujo", () => {
    expect(cursorForTool("rect")).toBe("crosshair");
    expect(cursorForTool("circle")).toBe("crosshair");
    expect(cursorForTool("line")).toBe("crosshair");
    expect(cursorForTool("text")).toBe("crosshair");
  });
});

describe("isEditableTarget", () => {
  it("detecta campos editables", () => {
    expect(isEditableTarget(document.createElement("input"))).toBe(true);
    expect(isEditableTarget(document.createElement("textarea"))).toBe(true);
    expect(isEditableTarget(document.createElement("select"))).toBe(true);
  });

  it("detecta contenido editable", () => {
    const div = document.createElement("div");
    div.setAttribute("contenteditable", "true");
    expect(isEditableTarget(div)).toBe(true);
  });

  it("no marca elementos no editables", () => {
    expect(isEditableTarget(document.createElement("div"))).toBe(false);
    expect(isEditableTarget(document.createElement("button"))).toBe(false);
  });

  it("no rompe con target nulo", () => {
    expect(isEditableTarget(null)).toBe(false);
  });
});

describe("shouldIgnoreShortcut", () => {
  it("no ignora un atajo limpio", () => {
    expect(shouldIgnoreShortcut({ key: "r" })).toBe(false);
  });

  it("ignora atajos con modificadores", () => {
    expect(shouldIgnoreShortcut({ key: "r", ctrlKey: true })).toBe(true);
    expect(shouldIgnoreShortcut({ key: "c", metaKey: true })).toBe(true);
    expect(shouldIgnoreShortcut({ key: "l", altKey: true })).toBe(true);
  });

  it("ignora la repetición de tecla", () => {
    expect(shouldIgnoreShortcut({ key: "t", repeat: true })).toBe(true);
  });

  it("ignora atajos con el foco en un campo editable", () => {
    const input = document.createElement("input");
    expect(shouldIgnoreShortcut({ key: "v", target: input })).toBe(true);
  });
});
