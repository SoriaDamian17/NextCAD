# Plan técnico — Scaffold del proyecto (Feature 2 `project_setup`)

> **Feature:** 2 — `project_setup` (`feature_list.json`)
> **Estado:** propuesto / pendiente de aprobación
> **Rol:** Senior Frontend (Next.js · react-three-fiber · drei)
> **Depende de:** Feature 1 — `ui_reference_analysis` (cerrada, ver `docs/plan-design-ux.md`)
> **Desbloquea:** Feature 3 — `viewport_2d`, y todo el resto de features de escena/UI.
> **Objetivo:** dejar una base ejecutable (dev, tests, build) con Next.js + react-three-fiber + drei + zustand + Tailwind + Vitest, sin implementar todavía lógica de dibujo.

---

## 1. Resumen ejecutivo

El repositorio **ya tiene un scaffold parcial**: Next.js 16 (App Router + TypeScript) y Tailwind v4 están instalados y configurados. Lo que falta para cerrar la feature 2 es exclusivamente la **capa 3D y la capa de tests**:

1. Dependencias de runtime 3D/estado: `three`, `@react-three/fiber`, `@react-three/drei`, `zustand`.
2. Entorno de tests: `vitest` + `jsdom` + *React Testing Library* + `@react-three/test-renderer`.
3. Un **Canvas de prueba** en la ruta raíz que confirme que r3f + drei funcionan en el navegador.
4. Un **test de ejemplo** que pase con `pnpm test`.
5. Un **script `test`** y la verificación de que `pnpm build` cierra sin errores.

Además hay una **decisión pendiente** que conviene resolver antes de tocar nada: los *acceptance criteria* dicen `pnpm dev` / `pnpm test`, pero el repo está inicializado con **npm** (`package-lock.json`). Ver §4.1.

La feature **no** incluye el modelo de formas, el store real, el viewport CAD ni la UI final: eso son las features 3–11. Aquí solo se levanta el andamio.

---

## 2. Alcance

### Dentro de alcance

- Instalar y fijar versiones de las dependencias de runtime y de test.
- Configurar Vitest (entorno jsdom, plugins de React y de aliases, setup file).
- Reemplazar la página plantilla por un **Canvas de prueba** mínimo (caja + grid + orbit controls).
- Añadir un **test de ejemplo** + script `test`.
- Verificar `dev` / `test` / `build` / `lint`.

### Fuera de alcance (features posteriores)

| No pertenece a feature 2 | Feature que lo cubre |
|---|---|
| Cámara ortográfica, zoom/pan estilo CAD, grid definitivo | 3 `viewport_2d` |
| Tipos y store real de formas (rect, circle, line, text) | 4 `scene_store` |
| Toolbar, atajos, dibujado, selección, propiedades | 5–8 |
| Aplicar los tokens de diseño / fuentes Schibsted + Plex Mono | Se hará al construir la UI (ver §4.5) |
| Persistencia y export PNG | 11 `project_persistence` |

> Criterio: si algo no es necesario para que `dev`/`test`/`build` funcionen, no entra en esta feature. Se evita "scaffoldear de más" y así el cierre de la feature es verificable.

---

## 3. Auditoría del estado actual

### 3.1 Lo que ya existe (verificado sobre el repo)

| Elemento | Archivo | Estado |
|---|---|---|
| Next.js `16.4.2` (App Router) | `package.json` | Instalado en manifiesto (sin `node_modules`) |
| React / React-DOM `19.3.0` | `package.json` | Correcto para r3f v9 |
| TypeScript `^5` (strict, paths `@/*`) | `tsconfig.json` | Correcto |
| Tailwind v4 (`@tailwindcss/turbopack`) | `globals.css`, `next.config.ts` | Configurado |
| Config Next con Turbopack + experimental | `next.config.ts` | `cacheComponents`, `partialPrefetching`, `turbopack.rules` |
| App shell (layout con fuentes Geist) | `app/layout.tsx` | Plantilla por defecto |
| Página plantilla | `app/page.tsx` | Plantilla de `create-next-app` (a reemplazar) |
| ESLint (flat config + next) | `eslint.config.mjs` | Correcto |
| Regla de agentes (leer docs de Next 16) | `AGENTS.md` | A respetar en la implementación |

