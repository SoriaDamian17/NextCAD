import { describe, expect, it } from "vitest";
import { formatNumber } from "@/lib/format";

describe("formatNumber", () => {
  it("formatea números con separador de miles", () => {
    expect(formatNumber(1200)).toBe("1.200");
  });

  it("limita a dos decimales", () => {
    expect(formatNumber(12.3456)).toBe("12,35");
  });
});
