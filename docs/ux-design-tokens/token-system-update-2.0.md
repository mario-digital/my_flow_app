# Token System Update 2.0 - CSS Variable Usage Corrections

## Executive Summary

**Issue**: The codebase currently uses verbose Tailwind arbitrary value syntax `[var(--css-custom-property)]` throughout components, despite `tailwind.config.ts` having proper utility class mappings already defined. This creates unnecessarily verbose code and doesn't leverage the design token system properly.

**Root Cause**: Previous LLM work created components using direct CSS variable references instead of utilizing the Tailwind utility mappings that were configured in `tailwind.config.ts`.

**Impact**:
- Code is harder to read and maintain
- Design token system not being used as intended
- Inconsistent patterns across the codebase
- More verbose class strings

**Scope**: 6 component files with 33+ instances requiring updates

**Solution**: Replace all arbitrary value syntax with corresponding Tailwind utility classes that are already mapped in the configuration.

---

## Section 1: Tailwind Config Verification

### Current Tailwind Mappings (tailwind.config.ts:13-51)

✅ **These mappings are already defined and ready to use:**

```typescript
colors: {
  // Backgrounds
  'bg-primary': 'var(--color-bg-primary)',
  'bg-secondary': 'var(--color-bg-secondary)',
  'bg-tertiary': 'var(--color-bg-tertiary)',

  // Text colors
  'text-primary': 'var(--color-text-primary)',
  'text-secondary': 'var(--color-text-secondary)',
  'text-muted': 'var(--color-text-muted)',

  // Borders
  'border': 'var(--color-border)',
  'border-hover': 'var(--color-border-hover)',

  // Context (dynamic theming)
  'context': 'var(--color-context-current)',

  // Component-specific
  'button-primary': 'var(--button-bg-primary)',
  'button-primary-hover': 'var(--button-bg-primary-hover)',
  'button-primary-active': 'var(--button-bg-primary-active)',
  'button-danger': 'var(--button-bg-danger)',
  'button-danger-hover': 'var(--button-bg-danger-hover)',
  'button-danger-active': 'var(--button-bg-danger-active)',
  'button-secondary': 'var(--button-bg-secondary)',
  'button-ghost': 'var(--button-bg-ghost)',
  'card': 'var(--card-bg)',
  'card-border': 'var(--card-border)',
  'input': 'var(--input-bg)',
}
```

### Missing Mappings to Add

⚠️ **Add these mappings to tailwind.config.ts before proceeding:**

```typescript
// Add to the colors object in tailwind.config.ts
colors: {
  // ... existing mappings ...

  // Button text colors (currently missing)
  'button-text-primary': 'var(--button-text-primary)',
  'button-text-danger': 'var(--button-text-danger)',
  'button-text-secondary': 'var(--button-text-secondary)',
  'button-text-ghost': 'var(--button-text-ghost)',
  'button-text-ghost-hover': 'var(--button-text-ghost-hover)',

  // Button borders (currently missing)
  'button-border-secondary': 'var(--button-border-secondary)',
  'button-border-secondary-hover': 'var(--button-border-secondary-hover)',
}
```

**Also add shadow mappings** to the `extend` section:

```typescript
extend: {
  boxShadow: {
    'sm': 'var(--shadow-sm)',
    'md': 'var(--shadow-md)',
    'lg': 'var(--shadow-lg)',
  },
}
```

---

## Section 2: File-by-File Update Instructions

### File 1: `src/components/navigation.tsx`

**Location**: `/Users/mario/Projects/AZNext_AI_Builder_Projects/my_flow_app/my_flow_client/src/components/navigation.tsx`

**Total Instances**: 3

#### Line 25: Navigation Container
```typescript
// CURRENT (INCORRECT)
<nav className="border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]">

// REPLACE WITH (CORRECT)
<nav className="border-b border-border bg-bg-primary">
```

#### Line 31: Logo Text
```typescript
// CURRENT (INCORRECT)
<Link href="/" className="text-xl font-bold text-[var(--color-text-primary)]">

// REPLACE WITH (CORRECT)
<Link href="/" className="text-xl font-bold text-text-primary">
```