**Observaciones relevantes:**

- **`node_modules` no existe todavía.** Hay que ejecutar `install` antes de cualquier verificación. Instalar es, de hecho, el primer paso del plan.
- `AGENTS.md` advierte que **este Next.js no es el "conocido"**: hay que leer `node_modules/next/dist/docs/` *después de instalar* antes de escribir código de app. No aplica a este documento (plan), sí a la implementación.
- `next.config.ts` activa features experimentales (`cacheComponents`, `partialPrefetching`). No se tocan salvo que rompan `build`.
- `.gitignore` ya ignora `/coverage`, `/node_modules`, `.next`, y `.claude`. La carpeta `docs/` **sí** se versiona.

### 3.2 Brechas frente a los *acceptance criteria*

| # | Acceptance de feature 2 | ¿Cumple hoy? | Brecha |
|---|---|---|---|
| A1 | `pnpm dev` arranca sin errores y la ruta raíz renderiza | ❌ | Sin `node_modules`; script gestionado por npm; página es plantilla |
| A2 | r3f y drei instalados y verificados con un Canvas de prueba | ❌ | No están instalados; no hay Canvas |
| A3 | Vitest configurado y `pnpm test` pasa con un test de ejemplo | ❌ | No hay Vitest, ni config, ni script `test` |
| A4 | `pnpm build` completa sin errores | ⚠️ | Probablemente sí con la plantilla, pero debe re-verificarse con el Canvas |

zustand, aunque está en la descripción de la feature, **no tiene criterio de aceptación propio**; se instala aquí porque la feature 4 (`scene_store`) lo necesita. Su verificación real llega en la feature 4.

---

## 4. Decisiones y puntos abiertos

### 4.1 Gestor de paquetes: npm vs pnpm — **decidir**

Los acceptance criteria nombran **pnpm**, pero el repo trae `package-lock.json` (npm). Mantener ambos lockfiles es un anti-patrón.

| Opción | Pros | Contras |
|---|---|---|
| **A. Migrar a pnpm (recomendada)** | Coincide con los acceptance; pnpm `10.34.5` ya está instalado; lockfile reproducible; ahorra disco (store global) | Hay que borrar `package-lock.json`, añadir `packageManager` y `pnpm-lock.yaml` |
| B. Quedarse en npm | Cero cambios de tooling | Incumple literalmente los acceptance criteria (`pnpm dev`) |
| C. Soportar ambos | — | Ruido, deriva de versiones; desaconsejado |

**Recomendación:** Opción A. Migración limpia con `pnpm import` (convierte el `package-lock.json` a `pnpm-lock.yaml`) antes de borrar el lockfile de npm. Se añade el campo `packageManager` para fijar la versión vía Corepack (disponible: `corepack@0.31.0`).

### 4.2 Matriz de dependencias y versiones

Versiones consultadas en el registry de npm (verificar de nuevo en el momento de instalar; se instala con rangos `^`).

**Runtime**

| Paquete | Versión objetivo | Notas de compatibilidad |
|---|---|---|
| `three` | `^0.186` | — |
| `@react-three/fiber` | `^9.8` | peer: `react >=19 <19.4`, `three >=0.156` → ok con React 19.3 |
| `@react-three/drei` | `^10.7` | peer: `react ^19`, `@react-three/fiber ^9`, `three >=0.159` |
| `zustand` | `^5.0` | peer React `>=18` → ok (sin uso aún) |

**Desarrollo / test**

