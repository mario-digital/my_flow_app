# CSS Tokenization System Specification

## Overview

This document defines the complete CSS design token system for My Flow, including token structure, naming conventions, implementation approach, and integration with Tailwind CSS 4.x and shadcn/ui components.

**System Architecture:** CSS Custom Properties (native) → Tailwind CSS theme extension → shadcn/ui component styling

**Key Principle:** Single source of truth for all design values. Tokens are defined once as CSS custom properties and consumed everywhere through Tailwind utilities and component styles.

---

## Token Naming Convention

### Naming Structure

All tokens follow this pattern:
```
--{category}-{property}-{variant?}-{state?}
```

**Examples:**
- `--color-bg-primary`
- `--color-text-secondary`
- `--color-context-work`
- `--space-4`
- `--radius-md`
- `--font-size-body`

### Categories

| Category | Prefix | Purpose | Examples |
|----------|--------|---------|----------|
| Color | `color-` | All color values | `--color-bg-primary`, `--color-context-work` |
| Spacing | `space-` | Margins, padding, gaps | `--space-4`, `--space-8` |
| Typography | `font-` or `text-` | Font families, sizes, weights, line heights | `--font-family-primary`, `--font-size-h1` |
| Border Radius | `radius-` | Border radius values | `--radius-sm`, `--radius-full` |
| Shadows | `shadow-` | Box shadow definitions | `--shadow-sm`, `--shadow-lg` |
| Z-Index | `z-` | Stacking order | `--z-modal`, `--z-dropdown` |
| Animation | `anim-` | Duration, easing, delays | `--anim-duration-fast`, `--anim-ease-bounce` |

### Naming Rules

1. **Use semantic names for application-level tokens**, not literal values
   - ✅ `--color-bg-primary` (semantic)
   - ❌ `--color-black-900` (literal)

2. **Context colors use descriptive names**
   - ✅ `--color-context-work`, `--color-context-personal`
   - ❌ `--color-blue`, `--color-orange`

3. **State variants use suffix pattern**
   - `--color-button-primary-hover`
   - `--color-button-primary-active`
   - `--color-button-primary-disabled`

4. **Scale-based tokens use numeric suffixes**
   - `--space-1` through `--space-16` (4px increments)
   - `--font-size-xs`, `--font-size-sm`, `--font-size-base`, etc.

5. **All token names are lowercase with hyphens** (kebab-case)
   - ✅ `--color-text-primary`
   - ❌ `--colorTextPrimary`, `--Color_Text_Primary`

---

## Token Hierarchy & Organization

### Token Layers

**Layer 1: Primitive Tokens** (Raw values, not directly consumed by components)
```css
:root {
  /* Primitive colors - reference only */
  --primitive-black-900: #0A0A0A;
  --primitive-black-800: #1A1A1A;
  --primitive-black-700: #2A2A2A;
  --primitive-neutral-400: #A3A3A3;
  --primitive-neutral-600: #525252;
  --primitive-white: #FAFAFA;

  /* Context color primitives */
  --primitive-blue-500: #3B82F6;
  --primitive-orange-500: #F97316;
  --primitive-purple-500: #A855F7;
  --primitive-green-500: #10B981;

  /* Semantic color primitives */
  --primitive-success-500: #22C55E;
  --primitive-warning-500: #EAB308;
  --primitive-error-500: #EF4444;
}
```

**Layer 2: Semantic Tokens** (Application-level, consumed by components)
```css
:root {
  /* Background colors */
  --color-bg-primary: var(--primitive-black-900);
  --color-bg-secondary: var(--primitive-black-800);
  --color-bg-tertiary: var(--primitive-black-700);

  /* Text colors */
  --color-text-primary: var(--primitive-white);
  --color-text-secondary: var(--primitive-neutral-400);
  --color-text-muted: var(--primitive-neutral-600);

  /* Border colors */
  --color-border: #404040;
  --color-border-hover: #525252;

  /* Context colors - dynamic (set via JavaScript) */
  --color-context-current: var(--primitive-blue-500); /* Default */

  /* Semantic feedback colors */
  --color-success: var(--primitive-success-500);
  --color-warning: var(--primitive-warning-500);
  --color-error: var(--primitive-error-500);
}
```

**Layer 3: Component Tokens** (Component-specific overrides)
```css
:root {
  /* Button component tokens */
  --button-bg-primary: var(--color-context-current);
  --button-bg-primary-hover: var(--color-context-current-hover);
  --button-bg-secondary: transparent;
  --button-border-secondary: var(--color-border);

  /* Input component tokens */
  --input-bg: var(--color-bg-secondary);
  --input-border: var(--color-border);
  --input-border-focus: var(--color-context-current);

  /* Card component tokens */
  --card-bg: var(--color-bg-secondary);
  --card-border: var(--color-border);
}
```

---

## Complete Token Definitions

### Color Tokens

