import { beforeEach, describe, expect, it } from "vitest";
import { selectActiveTool, useToolStore } from "@/lib/tool-store";

describe("useToolStore", () => {
  beforeEach(() => {
    useToolStore.getState().reset();
  });

  it("arranca con Select como herramienta activa", () => {
    expect(useToolStore.getState().activeTool).toBe("select");
  });

  it("cambia la herramienta activa", () => {
    useToolStore.getState().setTool("rect");
    expect(useToolStore.getState().activeTool).toBe("rect");
  });

  it("vuelve a Select", () => {
    useToolStore.getState().setTool("circle");
    useToolStore.getState().setTool("select");
    expect(useToolStore.getState().activeTool).toBe("select");
  });

  it("reset vuelve a la herramienta por defecto", () => {
    useToolStore.getState().setTool("text");
    useToolStore.getState().reset();
    expect(useToolStore.getState().activeTool).toBe("select");
  });

  it("expone la herramienta activa con el selector", () => {
    useToolStore.getState().setTool("line");
    expect(selectActiveTool(useToolStore.getState())).toBe("line");
  });
});
