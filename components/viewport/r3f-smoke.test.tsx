import { describe, expect, it } from "vitest";
import ReactThreeTestRenderer from "@react-three/test-renderer";

describe("setup de react-three-fiber", () => {
  it("monta una escena mínima y expone el grafo de objetos", async () => {
    const renderer = await ReactThreeTestRenderer.create(
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial />
      </mesh>,
    );

    expect(renderer.scene.children).toHaveLength(1);
    expect(renderer.scene.children[0].type).toBe("Mesh");
  });
});