| Paquete | Versión objetivo | Notas |
|---|---|---|
| `vitest` | `^5` | peer vite `^6.4 \|\| ^7 \|\| ^8` |
| `vite` | `^8` | Requerido por `@vitejs/plugin-react` v6 y aceptado por vitest v5 |
| `@vitejs/plugin-react` | `^6` | peer `vite ^8` |
| `vite-tsconfig-paths` | `^6` | Para resolver el alias `@/*` en tests |
| `jsdom` | `^30` | Entorno DOM |
| `@react-three/test-renderer` | `^9` | Render de r3f sin WebGL (peer React ^19, r3f >=9) |
| `@testing-library/react` | `^16` | Se deja listo para las features de UI |
| `@testing-library/jest-dom` | `^7` | Matchers DOM |
| `@types/three` | `^0.186` | Comprobar si `three` ya expone tipos; si no, es obligatorio |

> ⚠️ `vitest@5` declara peer `@types/node ^22 || >=24`; el repo tiene `@types/node ^20` y Node `20.19.0`. **Mitigación:** subir `@types/node` a `^22` en dev (solo tipos). Si aparece un warning de peer, documentarlo y no bloquear.

### 4.3 Estrategia de test para react-three-fiber — **decisión técnica**

`jsdom` **no implementa WebGL**, así que montar un `<Canvas>` real en Vitest falla al no obtener contexto. Estrategia:

- **Tests automatizados (Vitest):** usar `@react-three/test-renderer` para montar escenas r3f sin WebGL (valida que r3f está correctamente integrado). Los componentes drei que dependen de shaders/WebGL (p. ej. `<Grid>`) se cubren **manualmente en el navegador**.
- **Verificación de drei (acceptance A2):** se hace sobre el **Canvas de prueba en la ruta raíz** (browser real con WebGL), no en Vitest.
- **No** se instala `gl`/headless-gl ni `@vitest/browser` en esta feature: coste alto, beneficio nulo para un scaffold.

### 4.4 Vitest vs Turbopack / Next 16 — **decisión técnica**

Vitest **no** reutiliza `next.config.ts` ni el pipeline de Turbopack: tiene su propia configuración (`vitest.config.ts`). Implicaciones:

- No se duplica la config de Next; se declaran en Vitest solo los plugins necesarios (`@vitejs/plugin-react`, `vite-tsconfig-paths`).
- Tailwind v4 en tests: los tests **no** importan `globals.css`, y Vitest ignora CSS por defecto. Si en el futuro se testean componentes con clases Tailwind, se añadirá `@tailwindcss/vite`. Fuera de alcance ahora.
- El alias `@/*` se resuelve vía `vite-tsconfig-paths` para no repetir el mapa de paths.

### 4.5 Tokens de diseño y fuentes — **aplazado a propósito**

`docs/plan-design-ux.md` §11 pide reemplazar Geist por Schibsted Grotesk + IBM Plex Mono y exponer los tokens en `@theme inline`. **No** es parte de los acceptance de feature 2 y las features de UI aún no existen. Se aplicará cuando se construya el chrome (features 5/8) para no introducir cambios no verificables ahora. Se deja anotado como deuda consciente.

---

## 5. Plan de implementación paso a paso

Cada paso es verificable de forma aislada.

### F2.1 — Decidir y fijar el gestor de paquetes (bloqueante)

```powershell
# 1) Convertir el lockfile de npm a pnpm
pnpm import
# 2) Añadir "packageManager": "pnpm@10.34.5" a package.json (edición manual)
# 3) Eliminar el lockfile de npm
Remove-Item package-lock.json
# 4) Instalar
pnpm install
```

**Verificación:** se genera `pnpm-lock.yaml`; `pnpm install` termina sin errores; ya no existe `package-lock.json`.

### F2.2 — Instalar dependencias de runtime

```powershell
pnpm add three @react-three/fiber @react-three/drei zustand
```

**Verificación:** `pnpm why @react-three/fiber` muestra React 19.3 en el árbol de peers sin conflictos.

### F2.3 — Instalar dependencias de test y crear la config de Vitest

```powershell
pnpm add -D vitest vite @vitejs/plugin-react vite-tsconfig-paths jsdom `
  @testing-library/react @testing-library/jest-dom @react-three/test-renderer `
  @types/three
```

Crear `vitest.config.ts` y `vitest.setup.ts` (ver §7). Añadir el script `test`.

**Verificación:** `pnpm vitest --version` responde; `pnpm test` arranca (fallará hasta el paso F2.5, es esperado).

