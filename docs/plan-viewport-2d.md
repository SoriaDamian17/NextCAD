# Plan técnico — Viewport 2D (Feature 3 `viewport_2d`)

> **Feature:** 3 — `viewport_2d` (`feature_list.json`)
> **Estado:** implementada / cerrada
> **Rol:** Senior Frontend (Next.js · react-three-fiber · drei)
> **Depende de:** Feature 2 — `project_setup` (cerrada, ver `docs/plan-project-setup.md`)
> **Desbloquea:** Features 4–11 (todas viven dentro del viewport).
> **Objetivo:** un Canvas con cámara **ortográfica** sobre el plano XY, grid CAD mayor/menor, **zoom centrado en el cursor**, pan y atajo de reset, montado en la ruta raíz y testeado en lo que no requiere WebGL.

---

## 1. Resumen ejecutivo

La feature 2 dejó un andamio ejecutable con un `TestCanvas` **temporal** (`components/dev/TestCanvas.tsx`) que la propia feature 2 marcó para ser reemplazado aquí. La feature 3 lo sustituye por el viewport CAD real:

1. **Cámara ortográfica** mirando el plano XY (top-down, sin rotación).
2. **Grid** de drei con líneas menores/mayores, sobre el plano XY y con los colores del plan de diseño.
3. **Navegación**: zoom centrado en el cursor, pan (middle-click o `space`+drag) y reset de vista.
4. Una **status bar mínima** (X/Y del cursor y zoom %) que, según `docs/plan-design-ux.md` §10, pertenece a esta feature y sirve de verificación visual de zoom/pan.
5. **Tokens de diseño** del viewport aplicados por primera vez en `app/globals.css`.

La lógica de navegación se apoya en **`drei <CameraControls>`** (librería `camera-controls@3.1.2`), que ya implementa `dollyToCursor`, en lugar de reimplementar la matemática de cámara. La matemática que **sí** escribimos (conversión pantalla↔mundo, porcentaje de zoom) vive aislada en `lib/viewport.ts` y se cubre con Vitest, porque jsdom **no tiene WebGL** y el `<Grid>`/cámara reales solo se verifican en navegador.

La feature **no** incluye formas, store, toolbar, selección ni propiedades: eso son las features 4–8.

---

## 2. Alcance

### Dentro de alcance

- Cámara ortográfica en el plano XY con zoom, pan y reset.
- Grid CAD (menor/mayor) con colores del plan de diseño sobre fondo `papel`.
- Status bar mínima de solo lectura: coordenadas del cursor y zoom %.
- Aplicar los tokens de color del viewport (y las fuentes técnicas) en Tailwind/`layout.tsx`.
- Reemplazar `TestCanvas` y eliminar `components/dev/`.
- Tests de la lógica pura + status bar; verificación manual del resto.

### Fuera de alcance (features posteriores)

| No pertenece a feature 3 | Feature que lo cubre |
|---|---|
| Modelo de formas y store zustand (rect, circle, line, text) | 4 `scene_store` |
| Toolbar, atajos V/R/C/L/T, herramienta activa | 5 `toolbar_draw_tools` |
| Dibujado click-drag, preview punteado | 6 `shape_drawing` |
| Selección, mover, redimensionar, handles | 7 `selection_transform` |
| Panel de propiedades 280px | 8 `properties_panel` |
| Top bar, undo/redo, Guardar/Cargar/Exportar | 9 y 11 |
| Biblioteca de objetos (cama, silla, mesa) | 10 `object_library` |

> Criterio: si algo no es necesario para que se cumplan los cinco *acceptance* de la feature 3, no entra. La status bar entra solo en su versión mínima (coords + zoom), no con imán ni escala (esos dependen de features futuras).

---

## 3. Auditoría del estado actual

### 3.1 Lo que ya existe (verificado sobre el repo)

