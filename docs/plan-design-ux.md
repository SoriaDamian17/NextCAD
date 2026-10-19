# Plan de diseño y UX — NextCAD (MVP 2D)

> **Feature:** 1 — `ui_reference_analysis`
> **Estado:** cerrada
> **Referencia visual:** `.claude/plano-2d-resources-3d.PNG`
> **Alcance:** definir la identidad visual y la estructura de UI del MVP 2D para orientar `toolbar_draw_tools`, `properties_panel` y el resto de las features de interfaz.

---

## 1. Objetivo y alcance

El MVP es una herramienta de dibujo de planos 2D en el navegador (tipo AutoCAD) construida sobre Next.js 16 + react-three-fiber + drei. El render 3D del departamento de la imagen es la **visión objetivo** del producto, no el alcance de esta versión. Por eso la UI del MVP toma de esa imagen su paleta, su materialidad y su clima, para que la transición a 3D se sienta como una evolución y no como un producto distinto.

Este documento define:

1. Qué se extrae de la imagen de referencia.
2. Los tokens de diseño (color, tipografía, espaciado, geometría).
3. El layout de la aplicación y el rol de cada zona.
4. Los estados e interacciones principales.
5. La voz de la interfaz y los criterios de accesibilidad.
6. La auto-crítica contra los defaults de diseño generado.

---

## 2. Lectura de la imagen de referencia

La imagen es un render isométrico "dollhouse" de un departamento: muros de carbón cálido, parquet espiga de roble, muebles crema y una terraza de piso teja que concentra todo el color saturado.

| Elemento | En la imagen | Traducción a UI |
|---|---|---|
| **Muros** | Negro carbón cálido, gruesos, definen cada espacio | **Chrome de la app**: paneles y barras en carbón oscuro |
| **Parquet espiga** | Roble miel con degradado suave, textura cálida | **Canvas**: fondo papel cálido donde se dibuja |
| **Muebles** | Off-white/crema, formas limpias, sombras suaves | Texto principal y superficies elevadas |
| **Terraza** | Rojo teja/óxido, único punto saturado | **Color de selección** — el único acento cálido fuerte |
| **Baño** | Gris pizarra neutro | Secundarios, hairlines, grid |
| **General** | Cero ruido, precisión, orden, luz difusa | UI densa, sin decoración sin función |

**Lectura de conjunto:** el render no decora, **estructura**. Los muros (oscuro) sostienen la vida interior (cálido). Ese contraste es la idea rectora de la interfaz.

---

## 3. Concepto de interfaz

> **El chrome es el muro, el canvas es el suelo.**

La app enmarca el plano con una estructura oscura y precisa, igual que los muros enmarcan el interior del departamento. El área de trabajo es cálida, luminosa y silenciosa; el color saturado se reserva exclusivamente para señalar selección. No es una paleta elegida de catálogo: está extraída del brief visual, píxel por píxel.

---

## 4. Tokens de diseño

### 4.1 Color

| Token | Hex | Origen | Uso |
|---|---|---|---|
| `muro` | `#26241F` | Muros del render | Fondo del chrome (barras, rail, panel) |
| `papel` | `#EFEBE3` | Parquet iluminado | Fondo del viewport 2D (sustituye al blanco puro, menos fatiga) |
| `roble` | `#C89B5E` | Roble miel | Hover, herramienta activa, handles, líneas de cota |
| `teja` | `#B2553A` | Piso de terraza | **Selección** — único acento saturado, usado con avaricia |
| `pizarra` | `#3A372F` | Sombra de muro | Inputs y paneles elevados sobre `muro` |
| `plomo` | `#9B958A` | Contrapiso gris | Texto secundario, hairlines, grid |

Tokens derivados:

| Token | Valor | Uso |
|---|---|---|
| `texto` | `#EDE7DC` | Texto principal sobre chrome |
| `texto-tenue` | `#9B958A` | Texto secundario sobre chrome |
| `foco` | `#C89B5E` | Anillo de foco de teclado (contraste AA sobre `muro`) |
| `borde` | `rgba(237, 231, 220, 0.10)` | Hairlines de separación |
| `grid-menor` | `rgba(58, 55, 47, 0.08)` | Grid de fondo del viewport |
| `grid-mayor` | `rgba(58, 55, 47, 0.16)` | Grid mayor cada 5 unidades |

**Regla de color:** `teja` significa *seleccionado*, siempre y en todo el producto. `roble` significa *activo/Hover*. Ningún otro elemento usa acentos saturados.

### 4.2 Tipografía

- **UI: Schibsted Grotesk** (400 / 500 / 600). Grotesca escandinava, precisa, con personalidad en los terminales; no es Inter ni un clon de Inter. Fallback: `Familjen Grotesk`, luego `system-ui`.
- **Números: IBM Plex Mono** (400 / 500). Herencia de ingeniería; coordenadas, dimensiones y zoom con cifras tabulares (`font-variant-numeric: tabular-nums`) para que no bailen al actualizar.

