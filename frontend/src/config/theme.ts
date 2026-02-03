// Theme Configuration - Colors and styling tokens
export const theme = {
  colors: {
    // Primary - Blue (used for main actions, links, highlights)
    primary: {
      light: '#60a5fa',    // blue-400
      main: '#3b82f6',     // blue-500
      dark: '#2563eb',     // blue-600
      darker: '#1d4ed8',   // blue-700
      contrast: '#ffffff', // text on primary background
    },
    // Secondary - Green (used for success, accents, header background)
    secondary: {
      light: '#4ade80',    // green-400
      main: '#22c55e',     // green-500
      dark: '#16a34a',     // green-600
      darker: '#15803d',   // green-700
      contrast: '#ffffff', // text on secondary background
    },
    // Neutral colors
    neutral: {
      white: '#ffffff',
      gray50: '#f9fafb',
      gray100: '#f3f4f6',
      gray200: '#e5e7eb',
      gray300: '#d1d5db',
      gray400: '#9ca3af',
      gray500: '#6b7280',
      gray600: '#4b5563',
      gray700: '#374151',
      gray800: '#1f2937',
      gray900: '#111827',
      black: '#000000',
    },
    // Status colors
    status: {
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },
  // Border radius tokens
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },
  // Shadow tokens
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  },
}

// CSS variable names for use in stylesheets
export const cssVars = {
  '--color-primary': theme.colors.primary.main,
  '--color-primary-light': theme.colors.primary.light,
  '--color-primary-dark': theme.colors.primary.dark,
  '--color-secondary': theme.colors.secondary.main,
  '--color-secondary-light': theme.colors.secondary.light,
  '--color-secondary-dark': theme.colors.secondary.dark,
}
