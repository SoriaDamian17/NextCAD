"use client";

import { ToolIcon } from "./ToolIcon";
import type { ToolDef } from "@/lib/tools";

type ToolButtonProps = {
  tool: ToolDef;
  active: boolean;
  onSelect: () => void;
};

export function ToolButton({ tool, active, onSelect }: ToolButtonProps) {
  const label = `${tool.label} (${tool.shortcut})`;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={[
        "relative flex h-10 w-10 items-center justify-center transition-colors duration-100",
        "hover:bg-pizarra focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-roble focus-visible:ring-offset-2 focus-visible:ring-offset-muro",
        active ? "text-texto" : "text-texto-tenue hover:text-texto",
      ].join(" ")}
    >
      {/* Tick de la herramienta activa (docs/plan-design-ux.md §6). */}
      <span
        aria-hidden
        data-testid={`tool-tick-${tool.id}`}
        className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 ${
          active ? "bg-roble" : "bg-transparent"
        }`}
      />
      <ToolIcon id={tool.id} />
    </button>
  );
}
