import { describe, expect, it } from "vitest";
import { DEFAULT_VIEW, clamp, screenToWorld, zoomPercent } from "@/lib/viewport";

describe("viewport math", () => {
  const camera = { position: { x: 0, y: 0 }, zoom: 50 };
  const size = { width: 800, height: 600 };

  it("mapea el centro del canvas al centro de la cámara", () => {
    expect(screenToWorld({ x: 0, y: 0 }, camera, size)).toEqual({ x: 0, y: 0 });
  });

  it("mapea la esquina superior derecha a media anchura/alto del mundo", () => {
    expect(screenToWorld({ x: 1, y: 1 }, camera, size)).toEqual({ x: 8, y: 6 });
  });

  it("respeta el desplazamiento de la cámara (pan)", () => {
    const moved = { position: { x: 100, y: -50 }, zoom: 50 };
    expect(screenToWorld({ x: 0, y: 0 }, moved, size)).toEqual({ x: 100, y: -50 });
  });

  it("clamp respeta los límites", () => {
    expect(clamp(10, 0, 5)).toBe(5);
    expect(clamp(-1, 0, 5)).toBe(0);
    expect(clamp(3, 0, 5)).toBe(3);
  });

  it("zoomPercent es 100 en la vista por defecto", () => {
    expect(zoomPercent(DEFAULT_VIEW.zoom)).toBe(100);
    expect(zoomPercent(DEFAULT_VIEW.zoom * 2)).toBe(200);
    expect(zoomPercent(DEFAULT_VIEW.zoom / 2)).toBe(50);
  });
});
