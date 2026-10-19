"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { CameraControls, CameraControlsImpl } from "@react-three/drei";
import type { CameraControls as CameraControlsInstance } from "@react-three/drei";
import { DEFAULT_VIEW } from "@/lib/viewport";

const ACTION = CameraControlsImpl.ACTION;

// Navegación CAD sobre la cámara ortográfica:
//   rueda                → zoom centrado en el cursor (dollyToCursor)
//   middle-click / drag  → pan
//   space + drag izq.    → pan
//   tecla 0              → reset de la vista
// Sin rotación: la vista es top-down fija (polar angle bloqueado).
export function CameraRig() {
  const ref = useRef<CameraControlsInstance | null>(null);
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    const controls = ref.current;
    if (!controls) return;

    controls.dollyToCursor = true;
    controls.minZoom = DEFAULT_VIEW.minZoom;
    controls.maxZoom = DEFAULT_VIEW.maxZoom;
    controls.truckSpeed = 1.5;
    controls.smoothTime = 0.2;
    // Vista top-down: el vector cámara→target es horizontal (90°).
    controls.minPolarAngle = Math.PI / 2;
    controls.maxPolarAngle = Math.PI / 2;
    controls.mouseButtons = {
      left: ACTION.NONE,
      middle: ACTION.TRUCK,
      right: ACTION.NONE,
      wheel: ACTION.ZOOM,
    };

    let panning = false;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !panning) {
        panning = true;
        controls.mouseButtons.left = ACTION.TRUCK;
        gl.domElement.style.cursor = "grab";
        e.preventDefault();
      }
      if (e.key === "0") {
        void controls.reset(true);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && panning) {
        panning = false;
        controls.mouseButtons.left = ACTION.NONE;
        gl.domElement.style.cursor = "";
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [gl]);

  return <CameraControls ref={ref} makeDefault />;
}