```css
:root {
  /* ========================================
     PRIMITIVE COLORS (Layer 1)
     ======================================== */

  /* Neutrals */
  --primitive-black-900: #0A0A0A;
  --primitive-black-800: #1A1A1A;
  --primitive-black-700: #2A2A2A;
  --primitive-neutral-600: #404040;
  --primitive-neutral-500: #525252;
  --primitive-neutral-400: #A3A3A3;
  --primitive-white: #FAFAFA;

  /* Context Colors (with hover/active states for full browser compatibility) */
  --primitive-work: #3B82F6;
  --primitive-work-hover: #60A5FA;     /* 10% lighter for hover */
  --primitive-work-active: #93C5FD;    /* 20% lighter for active */

  --primitive-personal: #F97316;
  --primitive-personal-hover: #FB923C; /* 10% lighter for hover */
  --primitive-personal-active: #FDBA74; /* 20% lighter for active */

  --primitive-rest: #A855F7;
  --primitive-rest-hover: #C084FC;     /* 10% lighter for hover */
  --primitive-rest-active: #D8B4FE;    /* 20% lighter for active */

  --primitive-social: #10B981;
  --primitive-social-hover: #34D399;   /* 10% lighter for hover */
  --primitive-social-active: #6EE7B7;  /* 20% lighter for active */

  /* Semantic Colors (with hover states) */
  --primitive-success: #22C55E;
  --primitive-warning: #EAB308;
  --primitive-error: #EF4444;
  --primitive-error-hover: #F87171;    /* 10% lighter for hover */
  --primitive-error-active: #FCA5A5;   /* 20% lighter for active */

  /* ========================================
     SEMANTIC COLORS (Layer 2)
     ======================================== */

  /* Backgrounds */
  --color-bg-primary: var(--primitive-black-900);
  --color-bg-secondary: var(--primitive-black-800);
  --color-bg-tertiary: var(--primitive-black-700);
  --color-bg-overlay: rgba(10, 10, 10, 0.6); /* 60% opacity for modals */

  /* Text */
  --color-text-primary: var(--primitive-white);
  --color-text-secondary: var(--primitive-neutral-400);
  --color-text-muted: var(--primitive-neutral-500);
  --color-text-disabled: var(--primitive-neutral-600);
  --color-text-inverse: var(--primitive-black-900); /* For light backgrounds */

  /* Borders */
  --color-border: var(--primitive-neutral-600);
  --color-border-hover: var(--primitive-neutral-500);
  --color-border-focus: var(--color-context-current);

  /* Context - Dynamic (controlled via JavaScript) */
  --color-context-current: var(--primitive-work); /* Default to Work */
  --color-context-current-hover: var(--primitive-work-hover);
  --color-context-current-active: var(--primitive-work-active);

  --color-context-work: var(--primitive-work);
  --color-context-personal: var(--primitive-personal);
  --color-context-rest: var(--primitive-rest);
  --color-context-social: var(--primitive-social);

  /* Semantic Feedback */
  --color-success: var(--primitive-success);
  --color-success-bg: rgba(34, 197, 94, 0.1);
  --color-warning: var(--primitive-warning);
  --color-warning-bg: rgba(234, 179, 8, 0.1);
  --color-error: var(--primitive-error);
  --color-error-bg: rgba(239, 68, 68, 0.1);

  /* ========================================
     COMPONENT COLORS (Layer 3)
     ======================================== */

  /* Buttons - Using pre-calculated hover/active colors for full browser compatibility */
  --button-bg-primary: var(--color-context-current);
  --button-bg-primary-hover: var(--color-context-current-hover);
  --button-bg-primary-active: var(--color-context-current-active);
  --button-text-primary: var(--primitive-white);

  --button-bg-secondary: transparent;
  --button-border-secondary: var(--color-border);
  --button-border-secondary-hover: var(--color-context-current);
  --button-text-secondary: var(--color-text-primary);

  --button-bg-ghost: transparent;
  --button-text-ghost: var(--color-text-secondary);
  --button-text-ghost-hover: var(--color-text-primary);

  --button-bg-danger: var(--color-error);
  --button-bg-danger-hover: var(--primitive-error-hover);
  --button-bg-danger-active: var(--primitive-error-active);
  --button-text-danger: var(--primitive-white);

  /* Inputs */
  --input-bg: var(--color-bg-secondary);
  --input-border: var(--color-border);
  --input-border-hover: var(--color-border-hover);
  --input-border-focus: var(--color-context-current);
  --input-text: var(--color-text-primary);
  --input-placeholder: var(--color-text-muted);

  /* Cards */
  --card-bg: var(--color-bg-secondary);
  --card-bg-hover: var(--color-bg-tertiary);
  --card-border: var(--color-border);
  --card-border-active: var(--color-context-current);

  /* Flow Cards */
  --flow-bg: var(--card-bg);
  --flow-bg-hover: var(--card-bg-hover);
  --flow-border-left: var(--color-context-current); /* 3px accent border */
  --flow-text-completed: var(--color-text-muted);

  /* Message Bubbles */
  --message-bg-user: var(--color-context-current);
  --message-bg-ai: var(--color-bg-secondary);
  --message-bg-system: var(--color-bg-tertiary);
  --message-text-user: var(--primitive-white);
  --message-text-ai: var(--color-text-primary);
}
```

### Typography Tokens

```css
:root {
  /* Font Families */
  --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;

  /* Font Sizes - Semantic naming for design clarity */
  --font-size-tiny: 0.75rem;    /* 12px - Captions, labels */
  --font-size-small: 0.875rem;  /* 14px - Secondary text */
  --font-size-body: 1rem;       /* 16px - Body text, default */
  --font-size-large: 1.125rem;  /* 18px - Emphasized body text */
  --font-size-h3: 1.25rem;      /* 20px - Heading 3 */
  --font-size-h2: 1.5rem;       /* 24px - Heading 2 */
  --font-size-h1: 2rem;         /* 32px - Heading 1 */

  /* Font Weights */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Line Heights */
  --line-height-tight: 1.2;
  --line-height-snug: 1.3;
  --line-height-normal: 1.4;
  --line-height-relaxed: 1.5;
  --line-height-loose: 1.6;

  /* Named line heights (matching design spec) */
  --line-height-h1: var(--line-height-tight);     /* 1.2 */
  --line-height-h2: var(--line-height-snug);      /* 1.3 */
  --line-height-h3: var(--line-height-normal);    /* 1.4 */
  --line-height-tiny: var(--line-height-normal);  /* 1.4 */
  --line-height-small: var(--line-height-relaxed); /* 1.5 */
  --line-height-body: var(--line-height-loose);   /* 1.6 */

  /* Letter Spacing */
  --letter-spacing-tight: -0.02em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.02em;
}
```

### Spacing Tokens

```css
:root {
  /* Base spacing scale (4px increments) */
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
  --space-32: 8rem;     /* 128px - Large section spacing */
  --space-40: 10rem;    /* 160px - Extra large sections */
  --space-48: 12rem;    /* 192px - Hero sections, large layouts */

  /* Component-specific spacing */
  --spacing-component-padding: var(--space-4);
  --spacing-component-gap: var(--space-3);
  --spacing-section-gap: var(--space-8);
  --spacing-section-gap-large: var(--space-16);
  --spacing-page-padding: var(--space-6);
}
```

