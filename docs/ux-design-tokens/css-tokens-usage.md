# CSS Design Tokens Usage Guide

## Overview

This guide explains **how to use** MyFlow's CSS Design Token System for daily development work. For the full technical specification, see [`css-tokenization-spec.md`](./css-tokenization-spec.md).

**🚨 CRITICAL RULE:** Do NOT add new tokens without explicit approval from designer/UX expert. All necessary tokens already exist. This system is complete and frozen.

---

## Quick Start

### File Locations

All token files are in `my_flow_client/src/app/styles/tokens/`:

```
styles/tokens/
├── colors.css        # Color system (3 layers: primitive → semantic → component)
├── typography.css    # Fonts, sizes, weights, line heights
├── spacing.css       # Spacing scale (--space-0 to --space-48)
├── effects.css       # Shadows, blurs, border radius
└── animation.css     # Durations, easings
```

### Import Structure

Tokens are imported in `globals.css` using Tailwind v4 `@layer` syntax:

```css
/* Tailwind CSS v4.x import syntax */
@import 'tailwindcss';

/* Design Tokens - Layer ensures proper import order */
@layer tokens {
  @import './styles/tokens/colors.css' layer(tokens.colors);
  @import './styles/tokens/typography.css' layer(tokens.typography);
  @import './styles/tokens/spacing.css' layer(tokens.spacing);
  @import './styles/tokens/effects.css' layer(tokens.effects);
  @import './styles/tokens/animation.css' layer(tokens.animation);
}
```

**Why `@layer`?**
- Guarantees correct import order
- Build fails early if token file is missing
- Required for Tailwind v4 compatibility

---

## 3-Layer Token System

### The Pyramid Hierarchy

```
Component Tokens (Layer 3) ← Use these first
    ↓ (references)
Semantic Tokens (Layer 2)  ← Fallback to these
    ↓ (references)
Primitive Tokens (Layer 1) ← Never use directly
```

### Layer 1: Primitives (Never Use These)

**Rule:** Primitives are raw values. NEVER use them in components.

```css
/* ❌ WRONG: Using primitives directly */
.my-component {
  background: var(--primitive-work); /* DON'T DO THIS */
}
```

**Available Primitives:** `--primitive-work`, `--primitive-personal`, `--primitive-black-900`, etc.

### Layer 2: Semantic Tokens (General Purpose)

**Rule:** Use for general UI elements when no component token exists.

```css
/* ✅ CORRECT: Use semantic tokens for general UI */
.my-card {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}
```

**Most Used Semantic Tokens:**

| Category | Tokens | Usage |
|----------|--------|-------|
| **Backgrounds** | `--color-bg-primary`, `--color-bg-secondary`, `--color-bg-tertiary` | Page/card backgrounds |
| **Text** | `--color-text-primary`, `--color-text-secondary`, `--color-text-muted` | Text hierarchy |
| **Borders** | `--color-border`, `--color-border-hover`, `--color-border-focus` | All borders |
| **Context (Dynamic)** | `--color-context-current` | Auto-updates when context switches |

### Layer 3: Component Tokens (Always Prefer These)

**Rule:** Always use component tokens when they exist for your component type.

```css
/* ✅ BEST: Use component tokens */
.my-button {
  background: var(--button-bg-primary);
  color: var(--button-text-primary);
}

.my-button:hover {
  background: var(--button-bg-primary-hover);
}
```

**Available Component Token Sets:**

- **Buttons:** `--button-bg-primary/secondary/ghost/danger` (with `-hover`, `-active`, `-text-` variants)
- **Inputs:** `--input-bg`, `--input-border`, `--input-border-focus`, `--input-text`, `--input-placeholder`
- **Cards:** `--card-bg`, `--card-bg-hover`, `--card-border`, `--card-border-active`
- **Flow Cards:** `--flow-bg`, `--flow-bg-hover`, `--flow-border-left`, `--flow-text-completed`
- **Message Bubbles:** `--message-bg-user/ai/system` (with `-text-` variants)

---

## How to Use Tokens

### Option 1: Tailwind Arbitrary Values (Recommended)

```tsx
// ✅ RECOMMENDED: Use Tailwind with CSS tokens
<button className="bg-[var(--button-bg-primary)] hover:bg-[var(--button-bg-primary-hover)] text-[var(--button-text-primary)] px-4 py-2 rounded-md">
  Create Flow
</button>

<div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-4 rounded-lg">
  Card content
</div>
```

### Option 2: Component Variants (For shadcn/ui)

```tsx
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--button-bg-primary)] hover:bg-[var(--button-bg-primary-hover)] text-[var(--button-text-primary)]',
        secondary: 'bg-transparent border border-[var(--button-border-secondary)] hover:border-[var(--button-border-secondary-hover)] text-[var(--button-text-secondary)]',
        danger: 'bg-[var(--button-bg-danger)] hover:bg-[var(--button-bg-danger-hover)] text-[var(--button-text-danger)]',
      },
    },
  }
);
```