Escala densa, propia de una herramienta:

| Rol | Tamaño | Interlineado | Peso |
|---|---|---|---|
| Micro (status bar, unidades) | 11px | 1.2 | 400/500 |
| Label de campo | 12px | 1.2 | 500 |
| Default / cuerpo | 13px | 1.45 | 400 |
| Título de panel | 15px | 1.25 | 600 |
| Empty state | 20px | 1.3 | 500 |

- Mayúsculas con tracking **solo** donde el dibujo técnico lo exige (lectura de unidades en la status bar). Nunca como etiqueta genérica de sección.
- Sin tratamientos de acento arbitrarios en titulares (una palabra en itálica/color distinto) fuera de los estados funcionales.

### 4.3 Espaciado y geometría

- Base de **4px**. Gutter estándar 8/12/16px.
- Rail de herramientas: **48px**.
- Top bar: **56px**.
- Panel de propiedades: **280px** (colapsable).
- Status bar: **32px**.
- Radios: **0** en paneles estructurales (precisión de dibujo), **4px** en botones e inputs, **6px** en menús flotantes.
- Separación por **hairline de 1px**, no por sombras difusas.
- Sombras: solo en superficies flotantes (menús, popovers): `0 8px 24px rgba(0, 0, 0, 0.24)`.

---

## 5. Layout

### 5.1 Wireframe

```
┌──────────────────────────────────────────────────────────────────────┐
│ NextCAD · plano-dpto-01      ↶ deshacer  ↷ rehacer   [Guardar][PNG]  │ 56px
├────┬─────────────────────────────────────────────────┬───────────────┤
│ ↖  │                                                 │ Posición      │
│ ▭  │                                                 │   X  1200 mm  │
│ ○  │           viewport 2D  (papel + grid)           │   Y   840 mm  │
│ ／ │                                                 │ Tamaño        │
│ T  │      formas dibujadas, preview punteado         │   An  600 mm  │
│ ⌗  │      en teja; handles en roble                  │   Al  400 mm  │
│    │                                                 │ Estilo        │
│    │                                                 │   Trazo  ■    │
├────┴─────────────────────────────────────────────────┴───────────────┤
│  X 1200  Y 840    zoom 100%    imán ▣    escala 1:50                 │ 32px
└──────────────────────────────────────────────────────────────────────┘
   rail 48px                                    panel 280px
```

### 5.2 Zonas

| Zona | Contenido | Feature responsable |
|---|---|---|
| **Top bar** (56px) | Nombre del proyecto, deshacer/reehacer, Guardar, Cargar, Exportar PNG | `edit_operations`, `project_persistence` |
| **Rail izquierdo** (48px) | Select, Rectángulo, Círculo, Línea, Texto, Biblioteca de objetos | `toolbar_draw_tools`, `object_library` |
| **Viewport** (flex) | Canvas 2D sobre `papel` con grid hairline | `viewport_2d`, `shape_drawing`, `selection_transform` |
| **Panel derecho** (280px) | Propiedades de la selección: posición, tamaño, estilo | `properties_panel` |
| **Status bar** (32px) | Coordenadas del cursor, zoom, toggle de imán, escala | `viewport_2d` |

**Alineación:** todo el contenido es de alineación izquierda. Los valores numéricos del panel se alinean a la derecha dentro de su campo (tabular) para comparar magnitudes de un vistazo.

---

## 6. Estados e interacción

| Estado | Tratamiento |
|---|---|
| Herramienta activa | Tick de dibujo en `roble` junto al icono + icono en `texto`; las inactivas en `texto-tenue`. Sin píldora rellena. |
| Hover sobre herramienta | Fondo `pizarra`, icono en `texto`; transición 80ms. |
| Preview de dibujo | Línea/contorno punteado `teja`, sin relleno. |
| Forma seleccionada | Contorno `teja` 1.5px + 8 handles cuadrados `roble` de 6px. |
| Selección múltiple | Contorno punteado `teja` envolvente + handles en las esquinas del bounding box. |
| Panel sin selección | Empty state con instrucción ("Selecciona una forma para editarla" / "Elige una herramienta y arrastra en el plano"). No un panel gris muerto. |
| Campo numérico editado | Actualización en vivo del canvas; commit con Enter/blur, cancelar con Escape. |
| Focus de teclado | Anillo `roble` de 2px con offset de 2px, siempre visible. |
| Guardado | Micro-feedback en la top bar ("Guardado"), sin toast intrusivo. |
| Motion | Solo respuesta a acciones. Colapso de panel 160ms ease-out. Sin animaciones de entrada ni efectos de hover decorativos. `prefers-reduced-motion: reduce` desactiva transiciones no esenciales. |

