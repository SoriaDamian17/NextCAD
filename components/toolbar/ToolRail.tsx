"use client";

import { TOOL_DEFS } from "@/lib/tools";
import { useToolStore } from "@/lib/tool-store";
import { ToolButton } from "./ToolButton";
import { useToolShortcuts } from "./useToolShortcuts";

// Rail de herramientas: 48px a la izquierda del viewport
// (docs/plan-design-ux.md §5.2).
export function ToolRail() {
  const activeTool = useToolStore((state) => state.activeTool);
  const setTool = useToolStore((state) => state.setTool);

  useToolShortcuts();

  return (
    <nav
      aria-label="Herramientas de dibujo"
      className="flex h-full w-12 shrink-0 flex-col items-center gap-1 border-r border-borde bg-muro py-2"
    >
      {TOOL_DEFS.map((tool) => (
        <ToolButton
          key={tool.id}
          tool={tool}
          active={tool.id === activeTool}
          onSelect={() => setTool(tool.id)}
        />
      ))}
    </nav>
  );
}
