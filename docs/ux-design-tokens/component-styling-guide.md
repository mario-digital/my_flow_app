# My Flow Component Styling Guide

**Version:** 1.0
**Last Updated:** 2025-10-06
**Author:** Sally (UX Expert)
**Purpose:** Definitive styling reference for all My Flow components. Developers must follow these exact specifications.

---

## 🎨 Design Philosophy

My Flow is a **modern, intentional, calm productivity companion**—not another overwhelming TODO app. The visual language emphasizes:

- **Dark, Focused Aesthetic:** Single dark mode with deep blacks and sophisticated neutrals
- **Subtle Context Awareness:** Context colors appear as refined accents, not loud primary colors
- **Tactile, Responsive Interactions:** Clear visual feedback without being distracting
- **Intentional Scarcity:** Clean, uncluttered layouts that respect the user's attention
- **Professional Modernity:** Premium feel appropriate for knowledge workers and intentional living

### Color Strategy Update

**OLD:** Bright blue (#3B82F6) primary buttons everywhere
**NEW:** Neutral-first with context as subtle accent

- **Primary actions:** Sophisticated slate/neutral with subtle glow on hover
- **Context colors:** Reserved for left borders, icons, and focus states—not backgrounds
- **Hierarchy through elevation:** Shadows and subtle backgrounds, not loud colors

---

## 📚 Quick Reference Table

| Component | Base BG | Text Color | Border | Padding | Border Radius | Key States |
|-----------|---------|------------|--------|---------|---------------|------------|
| **Button Primary** | `--color-bg-tertiary` | `--color-text-primary` | `--color-border` | `--space-3` `--space-5` | `--radius-button` | Hover: border → `--color-context-current` |
| **Button Secondary** | `transparent` | `--color-text-primary` | `--color-border` | `--space-3` `--space-5` | `--radius-button` | Hover: border → `--color-context-current` |
| **Button Ghost** | `transparent` | `--color-text-secondary` | `none` | `--space-2` `--space-4` | `--radius-button` | Hover: bg → `--color-bg-tertiary` |
| **Card Standard** | `--card-bg` | `--color-text-primary` | `--card-border` | `--space-4` | `--radius-card` | Hover: bg → `--card-bg-hover` |
| **Flow Card** | `--flow-bg` | `--color-text-primary` | Left: `3px` `--flow-border-left` | `--space-4` | `--radius-card` | Hover: shadow → `--shadow-card-hover` |
| **Input** | `--input-bg` | `--input-text` | `--input-border` | `--space-3` | `--radius-input` | Focus: border → `--input-border-focus`, ring → `--shadow-focus` |
| **Modal** | `--color-bg-secondary` | `--color-text-primary` | `--color-border` | `--space-6` | `--radius-modal` | Backdrop: `--color-bg-overlay` |
| **Dropdown** | `--color-bg-secondary` | `--color-text-primary` | `--color-border` | `--space-2` | `--radius-md` | Shadow: `--shadow-dropdown` |

---

## 🎨 Updated Color Primitives

### New Neutral Palette (Sophisticated Grays)

Add these to `colors.css`:

```css
:root {
  /* Enhanced neutral palette for modern look */
  --primitive-slate-50: #f8fafc;
  --primitive-slate-100: #f1f5f9;
  --primitive-slate-200: #e2e8f0;
  --primitive-slate-300: #cbd5e1;
  --primitive-slate-400: #94a3b8;
  --primitive-slate-500: #64748b;
  --primitive-slate-600: #475569;
  --primitive-slate-700: #334155;
  --primitive-slate-800: #1e293b;
  --primitive-slate-900: #0f172a;

  /* Refined context colors - more sophisticated */
  --primitive-work: #6366f1;           /* Indigo - professional, focused */
  --primitive-work-hover: #818cf8;
  --primitive-work-active: #a5b4fc;

  --primitive-personal: #f59e0b;       /* Amber - warm, personal */
  --primitive-personal-hover: #fbbf24;
  --primitive-personal-active: #fcd34d;

  --primitive-rest: #8b5cf6;           /* Violet - calm, restorative */
  --primitive-rest-hover: #a78bfa;
  --primitive-rest-active: #c4b5fd;

  --primitive-social: #10b981;         /* Emerald - vibrant, connective */
  --primitive-social-hover: #34d399;
  --primitive-social-active: #6ee7b7;
}
```

### Updated Semantic Colors

Update `colors.css` semantic layer:

```css
:root {
  /* Backgrounds - deeper, more refined */
  --color-bg-primary: var(--primitive-black-900);      /* #0a0a0a - deepest black */
  --color-bg-secondary: var(--primitive-black-800);    /* #1a1a1a - cards, panels */
  --color-bg-tertiary: var(--primitive-black-700);     /* #2a2a2a - elevated elements */
  --color-bg-elevated: var(--primitive-slate-800);     /* #1e293b - highest elevation */

  /* Text - refined hierarchy */
  --color-text-primary: var(--primitive-white);        /* #fafafa - main text */
  --color-text-secondary: var(--primitive-slate-400);  /* #94a3b8 - secondary text */
  --color-text-muted: var(--primitive-slate-500);      /* #64748b - muted text */
  --color-text-disabled: var(--primitive-neutral-600); /* #404040 - disabled state */

  /* Borders - subtle and refined */
  --color-border-default: var(--primitive-slate-700);  /* #334155 - default borders */
  --color-border-subtle: var(--primitive-slate-800);   /* #1e293b - very subtle */
  --color-border-hover: var(--primitive-slate-600);    /* #475569 - hover state */
  --color-border-focus: var(--primitive-work);         /* Context color on focus */
}
```

### New Component Tokens

Add these to `colors.css` component layer:

```css
:root {
  /* ========================================
     BUTTON COMPONENTS - Neutral First Approach
     ======================================== */

  /* Primary Button - Neutral with glow */
  --button-bg-primary: var(--color-bg-tertiary);
  --button-bg-primary-hover: var(--color-bg-elevated);
  --button-text-primary: var(--color-text-primary);
  --button-border-primary: var(--color-border-default);
  --button-border-primary-hover: var(--color-context-current);
  --button-glow-primary-hover: 0 0 0 1px var(--color-context-current);

  /* Secondary Button - Outlined */
  --button-bg-secondary: transparent;
  --button-text-secondary: var(--color-text-primary);
  --button-border-secondary: var(--color-border-default);
  --button-border-secondary-hover: var(--color-context-current);

  /* Ghost Button - Minimal */
  --button-bg-ghost: transparent;
  --button-bg-ghost-hover: var(--color-bg-tertiary);
  --button-text-ghost: var(--color-text-secondary);
  --button-text-ghost-hover: var(--color-text-primary);

  /* Danger Button - Destructive actions */
  --button-bg-danger: transparent;
  --button-text-danger: var(--primitive-error);
  --button-border-danger: var(--primitive-error);
  --button-bg-danger-hover: rgba(239, 68, 68, 0.1);

  /* Context Button - Only for context-switching actions */
  --button-bg-context: var(--color-context-current);
  --button-bg-context-hover: var(--color-context-current-hover);
  --button-text-context: var(--primitive-white);

  /* ========================================
     CARD COMPONENTS
     ======================================== */

  /* Standard Card */
  --card-bg: var(--color-bg-secondary);
  --card-bg-hover: var(--color-bg-tertiary);
  --card-border: var(--color-border-subtle);
  --card-text: var(--color-text-primary);

  /* Flow Card - With context accent */
  --flow-card-bg: var(--color-bg-secondary);
  --flow-card-bg-hover: var(--color-bg-tertiary);
  --flow-card-border: var(--color-border-subtle);
  --flow-card-border-left: var(--color-context-current);
  --flow-card-border-left-width: 3px;
  --flow-card-text: var(--color-text-primary);
  --flow-card-text-completed: var(--color-text-muted);

  /* Context Card - For context switcher */
  --context-card-bg: var(--color-bg-secondary);
  --context-card-bg-hover: var(--color-bg-tertiary);
  --context-card-bg-active: var(--color-bg-elevated);
  --context-card-border: var(--color-border-subtle);
  --context-card-indicator: var(--color-context-current);

  /* ========================================
     FORM COMPONENTS
     ======================================== */

  /* Input Fields */
  --input-bg: var(--color-bg-secondary);
  --input-border: var(--color-border-default);
  --input-border-hover: var(--color-border-hover);
  --input-border-focus: var(--color-context-current);
  --input-text: var(--color-text-primary);
  --input-placeholder: var(--color-text-muted);
  --input-shadow-focus: 0 0 0 2px var(--color-context-current);

  /* ========================================
     NAVIGATION COMPONENTS
     ======================================== */

  /* Navigation Items */
  --nav-item-text: var(--color-text-secondary);
  --nav-item-text-hover: var(--color-text-primary);
  --nav-item-text-active: var(--color-text-primary);
  --nav-item-bg-hover: var(--color-bg-tertiary);
  --nav-item-bg-active: var(--color-bg-elevated);
  --nav-item-indicator: var(--color-context-current);

  /* ========================================
     OVERLAY COMPONENTS
     ======================================== */

  /* Modal/Dialog */
  --modal-bg: var(--color-bg-secondary);
  --modal-border: var(--color-border-default);
  --modal-backdrop: var(--color-bg-overlay);
  --modal-shadow: var(--shadow-modal);

  /* Dropdown/Popover */
  --dropdown-bg: var(--color-bg-secondary);
  --dropdown-border: var(--color-border-default);
  --dropdown-shadow: var(--shadow-dropdown);
  --dropdown-item-hover: var(--color-bg-tertiary);

  /* Tooltip */
  --tooltip-bg: var(--color-bg-elevated);
  --tooltip-text: var(--color-text-primary);
  --tooltip-shadow: var(--shadow-lg);

  /* ========================================
     FEEDBACK COMPONENTS
     ======================================== */

  /* Badge/Pill */
  --badge-bg: var(--color-bg-tertiary);
  --badge-text: var(--color-text-secondary);
  --badge-border: var(--color-border-subtle);

  /* Context Badge - Shows context color */
  --badge-context-bg: rgba(99, 102, 241, 0.1); /* Transparent context color */
  --badge-context-text: var(--color-context-current);
  --badge-context-border: var(--color-context-current);

  /* Alert - Success/Warning/Error */
  --alert-success-bg: var(--color-success-bg);
  --alert-success-text: var(--color-success);
  --alert-success-border: var(--color-success);

  --alert-warning-bg: var(--color-warning-bg);
  --alert-warning-text: var(--color-warning);
  --alert-warning-border: var(--color-warning);

  --alert-error-bg: var(--color-error-bg);
  --alert-error-text: var(--color-error);
  --alert-error-border: var(--color-error);
}
```

---

## 🔘 Buttons

### Primary Button (Neutral with Glow)

**Use Case:** Main actions, form submissions, confirmations
**NOT for:** Context switching (use Context Button instead)

**Specification:**
```
Background:     --button-bg-primary (#2a2a2a)
Text:           --button-text-primary (#fafafa)
Border:         1px solid --button-border-primary (#334155)
Padding:        --space-3 (12px) vertical, --space-5 (20px) horizontal
Border Radius:  --radius-button (6px)
Font Size:      --font-size-body (16px)
Font Weight:    --font-weight-medium (500)
Line Height:    --line-height-normal (1.4)
Transition:     all --anim-duration-fast (200ms) --anim-ease-out

States:
  Hover:
    Background:   --button-bg-primary-hover (#1e293b)
    Border:       --button-border-primary-hover (context color)
    Box Shadow:   --button-glow-primary-hover (0 0 0 1px context color)

  Active:
    Background:   --button-bg-primary-hover
    Border:       --button-border-primary-hover
    Transform:    scale(0.98)

  Focus:
    Outline:      none
    Box Shadow:   --shadow-focus (0 0 0 2px context color)

  Disabled:
    Background:   --color-bg-secondary
    Text:         --color-text-disabled
    Border:       --color-border-subtle
    Opacity:      0.5
    Cursor:       not-allowed
```

**Tailwind Implementation:**
```tsx
<button className="
  bg-bg-tertiary
  text-text-primary
  border border-border-default
  px-5 py-3
  rounded-button
  text-base font-medium leading-normal
  transition-all duration-fast ease-out
  hover:bg-bg-elevated hover:border-context
  hover:shadow-[0_0_0_1px_var(--color-context-current)]
  active:scale-[0.98]
  focus-visible:outline-none focus-visible:shadow-focus
  disabled:bg-bg-secondary disabled:text-text-disabled
  disabled:border-border-subtle disabled:opacity-50
  disabled:cursor-not-allowed
">
  Primary Action
</button>
```

---

### Secondary Button (Outlined)

**Use Case:** Secondary actions, cancel buttons, alternative options

**Specification:**
```
Background:     transparent
Text:           --button-text-secondary (#fafafa)
Border:         1px solid --button-border-secondary (#334155)
Padding:        --space-3 (12px) vertical, --space-5 (20px) horizontal
Border Radius:  --radius-button (6px)
Font Size:      --font-size-body (16px)
Font Weight:    --font-weight-medium (500)
Transition:     all --anim-duration-fast (200ms) --anim-ease-out

States:
  Hover:
    Background:   rgba(51, 65, 85, 0.1) (slate-700 at 10%)
    Border:       --button-border-secondary-hover (context color)

  Active:
    Background:   rgba(51, 65, 85, 0.2)
    Transform:    scale(0.98)

  Focus:
    Box Shadow:   --shadow-focus

  Disabled:
    Text:         --color-text-disabled
    Border:       --color-border-subtle
    Opacity:      0.5
```

**Tailwind Implementation:**
```tsx
<button className="
  bg-transparent
  text-text-primary
  border border-border-default
  px-5 py-3
  rounded-button
  text-base font-medium
  transition-all duration-fast ease-out
  hover:bg-slate-700/10 hover:border-context
  active:bg-slate-700/20 active:scale-[0.98]
  focus-visible:outline-none focus-visible:shadow-focus
  disabled:text-text-disabled disabled:border-border-subtle
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Secondary Action
</button>
```

---

### Ghost Button (Minimal)

**Use Case:** Tertiary actions, icon buttons, subtle interactions

**Specification:**
```
Background:     transparent
Text:           --button-text-ghost (#94a3b8)
Border:         none
Padding:        --space-2 (8px) vertical, --space-4 (16px) horizontal
Border Radius:  --radius-button (6px)
Font Size:      --font-size-body (16px)
Font Weight:    --font-weight-medium (500)
Transition:     all --anim-duration-fast (200ms) --anim-ease-out

States:
  Hover:
    Background:   --button-bg-ghost-hover (#2a2a2a)
    Text:         --button-text-ghost-hover (#fafafa)

  Active:
    Background:   --color-bg-elevated (#1e293b)
    Transform:    scale(0.98)

  Focus:
    Box Shadow:   --shadow-focus

  Disabled:
    Text:         --color-text-disabled
    Opacity:      0.5
```

**Tailwind Implementation:**
```tsx
<button className="
  bg-transparent
  text-text-secondary
  px-4 py-2
  rounded-button
  text-base font-medium
  transition-all duration-fast ease-out
  hover:bg-bg-tertiary hover:text-text-primary
  active:bg-bg-elevated active:scale-[0.98]
  focus-visible:outline-none focus-visible:shadow-focus
  disabled:text-text-disabled disabled:opacity-50
  disabled:cursor-not-allowed
">
  Ghost Action
</button>
```

---

### Danger Button (Destructive)

**Use Case:** Delete, remove, destructive actions

**Specification:**
```
Background:     transparent
Text:           --button-text-danger (#ef4444)
Border:         1px solid --button-border-danger (#ef4444)
Padding:        --space-3 (12px) vertical, --space-5 (20px) horizontal
Border Radius:  --radius-button (6px)
Font Size:      --font-size-body (16px)
Font Weight:    --font-weight-medium (500)
Transition:     all --anim-duration-fast (200ms) --anim-ease-out

States:
  Hover:
    Background:   --button-bg-danger-hover (rgba(239, 68, 68, 0.1))
    Border:       --primitive-error-hover (#f87171)
    Text:         --primitive-error-hover

  Active:
    Background:   rgba(239, 68, 68, 0.2)
    Transform:    scale(0.98)

  Focus:
    Box Shadow:   --shadow-focus-error (0 0 0 2px error color)
```

**Tailwind Implementation:**
```tsx
<button className="
  bg-transparent
  text-error
  border border-error
  px-5 py-3
  rounded-button
  text-base font-medium
  transition-all duration-fast ease-out
  hover:bg-error/10 hover:text-error-hover hover:border-error-hover
  active:bg-error/20 active:scale-[0.98]
  focus-visible:outline-none focus-visible:shadow-focus-error
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Delete
</button>
```

---

### Context Button (Special)

**Use Case:** ONLY for context switching actions
**Appearance:** Uses current context color as background

**Specification:**
```
Background:     --button-bg-context (current context color)
Text:           --button-text-context (#fafafa)
Border:         none
Padding:        --space-3 (12px) vertical, --space-5 (20px) horizontal
Border Radius:  --radius-button (6px)
Font Size:      --font-size-body (16px)
Font Weight:    --font-weight-semibold (600)
Transition:     all --anim-duration-fast (200ms) --anim-ease-out

States:
  Hover:
    Background:   --button-bg-context-hover (lighter context color)
    Transform:    translateY(-1px)
    Box Shadow:   --shadow-sm

  Active:
    Transform:    translateY(0) scale(0.98)
```

**Tailwind Implementation:**
```tsx
<button className="
  bg-[var(--color-context-current)]
  text-white
  px-5 py-3
  rounded-button
  text-base font-semibold
  transition-all duration-fast ease-out
  hover:bg-[var(--color-context-current-hover)]
  hover:-translate-y-0.5 hover:shadow-sm
  active:translate-y-0 active:scale-[0.98]
  focus-visible:outline-none focus-visible:shadow-focus
">
  Switch to Work Flow
</button>
```

---

## 🎴 Cards

### Standard Card

**Use Case:** Generic content containers, settings panels, info displays

**Specification:**
```
Background:     --card-bg (#1a1a1a)
Text:           --card-text (#fafafa)
Border:         1px solid --card-border (#1e293b)
Padding:        --space-4 (16px)
Border Radius:  --radius-card (8px)
Box Shadow:     --shadow-card (0 2px 4px rgba(0,0,0,0.4))
Transition:     all --anim-duration-fast (200ms) --anim-ease-out

States:
  Hover (if interactive):
    Background:   --card-bg-hover (#2a2a2a)
    Box Shadow:   --shadow-card-hover (0 4px 6px rgba(0,0,0,0.5))
    Transform:    translateY(-2px)

  Focus (if interactive):
    Box Shadow:   --shadow-focus
```

**Tailwind Implementation:**
```tsx
<div className="
  bg-card
  text-card-text
  border border-card-border
  p-4
  rounded-card
  shadow-card
  transition-all duration-fast ease-out
  hover:bg-card-bg-hover hover:shadow-card-hover
  hover:-translate-y-0.5
">
  {/* Card content */}
</div>
```

---

### Flow Card (Context-Aware Task Card)

**Use Case:** Individual flow/task items within context views
**Special:** 3px left border in context color

**Specification:**
```
Background:     --flow-card-bg (#1a1a1a)
Text:           --flow-card-text (#fafafa)
Border:         1px solid --flow-card-border (#1e293b)
Border Left:    3px solid --flow-card-border-left (context color)
Padding:        --space-4 (16px)
Border Radius:  --radius-card (8px)
Box Shadow:     --shadow-card
Transition:     all --anim-duration-fast (200ms) --anim-ease-out

Layout:
  - Checkbox (left, 20px icon)
  - Flow title (--font-size-body, --font-weight-medium)
  - Flow description (--font-size-small, --color-text-secondary)
  - Due date/metadata (--font-size-tiny, --color-text-muted)

States:
  Hover:
    Background:   --flow-card-bg-hover (#2a2a2a)
    Box Shadow:   --shadow-card-hover
    Cursor:       pointer

  Completed:
    Text:         --flow-card-text-completed (#64748b - muted)
    Text Decoration: line-through
    Opacity:      0.7

  Focus:
    Border:       --color-context-current
    Box Shadow:   --shadow-focus
```

**Tailwind Implementation:**
```tsx
<div className="
  bg-[var(--flow-card-bg)]
  text-[var(--flow-card-text)]
  border border-[var(--flow-card-border)]
  border-l-[3px] border-l-[var(--flow-card-border-left)]
  p-4
  rounded-card
  shadow-card
  transition-all duration-fast ease-out
  hover:bg-[var(--flow-card-bg-hover)] hover:shadow-card-hover
  hover:cursor-pointer
  focus-within:border-context focus-within:shadow-focus
  [&.completed]:text-text-muted [&.completed]:line-through
  [&.completed]:opacity-70
">
  <div className="flex items-start gap-3">
    {/* Checkbox */}
    <input type="checkbox" className="w-5 h-5 mt-0.5" />

    <div className="flex-1">
      {/* Flow title */}
      <h3 className="text-base font-medium leading-normal mb-1">
        Review Q4 planning document
      </h3>

      {/* Flow description */}
      <p className="text-small text-text-secondary leading-relaxed mb-2">
        Check budget allocations and team headcount
      </p>

      {/* Metadata */}
      <div className="flex items-center gap-3 text-tiny text-text-muted">
        <span>Due: Oct 10</span>
        <span>•</span>
        <span>Priority: High</span>
      </div>
    </div>
  </div>
</div>
```

---

### Context Card (For Context Switcher)

**Use Case:** Context selection cards in switcher dropdown/panel
**Special:** Shows context icon + color indicator

**Specification:**
```
Background:     --context-card-bg (#1a1a1a)
Border:         1px solid --context-card-border (#1e293b)
Padding:        --space-3 (12px)
Border Radius:  --radius-md (8px)
Transition:     all --anim-duration-fast (200ms) --anim-ease-out

Layout:
  - Context icon (32px, in context color)
  - Context name (--font-size-body, --font-weight-medium)
  - Flow count (--font-size-small, --color-text-secondary)
  - Color indicator dot (8px, context color)

States:
  Hover:
    Background:   --context-card-bg-hover (#2a2a2a)
    Cursor:       pointer

  Active (current context):
    Background:   --context-card-bg-active (#1e293b)
    Border:       1px solid --context-card-indicator (context color)

  Focus:
    Box Shadow:   --shadow-focus
```

**Tailwind Implementation:**
```tsx
<button className="
  w-full
  bg-[var(--context-card-bg)]
  border border-[var(--context-card-border)]
  p-3
  rounded-md
  transition-all duration-fast ease-out
  hover:bg-[var(--context-card-bg-hover)]
  hover:cursor-pointer
  focus-visible:outline-none focus-visible:shadow-focus
  [&.active]:bg-[var(--context-card-bg-active)]
  [&.active]:border-[var(--context-card-indicator)]
">
  <div className="flex items-center gap-3">
    {/* Context icon (32px) */}
    <div className="w-8 h-8 flex items-center justify-center
                    text-[var(--color-context-current)]">
      <WorkIcon className="w-full h-full" />
    </div>

    <div className="flex-1 text-left">
      {/* Context name */}
      <div className="text-base font-medium text-text-primary">
        Work Flow
      </div>
      {/* Flow count */}
      <div className="text-small text-text-secondary">
        3 active flows
      </div>
    </div>

    {/* Color indicator dot */}
    <div className="w-2 h-2 rounded-full
                    bg-[var(--color-context-current)]" />
  </div>
</button>
```

---

## 📝 Forms

### Text Input

**Use Case:** Single-line text entry, email, password, search

**Specification:**
```
Background:     --input-bg (#1a1a1a)
Text:           --input-text (#fafafa)
Placeholder:    --input-placeholder (#64748b)
Border:         1px solid --input-border (#334155)
Padding:        --space-3 (12px) vertical, --space-4 (16px) horizontal
Border Radius:  --radius-input (8px)
Height:         44px (--space-11)
Font Size:      --font-size-body (16px)
Font Weight:    --font-weight-regular (400)
Line Height:    --line-height-normal (1.4)
Transition:     all --anim-duration-fast (200ms) --anim-ease-out

States:
  Hover:
    Border:       --input-border-hover (#475569)

  Focus:
    Border:       --input-border-focus (context color)
    Box Shadow:   --input-shadow-focus (0 0 0 2px context color)
    Outline:      none

  Error:
    Border:       --color-error (#ef4444)
    Box Shadow:   0 0 0 2px rgba(239, 68, 68, 0.2)

  Disabled:
    Background:   --color-bg-primary
    Text:         --color-text-disabled
    Border:       --color-border-subtle
    Cursor:       not-allowed
```

**Tailwind Implementation:**
```tsx
<input
  type="text"
  placeholder="Enter flow title..."
  className="
    w-full h-11
    bg-input
    text-input-text
    placeholder:text-input-placeholder
    border border-input-border
    px-4 py-3
    rounded-input
    text-base font-normal leading-normal
    transition-all duration-fast ease-out
    hover:border-input-border-hover
    focus:outline-none focus:border-input-border-focus
    focus:shadow-[var(--input-shadow-focus)]
    disabled:bg-bg-primary disabled:text-text-disabled
    disabled:border-border-subtle disabled:cursor-not-allowed
    [&.error]:border-error
    [&.error]:shadow-[0_0_0_2px_rgba(239,68,68,0.2)]
  "
/>
```

---

### Textarea

**Use Case:** Multi-line text entry, descriptions, notes

**Specification:**
```
Background:     --input-bg (#1a1a1a)
Text:           --input-text (#fafafa)
Placeholder:    --input-placeholder (#64748b)
Border:         1px solid --input-border (#334155)
Padding:        --space-3 (12px)
Border Radius:  --radius-input (8px)
Min Height:     120px (--space-30)
Font Size:      --font-size-body (16px)
Font Weight:    --font-weight-regular (400)
Line Height:    --line-height-loose (1.6)
Resize:         vertical
Transition:     all --anim-duration-fast (200ms) --anim-ease-out

States: Same as Text Input
```

**Tailwind Implementation:**
```tsx
<textarea
  placeholder="Describe the flow..."
  rows={5}
  className="
    w-full min-h-[120px]
    bg-input
    text-input-text
    placeholder:text-input-placeholder
    border border-input-border
    p-3
    rounded-input
    text-base font-normal leading-loose
    resize-y
    transition-all duration-fast ease-out
    hover:border-input-border-hover
    focus:outline-none focus:border-input-border-focus
    focus:shadow-[var(--input-shadow-focus)]
    disabled:bg-bg-primary disabled:text-text-disabled
    disabled:border-border-subtle disabled:cursor-not-allowed
  "
/>
```

---

### Select Dropdown

**Use Case:** Single-choice selection from predefined options

**Specification:**
```
Background:     --input-bg (#1a1a1a)
Text:           --input-text (#fafafa)
Border:         1px solid --input-border (#334155)
Padding:        --space-3 (12px) vertical, --space-4 (16px) horizontal
Border Radius:  --radius-input (8px)
Height:         44px
Font Size:      --font-size-body (16px)
Icon:           Chevron down (16px, --color-text-secondary)
Transition:     all --anim-duration-fast (200ms) --anim-ease-out

Dropdown Panel:
  Background:   --dropdown-bg (#1a1a1a)
  Border:       1px solid --dropdown-border (#334155)
  Shadow:       --dropdown-shadow
  Border Radius: --radius-md (8px)
  Max Height:   320px (scrollable)

Dropdown Item:
  Padding:      --space-2 (8px) vertical, --space-3 (12px) horizontal
  Hover BG:     --dropdown-item-hover (#2a2a2a)
  Selected BG:  --color-bg-elevated (#1e293b)
  Selected Text: --color-context-current

States: Same as Text Input
```

**Tailwind Implementation (using shadcn/ui Select):**
```tsx
<Select>
  <SelectTrigger className="
    w-full h-11
    bg-input
    text-input-text
    border border-input-border
    px-4 py-3
    rounded-input
    text-base
    transition-all duration-fast ease-out
    hover:border-input-border-hover
    focus:outline-none focus:border-input-border-focus
    focus:shadow-[var(--input-shadow-focus)]
  ">
    <SelectValue placeholder="Select priority..." />
  </SelectTrigger>

  <SelectContent className="
    bg-dropdown-bg
    border border-dropdown-border
    rounded-md
    shadow-dropdown
    max-h-80
  ">
    <SelectItem value="high" className="
      px-3 py-2
      text-base
      hover:bg-dropdown-item-hover
      focus:bg-bg-elevated focus:text-context
      cursor-pointer
    ">
      High Priority
    </SelectItem>
    <SelectItem value="medium">Medium Priority</SelectItem>
    <SelectItem value="low">Low Priority</SelectItem>
  </SelectContent>
</Select>
```

---

### Label

**Use Case:** Form field labels, input descriptions

**Specification:**
```
Text:           --color-text-primary (#fafafa)
Font Size:      --font-size-small (14px)
Font Weight:    --font-weight-medium (500)
Line Height:    --line-height-normal (1.4)
Margin Bottom:  --space-2 (8px)

Required Indicator (*):
  Color:        --color-error (#ef4444)
  Margin Left:  --space-1 (4px)
```

**Tailwind Implementation:**
```tsx
<label className="
  block
  text-small text-text-primary font-medium
  leading-normal
  mb-2
">
  Flow Title
  <span className="text-error ml-1">*</span>
</label>
```

---

### Error Message

**Use Case:** Form validation errors, inline error feedback

**Specification:**
```
Text:           --color-error (#ef4444)
Font Size:      --font-size-small (14px)
Font Weight:    --font-weight-regular (400)
Line Height:    --line-height-relaxed (1.5)
Margin Top:     --space-2 (8px)
Icon:           Error icon (16px, --color-error)
```

**Tailwind Implementation:**
```tsx
<div className="
  flex items-start gap-2
  mt-2
  text-small text-error font-normal leading-relaxed
">
  <ErrorIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
  <span>Flow title is required</span>
</div>
```

---

## 🎯 Navigation

### Navigation Item (Sidebar/Header)

**Use Case:** Main navigation links, sidebar menu items

**Specification:**
```
Background:     transparent
Text:           --nav-item-text (#94a3b8)
Padding:        --space-2 (8px) vertical, --space-3 (12px) horizontal
Border Radius:  --radius-sm (6px)
Font Size:      --font-size-body (16px)
Font Weight:    --font-weight-medium (500)
Transition:     all --anim-duration-fast (200ms) --anim-ease-out

Icon:
  Size:         20px (--icon-size-sm)
  Color:        --nav-item-text
  Margin Right: --space-2 (8px)

States:
  Hover:
    Background:   --nav-item-bg-hover (#2a2a2a)
    Text:         --nav-item-text-hover (#fafafa)

  Active (current page):
    Background:   --nav-item-bg-active (#1e293b)
    Text:         --nav-item-text-active (#fafafa)
    Border Left:  3px solid --nav-item-indicator (context color)

  Focus:
    Box Shadow:   --shadow-focus
```

**Tailwind Implementation:**
```tsx
<a href="/dashboard" className="
  flex items-center gap-2
  px-3 py-2
  rounded-sm
  text-base font-medium
  text-nav-item-text
  transition-all duration-fast ease-out
  hover:bg-nav-item-bg-hover hover:text-nav-item-text-hover
  focus-visible:outline-none focus-visible:shadow-focus
  [&.active]:bg-nav-item-bg-active [&.active]:text-nav-item-text-active
  [&.active]:border-l-[3px] [&.active]:border-l-[var(--nav-item-indicator)]
">
  <DashboardIcon className="w-5 h-5" />
  <span>Dashboard</span>
</a>
```

---

## 💬 Overlays

### Modal/Dialog

**Use Case:** Confirmations, forms, detail views that require focus

**Specification:**
```
Backdrop:
  Background:   --modal-backdrop (rgba(10, 10, 10, 0.6))
  Z-Index:      --z-modal-backdrop (4000)

Modal Container:
  Background:   --modal-bg (#1a1a1a)
  Border:       1px solid --modal-border (#334155)
  Border Radius: --radius-modal (12px)
  Box Shadow:   --modal-shadow (large elevation)
  Padding:      --space-6 (24px)
  Max Width:    560px (--space-140)
  Z-Index:      --z-modal (5000)

Header:
  Font Size:    --font-size-h2 (24px)
  Font Weight:  --font-weight-semibold (600)
  Margin Bottom: --space-4 (16px)

Body:
  Font Size:    --font-size-body (16px)
  Line Height:  --line-height-loose (1.6)
  Margin Bottom: --space-6 (24px)

Footer (Actions):
  Display:      flex
  Gap:          --space-3 (12px)
  Justify:      flex-end

Animation:
  Entry:        fade + scale up from 0.95
  Exit:         fade + scale down to 0.95
  Duration:     --anim-duration-normal (300ms)
  Easing:       --anim-ease-out
```

**Tailwind Implementation (using shadcn/ui Dialog):**
```tsx
<Dialog>
  {/* Backdrop */}
  <DialogOverlay className="
    fixed inset-0
    bg-[var(--modal-backdrop)]
    z-modal-backdrop
    animate-fade-in
  " />

  {/* Modal */}
  <DialogContent className="
    fixed left-1/2 top-1/2
    -translate-x-1/2 -translate-y-1/2
    bg-modal-bg
    border border-modal-border
    rounded-modal
    shadow-modal
    p-6
    max-w-[560px] w-full
    z-modal
    animate-scale-fade-in
  ">
    {/* Header */}
    <DialogHeader className="mb-4">
      <DialogTitle className="
        text-h2 font-semibold text-text-primary
      ">
        Delete Flow?
      </DialogTitle>
    </DialogHeader>

    {/* Body */}
    <div className="
      text-base leading-loose text-text-primary
      mb-6
    ">
      Are you sure you want to delete "Review Q4 planning document"?
      This action cannot be undone.
    </div>

    {/* Footer */}
    <DialogFooter className="
      flex gap-3 justify-end
    ">
      <Button variant="secondary">Cancel</Button>
      <Button variant="danger">Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### Dropdown Menu

**Use Case:** Action menus, context menus, more options

**Specification:**
```
Background:     --dropdown-bg (#1a1a1a)
Border:         1px solid --dropdown-border (#334155)
Border Radius:  --radius-md (8px)
Box Shadow:     --dropdown-shadow
Padding:        --space-2 (8px) vertical
Min Width:      200px
Z-Index:        --z-dropdown (1000)

Item:
  Padding:      --space-2 (8px) vertical, --space-3 (12px) horizontal
  Font Size:    --font-size-body (16px)
  Text:         --color-text-primary
  Transition:   background --anim-duration-fast ease-out

Item States:
  Hover:
    Background:   --dropdown-item-hover (#2a2a2a)
    Cursor:       pointer

  Focus:
    Background:   --dropdown-item-hover
    Outline:      none

Separator:
  Height:       1px
  Background:   --color-border-subtle (#1e293b)
  Margin:       --space-2 (8px) vertical

Animation:
  Entry:        fade + slide down 4px
  Duration:     --anim-duration-fast (200ms)
  Easing:       --anim-ease-out
```

**Tailwind Implementation (using shadcn/ui DropdownMenu):**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost">
      <MoreIcon className="w-5 h-5" />
    </Button>
  </DropdownMenuTrigger>

  <DropdownMenuContent className="
    bg-dropdown-bg
    border border-dropdown-border
    rounded-md
    shadow-dropdown
    py-2
    min-w-[200px]
    z-dropdown
    animate-slide-down-fade
  ">
    <DropdownMenuItem className="
      px-3 py-2
      text-base text-text-primary
      transition-colors duration-fast ease-out
      hover:bg-dropdown-item-hover
      focus:bg-dropdown-item-hover focus:outline-none
      cursor-pointer
    ">
      Edit Flow
    </DropdownMenuItem>

    <DropdownMenuItem>
      Mark Complete
    </DropdownMenuItem>

    <DropdownMenuSeparator className="
      h-px bg-border-subtle my-2
    " />

    <DropdownMenuItem className="
      text-error hover:bg-error/10
    ">
      Delete Flow
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### Tooltip

**Use Case:** Helpful hints, icon explanations, keyboard shortcuts

**Specification:**
```
Background:     --tooltip-bg (#1e293b)
Text:           --tooltip-text (#fafafa)
Border:         none
Border Radius:  --radius-sm (6px)
Box Shadow:     --tooltip-shadow (large)
Padding:        --space-2 (8px) vertical, --space-3 (12px) horizontal
Font Size:      --font-size-small (14px)
Font Weight:    --font-weight-medium (500)
Line Height:    --line-height-snug (1.3)
Max Width:      280px
Z-Index:        --z-tooltip (7000)

Arrow:
  Size:         6px
  Color:        --tooltip-bg

Animation:
  Entry:        fade + slide from trigger direction
  Duration:     --anim-duration-fast (200ms)
  Delay:        500ms (before showing)
  Easing:       --anim-ease-out
```

**Tailwind Implementation (using shadcn/ui Tooltip):**
```tsx
<Tooltip delayDuration={500}>
  <TooltipTrigger asChild>
    <Button variant="ghost">
      <HelpIcon className="w-5 h-5" />
    </Button>
  </TooltipTrigger>

  <TooltipContent className="
    bg-tooltip-bg
    text-tooltip-text
    rounded-sm
    shadow-tooltip
    px-3 py-2
    text-small font-medium leading-snug
    max-w-[280px]
    z-tooltip
    animate-fade-slide
  ">
    Flows are actionable items extracted from your conversations
    <TooltipArrow className="fill-tooltip-bg" />
  </TooltipContent>
</Tooltip>
```

---

## 🏷️ Badges & Indicators

### Badge/Pill

**Use Case:** Status indicators, counts, tags

**Specification:**
```
Background:     --badge-bg (#2a2a2a)
Text:           --badge-text (#94a3b8)
Border:         1px solid --badge-border (#1e293b)
Border Radius:  --radius-full (9999px)
Padding:        --space-1 (4px) vertical, --space-2 (8px) horizontal
Font Size:      --font-size-tiny (12px)
Font Weight:    --font-weight-medium (500)
Line Height:    --line-height-tight (1.2)
```

**Tailwind Implementation:**
```tsx
<span className="
  inline-flex items-center
  bg-badge-bg
  text-badge-text
  border border-badge-border
  px-2 py-1
  rounded-full
  text-tiny font-medium leading-tight
">
  3 active
</span>
```

---

### Context Badge (Shows Context Color)

**Use Case:** Indicating which context a flow belongs to

**Specification:**
```
Background:     --badge-context-bg (transparent context color at 10%)
Text:           --badge-context-text (context color)
Border:         1px solid --badge-context-border (context color)
Border Radius:  --radius-full (9999px)
Padding:        --space-1 (4px) vertical, --space-2 (8px) horizontal
Font Size:      --font-size-tiny (12px)
Font Weight:    --font-weight-medium (500)
```

**Tailwind Implementation:**
```tsx
<span className="
  inline-flex items-center gap-1.5
  bg-[rgba(99,102,241,0.1)]
  text-[var(--color-context-current)]
  border border-[var(--color-context-current)]
  px-2 py-1
  rounded-full
  text-tiny font-medium
">
  <div className="w-2 h-2 rounded-full
                  bg-[var(--color-context-current)]" />
  Work Flow
</span>
```

---

## 🔔 Alerts & Notifications

### Alert (Inline Feedback)

**Use Case:** Success messages, warnings, errors, info within a page

**Specification:**
```
Success:
  Background:   --alert-success-bg (rgba(34, 197, 94, 0.1))
  Text:         --alert-success-text (#22c55e)
  Border:       1px solid --alert-success-border (#22c55e)

Warning:
  Background:   --alert-warning-bg (rgba(234, 179, 8, 0.1))
  Text:         --alert-warning-text (#eab308)
  Border:       1px solid --alert-warning-border (#eab308)

Error:
  Background:   --alert-error-bg (rgba(239, 68, 68, 0.1))
  Text:         --alert-error-text (#ef4444)
  Border:       1px solid --alert-error-border (#ef4444)

Common Properties:
  Border Radius: --radius-md (8px)
  Padding:      --space-3 (12px) vertical, --space-4 (16px) horizontal
  Font Size:    --font-size-body (16px)
  Line Height:  --line-height-relaxed (1.5)

Icon:
  Size:         20px
  Margin Right: --space-3 (12px)
```

**Tailwind Implementation:**
```tsx
{/* Success Alert */}
<div className="
  flex items-start gap-3
  bg-alert-success-bg
  text-alert-success-text
  border border-alert-success-border
  px-4 py-3
  rounded-md
  text-base leading-relaxed
">
  <CheckCircleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
  <div>
    <strong className="font-semibold">Success!</strong>
    <p>Flow created successfully.</p>
  </div>
</div>

{/* Error Alert */}
<div className="
  flex items-start gap-3
  bg-alert-error-bg
  text-alert-error-text
  border border-alert-error-border
  px-4 py-3
  rounded-md
  text-base leading-relaxed
">
  <AlertCircleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
  <div>
    <strong className="font-semibold">Error</strong>
    <p>Failed to create flow. Please try again.</p>
  </div>
</div>
```

---

## 🎭 Special Components

### AI Chat Message Bubble

**Use Case:** Displaying AI and user messages in chat interface

**User Message Specification:**
```
Background:     --message-bg-user (context color)
Text:           --message-text-user (#fafafa)
Border Radius:  --radius-lg (12px) with bottom-right 4px
Padding:        --space-3 (12px) vertical, --space-4 (16px) horizontal
Max Width:      70% of container
Align:          right
Font Size:      --font-size-body (16px)
Line Height:    --line-height-relaxed (1.5)
```

**AI Message Specification:**
```
Background:     --message-bg-ai (#1a1a1a)
Text:           --message-text-ai (#fafafa)
Border:         1px solid --color-border-subtle (#1e293b)
Border Radius:  --radius-lg (12px) with bottom-left 4px
Padding:        --space-3 (12px) vertical, --space-4 (16px) horizontal
Max Width:      70% of container
Align:          left
Font Size:      --font-size-body (16px)
Line Height:    --line-height-relaxed (1.5)

AI Avatar:
  Size:         32px (--icon-size-lg)
  Background:   --color-bg-elevated
  Border:       1px solid --color-border-default
  Border Radius: --radius-full
  Margin Right: --space-3 (12px)
```

**Tailwind Implementation:**
```tsx
{/* User Message */}
<div className="flex justify-end mb-4">
  <div className="
    bg-[var(--message-bg-user)]
    text-[var(--message-text-user)]
    px-4 py-3
    rounded-lg rounded-br-[4px]
    max-w-[70%]
    text-base leading-relaxed
  ">
    I need to review the Q4 planning document before the meeting
  </div>
</div>

{/* AI Message */}
<div className="flex items-start gap-3 mb-4">
  {/* AI Avatar */}
  <div className="
    w-8 h-8 flex-shrink-0
    bg-bg-elevated
    border border-border-default
    rounded-full
    flex items-center justify-center
  ">
    <AIIcon className="w-4 h-4 text-context" />
  </div>

  {/* Message */}
  <div className="
    bg-[var(--message-bg-ai)]
    text-[var(--message-text-ai)]
    border border-border-subtle
    px-4 py-3
    rounded-lg rounded-bl-[4px]
    max-w-[70%]
    text-base leading-relaxed
  ">
    I've created a flow: "Review Q4 planning document" in your Work context.
    Would you like me to set a due date?
  </div>
</div>
```

---

### Context Switcher Panel

**Use Case:** Main UI component for switching between contexts

**Specification:**
```
Container:
  Background:   --color-bg-secondary (#1a1a1a)
  Border:       1px solid --color-border-default (#334155)
  Border Radius: --radius-lg (12px)
  Box Shadow:   --shadow-dropdown
  Padding:      --space-4 (16px)
  Min Width:    320px
  Z-Index:      --z-dropdown (1000)

Header:
  Text:         --color-text-primary
  Font Size:    --font-size-large (18px)
  Font Weight:  --font-weight-semibold (600)
  Margin Bottom: --space-4 (16px)

Context Grid:
  Display:      grid
  Grid Columns: 2
  Gap:          --space-3 (12px)

Each Context Card: See Context Card specification above
```

**Tailwind Implementation:**
```tsx
<div className="
  bg-bg-secondary
  border border-border-default
  rounded-lg
  shadow-dropdown
  p-4
  min-w-[320px]
  z-dropdown
">
  {/* Header */}
  <h3 className="
    text-large font-semibold text-text-primary
    mb-4
  ">
    Switch Context
  </h3>

  {/* Context Grid */}
  <div className="
    grid grid-cols-2 gap-3
  ">
    <ContextCard context="work" active />
    <ContextCard context="personal" />
    <ContextCard context="rest" />
    <ContextCard context="social" />
  </div>
</div>
```

---

### Loading Skeleton

**Use Case:** Placeholder while content loads

**Specification:**
```
Background:     --color-bg-tertiary (#2a2a2a)
Border Radius:  --radius-md (8px)
Animation:      pulse (opacity 1 → 0.5 → 1)
Duration:       --anim-duration-slowest (600ms)
Easing:         --anim-ease-in-out

Variants:
  Text Line:    Height 16px (--space-4)
  Title:        Height 24px (--space-6)
  Avatar:       32px circle (--icon-size-lg)
  Card:         Full card dimensions
```

**Tailwind Implementation:**
```tsx
{/* Text Skeleton */}
<div className="
  h-4 bg-bg-tertiary rounded-md
  animate-pulse
" />

{/* Card Skeleton */}
<div className="
  bg-bg-secondary border border-border-subtle
  p-4 rounded-card
  space-y-3
">
  <div className="h-6 bg-bg-tertiary rounded-md w-3/4 animate-pulse" />
  <div className="h-4 bg-bg-tertiary rounded-md w-full animate-pulse" />
  <div className="h-4 bg-bg-tertiary rounded-md w-5/6 animate-pulse" />
</div>
```

---

## ⚙️ States & Animations

### Hover States (General Guidelines)

**Interaction Type: Clickable Elements**
- **Background:** Lighten by one step in token hierarchy
- **Border:** Transition to context color or one step lighter
- **Transform:** Subtle translateY(-2px) for cards
- **Transition:** `all 200ms ease-out`

**Example:**
```css
.interactive-element {
  transition: all var(--anim-duration-fast) var(--anim-ease-out);
}

.interactive-element:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-context-current);
  transform: translateY(-2px);
}
```

---

### Focus States (Keyboard Navigation)

**All Interactive Elements MUST Have:**
- **Outline:** `none` (remove default browser outline)
- **Box Shadow:** `--shadow-focus` (0 0 0 2px context color)
- **Border:** Optional context color border
- **Visible Indicator:** WCAG AA compliant 2px minimum

**Example:**
```css
.interactive-element:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
  border-color: var(--color-context-current);
}
```

---

### Active/Pressed States

**Clickable Elements:**
- **Transform:** `scale(0.98)` for tactile feedback
- **Duration:** `--anim-duration-instant` (100ms)
- **Background:** Maintain hover state or go one step darker

**Example:**
```css
.button:active {
  transform: scale(0.98);
  transition: transform var(--anim-duration-instant) var(--anim-ease-out);
}
```

---

### Disabled States

**All Form Elements & Buttons:**
- **Opacity:** `0.5`
- **Cursor:** `not-allowed`
- **Background:** `--color-bg-secondary` or lighter than default
- **Text:** `--color-text-disabled`
- **Border:** `--color-border-subtle`
- **No Pointer Events:** Remove hover/focus effects

**Example:**
```css
.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--color-bg-secondary);
  color: var(--color-text-disabled);
  border-color: var(--color-border-subtle);
  pointer-events: none;
}
```

---

### Loading States

**Buttons:**
- **Opacity:** `0.8`
- **Cursor:** `wait`
- **Icon:** Spinning loader (20px, --color-text-primary)
- **Text:** Optional "Loading..." or keep original text

**Example:**
```tsx
<button disabled className="
  opacity-80 cursor-wait
  /* ... other button styles ... */
">
  <LoaderIcon className="w-5 h-5 animate-spin mr-2" />
  Loading...
</button>
```

**Spinner Animation:**
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
```

---

## 🎬 Animations

### Page Transitions

**Route Changes:**
- **Entry:** Fade in + slide up 8px
- **Duration:** `--anim-duration-normal` (300ms)
- **Easing:** `--anim-ease-out`

```css
@keyframes page-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-transition {
  animation: page-enter var(--anim-duration-normal) var(--anim-ease-out);
}
```

---

### Modal/Dialog Animations

**Entry:**
- **Backdrop:** Fade in
- **Modal:** Fade in + scale up from 0.95

**Exit:**
- **Backdrop:** Fade out
- **Modal:** Fade out + scale down to 0.95

**Duration:** `--anim-duration-normal` (300ms)

```css
@keyframes modal-enter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes backdrop-enter {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

---

### Dropdown Animations

**Entry:**
- Fade in + slide down 4px
- **Duration:** `--anim-duration-fast` (200ms)

```css
@keyframes dropdown-enter {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

### Flow Card Appear (When AI Creates)

**Special Animation:** Bouncy entrance for delight

**Entry:**
- Fade in + slide down + subtle bounce
- **Duration:** `--anim-duration-normal` (300ms)
- **Easing:** `--anim-ease-bounce`

```css
@keyframes flow-appear {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  60% {
    opacity: 1;
    transform: translateY(4px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.flow-card-appear {
  animation: flow-appear var(--anim-duration-normal) var(--anim-ease-bounce);
}
```

---

## 📐 Layout & Spacing

### Page Layout

**Container:**
- **Max Width:** `1280px` (desktop)
- **Padding:** `--space-6` (24px) on mobile, `--space-8` (32px) on desktop
- **Margin:** `0 auto` (centered)

**Section Spacing:**
- **Between Sections:** `--space-8` (32px) or `--space-12` (48px)
- **Within Sections:** `--space-4` (16px) to `--space-6` (24px)

---

### Component Spacing

**Cards:**
- **Internal Padding:** `--space-4` (16px)
- **Gap Between Items:** `--space-3` (12px)

**Forms:**
- **Label to Input:** `--space-2` (8px)
- **Between Fields:** `--space-4` (16px)
- **Field to Button:** `--space-6` (24px)

**Lists:**
- **Between Items:** `--space-2` (8px) to `--space-3` (12px)
- **Section Headers:** `--space-4` (16px) margin top

---

## 🎨 Typography Scale

### Headings

```
H1: --font-size-h1 (32px), --font-weight-bold (700), --line-height-tight (1.2)
H2: --font-size-h2 (24px), --font-weight-semibold (600), --line-height-snug (1.3)
H3: --font-size-h3 (20px), --font-weight-semibold (600), --line-height-normal (1.4)
```

### Body Text

```
Large:  --font-size-large (18px), --font-weight-regular (400), --line-height-relaxed (1.5)
Body:   --font-size-body (16px), --font-weight-regular (400), --line-height-loose (1.6)
Small:  --font-size-small (14px), --font-weight-regular (400), --line-height-relaxed (1.5)
Tiny:   --font-size-tiny (12px), --font-weight-medium (500), --line-height-normal (1.4)
```

### Text Styles

**Primary Text:**
```css
color: var(--color-text-primary);
font-size: var(--font-size-body);
line-height: var(--line-height-loose);
```

**Secondary Text:**
```css
color: var(--color-text-secondary);
font-size: var(--font-size-small);
line-height: var(--line-height-relaxed);
```

**Muted Text:**
```css
color: var(--color-text-muted);
font-size: var(--font-size-small);
line-height: var(--line-height-normal);
```

---

## 🎯 Developer Checklist

When implementing a new component, ensure:

- [ ] All colors use design tokens (no hardcoded hex values)
- [ ] All spacing uses token scale (`--space-*`)
- [ ] All typography uses token definitions
- [ ] Hover states are defined and smooth (200ms transition)
- [ ] Focus states are WCAG AA compliant (2px ring, context color)
- [ ] Active states provide tactile feedback (scale 0.98)
- [ ] Disabled states are clearly distinguishable (opacity 0.5)
- [ ] Loading states prevent multiple submissions
- [ ] Animations use defined durations and easings
- [ ] Component is keyboard accessible (focus-visible styles)
- [ ] Component works on mobile (responsive breakpoints)
- [ ] Context color integration is appropriate (subtle, not overwhelming)

---

## 🚀 Usage Guidelines

### DO ✅

- **Reference tokens exclusively** - Never hardcode values
- **Follow hover → focus → active state order** in CSS
- **Use context colors sparingly** - For accents, borders, focus states only
- **Maintain visual hierarchy** - Through elevation (shadows) and backgrounds
- **Keep interactions tactile** - Subtle transforms, smooth transitions
- **Design for keyboard navigation** - Always style `:focus-visible`

### DON'T ❌

- **Don't use bright colors as backgrounds** - Context colors are accents
- **Don't skip disabled states** - Every interactive element needs one
- **Don't hardcode pixel values** - Use token scale
- **Don't ignore mobile** - Responsive design is required
- **Don't overwhelm with animations** - Subtle and purposeful only
- **Don't use blue as primary** - We've moved to neutral-first design

---

## 📝 Token Reference Quick List

### Most Used Tokens

```css
/* Colors */
--color-bg-primary: #0a0a0a
--color-bg-secondary: #1a1a1a
--color-bg-tertiary: #2a2a2a
--color-bg-elevated: #1e293b
--color-text-primary: #fafafa
--color-text-secondary: #94a3b8
--color-text-muted: #64748b
--color-border-default: #334155
--color-context-current: (dynamic - indigo/amber/violet/emerald)

/* Spacing */
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px

/* Typography */
--font-size-body: 16px
--font-weight-medium: 500
--line-height-normal: 1.4

/* Effects */
--radius-button: 6px
--radius-card: 8px
--shadow-card: 0 2px 4px rgba(0,0,0,0.4)
--shadow-focus: 0 0 0 2px var(--color-context-current)

/* Animation */
--anim-duration-fast: 200ms
--anim-ease-out: cubic-bezier(0, 0, 0.2, 1)
```

---

**End of Component Styling Guide**

**Version:** 1.0
**Status:** Living Document
**Updates:** Any new components or patterns must be added here before implementation
**Questions?** Consult with Sally (UX Expert) before deviating from this guide