**Cursor:** crosshair en herramientas de dibujo; default en Select; `grab`/`grabbing` durante el pan; `nwse-resize`/`nesw-resize` sobre handles.

---

## 7. Voz y copy

- **Idioma:** español, sentence case, verbos directos.
- **Acciones nombran el resultado:** "Guardar", "Exportar PNG", "Insertar cama". El toast confirma con el participio: "Guardado", "Exportado".
- **Errores dicen qué pasó y cómo resolverlo**, sin disculpas ni vaguedad: "No se pudo abrir el archivo. Verifica que sea un proyecto de NextCAD (.json)."
- **Empty state invita a actuar:** "El plano está vacío. Elige una herramienta y arrastra para empezar."
- Sin jerga de implementación ("webhook", "config") en la UI.

---

## 8. Accesibilidad

- Contraste mínimo AA: `texto` sobre `muro` ≈ 12:1; `texto-tenue` sobre `muro` ≈ 4.7:1; `teja` sobre `papel` ≈ 4.6:1 (solo para elementos no textuales o con refuerzo).
- Targets interactivos ≥ 32×32px (rail 48px da margen).
- Navegación completa por teclado; foco visible y orden lógico.
- El color nunca es el único portador de información: la selección suma handles y contorno; el estado de herramienta suma el tick.
- `prefers-reduced-motion` respetado.
- Zoom de texto del navegador hasta 200% sin pérdida de función.

---

## 9. Auto-crítica contra los defaults

| Riesgo detectado | Corrección aplicada |
|---|---|
| Paleta "crema + terracotta" (tell #1 del diseño generado) | El chrome es mayoritariamente oscuro (`muro`); `papel` solo vive dentro del viewport; `teja` no decora, solo señala selección. |
| Inter como tipografía por defecto | Schibsted Grotesk + IBM Plex Mono, elegidas por su carácter técnico y su origen en el dibujo de ingeniería. |
| Tarjetas redondeadas idénticas con sombra suave | Paneles rectos con hairlines; radio solo en controles flotantes. |
| Eyebrows en mayúsculas sobre cada sección | Sin eyebrows. Mayúsculas solo en unidades de la status bar, donde el dibujo técnico lo exige. |
| Animaciones de entrada y hover en todo | Solo motion disparado por acción; una sola transición (colapso de panel). |
| Iconografía genérica de librería | Iconos lineales de 1.5px con remates rectos, coherentes con el trazo técnico del plano. |

**Riesgo aceptado:** el layout rail + canvas + panel es la convención de las herramientas profesionales (Figma, AutoCAD). Reinventarlo dañaría la usabilidad. La distinción vive en la paleta, la tipografía y el detalle, no en reubicar controles.

---

## 10. Mapeo con `feature_list.json`

| Feature | Elemento de UI afectado |
|---|---|
| 3 `viewport_2d` | Fondo `papel #EFEBE3`, grid hairline `plomo` |
| 5 `toolbar_draw_tools` | Rail izquierdo 48px, tick `roble` en activa, atajos V/R/C/L/T |
| 6 `shape_drawing` | Preview punteado en `teja` |
| 7 `selection_transform` | Contorno `teja` 1.5px + handles `roble` |
| 8 `properties_panel` | Panel derecho 280px, valores en IBM Plex Mono |
| 9 `edit_operations` | Deshacer/reehacer en top bar |
| 10 `object_library` | Panel flotante lanzado desde el rail |
| 11 `project_persistence` | Botones Guardar / Cargar / Exportar PNG en top bar |

---

## 11. Notas de implementación

- **Tailwind v4**: exponer los tokens en `app/globals.css` dentro de `@theme inline`:

  ```css
  @theme inline {
    --color-muro: #26241f;
    --color-papel: #efebe3;
    --color-roble: #c89b5e;
    --color-teja: #b2553a;
    --color-pizarra: #3a372f;
    --color-plomo: #9b958a;
    --color-texto: #ede7dc;
    --color-borde: rgba(237, 231, 220, 0.1);
    --font-sans: var(--font-schibsted);
    --font-mono: var(--font-plex-mono);
  }
  ```

- **Fuentes**: reemplazar Geist/Geist_Mono en `app/layout.tsx` por `Schibsted_Grotesk` e `IBM_Plex_Mono` de `next/font/google`, exponiendo `--font-schibsted` y `--font-plex-mono`.
- **Cifras tabulares** en coordenadas y dimensiones: `font-variant-numeric: tabular-nums`.
- **Iconografía**: set propio de 1.5px de trazo, remates rectos; no mezclar familias de iconos.

---

## 12. Checklist de aceptación — Feature 1

- [x] Se documenta la distribución de zonas de la UI (toolbar, viewport, paneles) basada en la imagen.
- [x] Se define paleta de colores y estilo visual (tema oscuro cálido, tipografía técnica).
- [x] El resultado orienta el layout de los features de UI siguientes (`toolbar_draw_tools`, `properties_panel`).
