import type { ToolId } from "@/lib/tools";

type IconProps = { id: ToolId; className?: string };

// Set propio de iconos lineales (docs/plan-design-ux.md §9):
// 24×24, trazo 1.5px, remates rectos, sin relleno.
export function ToolIcon({ id, className }: IconProps) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "square" as const,
    strokeLinejoin: "miter" as const,
    "aria-hidden": true,
    focusable: false,
  };

  switch (id) {
    case "select":
      return (
        <svg {...common} className={className}>
          <path d="M5 3l14 8-6 1.5L10.5 19z" />
        </svg>
      );
    case "rect":
      return (
        <svg {...common} className={className}>
          <rect x="4" y="6" width="16" height="12" />
        </svg>
      );
    case "circle":
      return (
        <svg {...common} className={className}>
          <circle cx="12" cy="12" r="7" />
        </svg>
      );
    case "line":
      return (
        <svg {...common} className={className}>
          <path d="M5 19L19 5" />
        </svg>
      );
    case "text":
      return (
        <svg {...common} className={className}>
          <path d="M6 6h12M12 6v13M9 19h6" />
        </svg>
      );
  }
}