### F2.4 — Canvas de prueba en la ruta raíz

- Crear `components/dev/TestCanvas.tsx` (`"use client"`): `<Canvas>` con luz, un `<mesh>` con `boxGeometry` + `meshStandardMaterial`, un `<Grid>` de drei y `<OrbitControls>`.
- Reemplazar `app/page.tsx` por un contenedor a pantalla completa que monte `<TestCanvas />`.
- Marcar el componente como **temporal** (comentario + nombre `Test/Dev`) para que la feature 3 lo sustituya por el viewport real.

**Verificación:** §9 (manual, navegador).

### F2.5 — Test de ejemplo

- `components/dev/TestCanvas.test.tsx` con `@react-three/test-renderer`: montar una escena mínima (mesh + material) y afirmar que el grafo tiene 1 hijo de tipo `Mesh`.
- (Opcional) `lib/format.test.ts`: test unitario puro (p. ej. formateo de número tabular) para demostrar que la ruta "unit sin DOM" también funciona.

**Verificación:** `pnpm test` → todos los tests pasan.

### F2.6 — Typecheck, lint y build

```powershell
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

**Verificación:** los tres terminan en verde; el build reporta la ruta `/` como página del App Router.

### F2.7 — Cierre de la feature

- Actualizar `feature_list.json`: `project_setup.status = "done"` (solo tras pasar §10).
- (Opcional, si se sigue la convención del repo) rama `feature/NC-002` y commit.
- Adjuntar evidencias (salidas de `dev`/`test`/`build`) al cierre.

---

## 6. Estructura de archivos propuesta

```
NextCAD/
├─ app/
│  ├─ layout.tsx              # sin cambios en esta feature
│  ├─ globals.css             # sin cambios en esta feature
│  └─ page.tsx                # ✏️ reemplazada: monta <TestCanvas />
├─ components/
│  └─ dev/
│     ├─ TestCanvas.tsx       # ✏️ Canvas temporal de verificación (r3f + drei)
│     └─ TestCanvas.test.tsx  # ✏️ test de ejemplo con test-renderer
├─ lib/
│  └─ format.test.ts          # ✏️ (opcional) test unitario puro
├─ vitest.config.ts           # ✏️ config de Vitest
├─ vitest.setup.ts            # ✏️ setup (jest-dom, cleanup)
├─ package.json               # ✏️ scripts + deps + packageManager
├─ pnpm-lock.yaml             # ✏️ nuevo lockfile
└─ docs/
   └─ plan-project-setup.md   # ← este documento
```

---

## 7. Configuración propuesta

### 7.1 `package.json` (fragmentos)

```jsonc
{
  "name": "nextcad",
  "packageManager": "pnpm@10.34.5",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  }
}
```

### 7.2 `vitest.config.ts`

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e"],
  },
});
```

### 7.3 `vitest.setup.ts`

```ts
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
```

> Se importan `describe/it/expect` explícitamente desde `vitest` (sin `globals: true`) para no tener que ampliar `types` en `tsconfig.json` y no interferir con los tipos globales que genera Next 16.

### 7.4 `components/dev/TestCanvas.tsx` (temporal)

```tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";

// TEMPORAL: Canvas de verificación del scaffold (feature 2).
// La feature 3 (viewport_2d) lo reemplaza por el viewport CAD real.
export function TestCanvas() {
  return (
    <Canvas camera={{ position: [4, 4, 4], fov: 50 }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <Grid
        args={[20, 20]}
        cellSize={0.5}
        cellThickness={0.6}
        sectionSize={2.5}
        sectionThickness={1}
        infiniteGrid
        fadeDistance={30}
      />
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#c89b5e" />
      </mesh>
      <OrbitControls makeDefault />
    </Canvas>
  );
}
```

### 7.5 `app/page.tsx` (reemplazo)

```tsx
import { TestCanvas } from "@/components/dev/TestCanvas";

export default function Home() {
  return (
    <main className="h-[100dvh] w-full">
      <TestCanvas />
    </main>
  );
}
```