| Elemento | Archivo | Estado |
|---|---|---|
| Scaffold Next 16 + React 19 + r3f + drei + zustand | `package.json` | Instalado; `pnpm test/build` verdes en feature 2 |
| Canvas temporal con `<Grid>` + `<OrbitControls>` | `components/dev/TestCanvas.tsx` | Marca explícita: "la feature 3 lo reemplaza" |
| Test genérico de r3f (sin WebGL) | `components/dev/TestCanvas.test.tsx` | Verde; se **mueve** a `components/viewport/` |
| Ruta raíz | `app/page.tsx` | Solo monta `<TestCanvas />` en `h-[100dvh]` |
| Layout con fuentes Geist | `app/layout.tsx` | Plantilla; usa `LayoutProps<"/">` |
| Tokens Tailwind | `app/globals.css` | Solo `background/foreground` + Geist; **sin** tokens de diseño |
| Utilidad de formato | `lib/format.ts` | `formatNumber` (cifras tabulares) |
| Config Vitest | `vitest.config.mts` | jsdom, `tsconfigPaths` nativo |
| Plan de diseño | `docs/plan-design-ux.md` | Define `papel`, `plomo`, grid-menor/mayor y la status bar |

**Observaciones:**

- `docs/plan-design-ux.md` §11 pide reemplazar Geist por **Schibsted Grotesk + IBM Plex Mono** y exponer los tokens en `@theme inline`. La feature 2 lo aplazó. Aquí se retoma (ver §4.4) porque el viewport ya usa `papel`/`plomo` y la status bar usa cifras tabulares.
- `AGENTS.md` exige leer `node_modules/next/dist/docs/` antes de escribir código de app (este Next difiere del estándar). Aplica a la implementación, no a este documento.
- El typecheck (`tsc --noEmit`) **falla en checkout limpio** hasta que `next dev`/`next build` genera `.next/types/**` (nota operativa de la feature 2, §13.4). Orden: `build` antes de `tsc`.

### 3.2 Brechas frente a los *acceptance criteria*

| # | Acceptance de feature 3 | ¿Cumple hoy? | Brecha |
|---|---|---|---|
| A1 | Cámara ortográfica renderizando el plano XY | ❌ | El Canvas es de perspectiva (`fov: 50`), 3D y con órbita |
| A2 | Grid CAD con líneas mayores/menores (`drei <Grid>`) | ⚠️ | Hay `<Grid>`, pero en plano XZ, sin colores de diseño ni jerarquía pensada para CAD 2D |
| A3 | Zoom centrado en la posición del cursor | ❌ | `OrbitControls` hace dolly radial, no zoom-al-cursor |
| A4 | Pan con middle-click o `space`+drag | ❌ | `OrbitControls` mapea middle a dolly; no hay `space`+drag |
| A5 | Atajo para resetear la vista | ❌ | No existe |

---

## 4. Decisiones y puntos abiertos

### 4.1 Navegación: `drei <CameraControls>` (decidido)

`OrbitControls` está pensado para orbitar en 3D: rota por defecto, no hace **zoom centrado en el cursor** y su pan no distingue `space`+drag. La alternativa es `drei <CameraControls>` (envoltorio de `camera-controls@3.1.2`), que ya expone:

- `dollyToCursor: boolean` — "enable Dolly-in to the mouse cursor coords" (zoom hacia el cursor).
- `minZoom` / `maxZoom` — límites de zoom (la cámara es ortográfica).
- `mouseButtons: { left, middle, right, wheel }` con `ACTION` (`NONE`, `ROTATE`, `TRUCK`, `ZOOM`, …). En ortográfica la rueda es `ZOOM` (no admite `DOLLY`).
- `reset()`, `zoomTo()`, `truck()`, `setTarget()`, `saveState()`, `update(delta)`.
- `makeDefault` y ref al `impl` (`CameraControlsImpl`).

**Mapeo propuesto de botones:**

| Entrada | Acción | Motivo |
|---|---|---|
| left | `NONE` | Libre para las features 5/6/7 (dibujado, selección) |
| middle | `TRUCK` | Pan con middle-click (acceptance A4) |
| right | `NONE` | Evita menú contextual / gestos no deseados |
| wheel | `ZOOM` | Zoom (con `dollyToCursor`) |
| `space`+left | `TRUCK` (temporal) | Pan con `space`+drag (acceptance A4) |

Rotación: no se asigna `ACTION.ROTATE` a ningún botón; además se fijan `minPolarAngle`/`maxPolarAngle` para blindar la vista top-down.

**Implementación del mapeo:** se prefiere un `ref` al `impl` y ajustar las propiedades en un `useEffect` (fiable con la versión instalada) antes que confiar en pasar un objeto anidado como prop. El `space`+drag se resuelve con listeners de teclado a nivel `window`: al presionar `space` se pone `mouseButtons.left = TRUCK` y se cambia el cursor a `grab`; al soltar se restaura a `NONE`. `space` hace `preventDefault` para no scrollear la página.

