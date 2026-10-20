// Modelo puro de las herramientas de dibujo. Sin React, sin zustand:
// el rail, el canvas y los tests consumen la misma tabla de verdad.
// Ver docs/plan-toolbar_draw_tools.md §4.2.

export type ToolId = "select" | "rect" | "circle" | "line" | "text";

export type ToolDef = {
  id: ToolId;
  label: string; // español, sentence case
  shortcut: string; // tecla sin modificadores
  cursor: "default" | "crosshair";
};

export const DEFAULT_TOOL: ToolId = "select";

export const TOOL_DEFS: readonly ToolDef[] = [
  { id: "select", label: "Seleccionar", shortcut: "V", cursor: "default" },
  { id: "rect", label: "Rectángulo", shortcut: "R", cursor: "crosshair" },
  { id: "circle", label: "Círculo", shortcut: "C", cursor: "crosshair" },
  { id: "line", label: "Línea", shortcut: "L", cursor: "crosshair" },
  { id: "text", label: "Texto", shortcut: "T", cursor: "crosshair" },
];

const TOOL_BY_SHORTCUT: Record<string, ToolId> = Object.fromEntries(
  TOOL_DEFS.map((tool) => [tool.shortcut.toLowerCase(), tool.id]),
);

export function toolById(id: ToolId): ToolDef {
  const tool = TOOL_DEFS.find((candidate) => candidate.id === id);
  if (!tool) throw new Error(`Herramienta desconocida: ${id}`);
  return tool;
}

/** Devuelve la herramienta asociada a una tecla, o null si no hay atajo. */
export function resolveShortcut(key: string): ToolId | null {
  return TOOL_BY_SHORTCUT[key.toLowerCase()] ?? null;
}

export function cursorForTool(id: ToolId): "default" | "crosshair" {
  return toolById(id).cursor;
}

export function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  if (!element || typeof element !== "object") return false;
  if (typeof element.tagName !== "string") return false;

  if (element.isContentEditable) return true;
  const attribute =
    typeof element.getAttribute === "function"
      ? element.getAttribute("contenteditable")
      : null;
  if (attribute !== null && attribute !== "false") return true;

  const tag = element.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select";
}

// Tipo estructural mínimo: permite testear las guardas sin DOM real.
export type ShortcutEvent = {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  repeat?: boolean;
  target?: EventTarget | null;
};

/**
 * Un atajo de herramienta no debe disparar si:
 * - hay modificadores (reservados para Ctrl+D, Ctrl+Z, copiar/pegar…),
 * - la tecla se está repitiendo,
 * - el foco está en un campo editable (panel de propiedades, texto inline).
 */
export function shouldIgnoreShortcut(event: ShortcutEvent): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) return true;
  if (event.repeat) return true;
  return isEditableTarget(event.target ?? null);
}