> El `Canvas` de r3f necesita un contenedor con altura explícita; `h-[100dvh]` evita el clásico canvas de 0px. Se revisará el layout definitivo en la feature 3.

### 7.6 `components/dev/TestCanvas.test.tsx` (test de ejemplo)

```tsx
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
```

---

## 8. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Conflicto de peers con React 19.3 | `pnpm install` con warnings o fallo | Fijar `@react-three/fiber ^9` / `drei ^10` (compatibles React 19); verificar con `pnpm why`; `strict-peer-dependencies=false` solo si es imprescindible |
| `@types/node ^20` vs peer de Vitest 5 (`^22`) | Warning de peer | Subir `@types/node` a `^22` (solo dev); documentar si se ignora |
| WebGL ausente en jsdom | Tests de `<Canvas>` fallan | Usar `@react-three/test-renderer` en tests; verificar drei en navegador (§4.3) |
| Canvas sin altura → nada visible | A1/A2 fallan visualmente | Contenedor con `h-[100dvh]` (§7.5) |
| Divergencia Vitest/Turbopack | Scripts contradictorios | Config de Vitest propia y aislada; no tocar `next.config.ts` (§4.4) |
| Features experimentales de Next 16 (`cacheComponents`, `partialPrefetching`) | Posibles errores de `build` no relacionados con esta feature | No modificarlas salvo fallo; aislar el problema antes de desactivar |
| `AGENTS.md` exige leer docs de Next 16 | Código con APIs obsoletas | Antes de implementar, leer `node_modules/next/dist/docs/` (tras `pnpm install`) |
| Migración npm→pnpm a medias | Dos lockfiles / deriva de versiones | `pnpm import` + borrar `package-lock.json` en el mismo paso (F2.1) |

---

## 9. Verificación manual (paso a paso)

Ejecutar en PowerShell desde la raíz del repo. Criterio de éxito por comando.

### 9.1 Instalación

```powershell
pnpm install
```
- [ ] Termina sin errores. Warnings de peer, si los hay, quedan documentados.
- [ ] Existe `pnpm-lock.yaml`; **no** existe `package-lock.json`.

### 9.2 Desarrollo

```powershell
pnpm dev
```
- [ ] Compila y sirve en `http://localhost:3000` **sin errores** en la terminal.
- [ ] Abrir la URL: la **ruta raíz renderiza** y se ve el **Canvas** (caja color `roble #C89B5E`).
- [ ] Se ve el **grid** de drei y al arrastrar con el mouse la **cámara orbita** (confirma drei). ← acceptance A2
- [ ] La consola del navegador **no** muestra errores de WebGL ni de hidratación.

### 9.3 Tests

```powershell
pnpm test
```
- [ ] Vitest arranca, encuentra `TestCanvas.test.tsx` y reporta **todos los tests en verde** (`Test Files 1 passed`, `Tests 1 passed`). ← acceptance A3
- [ ] `pnpm test:watch` funciona (opcional).

### 9.4 Typecheck y lint

```powershell
pnpm exec tsc --noEmit
pnpm lint
```
- [ ] Sin errores de tipos.
- [ ] Sin errores de ESLint.

### 9.5 Build

```powershell
pnpm build
```
- [ ] `next build` **completa sin errores**. ← acceptance A4
- [ ] La tabla de rutas lista `/` como ruta del App Router.
- [ ] (Opcional) `pnpm start` sirve el build y la ruta raíz vuelve a mostrar el Canvas.

### 9.6 Prueba negativa (confianza en los tests)

- [ ] Romper intencionalmente el test (p. ej. cambiar el `type` esperado a `"Circle"`) y confirmar que `pnpm test` **falla**; revertir.

---

## 10. Checklist de aceptación — Feature 2

| Acceptance (`feature_list.json`) | Cómo se comprueba | Estado |
|---|---|---|
| `pnpm dev` arranca sin errores y la ruta raíz renderiza | §9.2 | ✅ |
| r3f y drei instalados y verificados con un Canvas de prueba | §9.2 (Canvas + OrbitControls + Grid) | ✅ |
| Vitest configurado y `pnpm test` pasa con un test de ejemplo | §9.3 | ✅ |
| `pnpm build` completa sin errores | §9.5 | ✅ |