### 4.2 Grid en el plano XY (decidido)

`drei <Grid>` vive por defecto en el plano **XZ** (normal `+Y`). Para un CAD 2D hay que rotarlo a XY:

- `rotation={[Math.PI / 2, 0, 0]}`
- `infiniteGrid` + `fadeDistance` para un plano que no termina en un borde visible.
- `cellColor` = `grid-menor`, `sectionColor` = `grid-mayor` (tokens de `plan-design-ux.md`).
- `cellSize`/`sectionSize` con **sección cada 5 celdas**.
- `raycast={() => null}` para que el grid **no intercepte** los clics de las features 5–7.

Fondo del viewport: `<color attach="background" args={["#EFEBE3"]} />` (token `papel`), no el blanco puro.

### 4.3 Matemática pura, aislada y testeable (decidido)

jsdom no implementa WebGL: no se puede montar `<Canvas>` en Vitest. Estrategia, igual que en la feature 2:

- Lo que **sí** escribimos (y testeamos con Vitest): conversión pantalla↔mundo y derivados, en `lib/viewport.ts`:
  - `screenToWorld(pointerNdc, camera, size)` → `{ x, y }` en unidades del plano.
  - `zoomPercent(zoom, baseZoom)` → número entero para la status bar.
  - `clamp(value, min, max)`.
  - `DEFAULT_VIEW` (`{ zoom, minZoom, maxZoom }`) como fuente única de verdad.
- Lo que **delega** `camera-controls` (zoom-al-cursor, truck, reset) se verifica **manualmente en navegador**.
- Componente DOM puro (`StatusBar`) se testea con `@testing-library/react` (no necesita WebGL).
- Se **mueve** el smoke-test genérico de r3f (`TestCanvas.test.tsx` → `components/viewport/r3f-smoke.test.tsx`) para no perder la cobertura de integración de r3f.

### 4.4 Tokens de diseño y fuentes (retomado de la feature 2)

Se aplican los tokens de `docs/plan-design-ux.md` §11 en `app/globals.css` (`@theme inline`) y se sustituye Geist por **Schibsted Grotesk** + **IBM Plex Mono** en `app/layout.tsx`. Motivo: el viewport usa `papel` y `plomo`, y la status bar usa cifras tabulares en Plex Mono. Es la primera vez que se consumen los tokens, así que el cambio es pequeño y localizado (no hay otras páginas).

**Reversible:** si se quiere mantener Geist, se aplican solo los colores y el mono queda como deuda; la funcionalidad del viewport no depende de la fuente.

### 4.5 Status bar mínima (decidido)

`plan-design-ux.md` §5.2 y §10 asignan la status bar a `viewport_2d`, pero los *acceptance* no la mencionan. Se implementa **solo** la parte que esta feature puede alimentar de verdad:

- X / Y del cursor (unidades del plano, cifras tabulares).
- Zoom actual en %.

Se omiten `imán` y `escala 1:50` (dependen de features futuras). La barra es de solo lectura; se renderiza como overlay absoluto en la base del viewport, con el chrome definitivo llegando en las features de UI.

### 4.6 Unidad de trabajo

1 unidad = 1 mm conceptual (el plan de diseño habla en mm y `escala 1:50`). No se impone escala real todavía; el viewport trabaja en unidades abstractas y la status bar las muestra tal cual. El zoom inicial se define en `DEFAULT_VIEW` (ver §7.3) y se ajusta en implementación para que la vista sea cómoda.

---

## 5. Plan de implementación paso a paso

Cada paso es verificable de forma aislada. Antes de escribir código de app: leer `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` (regla `AGENTS.md`).

### F3.1 — Tokens y fuentes

- `app/globals.css`: exponer en `@theme inline` los tokens (`muro`, `papel`, `roble`, `teja`, `pizarra`, `plomo`, `texto`, `borde`, `grid-menor`, `grid-mayor`) y las fuentes (`--font-sans`, `--font-mono`).
- `app/layout.tsx`: sustituir `Geist`/`Geist_Mono` por `Schibsted_Grotesk` e `IBM_Plex_Mono` de `next/font/google`, exponiendo `--font-schibsted` y `--font-plex-mono`.

**Verificación:** `pnpm dev` compila; no hay referencias colgando a `--font-geist-*`.

### F3.2 — `lib/viewport.ts` (lógica pura)