#### Line 39: User Email Display
```typescript
// CURRENT (INCORRECT)
<span className="text-sm text-[var(--color-text-secondary)]">

// REPLACE WITH (CORRECT)
<span className="text-sm text-text-secondary">
```

---

### File 2: `src/app/page.tsx`

**Location**: `/Users/mario/Projects/AZNext_AI_Builder_Projects/my_flow_app/my_flow_client/src/app/page.tsx`

**Total Instances**: 6

#### Line 16: Main Heading
```typescript
// CURRENT (INCORRECT)
<h1 className="mb-4 text-4xl font-bold text-[var(--color-text-primary)]">

// REPLACE WITH (CORRECT)
<h1 className="mb-4 text-4xl font-bold text-text-primary">
```

#### Line 19: Subtitle
```typescript
// CURRENT (INCORRECT)
<p className="mb-8 text-lg text-[var(--color-text-secondary)]">

// REPLACE WITH (CORRECT)
<p className="mb-8 text-lg text-text-secondary">
```

#### Line 31: Features Container
```typescript
// CURRENT (INCORRECT)
<div className="grid gap-6 rounded-lg bg-[var(--color-bg-tertiary)] p-8">

// REPLACE WITH (CORRECT)
<div className="grid gap-6 rounded-lg bg-bg-tertiary p-8">
```

#### Line 46: Get Started Button
```typescript
// CURRENT (INCORRECT)
className="rounded-lg bg-[var(--button-bg-primary)] px-6 py-3 font-semibold text-[var(--button-text-primary)]"

// REPLACE WITH (CORRECT)
className="rounded-lg bg-button-primary px-6 py-3 font-semibold text-button-text-primary"
```

#### Line 52 & 57: Feature Headings
```typescript
// CURRENT (INCORRECT) - appears twice
<h3 className="mb-2 text-xl font-semibold text-[var(--color-text-primary)]">

// REPLACE WITH (CORRECT)
<h3 className="mb-2 text-xl font-semibold text-text-primary">
```

---

### File 3: `src/app/(auth)/login/page.tsx`

**Location**: `/Users/mario/Projects/AZNext_AI_Builder_Projects/my_flow_app/my_flow_client/src/app/(auth)/login/page.tsx`

**Total Instances**: 4

#### Line 20: Login Container
```typescript
// CURRENT (INCORRECT)
<div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-primary)]">

// REPLACE WITH (CORRECT)
<div className="flex min-h-screen items-center justify-center bg-bg-primary">
```

#### Line 21: Card Container
```typescript
// CURRENT (INCORRECT)
<div className="w-full max-w-md rounded-lg bg-[var(--card-bg)] p-8 shadow-[var(--shadow-lg)]">

// REPLACE WITH (CORRECT)
<div className="w-full max-w-md rounded-lg bg-card p-8 shadow-lg">
```

#### Line 22: Heading
```typescript
// CURRENT (INCORRECT)
<h1 className="mb-6 text-3xl font-bold text-[var(--color-text-primary)]">

// REPLACE WITH (CORRECT)
<h1 className="mb-6 text-3xl font-bold text-text-primary">
```

#### Line 26: Description Text
```typescript
// CURRENT (INCORRECT)
<p className="mb-6 text-[var(--color-text-secondary)]">

// REPLACE WITH (CORRECT)
<p className="mb-6 text-text-secondary">
```

---

### File 4: `src/app/dashboard/page.tsx`

**Location**: `/Users/mario/Projects/AZNext_AI_Builder_Projects/my_flow_app/my_flow_client/src/app/dashboard/page.tsx`

**Total Instances**: 6

#### Line 27: Page Heading
```typescript
// CURRENT (INCORRECT)
<h1 className="text-3xl font-bold text-[var(--color-text-primary)]">

// REPLACE WITH (CORRECT)
<h1 className="text-3xl font-bold text-text-primary">
```

