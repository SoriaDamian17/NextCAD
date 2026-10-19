"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { CadGrid } from "./CadGrid";
import { CameraRig } from "./CameraRig";
import { StatusBar } from "./StatusBar";
import { ViewportStateTracker, type ViewportReadout } from "./ViewportStateTracker";
import { DEFAULT_VIEW, VIEWPORT_COLORS } from "@/lib/viewport";

const INITIAL_READOUT: ViewportReadout = { x: 0, y: 0, zoom: 100 };

export function Viewport2D() {
  const [readout, setReadout] = useState<ViewportReadout>(INITIAL_READOUT);

  return (
    <div className="relative h-full w-full overflow-hidden">
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