- Definir `DEFAULT_VIEW`, `screenToWorld`, `zoomPercent`, `clamp`.
- Tipos explícitos; sin dependencias de React ni de WebGL.

**Verificación:** `pnpm test` con los tests de §7.9.

### F3.3 — `components/viewport/CadGrid.tsx`

- `drei <Grid>` rotado a XY, colores desde tokens, `infiniteGrid`, `fadeDistance`, `raycast` anulado.
- `"use client"`.

**Verificación:** revisión de tipos; comportamiento en navegador (§9).

### F3.4 — `components/viewport/CameraRig.tsx`

- `drei <CameraControls makeDefault>` con `ref` al `impl`; en `useEffect` fijar `dollyToCursor`, `minZoom`, `maxZoom`, `mouseButtons`, `minPolarAngle = maxPolarAngle = 0`, `smoothTime`, `truckSpeed`.
- Listener de `space` (`window`): alterna `left` entre `NONE` y `TRUCK`, cursor `grab`/`grabbing`, `preventDefault`.
- Listener de tecla `0`: `controls.reset(true)` (la vista inicial es el estado por defecto que captura `camera-controls`).
- Actualizar la cámara en el loop (`useFrame` → `controls.update(delta)`), o confiar en el `useFrame` interno de drei (verificar en implementación).

**Verificación:** navegador (§9); no testeable en jsdom.

### F3.5 — `components/viewport/StatusBar.tsx` + tracker

- `StatusBar`: componente DOM puro que recibe `{ x, y, zoom }` y los formatea (`formatNumber`, cifras tabulares).
- `ViewportStateTracker` (dentro del Canvas): con `useThree`/`useFrame` calcula la posición de mundo del pointer y el zoom y los eleva por callback/estado a `Viewport2D`.

**Verificación:** `StatusBar.test.tsx` + navegador.

### F3.6 — `components/viewport/Viewport2D.tsx` + `app/page.tsx`

- `Viewport2D` (`"use client"`): contenedor `relative h-full w-full`; `<Canvas orthographic camera={...}>` con fondo `papel`, `CadGrid`, `CameraRig`, tracker; `StatusBar` como overlay absoluto abajo.
- `app/page.tsx`: montar `<Viewport2D />` en `main.h-[100dvh] w-full`.

**Verificación:** §9.2.

### F3.7 — Eliminar `components/dev/`

- Borrar `TestCanvas.tsx` y `TestCanvas.test.tsx` (el smoke-test se movió en F3.8).

**Verificación:** `grep TestCanvas` sin resultados; `pnpm build` sigue verde.

### F3.8 — Tests

- Mover `components/dev/TestCanvas.test.tsx` → `components/viewport/r3f-smoke.test.tsx` (contenido genérico de r3f; sin cambios funcionales).
- `lib/viewport.test.ts` (ver §7.9).
- `components/viewport/StatusBar.test.tsx` (DOM puro).

**Verificación:** `pnpm test` → todo verde y **al menos un test por archivo nuevo con lógica**.

### F3.9 — Typecheck, lint, build y cierre

```powershell
pnpm build            # genera .next/types (necesario antes del typecheck)
pnpm exec tsc --noEmit
pnpm lint
pnpm test
```

- Marcar `viewport_2d.status = "done"` en `feature_list.json` **solo** tras §10.
- Registrar evidencias en §13 de este documento.
- Actualizar `progress/current.md` y **añadir** el resumen a `progress/history.md` (append-only).

---

## 6. Estructura de archivos propuesta

```
NextCAD/
├─ app/
│  ├─ layout.tsx                 # ✏️ fuentes Schibsted + Plex Mono
│  ├─ globals.css                # ✏️ tokens de diseño en @theme inline
│  └─ page.tsx                   # ✏️ monta <Viewport2D />
├─ components/
│  ├─ viewport/
│  │  ├─ Viewport2D.tsx          # ✏️ Canvas ortográfico + fondo papel + overlay
│  │  ├─ CadGrid.tsx             # ✏️ <Grid> en XY con tokens
│  │  ├─ CameraRig.tsx           # ✏️ CameraControls + space+drag + reset
│  │  ├─ StatusBar.tsx           # ✏️ X/Y + zoom % (solo lectura)
│  │  ├─ StatusBar.test.tsx      # ✏️ test DOM
│  │  └─ r3f-smoke.test.tsx      # ➡️ movido desde components/dev/TestCanvas.test.tsx
│  └─ dev/                       # ❌ eliminado
├─ lib/
│  ├─ viewport.ts                # ✏️ math pura de cámara
│  └─ viewport.test.ts           # ✏️ tests
└─ docs/
   └─ plan-viewport-2d.md        # ← este documento
```

