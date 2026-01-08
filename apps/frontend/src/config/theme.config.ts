/**
 * Theme Configuration
 *
 * Centralized UI configuration following object-style architecture.
 * All colors, fonts, spacing, and animations defined here.
 *
 * Usage:
 *   import { themeConfig } from '@/config/theme.config'
 *   <div style={{ color: themeConfig.colors.primary }}>
 */

export const themeConfig = {
  /**
   * Color palette
   * Based on purple/pink gradient theme with dark backgrounds
   */
  colors: {
    // Primary colors
    primary: '#8B5CF6',        // Purple
    primaryHover: '#7C3AED',
    primaryLight: '#A78BFA',
    primaryDark: '#6D28D9',

    // Secondary colors
    secondary: '#EC4899',      // Pink
    secondaryHover: '#DB2777',
    secondaryLight: '#F472B6',

    // Background colors
    background: '#0F172A',     // Dark slate
    backgroundLight: '#1E293B',
    backgroundLighter: '#334155',
    surface: '#1E293B',
    surfaceHover: '#334155',

    // Text colors
    text: '#F1F5F9',           // Light slate
    textSecondary: '#94A3B8',
    textMuted: '#64748B',

    // Status colors
    success: '#10B981',        // Green
    error: '#EF4444',          // Red
    warning: '#F59E0B',        // Amber
    info: '#3B82F6',           // Blue

    // Border colors
    border: '#334155',
    borderLight: '#475569',

    // Overlay
    overlay: 'rgba(15, 23, 42, 0.75)',

    // Glass morphism
    glass: 'rgba(30, 41, 59, 0.5)',
    glassHover: 'rgba(30, 41, 59, 0.7)',
  },

  /**
   * Typography
   */
  fonts: {
    heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"Fira Code", "Courier New", monospace',
  },

  fontSizes: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    md: '1rem',         // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
  },

  fontWeights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  /**
   * Spacing
   */
  spacing: {
    xs: '0.25rem',      // 4px
    sm: '0.5rem',       // 8px
    md: '1rem',         // 16px
    lg: '1.5rem',       // 24px
    xl: '2rem',         // 32px
    '2xl': '3rem',      // 48px
    '3xl': '4rem',      // 64px
    '4xl': '6rem',      // 96px
  },

  /**
   * Border radius
   */
  radius: {
    none: '0',
    sm: '0.25rem',      // 4px
    md: '0.5rem',       // 8px
    lg: '0.75rem',      // 12px
    xl: '1rem',         // 16px
    '2xl': '1.5rem',    // 24px
    full: '9999px',
  },

  /**
   * Shadows
   */
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glow: '0 0 20px rgba(139, 92, 246, 0.3)',
    glowPink: '0 0 20px rgba(236, 72, 153, 0.3)',
  },

  /**
   * Animations
   * Subtle, professional animations
   */
  animations: {
    // Durations
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',

    // Easing functions
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

    // Predefined animations
    fadeIn: 'fadeIn 0.3s ease-in-out',
    slideUp: 'slideUp 0.5s ease-out',
    slideDown: 'slideDown 0.5s ease-out',
    scaleIn: 'scaleIn 0.3s ease-out',
    shimmer: 'shimmer 2s infinite',
  },

  /**
   * Z-index layers
   */
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },

  /**
   * Breakpoints (mobile-first)
   */
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  /**
   * Component-specific configs
   */
  components: {
    button: {
      heights: {
        sm: '2rem',      // 32px
        md: '2.5rem',    // 40px
        lg: '3rem',      // 48px
      },
      paddings: {
        sm: '0.5rem 1rem',
        md: '0.75rem 1.5rem',
        lg: '1rem 2rem',
      },
    },
    input: {
      heights: {
        sm: '2rem',
        md: '2.5rem',
        lg: '3rem',
      },
    },
    card: {
      padding: '1.5rem',
      borderRadius: '0.75rem',
    },
    modal: {
      maxWidth: '42rem',  // 672px
      padding: '2rem',
    },
  },
}

/**
 * Theme type for TypeScript
 */
export type ThemeConfig = typeof themeConfig

/**
 * CSS variables generation
 * Can be used to inject theme as CSS custom properties
 */
export const generateCSSVariables = () => {
  return `
    :root {
      --color-primary: ${themeConfig.colors.primary};
      --color-secondary: ${themeConfig.colors.secondary};
      --color-background: ${themeConfig.colors.background};
      --color-text: ${themeConfig.colors.text};
      --font-heading: ${themeConfig.fonts.heading};
      --font-body: ${themeConfig.fonts.body};
      --spacing-md: ${themeConfig.spacing.md};
      --radius-md: ${themeConfig.radius.md};
    }
  `
}

export default themeConfig
