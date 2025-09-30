# User Interface Design Goals

## Overall UX Vision

My Flow delivers a calm, focused interface that minimizes cognitive load during context switching. The design emphasizes clarity, speed, and visual distinction between contexts through thoughtful use of color and iconography. Dark mode creates a distraction-free environment suitable for extended use. The interface should feel conversational and natural, encouraging users to interact with the AI as they would with a colleague or assistant.

## Key Interaction Paradigms

- **Context-First Navigation:** The context switcher is always visible and accessible, allowing instant transitions without losing place
- **Conversational Interface:** The AI chat is the primary interaction method, with traditional CRUD forms as secondary alternatives
- **Progressive Disclosure:** Flow details expand inline rather than navigating to separate pages
- **Optimistic Updates:** UI reflects actions immediately while background operations complete, with graceful error rollback

## Core Screens and Views

- Login Screen
- Main Dashboard (context overview with flow counts)
- Context Chat View (AI conversation + flow list for current context)
- Flow Management Panel (list view with quick actions)
- Settings Page (context management, preferences)

## Accessibility: WCAG AA

All interactive elements must be keyboard navigable, screen reader compatible, and provide clear focus indicators. Color is not the sole means of conveying information (use icons and text labels as well).

## Branding

- **Dark Mode Only:** No light mode variant. Background uses deep blacks/grays for reduced eye strain
- **CSS Design Tokens:** All colors, spacing, typography, and visual properties are defined as CSS custom properties (CSS variables) from day one
- **Context-Specific Accent Colors:** Each context type has a distinct accent color (work=blue, personal=orange, rest=purple, social=green)

**Example CSS Design Tokens:**
```css
/* Color tokens */
--color-bg-primary: #0a0a0a;
--color-bg-secondary: #1a1a1a;
--color-bg-tertiary: #2a2a1a;
--color-text-primary: #e8e8e8;
--color-text-secondary: #a8a8a8;
--color-accent-work: #4a9eff;
--color-accent-personal: #ff9d5c;
--color-accent-rest: #9d7aff;
--color-accent-social: #6bcc85;

/* Spacing tokens */
--space-xs: 0.25rem;
--space-sm: 0.5rem;
--space-md: 1rem;
--space-lg: 1.5rem;
--space-xl: 2rem;

/* Typography tokens */
--font-family-base: 'Inter', system-ui, sans-serif;
--font-size-xs: 0.75rem;
--font-size-sm: 0.875rem;
--font-size-base: 1rem;
--font-size-lg: 1.25rem;
--font-size-xl: 1.5rem;

/* Radius and shadow tokens */
--radius-sm: 0.375rem;
--radius-md: 0.5rem;
--radius-lg: 0.75rem;
--shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
--shadow-md: 0 4px 6px rgba(0,0,0,0.4);
```

## Target Device and Platforms: Web Responsive

Desktop-first responsive design (1920x1080 primary, 1440x900 secondary). Mobile support is secondary for MVP but interface should degrade gracefully.

---
