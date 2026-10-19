"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { OrthographicCamera } from "three";
import { screenToWorld, zoomPercent } from "@/lib/viewport";

export type ViewportReadout = { x: number; y: number; zoom: number };

type Props = { onChange: (readout: ViewportReadout) => void };

// Lee el pointer normalizado y el zoom de la cámara en cada frame y eleva
// el resultado, pero solo cuando cambia (evita re-render por frame).
export function ViewportStateTracker({ onChange }: Props) {
  const camera = useThree((s) => s.camera) as OrthographicCamera;
  const size = useThree((s) => s.size);
  const pointer = useThree((s) => s.pointer);
  const last = useRef<ViewportReadout>({ x: NaN, y: NaN, zoom: NaN });

  useFrame(() => {
    const { x, y } = screenToWorld(
      { x: pointer.x, y: pointer.y },
      { position: { x: camera.position.x, y: camera.position.y }, zoom: camera.zoom },
      { width: size.width, height: size.height },
    );
    const zoom = zoomPercent(camera.zoom);
    const rx = Math.round(x * 100) / 100;
    const ry = Math.round(y * 100) / 100;

    if (rx !== last.current.x || ry !== last.current.y || zoom !== last.current.zoom) {
      last.current = { x: rx, y: ry, zoom };
      onChange(last.current);
    }
  });

  return null;
}