### Border Radius Tokens

```css
:root {
  --radius-none: 0;
  --radius-sm: 0.375rem;   /* 6px - buttons, badges */
  --radius-md: 0.5rem;     /* 8px - cards, inputs */
  --radius-lg: 0.75rem;    /* 12px - modals, panels */
  --radius-full: 9999px;   /* Fully rounded - avatars, pills */

  /* Component-specific radius */
  --radius-button: var(--radius-sm);
  --radius-card: var(--radius-md);
  --radius-modal: var(--radius-lg);
  --radius-input: var(--radius-md);
}
```

### Shadow Tokens

```css
:root {
  /* Elevation shadows */
  --shadow-none: none;
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-sm: 0 2px 4px 0 rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.6), 0 4px 6px -2px rgba(0, 0, 0, 0.4);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 10px 10px -5px rgba(0, 0, 0, 0.4);

  /* Focus ring */
  --shadow-focus: 0 0 0 2px var(--color-context-current);
  --shadow-focus-error: 0 0 0 2px var(--color-error);

  /* Component-specific shadows */
  --shadow-card: var(--shadow-sm);
  --shadow-card-hover: var(--shadow-md);
  --shadow-modal: var(--shadow-xl);
  --shadow-dropdown: var(--shadow-lg);
}
```

### Z-Index Tokens

```css
:root {
  /* Z-index scale - Using 1000 increments for flexibility */
  --z-base: 0;
  --z-dropdown: 1000;
  --z-sticky: 2000;
  --z-fixed: 3000;
  --z-modal-backdrop: 4000;
  --z-modal: 5000;
  --z-popover: 6000;
  --z-tooltip: 7000;
  --z-notification: 8000;
  --z-max: 9999;
}
```

**Using Intermediate Z-Index Values:**

The 1000-increment scale provides flexibility for inserting layers between defined levels without refactoring. Use the following patterns:

**Pattern 1: Nested Components** - Add increments for elements inside a layer
```css
/* Tooltip inside a modal */
.modal-tooltip {
  z-index: calc(var(--z-modal) + 100); /* 5100 */
}

/* Secondary popover on top of primary popover */
.popover-nested {
  z-index: calc(var(--z-popover) + 50); /* 6050 */
}
```

**Pattern 2: Component Variants** - Use increments for component variations
```css
/* Sticky header with elevated state */
.sticky-header--elevated {
  z-index: calc(var(--z-sticky) + 10); /* 2010 */
}

/* Dropdown submenu */
.dropdown-submenu {
  z-index: calc(var(--z-dropdown) + 1); /* 1001 */
}
```

**Pattern 3: Temporary Overlays** - Use higher values within a range for temporary states
```css
/* Loading overlay on top of modal */
.modal-loading-overlay {
  z-index: calc(var(--z-modal) + 500); /* 5500 */
}
```

**Best Practices:**
- Use increments of **1, 10, 50, 100, or 500** to maintain readability
- Document any intermediate values in component comments
- Avoid exceeding **900** units above the base token (keeps within range)
- If you need more than 5 intermediate layers, consider creating a new base token

### Animation Tokens

```css
:root {
  /* Duration - Consistent semantic naming */
  --anim-duration-instant: 100ms;   /* Immediate feedback (button press) */
  --anim-duration-fast: 200ms;      /* Quick transitions (hover, focus) */
  --anim-duration-normal: 300ms;    /* Standard transitions (modal, drawer) */
  --anim-duration-slow: 400ms;      /* Emphasized transitions (context switch) */
  --anim-duration-slowest: 600ms;   /* Long transitions (page transitions) */

  /* Component-specific durations */
  --anim-duration-button: var(--anim-duration-instant);
  --anim-duration-modal: var(--anim-duration-normal);
  --anim-duration-context-switch: var(--anim-duration-slow);

  /* Easing functions */
  --anim-ease-linear: linear;
  --anim-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --anim-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --anim-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --anim-ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --anim-ease-spring: cubic-bezier(0.4, 0.0, 0.2, 1);

  /* Component-specific easing */
  --anim-ease-button: var(--anim-ease-out);
  --anim-ease-modal: var(--anim-ease-out);
  --anim-ease-flow-appear: var(--anim-ease-bounce);
}
```

**Animation Duration Usage Guide:**

Choose the right duration for the interaction type:

| Duration | Use Cases | Examples |
|----------|-----------|----------|
| **instant** (100ms) | Immediate user feedback, micro-interactions | Button press, checkbox toggle, switch flip, radio select |
| **fast** (200ms) | Hover effects, focus states, subtle transitions | Hover color change, focus ring appear, link underline slide |
| **normal** (300ms) | Standard UI transitions, element appearances | Modal open/close, drawer slide in/out, accordion expand, dropdown appear |
| **slow** (400ms) | Emphasized transitions, state changes | Context theme switch, tab change, card flip, content fade |
| **slowest** (600ms) | Page-level transitions, large layout shifts | Route transitions, hero section animations, full-screen modals, major layout reflows |

**Pairing Durations with Easing:**

```css
/* Fast interactions - Use ease-out for snappy feel */
.button:hover {
  transition: background-color var(--anim-duration-fast) var(--anim-ease-out);
}

/* Standard transitions - Use ease-out for natural feel */
.modal {
  transition: transform var(--anim-duration-normal) var(--anim-ease-out);
}

/* Emphasized transitions - Use ease-in-out for smooth feel */
.context-switch {
  transition: all var(--anim-duration-slow) var(--anim-ease-in-out);
}

/* Playful interactions - Use bounce/spring for delight */
.flow-card-appear {
  animation: slideIn var(--anim-duration-normal) var(--anim-ease-bounce);
}
```

### Icon Size Tokens