### Option 3: Custom CSS (When Necessary)

```css
.custom-tooltip {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
  font-size: var(--font-size-small);
  padding: var(--space-2) var(--space-3);
}
```

---

## Dynamic Context Theming

### How It Works

The `--color-context-current` token **automatically updates** when users switch contexts (Work → Personal → Rest → Social).

**File:** `src/lib/context-theme.ts`

```typescript
export function setContextTheme(context: ContextType): void {
  const root = document.documentElement;
  const styles = getComputedStyle(root);

  // Read from CSS (single source of truth)
  const base = styles.getPropertyValue(`--primitive-${context}`).trim();
  const hover = styles.getPropertyValue(`--primitive-${context}-hover`).trim();
  const active = styles.getPropertyValue(`--primitive-${context}-active`).trim();

  // Update current context tokens
  root.style.setProperty('--color-context-current', base);
  root.style.setProperty('--color-context-current-hover', hover);
  root.style.setProperty('--color-context-current-active', active);
}
```

### Which Components Auto-Update?

Any component using `--color-context-current` (or tokens that reference it) will automatically change color when context switches:

- **Primary buttons** (`--button-bg-primary`)
- **Flow card left borders** (`--flow-border-left`)
- **User message bubbles** (`--message-bg-user`)
- **Focus rings** (`--input-border-focus`)

### Example: Context-Aware Button

```tsx
// This button automatically changes color when context switches
<button className="bg-[var(--button-bg-primary)] hover:bg-[var(--button-bg-primary-hover)] text-[var(--button-text-primary)] px-4 py-2 rounded-md">
  Create Flow
</button>

// Context: Work → blue (#3b82f6)
// Context: Personal → orange (#f97316)
// Context: Rest → purple (#a855f7)
// Context: Social → green (#10b981)
```

---

## Migration Examples

### Example 1: Button Component

**BEFORE (Hardcoded Tailwind colors):**

```tsx
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
    },
  }
);
```

**AFTER (CSS Design Tokens):**

```tsx
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[var(--button-bg-primary)] hover:bg-[var(--button-bg-primary-hover)] text-[var(--button-text-primary)]',
        destructive: 'bg-[var(--button-bg-danger)] hover:bg-[var(--button-bg-danger-hover)] text-[var(--button-text-danger)]',
      },
    },
  }
);
```

### Example 2: Card Component

**BEFORE:**

```tsx
<div className="rounded-lg border bg-card text-card-foreground shadow-sm">
  <h3 className="text-lg font-semibold">Card Title</h3>
</div>
```

**AFTER:**

```tsx
<div className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--color-text-primary)] shadow-[var(--shadow-sm)]">
  <h3 className="text-lg font-semibold">Card Title</h3>
</div>
```

### Example 3: Navigation Component

**BEFORE:**

```tsx
<nav className="border-b border-border bg-background">
  <Link href="/" className="text-xl font-bold text-foreground">MyFlow</Link>
  <span className="text-sm text-muted-foreground">{email}</span>
</nav>
```

**AFTER:**

```tsx
<nav className="border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]">
  <Link href="/" className="text-xl font-bold text-[var(--color-text-primary)]">MyFlow</Link>
  <span className="text-sm text-[var(--color-text-secondary)]">{email}</span>
</nav>
```

---

## Common Patterns

### Pattern 1: Context-Aware Primary Button

```tsx
<button className="bg-[var(--button-bg-primary)] hover:bg-[var(--button-bg-primary-hover)] active:bg-[var(--button-bg-primary-active)] text-[var(--button-text-primary)] px-4 py-2 rounded-md">
  Context-Aware Action
</button>
```

### Pattern 2: Static Danger Button

```tsx
<button className="bg-[var(--button-bg-danger)] hover:bg-[var(--button-bg-danger-hover)] text-[var(--button-text-danger)] px-4 py-2 rounded-md">
  Delete Item
</button>
```

### Pattern 3: Card with Context Accent Border

```tsx
<div className="border-l-4 border-l-[var(--flow-border-left)] bg-[var(--card-bg)] border border-[var(--card-border)] p-4 rounded-r-lg">
  <h3 className="text-[var(--color-text-primary)]">Flow Title</h3>
</div>
```

### Pattern 4: Input with Focus State

```tsx
<input
  className="bg-[var(--input-bg)] border border-[var(--input-border)] hover:border-[var(--input-border-hover)] focus:border-[var(--input-border-focus)] focus:ring-1 focus:ring-[var(--input-border-focus)] text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] px-3 py-2 rounded-md"
  placeholder="Enter text..."
/>
```

---

