import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
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
        'button-primary-hover': 'var(--button-bg-primary-hover)',
        'button-primary-active': 'var(--button-bg-primary-active)',
        'button-danger': 'var(--button-bg-danger)',
        'button-danger-hover': 'var(--button-bg-danger-hover)',
        'button-danger-active': 'var(--button-bg-danger-active)',
        'button-secondary': 'var(--button-bg-secondary)',
        'button-ghost': 'var(--button-bg-ghost)',
        'button-text-primary': 'var(--button-text-primary)',
        'button-text-danger': 'var(--button-text-danger)',
        'button-text-secondary': 'var(--button-text-secondary)',
        'button-text-ghost': 'var(--button-text-ghost)',
        'button-text-ghost-hover': 'var(--button-text-ghost-hover)',
        'button-border-secondary': 'var(--button-border-secondary)',
        'button-border-secondary-hover': 'var(--button-border-secondary-hover)',
        'card': 'var(--card-bg)',
        'card-border': 'var(--card-border)',
        'input': 'var(--input-bg)',
      },

      // Spacing - use default Tailwind scale (already matches 4px increments)
      spacing: {
        // Tailwind's default scale is perfect, but we can add custom ones
        // 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24 already map to our tokens
        '32': 'var(--space-32)', // 128px - Large section spacing
        '40': 'var(--space-40)', // 160px - Extra large sections
        '48': 'var(--space-48)', // 192px - Hero sections, large layouts
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