```css
:root {
  --icon-size-xs: 1rem;      /* 16px - inline with text */
  --icon-size-sm: 1.25rem;   /* 20px - buttons, cards */
  --icon-size-md: 1.5rem;    /* 24px - navigation, primary actions */
  --icon-size-lg: 2rem;      /* 32px - context icons in dashboard */
  --icon-size-xl: 2.5rem;    /* 40px - large decorative icons */
}
```

---

## File Structure & Implementation

### Directory Organization

```
app/
├── globals.css              # Root token definitions + Tailwind imports
├── styles/
│   ├── tokens/
│   │   ├── colors.css       # All color tokens
│   │   ├── typography.css   # Font, size, weight, line-height tokens
│   │   ├── spacing.css      # Spacing scale tokens
│   │   ├── effects.css      # Shadows, radius, z-index
│   │   └── animation.css    # Duration, easing tokens
│   └── components/
│       ├── button.css       # Button component styles (if not using Tailwind)
│       ├── card.css         # Card component styles
│       └── ...
components/
├── ui/                      # shadcn/ui components (use Tailwind + tokens)
│   ├── button.tsx
│   ├── card.tsx
│   └── ...
types/
└── tailwind-colors.d.ts     # TypeScript type declarations for Tailwind colors
tailwind.config.ts           # Tailwind theme extension consuming tokens
```

### globals.css (Entry Point)

```css
/* app/globals.css */

/* Tailwind CSS 4.x Imports */
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";

/* Token Definitions */
/* IMPORTANT: These files must be created manually before this import will work.
   See "Migration & Implementation Steps" section below for creation instructions.
   Create the following files in app/styles/tokens/ directory:
   - colors.css (color tokens)
   - typography.css (font, size, weight, line-height tokens)
   - spacing.css (spacing scale tokens)
   - effects.css (shadows, radius, z-index tokens)
   - animation.css (duration, easing tokens)
*/
@import './styles/tokens/colors.css';
@import './styles/tokens/typography.css';
@import './styles/tokens/spacing.css';
@import './styles/tokens/effects.css';
@import './styles/tokens/animation.css';

/* Global Resets & Base Styles */
@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-bg-primary text-text-primary;
    font-family: var(--font-family-primary);
    font-size: var(--font-size-body);
    line-height: var(--line-height-body);
  }

  h1 {
    font-size: var(--font-size-h1);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-h1);
  }

  h2 {
    font-size: var(--font-size-h2);
    font-weight: var(--font-weight-semibold);
    line-height: var(--line-height-h2);
  }

  h3 {
    font-size: var(--font-size-h3);
    font-weight: var(--font-weight-semibold);
    line-height: var(--line-height-h3);
  }
}

/* Accessibility: Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Tailwind CSS 4.x Integration

### types/tailwind-colors.d.ts

Create a separate type declaration file for Tailwind custom colors. This ensures proper module augmentation and TypeScript autocomplete.

```typescript
// types/tailwind-colors.d.ts

// Type-safe custom color names for autocomplete and typo prevention
declare module 'tailwindcss/types/config' {
  interface CustomColors {
    // Backgrounds
    'bg-primary': string;
    'bg-secondary': string;
    'bg-tertiary': string;
    'bg-overlay': string;
    // Text
    'text-primary': string;
    'text-secondary': string;
    'text-muted': string;
    'text-disabled': string;
    // Borders
    'border': string;
    'border-hover': string;
    'border-focus': string;
    // Context
    'context': string;
    'context-work': string;
    'context-personal': string;
    'context-rest': string;
    'context-social': string;
    // Semantic
    'success': string;
    'success-bg': string;
    'warning': string;
    'warning-bg': string;
    'error': string;
    'error-bg': string;
    // Components
    'button-primary': string;
    'button-secondary': string;
    'card': string;
    'input': string;
  }
}