#### Line 30: Welcome Message
```typescript
// CURRENT (INCORRECT)
<p className="mt-2 text-[var(--color-text-secondary)]">

// REPLACE WITH (CORRECT)
<p className="mt-2 text-text-secondary">
```

#### Line 35: Card Container
```typescript
// CURRENT (INCORRECT)
<div className="mt-4 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow-sm)]">

// REPLACE WITH (CORRECT)
<div className="mt-4 rounded-lg border border-card-border bg-card p-4 shadow-sm">
```

#### Line 36: Card Heading
```typescript
// CURRENT (INCORRECT)
<h2 className="text-xl font-semibold text-[var(--color-text-primary)]">

// REPLACE WITH (CORRECT)
<h2 className="text-xl font-semibold text-text-primary">
```

#### Line 38 & 42: Card Description Texts
```typescript
// CURRENT (INCORRECT) - appears twice
<p className="text-sm text-[var(--color-text-secondary)]">

// REPLACE WITH (CORRECT)
<p className="text-sm text-text-secondary">
```

---

### File 5: `src/app/(auth)/callback/page.tsx`

**Location**: `/Users/mario/Projects/AZNext_AI_Builder_Projects/my_flow_app/my_flow_client/src/app/(auth)/callback/page.tsx`

**Total Instances**: 2

#### Line 35: Loading Container
```typescript
// CURRENT (INCORRECT)
<div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-primary)]">

// REPLACE WITH (CORRECT)
<div className="flex min-h-screen items-center justify-center bg-bg-primary">
```

#### Line 37: Loading Text
```typescript
// CURRENT (INCORRECT)
<p className="text-lg text-[var(--color-text-secondary)]">

// REPLACE WITH (CORRECT)
<p className="text-lg text-text-secondary">
```

---

### File 6: `src/components/ui/button.tsx` ⚠️ CRITICAL

**Location**: `/Users/mario/Projects/AZNext_AI_Builder_Projects/my_flow_app/my_flow_client/src/components/ui/button.tsx`

**Total Instances**: 12+

**⚠️ IMPORTANT**: This is a reusable component used throughout the app. Changes here affect all buttons.

#### Line 8: Base Button Classes
```typescript
// CURRENT (INCORRECT)
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-context-current)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',

// REPLACE WITH (CORRECT)
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-context focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
```

#### Lines 12-14: Default Variant
```typescript
// CURRENT (INCORRECT)
default:
  'bg-[var(--button-bg-primary)] text-[var(--button-text-primary)] shadow-[var(--shadow-sm)] hover:bg-[var(--button-bg-primary-hover)] active:bg-[var(--button-bg-primary-active)]',

// REPLACE WITH (CORRECT)
default:
  'bg-button-primary text-button-text-primary shadow-sm hover:bg-button-primary-hover active:bg-button-primary-active',
```

#### Lines 14-16: Destructive Variant
```typescript
// CURRENT (INCORRECT)
destructive:
  'bg-[var(--button-bg-danger)] text-[var(--button-text-danger)] shadow-[var(--shadow-sm)] hover:bg-[var(--button-bg-danger-hover)] active:bg-[var(--button-bg-danger-active)]',

// REPLACE WITH (CORRECT)
destructive:
  'bg-button-danger text-button-text-danger shadow-sm hover:bg-button-danger-hover active:bg-button-danger-active',
```

#### Lines 16-18: Outline Variant
```typescript
// CURRENT (INCORRECT)
outline:
  'border-2 border-[var(--button-border-secondary)] bg-[var(--button-bg-secondary)] shadow-[var(--shadow-sm)] hover:border-[var(--button-border-secondary-hover)] text-[var(--button-text-secondary)]',

// REPLACE WITH (CORRECT)
outline:
  'border-2 border-button-border-secondary bg-button-secondary shadow-sm hover:border-button-border-secondary-hover text-button-text-secondary',
```

#### Lines 18-20: Secondary Variant
```typescript
// CURRENT (INCORRECT)
secondary:
  'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] shadow-[var(--shadow-sm)] hover:bg-[var(--color-bg-tertiary)]',

// REPLACE WITH (CORRECT)
secondary:
  'bg-bg-secondary text-text-primary shadow-sm hover:bg-bg-tertiary',
```

