"use client";

import { create } from "zustand";
import { DEFAULT_TOOL, type ToolId } from "@/lib/tools";

// Estado de interfaz, no de documento: no se serializa en la persistencia
// de la feature 11 (que persiste `{ version, shapes, order }`).
// Ver docs/plan-toolbar_draw_tools.md §4.1.
export type ToolStore = {
  activeTool: ToolId;
  setTool: (tool: ToolId) => void;
  reset: () => void;
};

export const useToolStore = create<ToolStore>()((set) => ({
  activeTool: DEFAULT_TOOL,
  setTool: (tool) => set({ activeTool: tool }),
  reset: () => set({ activeTool: DEFAULT_TOOL }),
}));

export const selectActiveTool = (state: ToolStore) => state.activeTool;
