"use client";

import { useEffect } from "react";
import { resolveShortcut, shouldIgnoreShortcut } from "@/lib/tools";
import { useToolStore } from "@/lib/tool-store";

/**
 * Atajos de herramienta V/R/C/L/T.
 * Guardas (docs/plan-toolbar_draw_tools.md §4.5): modificadores,
 * repetición de tecla y foco en un campo editable.
 */
export function useToolShortcuts() {
  const setTool = useToolStore((state) => state.setTool);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreShortcut(event)) return;

      const tool = resolveShortcut(event.key);
      if (!tool) return;

      setTool(tool);
      event.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setTool]);
}
