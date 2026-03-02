# Design Rules — Sistema de Comidas

## 1. Filosofía Visual

El diseño debe sentirse:

- Limpio
- Aireado
- Profesional
- Editorial
- Moderno pero sobrio
- Sin exageraciones visuales

Evitar:

- Gradientes
- Sombras fuertes
- Colores fuera del theme
- Bordes negros duros
- Interfaces recargadas

El enfoque es claridad y jerarquía.

---

## 2. Sistema de Colores (Tokens Semánticos)

Nunca usar colores hardcodeados en componentes.

Siempre usar tokens definidos en Tailwind.

### Background

- `bg-background-primary` → `#F5F0E8`
- `bg-background-secondary` → `#F3E1E4`
- `bg-background-accent` → `#D62B42`
- `bg-background-accent-light` → `#ED3951`
- `bg-background-accent-dark` → `#B8283B`

Uso:

- `background.primary` → fondo general de la app
- `background.secondary` → superficies suaves (cards / bloques internos claros)
- `background.accent*` → bloques de énfasis (métricas, CTA, secciones destacadas)

### Texto

- `text-text-primary` → `#1A1A1A`
- `text-text-secondary` → `#6B6B6B`
- `text-text-contrast` → `#F5F0E8`

Uso:

- `text.primary` → títulos, contenido principal
- `text.secondary` → metadata, descripción, apoyo
- `text.contrast` → texto sobre `background.accent`, `background.accent-light`, `background.accent-dark`

### Accent

- `text-accent` / `bg-accent` → `#D62B42`
- `text-accent-light` / `bg-accent-light` → `#ED3951`
- `text-accent-dark` / `bg-accent-dark` → `#B8283B`

Uso:

- Botones principales
- Estados activos
- Bordes de énfasis
- Palabras clave en titulares

---

## 3. Tipografía

Fuente base:

- DM Sans
- Sans-serif fallback

Reglas:

- Headings: tracking ligeramente negativo (`-0.01em`)
- Pesos:
  - Títulos: 600
  - Botones: 500
  - Texto normal: 400
- Interlineado cómodo
- No usar fuentes decorativas

Jerarquía clara antes que tamaño excesivo.

---

## 4. Espaciado

Usar escala consistente basada en múltiplos de 8.

Ejemplo:

- `p-4`
- `p-6`
- `p-8`
- `gap-4`
- `gap-6`

Evitar valores arbitrarios.

El diseño debe respirar.

Más espacio > más elementos.

---

## 5. Componentes

### Botones

- `rounded-md`
- Sin sombras grandes
- Transiciones suaves (`duration-200`)
- Hover sutil
- Sin azul por defecto

Variantes permitidas:

- `primary` → `bg-accent` + `text-text-contrast`
- `secondary` → `bg-background-secondary` + `text-text-primary`
- `ghost` → fondo transparente + texto accent

### Cards / Bloques

- `rounded-lg`
- Padding generoso
- Border sutil solo cuando aporta jerarquía
- Sin `shadow-lg`
- En fondos `background.accent*`, usar siempre `text-text-contrast`

### Inputs

- Fondo claro de superficie (`background.secondary`)
- Border sutil
- Focus en accent
- Placeholder en `text.secondary`
- Sin outline azul por defecto

---

## 6. Layout

- Container centrado
- Máximo ancho ~1200px
- Mucho espacio en blanco
- Separar secciones con espacio (no con líneas pesadas)

---

## 7. Restricciones Globales

En este proyecto:

- No colores hardcodeados
- No gradientes
- No sombras fuertes
- No bordes negros duros
- No azul por defecto del navegador
- No estilos inconsistentes entre páginas

Siempre usar tokens del theme.

---

## 8. Principios de Interacción

- Transiciones suaves (`duration-200` o `duration-300`)
- Hover sutil
- Active discreto
- Feedback elegante, no llamativo

La interfaz debe sentirse estable y confiable.

---

## 9. Escalabilidad

Cualquier nuevo componente debe:

1. Usar tokens del theme
2. Respetar espaciado consistente
3. Mantener coherencia visual
4. No introducir nuevos colores sin actualizar el design system

Si se necesita un nuevo color o variante, primero se agrega al theme.

---

## 10. Sensación General

La aplicación debe transmitir:

- Orden
- Claridad
- Confianza
- Profesionalismo
- Simplicidad intencional

Si algo se ve “demasiado diseño”, probablemente está mal.