#### Lines 20-22: Ghost Variant
```typescript
// CURRENT (INCORRECT)
ghost:
  'bg-[var(--button-bg-ghost)] text-[var(--button-text-ghost)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--button-text-ghost-hover)]',

// REPLACE WITH (CORRECT)
ghost:
  'bg-button-ghost text-button-text-ghost hover:bg-bg-tertiary hover:text-button-text-ghost-hover',
```

#### Line 22: Link Variant
```typescript
// CURRENT (INCORRECT)
link: 'text-[var(--color-context-current)] underline-offset-4 hover:underline',

// REPLACE WITH (CORRECT)
link: 'text-context underline-offset-4 hover:underline',
```

---

## Section 3: Update Execution Plan

### Step 1: Update tailwind.config.ts (REQUIRED FIRST)

**File**: `my_flow_client/tailwind.config.ts`

**Action**: Add missing color and shadow mappings as specified in Section 1.

**Location**: Lines 13-51 (colors object) and line 52+ (extend section)

### Step 2: Update Components (in this order)

1. ✅ **button.tsx** - Update first (affects all buttons throughout app)
2. ✅ **navigation.tsx** - Update second (affects all pages)
3. ✅ **page.tsx** (home page)
4. ✅ **login/page.tsx**
5. ✅ **dashboard/page.tsx**
6. ✅ **callback/page.tsx**

### Step 3: Verification Checklist

After each file update:

- [ ] File saves without TypeScript errors
- [ ] Run `bun run build` in my_flow_client directory
- [ ] Verify Tailwind compilation succeeds
- [ ] No console warnings about unknown utilities

After all updates:

- [ ] Start dev server: `bun run dev`
- [ ] Visually verify home page renders correctly
- [ ] Visually verify login page renders correctly
- [ ] Visually verify dashboard renders correctly
- [ ] Test all button variants render correctly
- [ ] Test navigation component renders correctly
- [ ] Verify no visual regressions (colors, spacing, shadows should look identical)

---

## Section 4: Find-and-Replace Patterns

### Global Patterns (use with caution - verify each match)

**Pattern 1: Background Colors**
- Find: `bg-\[var\(--color-bg-primary\)\]`
- Replace: `bg-bg-primary`

- Find: `bg-\[var\(--color-bg-secondary\)\]`
- Replace: `bg-bg-secondary`

- Find: `bg-\[var\(--color-bg-tertiary\)\]`
- Replace: `bg-bg-tertiary`

**Pattern 2: Text Colors**
- Find: `text-\[var\(--color-text-primary\)\]`
- Replace: `text-text-primary`

- Find: `text-\[var\(--color-text-secondary\)\]`
- Replace: `text-text-secondary`

- Find: `text-\[var\(--color-text-muted\)\]`
- Replace: `text-text-muted`

**Pattern 3: Borders**
- Find: `border-\[var\(--color-border\)\]`
- Replace: `border-border`

- Find: `border-\[var\(--card-border\)\]`
- Replace: `border-card-border`

**Pattern 4: Context Color**
- Find: `\[var\(--color-context-current\)\]`
- Replace: `context` (adjust prefix: `text-context`, `bg-context`, `ring-context`)

**Pattern 5: Shadows**
- Find: `shadow-\[var\(--shadow-sm\)\]`
- Replace: `shadow-sm`

- Find: `shadow-\[var\(--shadow-md\)\]`
- Replace: `shadow-md`

- Find: `shadow-\[var\(--shadow-lg\)\]`
- Replace: `shadow-lg`

**Pattern 6: Button Colors** (after adding missing mappings)
- Find: `bg-\[var\(--button-bg-primary\)\]`
- Replace: `bg-button-primary`

- Find: `text-\[var\(--button-text-primary\)\]`
- Replace: `text-button-text-primary`

---

## Section 5: Testing Strategy

### Visual Regression Testing