export {} // Make this a module
```

### tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // Colors - map CSS custom properties to Tailwind utilities
      colors: {
        // Backgrounds
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-tertiary': 'var(--color-bg-tertiary)',
        'bg-overlay': 'var(--color-bg-overlay)',

        // Text
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        'text-disabled': 'var(--color-text-disabled)',

        // Borders
        'border': 'var(--color-border)',
        'border-hover': 'var(--color-border-hover)',
        'border-focus': 'var(--color-border-focus)',

        // Context (dynamic)
        'context': 'var(--color-context-current)',
        'context-work': 'var(--color-context-work)',
        'context-personal': 'var(--color-context-personal)',
        'context-rest': 'var(--color-context-rest)',
        'context-social': 'var(--color-context-social)',

        // Semantic
        'success': 'var(--color-success)',
        'success-bg': 'var(--color-success-bg)',
        'warning': 'var(--color-warning)',
        'warning-bg': 'var(--color-warning-bg)',
        'error': 'var(--color-error)',
        'error-bg': 'var(--color-error-bg)',

        // Component-specific
        'button-primary': 'var(--button-bg-primary)',
        'button-secondary': 'var(--button-bg-secondary)',
        'card': 'var(--card-bg)',
        'input': 'var(--input-bg)',
      },

      // Spacing - use default Tailwind scale (already matches 4px increments)
      spacing: {
        // Tailwind's default scale is perfect, but we can add custom ones
        // 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24 already map to our tokens
      },

      // Border Radius
      borderRadius: {
        'none': 'var(--radius-none)',
        'sm': 'var(--radius-sm)',
        'DEFAULT': 'var(--radius-md)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'full': 'var(--radius-full)',
      },

      // Font Family
      fontFamily: {
        sans: ['var(--font-family-primary)'],
        mono: ['var(--font-family-mono)'],
      },

      // Font Size - Semantic names only for clarity
      fontSize: {
        'tiny': 'var(--font-size-tiny)',       // 12px - Captions, labels
        'small': 'var(--font-size-small)',     // 14px - Secondary text
        'body': 'var(--font-size-body)',       // 16px - Body text (default)
        'large': 'var(--font-size-large)',     // 18px - Emphasized body
        'h3': 'var(--font-size-h3)',           // 20px - Heading 3
        'h2': 'var(--font-size-h2)',           // 24px - Heading 2
        'h1': 'var(--font-size-h1)',           // 32px - Heading 1
      },

      // Font Weight
      fontWeight: {
        'regular': 'var(--font-weight-regular)',
        'medium': 'var(--font-weight-medium)',
        'semibold': 'var(--font-weight-semibold)',
        'bold': 'var(--font-weight-bold)',
      },

      // Line Height
      lineHeight: {
        'tight': 'var(--line-height-tight)',
        'snug': 'var(--line-height-snug)',
        'normal': 'var(--line-height-normal)',
        'relaxed': 'var(--line-height-relaxed)',
        'loose': 'var(--line-height-loose)',
      },

      // Box Shadow
      boxShadow: {
        'none': 'var(--shadow-none)',
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'DEFAULT': 'var(--shadow-md)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'focus': 'var(--shadow-focus)',
        'focus-error': 'var(--shadow-focus-error)',
      },

      // Z-Index
      zIndex: {
        'base': 'var(--z-base)',
        'dropdown': 'var(--z-dropdown)',
        'sticky': 'var(--z-sticky)',
        'fixed': 'var(--z-fixed)',
        'modal-backdrop': 'var(--z-modal-backdrop)',
        'modal': 'var(--z-modal)',
        'popover': 'var(--z-popover)',
        'tooltip': 'var(--z-tooltip)',
        'notification': 'var(--z-notification)',
        'max': 'var(--z-max)',
      },

      // Animation Duration
      transitionDuration: {
        'instant': 'var(--anim-duration-instant)',  // 100ms
        'fast': 'var(--anim-duration-fast)',        // 200ms
        'DEFAULT': 'var(--anim-duration-normal)',   // 300ms
        'normal': 'var(--anim-duration-normal)',    // 300ms
        'slow': 'var(--anim-duration-slow)',        // 400ms
        'slowest': 'var(--anim-duration-slowest)',  // 600ms
      },

      // Animation Easing
      transitionTimingFunction: {
        'linear': 'var(--anim-ease-linear)',
        'in': 'var(--anim-ease-in)',
        'out': 'var(--anim-ease-out)',
        'in-out': 'var(--anim-ease-in-out)',
        'bounce': 'var(--anim-ease-bounce)',
        'spring': 'var(--anim-ease-spring)',
      },

      // Icon Sizes (as width/height utilities)
      width: {
        'icon-xs': 'var(--icon-size-xs)',
        'icon-sm': 'var(--icon-size-sm)',
        'icon-md': 'var(--icon-size-md)',
        'icon-lg': 'var(--icon-size-lg)',
        'icon-xl': 'var(--icon-size-xl)',
      },
      height: {
        'icon-xs': 'var(--icon-size-xs)',
        'icon-sm': 'var(--icon-size-sm)',
        'icon-md': 'var(--icon-size-md)',
        'icon-lg': 'var(--icon-size-lg)',
        'icon-xl': 'var(--icon-size-xl)',
      },
    },
  },
  plugins: [],
}

export default config
```

---

## Context-Based Dynamic Theming

### JavaScript/TypeScript Context Switching

**Strategy:** Update the `--color-context-current` CSS variable when user switches contexts. This automatically updates all UI elements using the context color.

```typescript
// lib/context-theme.ts

export type ContextType = 'work' | 'personal' | 'rest' | 'social'

interface ContextColorSet {
  base: string
  hover: string
  active: string
}

const CONTEXT_COLORS: Record<ContextType, ContextColorSet> = {
  work: {
    base: '#3B82F6',
    hover: '#60A5FA',
    active: '#93C5FD',
  },
  personal: {
    base: '#F97316',
    hover: '#FB923C',
    active: '#FDBA74',
  },
  rest: {
    base: '#A855F7',
    hover: '#C084FC',
    active: '#D8B4FE',
  },
  social: {
    base: '#10B981',
    hover: '#34D399',
    active: '#6EE7B7',
  },
}

/**
 * Sets the active context theme by updating CSS custom properties
 * @param context - The context type to activate
 */
export function setContextTheme(context: ContextType): void {
  if (typeof document === 'undefined') return // Guard for SSR

  const root = document.documentElement
  const colors = CONTEXT_COLORS[context]

  // Update current context colors (base, hover, active)
  root.style.setProperty('--color-context-current', colors.base)
  root.style.setProperty('--color-context-current-hover', colors.hover)
  root.style.setProperty('--color-context-current-active', colors.active)

  // Optional: Add data attribute for additional CSS targeting
  root.setAttribute('data-context', context)
}

/**
 * Gets the current active context from DOM
 */
export function getCurrentContext(): ContextType | null {
  if (typeof document === 'undefined') return null

  return document.documentElement.getAttribute('data-context') as ContextType | null
}
```

### React Hook for Context Theme

```typescript
// hooks/use-context-theme.ts

import { useEffect } from 'react'
import { setContextTheme, type ContextType } from '@/lib/context-theme'

/**
 * Hook to manage context-based theming
 * @param context - The current context
 */
export function useContextTheme(context: ContextType) {
  useEffect(() => {
    setContextTheme(context)
  }, [context])
}
```

### AI-Triggered Context Switching

**Integration with AI Chat Responses:**

The My Flow application includes AI-driven context suggestions. When the AI detects that user input belongs to a different context, it can suggest or automatically switch contexts.