## Common Pitfalls (DON'T DO THIS)

### ❌ Pitfall 1: Using Primitive Tokens Directly

```tsx
// ❌ WRONG
<button className="bg-[var(--primitive-work)]">Click me</button>

// ✅ CORRECT
<button className="bg-[var(--button-bg-primary)]">Click me</button>
```

### ❌ Pitfall 2: Hardcoding Colors

```tsx
// ❌ WRONG
<div className="bg-blue-500 text-white">Content</div>

// ✅ CORRECT
<div className="bg-[var(--button-bg-primary)] text-[var(--button-text-primary)]">Content</div>
```

### ❌ Pitfall 3: Creating New Tokens Without Approval

```css
/* ❌ WRONG: DO NOT ADD NEW TOKENS */
:root {
  --my-custom-color: #ff0000; /* NEVER DO THIS */
}
```

### ❌ Pitfall 4: Forgetting Hover/Active States

```tsx
// ❌ WRONG: Only base state uses tokens
<button className="bg-[var(--button-bg-primary)] hover:bg-blue-600">
  Incomplete
</button>

// ✅ CORRECT: All states use tokens
<button className="bg-[var(--button-bg-primary)] hover:bg-[var(--button-bg-primary-hover)] active:bg-[var(--button-bg-primary-active)]">
  Complete
</button>
```

---

## Token Selection Flowchart

```
What are you styling?
│
├─ Button? ───────────────────→ Use --button-*
├─ Input/Textarea? ───────────→ Use --input-*
├─ Card? ─────────────────────→ Use --card-*
├─ Flow Card? ────────────────→ Use --flow-*
├─ Message Bubble? ───────────→ Use --message-*
├─ General Background? ───────→ Use --color-bg-*
├─ General Text? ─────────────→ Use --color-text-*
├─ Border? ───────────────────→ Use --color-border*
├─ Context-Aware Color? ──────→ Use --color-context-current
└─ None of the above? ────────→ Use semantic (--color-*) OR request UX approval
```

---

## Quick Reference: Most Used Tokens

### Colors

```css
/* Backgrounds */
--color-bg-primary          /* Main app background (#0a0a0a) */
--color-bg-secondary        /* Cards, elevated surfaces (#1a1a1a) */
--color-bg-tertiary         /* Sections (#2a2a2a) */

/* Text */
--color-text-primary        /* Main text (#fafafa) */
--color-text-secondary      /* Secondary text (#a3a3a3) */
--color-text-muted          /* Muted text (#525252) */

/* Borders */
--color-border              /* Default borders (#404040) */
--color-border-hover        /* Hover borders (#525252) */
--color-border-focus        /* Focus rings (context color) */

/* Context (Dynamic) */
--color-context-current     /* Auto-updates when context switches */

/* Component Tokens */
--button-bg-primary         /* Primary button background (context color) */
--button-bg-danger          /* Danger button background (#ef4444) */
--card-bg                   /* Card background (#1a1a1a) */
--input-bg                  /* Input background (#1a1a1a) */
--flow-border-left          /* Flow card left border (context color) */
```

### Spacing

```css
--space-2    /* 8px - tight spacing */
--space-4    /* 16px - default component padding */
--space-6    /* 24px - section padding */
--space-8    /* 32px - large section gaps */
```

### Typography

```css
--font-size-body      /* 16px - default text */
--font-size-small     /* 14px - secondary text */
--font-size-h3        /* 20px - Heading 3 */
--font-size-h2        /* 24px - Heading 2 */
--font-weight-medium  /* 500 - default UI weight */
```

### Effects

```css
--shadow-sm          /* Default card shadow */
--shadow-lg          /* Elevated elements */
--radius-md          /* Default border radius (8px) */
```

---

## Support & Questions

**Q: Can I add a new token for my feature?**
A: No. Use existing tokens or get UX approval first. 99% of use cases are already covered.

**Q: Which layer should I use?**
A: Component (Layer 3) → Semantic (Layer 2) → Never Primitive (Layer 1)

**Q: How do I test dynamic context switching?**
A: Call `setContextTheme('personal')` and verify colors update automatically.

**Q: What if I need a color that doesn't exist?**
A: Double-check all 5 token files. If truly missing, request UX review. (File: docs/ux-design-tokens/css-tokenization-spec.md)

---

## Related Documents

- **Full Technical Specification:** [`css-tokenization-spec.md`](./css-tokenization-spec.md)
- **Coding Standards:** [`docs/architecture/coding-standards.md`](../architecture/coding-standards.md)
- **Tech Stack:** [`docs/architecture/tech-stack.md`](../architecture/tech-stack.md)

---

**Last Updated:** 2025-10-05
**For Developers:** Daily usage reference
**Status:** ✅ Complete & Frozen (no new tokens without approval)
