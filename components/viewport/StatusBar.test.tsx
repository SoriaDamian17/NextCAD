import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBar } from "@/components/viewport/StatusBar";

describe("StatusBar", () => {
  it("muestra las coordenadas del cursor y el zoom", () => {
    render(<StatusBar x={120} y={84} zoom={100} />);

    expect(screen.getByText(/X 120/)).toBeInTheDocument();
    expect(screen.getByText(/Y 84/)).toBeInTheDocument();
    expect(screen.getByText(/zoom 100%/)).toBeInTheDocument();
  });
});