**Before Changes**:
1. Take screenshots of all pages:
   - Home page (`/`)
   - Login page (`/login`)
   - Dashboard page (`/dashboard`)
   - Sample of all button variants

**After Changes**:
1. Take identical screenshots
2. Compare side-by-side
3. Verify NO visual differences (colors, spacing, shadows should be pixel-perfect match)

### Build Verification

```bash
# Navigate to frontend directory
cd my_flow_client

# Clean build
rm -rf .next

# Build production bundle
bun run build

# Expected output: Successful compilation with no warnings
```

### Runtime Verification

```bash
# Start dev server
bun run dev

# Visit these URLs and verify:
# - http://localhost:3000 (home page)
# - http://localhost:3000/login (login page)
# - http://localhost:3000/dashboard (dashboard - requires auth)

# Check browser console for errors (should be none)
```

---

## Section 6: Rollback Plan

If issues occur after updates:

1. **Git Status**: Check which files were modified
   ```bash
   git status
   git diff
   ```

2. **Revert Specific File**:
   ```bash
   git checkout HEAD -- my_flow_client/src/components/ui/button.tsx
   ```

3. **Revert All Changes**:
   ```bash
   git checkout HEAD -- my_flow_client/src/
   ```

4. **Identify Issue**:
   - Check Tailwind config has all required mappings
   - Verify CSS custom properties are defined in token files
   - Check for typos in utility class names

---

## Appendix A: Complete Mapping Reference

### Tailwind Utility → CSS Custom Property

| Tailwind Utility | CSS Custom Property | Layer |
|-----------------|---------------------|-------|
| `bg-bg-primary` | `var(--color-bg-primary)` | Semantic |
| `bg-bg-secondary` | `var(--color-bg-secondary)` | Semantic |
| `bg-bg-tertiary` | `var(--color-bg-tertiary)` | Semantic |
| `text-text-primary` | `var(--color-text-primary)` | Semantic |
| `text-text-secondary` | `var(--color-text-secondary)` | Semantic |
| `text-text-muted` | `var(--color-text-muted)` | Semantic |
| `border-border` | `var(--color-border)` | Semantic |
| `border-card-border` | `var(--card-border)` | Component |
| `text-context` / `bg-context` | `var(--color-context-current)` | Semantic |
| `bg-button-primary` | `var(--button-bg-primary)` | Component |
| `text-button-text-primary` | `var(--button-text-primary)` | Component |
| `bg-card` | `var(--card-bg)` | Component |
| `shadow-sm` | `var(--shadow-sm)` | Semantic |
| `shadow-md` | `var(--shadow-md)` | Semantic |
| `shadow-lg` | `var(--shadow-lg)` | Semantic |

---

## Appendix B: Why This Matters

### Before (Verbose, Hard to Read)
```typescript
<button className="bg-[var(--button-bg-primary)] text-[var(--button-text-primary)] shadow-[var(--shadow-sm)] hover:bg-[var(--button-bg-primary-hover)]">
  Click Me
</button>
```

### After (Clean, Maintainable)
```typescript
<button className="bg-button-primary text-button-text-primary shadow-sm hover:bg-button-primary-hover">
  Click Me
</button>
```

**Benefits**:
- ✅ 40-50% shorter class strings
- ✅ Easier to read and understand intent
- ✅ Leverages Tailwind's IntelliSense for autocomplete
- ✅ Consistent with Tailwind best practices
- ✅ Proper use of design token system
- ✅ Easier to refactor and maintain
- ✅ Type-safe (Tailwind validates utility names at build time)

---

## Summary

**Total Files to Update**: 7 (1 config + 6 components)
**Total Instances to Fix**: 33+
**Estimated Time**: 30-45 minutes
**Risk Level**: Low (purely cosmetic refactor, no logic changes)
**Testing Required**: Visual verification + build verification

**Key Success Criteria**:
1. All arbitrary value syntax `[var(--*)]` replaced with Tailwind utilities
2. Zero visual regressions
3. Successful build with no warnings
4. All token mappings properly utilized
