"use client";

import { Canvas } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";

// TEMPORAL: Canvas de verificación del scaffold (feature 2 `project_setup`).
// Confirma que react-three-fiber y drei funcionan en el navegador.
// La feature 3 (`viewport_2d`) lo reemplaza por el viewport CAD real.
export function TestCanvas() {
  return (
    <Canvas camera={{ position: [4, 4, 4], fov: 50 }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <Grid
        args={[20, 20]}
        cellSize={0.5}
        cellThickness={0.6}
        sectionSize={2.5}
        sectionThickness={1}
        infiniteGrid
        fadeDistance={30}
      />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#c89b5e" />
      </mesh>
      <OrbitControls makeDefault />
    </Canvas>
  );
}