```typescript
// types/ai-context.ts

/**
 * AI Context Suggestion
 * Returned by AI when it detects user input belongs to a different context
 */
export interface AIContextSuggestion {
  suggestedContext: ContextType;
  confidence: number; // 0-1 scale
  reason?: string; // Optional explanation for the suggestion
}

/**
 * Context Switch Trigger
 * Determines how aggressively to auto-switch contexts based on AI suggestions
 */
export type ContextSwitchMode = 'manual' | 'suggest' | 'auto';

// lib/ai-context-handler.ts

/**
 * Handles AI-triggered context switches based on user preferences
 * @param suggestion - AI context suggestion from chat response
 * @param mode - Context switch mode (manual/suggest/auto)
 * @param currentContext - Current active context
 * @returns Whether to proceed with context switch
 */
export function handleAIContextSuggestion(
  suggestion: AIContextSuggestion,
  mode: ContextSwitchMode,
  currentContext: ContextType
): boolean {
  // Don't switch if already in suggested context
  if (suggestion.suggestedContext === currentContext) {
    return false;
  }

  switch (mode) {
    case 'manual':
      // Never auto-switch, only show suggestion to user
      return false;

    case 'suggest':
      // Auto-switch only if high confidence (>80%)
      if (suggestion.confidence > 0.8) {
        setContextTheme(suggestion.suggestedContext);
        return true;
      }
      return false;

    case 'auto':
      // Auto-switch for medium-high confidence (>60%)
      if (suggestion.confidence > 0.6) {
        setContextTheme(suggestion.suggestedContext);
        return true;
      }
      return false;

    default:
      return false;
  }
}

/**
 * Display AI context switch notification
 * Show user-friendly message when AI switches context
 */
export function showContextSwitchNotification(
  fromContext: ContextType,
  toContext: ContextType,
  reason?: string
) {
  // Implementation: Show toast/notification
  // Example: "Switched to Work context - detected work-related task"
  console.log(`Context switched: ${fromContext} → ${toContext}`, reason);
}
```

**Usage in AI Chat Component:**

```tsx
// components/ai-chat.tsx

'use client'

import { useState } from 'react'
import { useContextTheme } from '@/hooks/use-context-theme'
import { handleAIContextSuggestion, showContextSwitchNotification } from '@/lib/ai-context-handler'
import type { AIContextSuggestion, ContextSwitchMode } from '@/types/ai-context'

export function AIChat() {
  const [currentContext, setCurrentContext] = useState<ContextType>('work')
  const [contextSwitchMode, setContextSwitchMode] = useState<ContextSwitchMode>('suggest')

  useContextTheme(currentContext)

  const handleAIResponse = (response: AIResponse) => {
    // Check if AI suggested a context switch
    if (response.contextSuggestion) {
      const switched = handleAIContextSuggestion(
        response.contextSuggestion,
        contextSwitchMode,
        currentContext
      )

      if (switched) {
        // Update local state
        setCurrentContext(response.contextSuggestion.suggestedContext)

        // Show notification to user
        showContextSwitchNotification(
          currentContext,
          response.contextSuggestion.suggestedContext,
          response.contextSuggestion.reason
        )
      } else if (contextSwitchMode === 'manual' && response.contextSuggestion.confidence > 0.6) {
        // Show suggestion to user without switching
        showContextSwitchSuggestion(response.contextSuggestion)
      }
    }

    // Process rest of AI response...
  }

  return (
    <div className="ai-chat">
      {/* Chat UI */}
    </div>
  )
}
```

**User Preference Settings:**

Allow users to configure how aggressive context switching should be:

```tsx
// components/settings/context-preferences.tsx

export function ContextPreferences() {
  const [mode, setMode] = useState<ContextSwitchMode>('suggest')

  return (
    <div className="space-y-4">
      <h3 className="text-h3 font-semibold">AI Context Switching</h3>

      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            value="manual"
            checked={mode === 'manual'}
            onChange={(e) => setMode(e.target.value as ContextSwitchMode)}
          />
          <span>Manual - Always ask before switching</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            value="suggest"
            checked={mode === 'suggest'}
            onChange={(e) => setMode(e.target.value as ContextSwitchMode)}
          />
          <span>Suggest - Auto-switch when AI is very confident (&gt;80%)</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            value="auto"
            checked={mode === 'auto'}
            onChange={(e) => setMode(e.target.value as ContextSwitchMode)}
          />
          <span>Auto - Auto-switch when AI is confident (&gt;60%)</span>
        </label>
      </div>
    </div>
  )
}
```

**Best Practices:**

1. **Confidence Thresholds:**
   - High confidence (&gt;80%): Strong signal, safe to auto-switch
   - Medium confidence (60-80%): Suggest to user, don't force
   - Low confidence (&lt;60%): Don't show suggestion

2. **User Feedback:**
   - Always show notification when context switches
   - Allow easy undo for auto-switches (back button, undo toast)
   - Track user corrections to improve AI confidence

3. **Transition Animation:**
   - Use smooth theme transition (400ms) when switching contexts
   - Show loading state during theme transition
   - Preserve conversation history across switches

### Usage in Layout Component

```tsx
// app/layout.tsx or app/[context]/layout.tsx

'use client'

import { useContextTheme } from '@/hooks/use-context-theme'
import { useCurrentContext } from '@/hooks/use-current-context' // Your context state hook

export default function ContextLayout({ children }: { children: React.ReactNode }) {
  const context = useCurrentContext() // Gets current context from state/URL

  // Automatically update theme when context changes
  useContextTheme(context)

  return <div className="min-h-screen">{children}</div>
}
```

---

## shadcn/ui Component Integration

### shadcn/ui Theme Configuration

When installing shadcn/ui components, use the following configuration:

```json
// components.json (shadcn/ui config)
{
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### Customizing shadcn/ui Button Component

```tsx
// components/ui/button.tsx

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Uses token-based Tailwind utilities
        default: "bg-button-primary text-white hover:opacity-90 active:opacity-80",
        secondary: "border-2 border-border bg-transparent hover:border-context active:border-context",
        ghost: "bg-transparent hover:bg-bg-tertiary text-text-secondary hover:text-text-primary",
        danger: "bg-error text-white hover:opacity-90 active:opacity-80",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

---

## Usage Guidelines

### ✅ DO: Use Tailwind Utilities (Preferred)