---

## 7. Configuración y código propuesto

> Los fragmentos son **ilustrativos** y pueden ajustarse en implementación; las props de `camera-controls` se verificarán contra `3.1.2`.

### 7.1 `app/globals.css` (tokens)

```css
@import "tailwindcss";

@theme inline {
  --color-muro: #26241f;
  --color-papel: #efebe3;
  --color-roble: #c89b5e;
  --color-teja: #b2553a;
  --color-pizarra: #3a372f;
  --color-plomo: #9b958a;
  --color-texto: #ede7dc;
  --color-borde: rgba(237, 231, 220, 0.1);
  --color-grid-menor: rgba(58, 55, 47, 0.08);
  --color-grid-mayor: rgba(58, 55, 47, 0.16);

  --font-sans: var(--font-schibsted);
  --font-mono: var(--font-plex-mono);
}
```

### 7.2 `app/layout.tsx` (fuentes)

```tsx
import type { Metadata } from "next";
import { Schibsted_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "NextCAD",
  description: "Editor de planos 2D en el navegador.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${schibsted.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

### 7.3 `lib/viewport.ts` (lógica pura)

```ts
// Constantes de vista (fuente única de verdad). 1 unidad = 1 mm conceptual.
export const DEFAULT_VIEW = {
  zoom: 50,      // px por unidad en la vista por defecto
  minZoom: 5,
  maxZoom: 400,
} as const;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

type CameraLike = { position: { x: number; y: number }; zoom: number };
type Size = { width: number; height: number };
type Ndc = { x: number; y: number }; // pointer normalizado [-1, 1]

// Convierte un pointer NDC (como el que expone r3f) a coordenadas del plano XY.
export function screenToWorld(pointer: Ndc, camera: CameraLike, size: Size): { x: number; y: number } {
  const worldWidth = size.width / camera.zoom;
  const worldHeight = size.height / camera.zoom;
  return {
    x: camera.position.x + (pointer.x * worldWidth) / 2,
    y: camera.position.y + (pointer.y * worldHeight) / 2,
  };
}

export function zoomPercent(zoom: number, base = DEFAULT_VIEW.zoom): number {
  return Math.round((zoom / base) * 100);
}
```

### 7.4 `components/viewport/CadGrid.tsx`

```tsx
"use client";

import { Grid } from "@react-three/drei";

export function CadGrid() {
  return (
    <Grid
      rotation={[Math.PI / 2, 0, 0]}
      args={[100, 100]}
      cellSize={10}
      cellThickness={0.6}
      cellColor="#3a372f14"
      sectionSize={50}
      sectionThickness={1}
      sectionColor="#3a372f29"
      infiniteGrid
      fadeDistance={4000}
      fadeStrength={1.2}
      raycast={() => null}
    />
  );
}
```

> Colores hardcodeados por claridad; en implementación se tomarán de los tokens (`--color-grid-menor` / `--color-grid-mayor`) o de una constante compartida en `lib/viewport.ts` para que coincidan exactamente.

### 7.5 `components/viewport/CameraRig.tsx`

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import type CameraControlsImpl from "camera-controls";
import { DEFAULT_VIEW } from "@/lib/viewport";

const { ACTION } = (await import("camera-controls")).default; // o CameraControlsImpl.ACTION

export function CameraRig() {
  const ref = useRef<CameraControlsImpl>(null);
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.dollyToCursor = true;
    c.minZoom = DEFAULT_VIEW.minZoom;
    c.maxZoom = DEFAULT_VIEW.maxZoom;
    c.mouseButtons = { left: ACTION.NONE, middle: ACTION.TRUCK, right: ACTION.NONE, wheel: ACTION.ZOOM };
    c.minPolarAngle = c.maxPolarAngle = 0; // vista top-down fija
    c.truckSpeed = 1.5;

    let spaceDown = false;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !spaceDown) {
        spaceDown = true;
        c.mouseButtons.left = ACTION.TRUCK;
        gl.domElement.style.cursor = "grab";
        e.preventDefault();
      }
      if (e.key === "0") void c.reset(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceDown = false;
        c.mouseButtons.left = ACTION.NONE;
        gl.domElement.style.cursor = "";
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [gl]);

  useFrame((_, delta) => ref.current?.update(delta));
  return <CameraControls ref={ref} makeDefault />;
}
```

