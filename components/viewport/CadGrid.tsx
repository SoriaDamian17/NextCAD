"use client";

import { Grid } from "@react-three/drei";
import { GRID, VIEWPORT_COLORS } from "@/lib/viewport";

// Grid de fondo tipo CAD. `drei <Grid>` vive en el plano XZ por defecto:
// se rota a XY para una vista top-down. `raycast` se anula para que el grid
// no intercepte los clics de las features de dibujo/selección.
export function CadGrid() {
  return (
    <Grid
      rotation={[Math.PI / 2, 0, 0]}
      args={[100, 100]}
      cellSize={GRID.cellSize}
      cellThickness={0.6}
      cellColor={VIEWPORT_COLORS.gridMinor}
      sectionSize={GRID.sectionSize}
      sectionThickness={1}
      sectionColor={VIEWPORT_COLORS.gridMajor}
      infiniteGrid
      fadeDistance={GRID.fadeDistance}
      fadeStrength={1.2}
      raycast={() => null}
    />
  );
}
