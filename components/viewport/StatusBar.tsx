import { formatNumber } from "@/lib/format";

export type StatusBarProps = { x: number; y: number; zoom: number };

// Status bar mínima (solo lectura): coordenadas del cursor y zoom.
// La versión completa (imán, escala 1:50) pertenece a features posteriores.
export function StatusBar({ x, y, zoom }: StatusBarProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex h-8 items-center gap-4 bg-muro px-3 text-[11px] leading-none text-texto select-none">
      <span className="font-mono tabular-nums">X {formatNumber(x)}</span>
      <span className="font-mono tabular-nums">Y {formatNumber(y)}</span>
      <span className="ml-auto font-mono tabular-nums">zoom {zoom}%</span>
    </div>
  );
}