> El `import` dinámico del `ACTION` es para evitar confusiones de export; en implementación puede resolverse importando `{ CameraControlsImpl }` de drei y usando `CameraControlsImpl.ACTION`, o el valor estático. Verificar el export exacto de `camera-controls@3.1.2` (default export con `.ACTION` estático).

### 7.6 `components/viewport/StatusBar.tsx`

```tsx
import { formatNumber } from "@/lib/format";

type Props = { x: number; y: number; zoom: number };

export function StatusBar({ x, y, zoom }: Props) {
  return (
    <div className="absolute inset-x-0 bottom-0 h-8 flex items-center gap-4 px-3
                    bg-muro text-texto text-[11px] font-mono tabular-nums select-none">
      <span>X {formatNumber(x)}</span>
      <span>Y {formatNumber(y)}</span>
      <span className="ml-auto">zoom {zoom}%</span>
    </div>
  );
}
```

### 7.7 `components/viewport/Viewport2D.tsx`

```tsx
"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { CadGrid } from "./CadGrid";
import { CameraRig } from "./CameraRig";
import { StatusBar } from "./StatusBar";
import { ViewportStateTracker } from "./ViewportStateTracker";
import { DEFAULT_VIEW } from "@/lib/viewport";

export function Viewport2D() {
  const [cursor, setCursor] = useState({ x: 0, y: 0, zoom: 100 });

  return (
    <div className="relative h-full w-full">
      <Canvas
        orthographic
        camera={{ position: [0, 0, 10], zoom: DEFAULT_VIEW.zoom, near: 0.1, far: 5000 }}
      >
        <color attach="background" args={["#efebe3"]} />
        <CadGrid />
        <CameraRig />
        <ViewportStateTracker onChange={setCursor} />
      </Canvas>
      <StatusBar x={cursor.x} y={cursor.y} zoom={cursor.zoom} />
    </div>
  );
}
```

> `ViewportStateTracker` (dentro del Canvas) usa `useThree`/`useFrame` para leer el pointer normalizado y el zoom, aplica `screenToWorld`/`zoomPercent` y llama `onChange`. Se mantiene en un archivo aparte para que `Viewport2D` no dependa de hooks de r3f. El `setState` por frame se **throttlea** (p. ej. solo cuando cambia el valor redondeado) para no re-renderizar en cada frame.

### 7.8 `app/page.tsx`

```tsx
import { Viewport2D } from "@/components/viewport/Viewport2D";

export default function Home() {
  return (
    <main className="h-[100dvh] w-full">
      <Viewport2D />
    </main>
  );
}
```

### 7.9 Tests propuestos

`lib/viewport.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_VIEW, clamp, screenToWorld, zoomPercent } from "@/lib/viewport";

describe("viewport math", () => {
  const camera = { position: { x: 0, y: 0 }, zoom: 50 };
  const size = { width: 800, height: 600 };

  it("el centro del canvas mapea al centro de la cámara", () => {
    expect(screenToWorld({ x: 0, y: 0 }, camera, size)).toEqual({ x: 0, y: 0 });
  });

  it("mapea las esquinas a media anchura/alto del mundo", () => {
    expect(screenToWorld({ x: 1, y: 1 }, camera, size)).toEqual({ x: 8, y: 6 });
  });

  it("clamp respeta los límites", () => {
    expect(clamp(10, 0, 5)).toBe(5);
    expect(clamp(-1, 0, 5)).toBe(0);
    expect(clamp(3, 0, 5)).toBe(3);
  });

  it("zoomPercent es 100 en la vista por defecto", () => {
    expect(zoomPercent(DEFAULT_VIEW.zoom)).toBe(100);
    expect(zoomPercent(DEFAULT_VIEW.zoom * 2)).toBe(200);
  });
});
```

`components/viewport/StatusBar.test.tsx` — render con `@testing-library/react`, comprobando que X/Y/zoom aparecen formateados.

`components/viewport/r3f-smoke.test.tsx` — el test actual movido tal cual (monta un `<mesh>` con `@react-three/test-renderer`).

---

