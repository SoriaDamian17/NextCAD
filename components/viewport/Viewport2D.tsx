"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { CadGrid } from "./CadGrid";
import { CameraRig } from "./CameraRig";
import { StatusBar } from "./StatusBar";
import { ViewportStateTracker, type ViewportReadout } from "./ViewportStateTracker";
import { DEFAULT_VIEW, VIEWPORT_COLORS } from "@/lib/viewport";
import { cursorForTool } from "@/lib/tools";
import { useToolStore } from "@/lib/tool-store";

const INITIAL_READOUT: ViewportReadout = { x: 0, y: 0, zoom: 100 };

export function Viewport2D() {
  const [readout, setReadout] = useState<ViewportReadout>(INITIAL_READOUT);
  const activeTool = useToolStore((state) => state.activeTool);

  // El cursor sigue la herramienta activa: `default` en Select, `crosshair`
  // al dibujar (docs/plan-design-ux.md §6). El canvas lo hereda; durante el
  // pan, `CameraRig` aplica `grab` con estilo inline y lo revierte al soltar.
  const cursorClass =
    cursorForTool(activeTool) === "crosshair" ? "cursor-crosshair" : "cursor-default";

  return (
    <div className={`relative h-full w-full overflow-hidden ${cursorClass}`}>
      <Canvas
        orthographic
        camera={{ position: [0, 0, 10], zoom: DEFAULT_VIEW.zoom, near: 0.1, far: 5000 }}
        className="touch-none"
      >
        <color attach="background" args={[VIEWPORT_COLORS.background]} />
        <CadGrid />
        <CameraRig />
        <ViewportStateTracker onChange={setReadout} />
      </Canvas>
      <StatusBar x={readout.x} y={readout.y} zoom={readout.zoom} />
    </div>
  );
}