**Extras incluidos por descripción de la feature:** `zustand` instalado (§5 F2.2) — su verificación funcional llega en `scene_store` (feature 4).

---

## 11. Criterios de cierre

La feature se marca `done` en `feature_list.json` **solo cuando**:

1. Los cuatro bloques de §10 pasan en una máquina limpia (`pnpm install` desde cero).
2. `pnpm test` (requisito global `require_tests_to_close`) pasa.
3. Se registraron las evidencias (salidas de `dev`, `test`, `build`) en el PR o en este documento.

---

## 12. Deuda consciente y siguientes pasos

- **Fuentes y tokens de diseño** (`docs/plan-design-ux.md` §11): pendientes para las features de UI (5/8), no para la 2.
- **Reemplazo del `TestCanvas`** por el viewport CAD ortográfico: feature 3 `viewport_2d`.
- **`@tailwindcss/vite`**: solo si más adelante se testean componentes con estilos Tailwind.
- **Node 20.19**: vigilar si Next 16 o alguna dependencia exige Node ≥ 22 en el futuro.

---

## 13. Resultado de la implementación (ejecutado)

**Fecha:** 2026-10-19 · **Estado final:** `project_setup` → `done`.

### 13.1 Evidencias

| Verificación | Comando | Resultado |
|---|---|---|
| Dev arranca y la raíz responde | `pnpm dev` + GET `/` | `Ready in 1581ms`, `GET / 200` |
| Tests | `pnpm test` | `Test Files 2 passed`, `Tests 3 passed` |
| Typecheck | `pnpm exec tsc --noEmit` | sin errores |
| Lint | `pnpm lint` | sin errores |
| Build | `pnpm build` | `Compiled successfully`; rutas `/` y `/_not-found` (Static) |

### 13.2 Gestor de paquetes

Se adoptó **pnpm** (§4.1, opción A): `pnpm import` generó `pnpm-lock.yaml`, se eliminó `package-lock.json` y se añadió `"packageManager": "pnpm@10.34.5"`.

### 13.3 Desvíos respecto al plan (y por qué)

| Plan decía | Se hizo | Motivo |
|---|---|---|
| `jsdom ^30` | `jsdom ^29.1.1` | `jsdom@30` arrastra `undici@8`, que exige Node ≥ 22; el entorno tiene Node `20.19.0`. `jsdom@29` declara Node `^20.19.0` y usa `undici@7`. |
| `vite-tsconfig-paths` | `resolve.tsconfigPaths: true` (nativo, Vite 8) | El plugin está deprecado en Vite 8: la resolución de paths de tsconfig es nativa. Se eliminó la dependencia. |
| `vitest.config.ts` | `vitest.config.mts` | Evita el aviso del *config loader* de Vite sobre ESM en archivo cargado como CommonJS. |
| `@types/node ^20` | `@types/node ^22` | Peer de `vitest@5`. Solo afecta a tipos en dev; el runtime sigue en Node 20.19. |

### 13.4 Nota operativa (Next 16)

En un checkout limpio, `pnpm exec tsc --noEmit` **falla** con `Cannot find name 'LayoutProps'` hasta que un `next dev` o `next build` genera `.next/types/**`. Ejecutar `build` (o `dev`) antes del typecheck en CI. Reportado como feedback a Next.js durante esta sesión (§ revisión del usuario).

### 13.5 Archivos añadidos/modificados

- **Nuevos:** `vitest.config.mts`, `vitest.setup.ts`, `components/dev/TestCanvas.tsx`, `components/dev/TestCanvas.test.tsx`, `lib/format.ts`, `lib/format.test.ts`, `pnpm-lock.yaml`.
- **Modificados:** `package.json`, `app/page.tsx`, `feature_list.json`, `AGENTS.md` (bloque de feedback reescrito por `next dev`).
- **Eliminados:** `package-lock.json`, `vitest.config.ts` (renombrado a `.mts`).