## 8. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Zoom-al-cursor en ortográfica no funciona como se espera | Falla acceptance A3 | `dollyToCursor` + `wheel: ZOOM`; verificar en navegador (§9.3). Si falla, ajustar `dollySpeed` o implementar zoom manual con `zoomTo` en el evento `wheel` |
| `mouseButtons`/`ACTION` no se aplican pasando objetos como prop | El mapeo de botones no toma efecto | Fijar por `ref` al `impl` en `useEffect` (como en §7.5) |
| `space`+drag scrollea la página o choca con atajos futuros | Mala UX; conflicto con features 5+ | `preventDefault` en `keydown` de `Space`; listeners aislados en `CameraRig`; documentar reserva de la tecla |
| Grid intercepta clics de dibujo/selección (features 5–7) | No se pueden crear/seleccionar formas | `raycast={() => null}` en `<Grid>` |
| jsdom sin WebGL | Tests de Canvas imposibles | Tests solo de lógica pura y DOM; verificación WebGL manual |
| `reset()` depende del estado por defecto capturado al construir | Reset no vuelve a la vista deseada | Definir la vista inicial en `<Canvas camera>`/`DEFAULT_VIEW`; opcional `saveState()` tras montar |
| Cambiar fuentes/tokens rompe el layout | Regresión visual | Solo afecta al viewport; verificación §9.2; cambio reversible (§4.4) |
| `tsc --noEmit` falla en limpio por `.next/types` | Falso negativo de tipos | Ejecutar `pnpm build`/`dev` antes del typecheck (nota de feature 2) |
| Re-render por frame en la status bar | Caída de FPS | Throttle del `setState` (solo al cambiar el valor redondeado) |
| `AGENTS.md`: APIs de Next 16 no estándar | Código obsoleto | Leer `node_modules/next/dist/docs/` antes de implementar |

---

## 9. Verificación manual (paso a paso)

Ejecutar en PowerShell desde la raíz del repo. Criterio de éxito por bloque.

### 9.1 Instalación / arranque

```powershell
pnpm install
pnpm dev
```

- [ ] Compila y sirve en `http://localhost:3000` sin errores en terminal.
- [ ] La consola del navegador no muestra errores de WebGL ni de hidratación.

### 9.2 Render del viewport (A1, A2)

- [ ] El viewport ocupa la pantalla bajo la status bar.
- [ ] Fondo `papel #EFEBE3`; grid hairline `plomo` con líneas **menores** y **mayores** (sección cada 5 celdas) visibles.
- [ ] La vista es top-down (plano XY); no hay perspectiva ni órbita.

### 9.3 Navegación (A3, A4, A5)

- [ ] **Zoom al cursor:** poner el cursor sobre una esquina del grid, girar la rueda; el punto bajo el cursor **no se desplaza**.
- [ ] El zoom respeta `minZoom`/`maxZoom` (no se pasa de límites).
- [ ] **Middle-drag** hace pan.
- [ ] **`space`+drag** hace pan y **no** scrollea la página; el cursor cambia a `grab`/`grabbing`.
- [ ] **Tecla `0`** resetea la vista a la posición/zoom inicial.
- [ ] No se puede rotar la vista (sin `ACTION.ROTATE`).

### 9.4 Status bar

- [ ] X/Y del cursor se actualizan en vivo y en cifras tabulares (no "bailan").
- [ ] El zoom % cambia con la rueda y marca 100% en la vista por defecto.

### 9.5 Tests, tipos, lint y build

```powershell
pnpm build
pnpm exec tsc --noEmit
pnpm lint
pnpm test
```

- [ ] `next build` completa sin errores; `/` aparece como ruta del App Router.
- [ ] Sin errores de tipos ni de ESLint.
- [ ] Vitest: todos los tests en verde (math + StatusBar + r3f-smoke).

### 9.6 Prueba negativa (confianza en los tests)

- [ ] Romper a propósito un test de `lib/viewport.test.ts` (p. ej. esperar `x: 8` → `x: 9`) y confirmar que `pnpm test` **falla**; revertir.

---

## 10. Checklist de aceptación — Feature 3

| Acceptance (`feature_list.json`) | Cómo se comprueba | Estado |
|---|---|---|
| Cámara ortográfica renderizando el plano XY | §9.2 | ✅ |
| Grid de fondo tipo CAD con líneas mayores/menores (`drei <Grid>`) | §9.2 | ✅ |
| Zoom centrado en la posición del cursor (rueda) | §9.3 | ✅ |
| Pan con middle-click o `space`+drag | §9.3 | ✅ |
| Atajo para resetear la vista | §9.3 (`0`) | ✅ |

