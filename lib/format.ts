// Utilidades de formato. Cifras tabulares heredadas del plan de diseño
// (`docs/plan-design-ux.md`): coordenadas y dimensiones no deben "bailar".
export function formatNumber(value: number): string {
  return value.toLocaleString("es-ES", {
    useGrouping: true,
    maximumFractionDigits: 2,
  });
}