```tsx
// Preferred approach - using Tailwind utilities mapped to tokens
export function FlowCard({ title, completed }: FlowCardProps) {
  return (
    <div className="bg-card hover:bg-card-hover border-l-4 border-context rounded-md p-4 transition-colors duration-fast">
      <h3 className={cn(
        "text-base font-medium",
        completed ? "text-text-muted line-through" : "text-text-primary"
      )}>
        {title}
      </h3>
    </div>
  )
}
```

### ✅ DO: Use Tokens Directly for Dynamic Styles

```tsx
// When you need computed styles or dynamic values
export function ContextIndicator({ context }: { context: ContextType }) {
  return (
    <div
      className="w-3 h-3 rounded-full"
      style={{ backgroundColor: `var(--color-context-${context})` }}
    />
  )
}
```

### ✅ DO: Create Component-Specific Token Overrides

```css
/* For complex components that need their own token system */
.flow-card {
  --flow-spacing: var(--space-4);
  --flow-border-width: 3px;

  padding: var(--flow-spacing);
  border-left-width: var(--flow-border-width);
  border-color: var(--color-context-current);
}
```

### ❌ DON'T: Use Hardcoded Values

```tsx
// WRONG - hardcoded colors
<div className="bg-[#1A1A1A] text-[#FAFAFA]">

// RIGHT - use token-based utilities
<div className="bg-bg-secondary text-text-primary">
```

### ❌ DON'T: Bypass Tokens for One-Off Styles

```tsx
// WRONG - arbitrary value that doesn't match design system
<div className="shadow-[0_4px_20px_rgba(0,0,0,0.9)]">

// RIGHT - use defined shadow token (add to system if needed)
<div className="shadow-lg">
```

---

## Animation Implementation Examples

### Context Switch Transition

```tsx
// Using Tailwind + tokens for smooth context switching
export function ContextChatView({ context }: { context: ContextType }) {
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    setIsTransitioning(true)

    const timer = setTimeout(() => {
      setContextTheme(context) // Update CSS variables
      setIsTransitioning(false)
    }, 200) // First half of transition

    return () => clearTimeout(timer)
  }, [context])

  return (
    <div
      className={cn(
        "min-h-screen transition-opacity duration-slower ease-in-out",
        isTransitioning && "opacity-0"
      )}
    >
      {/* Content */}
    </div>
  )
}
```

### Flow Card Appearance Animation

```tsx
// Using CSS animation tokens
export function FlowCard({ flow, isNew }: FlowCardProps) {
  return (
    <div
      className={cn(
        "bg-card border-l-4 border-context rounded-md p-4",
        isNew && "animate-slide-in-bounce"
      )}
    >
      {flow.title}
    </div>
  )
}

// Add to globals.css
@layer utilities {
  @keyframes slide-in-bounce {
    0% {
      transform: translateY(-10px);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .animate-slide-in-bounce {
    animation: slide-in-bounce var(--anim-duration-normal) var(--anim-ease-bounce);
  }
}
```

---

## Testing & Validation

### Accessibility Contrast Testing

All color tokens must maintain WCAG 2.1 AA compliance:

**Text Contrast Requirements:**
- Normal text (16px): minimum 4.5:1 ratio
- Large text (24px+): minimum 3:1 ratio
- Interactive elements: minimum 3:1 ratio against background

**Testing Tools:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)
- Chrome DevTools Accessibility Panel

### Token Validation Checklist

Before deploying token system:

- [ ] All primitive tokens defined in `:root`
- [ ] All semantic tokens reference primitive tokens (no hardcoded values)
- [ ] Tailwind config successfully extends theme with all tokens
- [ ] Context color switching works in browser
- [ ] All shadcn/ui components render with correct token-based styles
- [ ] Dark mode exclusively enforced (no light mode fallbacks)
- [ ] Focus indicators meet 2px minimum and 3:1 contrast
- [ ] All animations respect `prefers-reduced-motion`
- [ ] TypeScript types for `ContextType` match available contexts

### Browser Support & Testing

**Minimum Browser Requirements:**

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome/Edge | 90+ | CSS Custom Properties support |
| Firefox | 89+ | CSS Custom Properties support |
| Safari | 14.1+ | CSS Custom Properties support |

**CSS Features Used:**
- CSS Custom Properties (all modern browsers)
- Pre-calculated color variants (no `color-mix()` required)
  - Hover/active states use explicit hex values for maximum compatibility
  - Works in all browsers supporting CSS variables
- CSS `@layer` directives (optional enhancement)

**Browser Compatibility Approach:**

Instead of relying on modern CSS functions like `color-mix()`, this spec uses **pre-calculated color variants** for hover and active states. This ensures:

1. **Universal Browser Support:** Works in any browser with CSS Custom Properties
2. **Predictable Rendering:** No runtime color calculation, consistent across all browsers
3. **Performance:** No CPU cycles spent on color mixing, faster renders
4. **Maintainability:** Clear, explicit color values in primitive tokens

**Browser Testing Checklist:**

Test token system in:
- Chrome/Edge (Chromium) 90+
- Firefox 89+
- Safari 14.1+ (macOS/iOS)

Verify:
- CSS custom properties cascade correctly
- Hover states render with correct lighter colors
- Active states show appropriate color feedback
- Transitions smooth at 60fps
- No FOUC (Flash of Unstyled Content)
- Context theme switching updates base, hover, and active colors

---

## Migration & Implementation Steps

### Phase 1: Foundation Setup (Week 1)

1. **Create token files**

   **IMPORTANT:** These files do not exist yet and must be created manually.

   - [ ] Create `app/styles/` directory if it doesn't exist
   - [ ] Create `app/styles/tokens/` subdirectory
   - [ ] Create `app/styles/tokens/colors.css` and define all color tokens (primitive, semantic, component)
   - [ ] Create `app/styles/tokens/typography.css` and define all typography tokens (fonts, sizes, weights, line-heights)
   - [ ] Create `app/styles/tokens/spacing.css` and define all spacing scale tokens
   - [ ] Create `app/styles/tokens/effects.css` and define shadow, radius, and z-index tokens
   - [ ] Create `app/styles/tokens/animation.css` and define duration and easing tokens

   **Note:** Copy the token definitions from the "Complete Token Definitions" section above into each respective file.