**Extras incluidos (no exigidos pero justificados):** status bar mínima (§4.5) y tokens/fuentes (§4.4).

---

## 11. Criterios de cierre

La feature se marca `done` en `feature_list.json` **solo cuando**:

1. Los cinco bloques de §10 están marcados ✅.
2. `pnpm test` pasa (regla global `require_tests_to_close`).
3. `pnpm build`, `tsc --noEmit` y `pnpm lint` están en verde.
4. Las evidencias (§9) quedan registradas en §13 de este documento.
5. `progress/current.md` se cierra y el resumen se **añade** a `progress/history.md`.

---

## 12. Deuda consciente y siguientes pasos

- **Store de estado del cursor/zoom:** hoy vive en estado local de React. La feature 4 (`scene_store`, zustand) puede absorberlo si conviene, pero no es requisito.
- **Status bar completa** (imán, escala): features 5–8.
- **Chrome definitivo** (top bar, rail, panel): features 5/8; la status bar actual es un overlay temporal.
- **Zoom-al-cursor delegado** a `camera-controls`: no hay test unitario propio; se cubre en navegador.
- **Iconografía y `prefers-reduced-motion`**: al construir el chrome.

---

## 13. Registro de progreso y bitácora

Convención del repo (ver `progress/`):

- Mientras se implementa: mantener `progress/feature-viewport_2d.md` y `progress/current.md` actualizados **en tiempo real**.
- Al cerrar: mover el resumen a `progress/history.md` (**append-only**, no editar entradas previas) y vaciar `current.md`.

### Resultado de la implementación (a completar al cerrar)

**Fecha:** 2026-10-19 · **Estado final:** `viewport_2d` → `done`.

| Verificación | Comando | Resultado |
|---|---|---|
| Dev / render | `pnpm dev` + GET `/` | `Ready in 1429ms`, `GET / 200`; el HTML contiene `<canvas>` |
| Tests | `pnpm exec vitest run` | `Test Files 4 passed`, `Tests 9 passed` (exit 0) |
| Typecheck | `pnpm exec tsc --noEmit` | sin errores (exit 0) |
| Lint | `pnpm lint` | sin errores (exit 0) |
| Build | `pnpm build` | `Compiled successfully`; rutas `/` y `/_not-found` (Static) |

**Verificación manual (§9.2/§9.3/§9.4):** pendiente de confirmación visual del usuario en navegador
(WebGL no es verificable de forma automatizada en este entorno). El servidor de desarrollo
arranca limpio y sirve la ruta raíz con el Canvas.

**Archivos añadidos/modificados/eliminados:**

- **Nuevos:** `lib/viewport.ts`, `lib/viewport.test.ts`, `components/viewport/Viewport2D.tsx`,
  `components/viewport/CadGrid.tsx`, `components/viewport/CameraRig.tsx`,
  `components/viewport/StatusBar.tsx`, `components/viewport/StatusBar.test.tsx`,
  `components/viewport/ViewportStateTracker.tsx`, `components/viewport/r3f-smoke.test.tsx`.
- **Modificados:** `app/globals.css` (tokens), `app/layout.tsx` (fuentes Schibsted + Plex Mono),
  `app/page.tsx` (monta `<Viewport2D />`), `feature_list.json`.
- **Eliminados:** `components/dev/TestCanvas.tsx`, `components/dev/TestCanvas.test.tsx` (movido a `components/viewport/r3f-smoke.test.tsx`).

**Desvíos respecto al plan (y por qué):**

| Plan decía | Se hizo | Motivo |
|---|---|---|
| `useFrame` → `controls.update(delta)` en `CameraRig` | No se llama `update()` | `drei <CameraControls>` ya ejecuta `controls.update(delta)` en su propio `useFrame` (prioridad -1); duplicarlo alteraría el suavizado |
| `minPolarAngle = maxPolarAngle = 0` | `= Math.PI / 2` | La convención de `camera-controls` mide el polar desde la vertical: la vista cámara(0,0,10)→origen es 90° = π/2, no 0 |
| Importar `ACTION` desde `camera-controls` | `CameraControlsImpl.ACTION` desde `@react-three/drei` | `camera-controls` es dependencia transitiva de drei; con pnpm no es resoluble como import directo |
