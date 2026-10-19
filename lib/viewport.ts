// Lógica pura del viewport 2D: sin React ni WebGL, para poder testearla en jsdom.
// 1 unidad = 1 mm conceptual (ver docs/plan-viewport-2d.md §4.6).

export const DEFAULT_VIEW = {
  zoom: 50, // px por unidad en la vista por defecto
  minZoom: 5,
  maxZoom: 400,
} as const;

// Colores del viewport, espejo de los tokens de `app/globals.css`.
// three/WebGL no consumen variables CSS, de ahí la constante compartida.
export const VIEWPORT_COLORS = {
  background: "#efebe3", // papel
  gridMinor: "#3a372f14", // rgba(58, 55, 47, 0.08)
  gridMajor: "#3a372f29", // rgba(58, 55, 47, 0.16)
} as const;

export const GRID = {
  cellSize: 10,
  sectionSize: 50, // sección mayor cada 5 celdas
  fadeDistance: 4000,
} as const;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

type CameraLike = { position: { x: number; y: number }; zoom: number };
type Size = { width: number; height: number };
type Ndc = { x: number; y: number };

/**
 * Convierte un pointer normalizado de r3f ([-1, 1], origen al centro, +y arriba)
 * a coordenadas del plano XY.
 */
export function screenToWorld(pointer: Ndc, camera: CameraLike, size: Size): { x: number; y: number } {
  const worldWidth = size.width / camera.zoom;
  const worldHeight = size.height / camera.zoom;
  return {
    x: camera.position.x + (pointer.x * worldWidth) / 2,
    y: camera.position.y + (pointer.y * worldHeight) / 2,
  };
}

export function zoomPercent(zoom: number, base: number = DEFAULT_VIEW.zoom): number {
  return Math.round((zoom / base) * 100);
}