2. **Create TypeScript type declarations**
   - [ ] Create `types/` directory if it doesn't exist
   - [ ] Create `types/tailwind-colors.d.ts` with CustomColors interface (see "Tailwind CSS 4.x Integration" section)

3. **Configure Tailwind**
   - [ ] Update `tailwind.config.ts` with token extensions (see "tailwind.config.ts" section)
   - [ ] Import token files in `globals.css` (see "globals.css (Entry Point)" section)
   - [ ] Test Tailwind utilities resolve to correct tokens

4. **Set up context theming utilities**
   - [ ] Create `lib/context-theme.ts` (see "JavaScript/TypeScript Context Switching" section)
   - [ ] Create `hooks/use-context-theme.ts` (see "React Hook for Context Theme" section)
   - [ ] Test context switching in browser

### Phase 2: Component Integration (Week 2)

5. **Install and configure shadcn/ui**
   - [ ] Run `npx shadcn-ui@latest init`
   - [ ] Configure `components.json` with token-aware settings
   - [ ] Install core components (Button, Card, Input, Dialog)

6. **Customize shadcn/ui components**
   - [ ] Update Button component with token-based variants
   - [ ] Update Card component with context accent styles
   - [ ] Update Input component with focus states using tokens
   - [ ] Create custom Flow Card component

7. **Build component library**
   - [ ] Create ContextCard component
   - [ ] Create MessageBubble component
   - [ ] Create ContextSwitcher dropdown
   - [ ] Test all components with different context themes

### Phase 3: Testing & Refinement (Week 3)

8. **Accessibility audit**
   - [ ] Run axe-core automated tests
   - [ ] Manual keyboard navigation testing
   - [ ] Screen reader testing (NVDA/VoiceOver)
   - [ ] Color contrast validation for all token combinations

9. **Performance validation**
   - [ ] Measure FPS for context switch animations
   - [ ] Test animation performance with `prefers-reduced-motion`
   - [ ] Validate no layout shifts during theme transitions

10. **Documentation**
   - [ ] Document token usage patterns for team
   - [ ] Create Storybook stories for token demos (optional)
   - [ ] Update component README files with token examples

---

## Troubleshooting

### Issue: Context color not updating

**Cause:** CSS custom property not being updated on root element

**Solution:**
```typescript
// Ensure setContextTheme runs on client side only
if (typeof window !== 'undefined') {
  setContextTheme(context)
}
```

### Issue: Tailwind utilities not resolving tokens

**Cause:** Tailwind config not properly extending theme

**Solution:**
```typescript
// Verify config uses 'extend' not 'theme'
theme: {
  extend: {  // Must be 'extend'
    colors: { ... }
  }
}
```

### Issue: Focus ring not showing on buttons

**Cause:** Missing focus-visible pseudo-class styles

**Solution:**
```tsx
// Add focus-visible:shadow-focus to all interactive elements
className="... focus-visible:outline-none focus-visible:shadow-focus"
```

### Issue: Animations janky on mobile

**Cause:** Animating layout properties instead of transforms

**Solution:**
```css
/* WRONG */
.slide-in {
  animation: slide 300ms;
}
@keyframes slide {
  from { left: -100px; }  /* Layout property */
  to { left: 0; }
}

/* RIGHT */
.slide-in {
  animation: slide 300ms;
}
@keyframes slide {
  from { transform: translateX(-100px); }  /* Transform property */
  to { transform: translateX(0); }
}
```

---

## Next Steps

1. **Review this specification** - Share with frontend engineers and design team for feedback
2. **Set up token files** - Create directory structure and initial token definitions
3. **Configure Tailwind** - Extend theme configuration with token mappings
4. **Install shadcn/ui** - Set up component library with token-aware theming
5. **Build proof-of-concept** - Create one complete feature (e.g., Context Card) using full token system to validate approach
6. **Iterate and refine** - Adjust token values based on actual implementation feedback
7. **Document usage patterns** - Create team guidelines for consistent token usage

---

## Appendix: Token Quick Reference

### Most Commonly Used Tokens

```css
/* Colors */
--color-bg-primary          /* Main app background */
--color-bg-secondary        /* Cards, elevated surfaces */
--color-text-primary        /* Main text color */
--color-text-secondary      /* Secondary text */
--color-context-current     /* Dynamic context accent */
--color-border              /* Default borders */

/* Spacing */
--space-2, --space-4, --space-6, --space-8  /* Most common spacing values */

/* Typography */
--font-size-body            /* Default text size (16px) */
--font-size-h1, h2, h3      /* Heading sizes */
--font-weight-medium        /* Default UI weight */

/* Effects */
--radius-md                 /* Default border radius */
--shadow-md                 /* Default shadow */

/* Animation */
--anim-duration-normal      /* Default transition duration */
--anim-ease-out             /* Default easing */
```

### Token Naming Cheat Sheet

| Need | Token Pattern | Example |
|------|---------------|---------|
| Background color | `--color-bg-{variant}` | `--color-bg-secondary` |
| Text color | `--color-text-{variant}` | `--color-text-muted` |
| Border color | `--color-border-{variant}` | `--color-border-focus` |
| Spacing | `--space-{number}` | `--space-4` |
| Font size | `--font-size-{size}` | `--font-size-lg` |
| Border radius | `--radius-{size}` | `--radius-sm` |
| Shadow | `--shadow-{size}` | `--shadow-lg` |
| Animation duration | `--anim-duration-{speed}` | `--anim-duration-fast` |
| Z-index | `--z-{layer}` | `--z-modal` |

---

**Document Version:** 1.0
**Last Updated:** 2025-10-02
**Author:** Sally (UX Expert)
**Related Documents:**
- [Front-End Specification](./front-end-spec.md)
- [Tech Stack](./architecture/tech-stack.md)
- [Coding Standards](./architecture/coding-standards.md)
