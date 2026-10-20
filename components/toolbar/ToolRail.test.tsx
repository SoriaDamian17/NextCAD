import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ToolRail } from "@/components/toolbar/ToolRail";
import { useToolStore } from "@/lib/tool-store";

function pressedButtons() {
  return screen
    .getAllByRole("button")
    .filter((button) => button.getAttribute("aria-pressed") === "true");
}

describe("ToolRail", () => {
  beforeEach(() => {
    useToolStore.getState().reset();
  });

  it("muestra las 5 herramientas con su atajo", () => {
    render(<ToolRail />);

    expect(screen.getByRole("button", { name: "Seleccionar (V)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rectángulo (R)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Círculo (C)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Línea (L)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Texto (T)" })).toBeInTheDocument();
  });

  it("arranca con Select resaltada", () => {
    render(<ToolRail />);

    const pressed = pressedButtons();
    expect(pressed).toHaveLength(1);
    expect(pressed[0]).toHaveAccessibleName("Seleccionar (V)");
  });

  it("cambia la herramienta activa al hacer click", () => {
    render(<ToolRail />);

    fireEvent.click(screen.getByRole("button", { name: "Rectángulo (R)" }));

    const pressed = pressedButtons();
    expect(pressed).toHaveLength(1);
    expect(pressed[0]).toHaveAccessibleName("Rectángulo (R)");
    expect(useToolStore.getState().activeTool).toBe("rect");
  });

  it("cambia la herramienta activa con el atajo de teclado", () => {
    render(<ToolRail />);

    fireEvent.keyDown(window, { key: "c" });

    expect(useToolStore.getState().activeTool).toBe("circle");
    expect(pressedButtons()[0]).toHaveAccessibleName("Círculo (C)");
  });

  it("ignora el atajo si hay modificadores", () => {
    render(<ToolRail />);

    fireEvent.keyDown(window, { key: "r", ctrlKey: true });

    expect(useToolStore.getState().activeTool).toBe("select");
  });

  it("ignora el atajo si el foco está en un campo editable", () => {
    render(<ToolRail />);
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    fireEvent.keyDown(input, { key: "t" });

    expect(useToolStore.getState().activeTool).toBe("select");
    input.remove();
  });

  it("ignora la repetición de tecla", () => {
    render(<ToolRail />);

    fireEvent.keyDown(window, { key: "l", repeat: true });

    expect(useToolStore.getState().activeTool).toBe("select");
  });
});
