/**
 * Pip-Boy Theme Tokens
 *
 * Design tokens for a retro terminal inspired UI.
 * Based on the classic green phosphor CRT aesthetic.
 */

// ============================================================
// Color Palette
// ============================================================

/**
 * Primary phosphor colors - the classic Pip-Boy green glow
 * Derived from vintage P1 phosphor CRT displays
 */
export const colors = {
  // Primary phosphor green scale
  phosphor: {
    50: '#e8fff0',
    100: '#c5ffd6',
    200: '#8affb3',
    300: '#4dff8a',
    400: '#1aff5c',
    500: '#14fe17', // Primary - classic Pip-Boy green
    600: '#0ed912',
    700: '#0ab30f',
    800: '#078c0c',
    900: '#046609',
    950: '#023305',
  },

  // Amber variant (P3 phosphor alternative)
  amber: {
    50: '#fffbeb',
    100: '#fff3c4',
    200: '#ffe58a',
    300: '#ffd24d',
    400: '#ffbe1a',
    500: '#ffaa00', // Amber primary
    600: '#e69500',
    700: '#bf7a00',
    800: '#996000',
    900: '#734700',
    950: '#402700',
  },

  // Background/terminal dark tones
  terminal: {
    50: '#0a1a0d',
    100: '#081408',
    200: '#060f06',
    300: '#040a04',
    400: '#030803',
    500: '#020502', // Deep terminal black
    600: '#010301',
    700: '#010201',
    800: '#000100',
    900: '#000000',
  },

  // UI state colors
  state: {
    danger: '#ff3333',
    warning: '#ffaa00',
    success: '#14fe17',
    info: '#00aaff',
    offline: '#666666',
  },

  // Semantic aliases for common use
  text: {
    primary: '#14fe17',
    secondary: '#0ab30f',
    muted: '#078c0c',
    disabled: '#046609',
  },

  background: {
    screen: '#020502',
    panel: '#040a04',
    elevated: '#060f06',
    overlay: 'rgba(2, 5, 2, 0.9)',
  },

  border: {
    default: '#0ab30f',
    subtle: '#046609',
    active: '#14fe17',
  },
} as const;

// ============================================================
// Typography
// ============================================================

/**
 * Font families - monospace for that terminal aesthetic
 */
export const fonts = {
  // Primary terminal font
  mono: '"Share Tech Mono", "Courier New", Courier, monospace',
  // Header/display font
  display: '"VT323", "Share Tech Mono", monospace',
  // Fallback system monospace
  system: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
} as const;

/**
 * Font sizes following a consistent scale
 */
export const fontSizes = {
  xs: '0.75rem', // 12px
  sm: '0.875rem', // 14px
  base: '1rem', // 16px
  lg: '1.125rem', // 18px
  xl: '1.25rem', // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem', // 48px
} as const;

/**
 * Font weights - limited for monospace consistency
 */
export const fontWeights = {
  normal: '400',
  medium: '500',
  bold: '700',
} as const;

/**
 * Line heights
 */
export const lineHeights = {
  tight: '1.1',
  normal: '1.4',
  relaxed: '1.6',
} as const;

/**
 * Letter spacing for that tech aesthetic
 */
export const letterSpacing = {
  tight: '-0.025em',
  normal: '0',
  wide: '0.05em',
  wider: '0.1em',
} as const;

// ============================================================
// Spacing
// ============================================================

/**
 * Spacing scale based on 4px grid
 */
export const spacing = {
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
} as const;

// ============================================================
// Borders & Radii
// ============================================================

/**
 * Border widths
 */
export const borderWidths = {
  none: '0',
  thin: '1px',
  medium: '2px',
  thick: '3px',
} as const;

/**
 * Border radii - sharp for that tech look
 */
export const radii = {
  none: '0',
  sm: '2px',
  md: '4px',
  lg: '6px',
  full: '9999px',
} as const;

// ============================================================
// Shadows & Effects
// ============================================================

/**
 * Phosphor glow effects - the signature Pip-Boy look
 */
export const glows = {
  // Text glow
  text: {
    sm: '0 0 4px rgba(20, 254, 23, 0.5)',
    md: '0 0 8px rgba(20, 254, 23, 0.6)',
    lg: '0 0 16px rgba(20, 254, 23, 0.7)',
  },
  // Box/container glow
  box: {
    sm: '0 0 4px rgba(20, 254, 23, 0.3), inset 0 0 4px rgba(20, 254, 23, 0.1)',
    md: '0 0 8px rgba(20, 254, 23, 0.4), inset 0 0 8px rgba(20, 254, 23, 0.15)',
    lg: '0 0 16px rgba(20, 254, 23, 0.5), inset 0 0 16px rgba(20, 254, 23, 0.2)',
  },
  // Active/focus state glow
  active: '0 0 12px rgba(20, 254, 23, 0.8), 0 0 24px rgba(20, 254, 23, 0.4)',
  // Amber variant glows
  amber: {
    text: '0 0 8px rgba(255, 170, 0, 0.6)',
    box: '0 0 8px rgba(255, 170, 0, 0.4), inset 0 0 8px rgba(255, 170, 0, 0.15)',
  },
} as const;

/**
 * Box shadows for elevation
 */
export const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
  md: '0 4px 6px rgba(0, 0, 0, 0.6)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.7)',
} as const;

// ============================================================
// Animation
// ============================================================

/**
 * Animation durations
 */
export const durations = {
  instant: '0ms',
  fast: '100ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const;

/**
 * Easing functions
 */
export const easings = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  // Custom CRT-style easing
  crtOn: 'cubic-bezier(0.16, 1, 0.3, 1)',
  crtOff: 'cubic-bezier(0.7, 0, 0.84, 0)',
} as const;

/**
 * Pre-defined transitions
 */
export const transitions = {
  colors: `color ${durations.normal} ${easings.easeOut}, background-color ${durations.normal} ${easings.easeOut}, border-color ${durations.normal} ${easings.easeOut}`,
  opacity: `opacity ${durations.normal} ${easings.easeOut}`,
  transform: `transform ${durations.normal} ${easings.easeOut}`,
  all: `all ${durations.normal} ${easings.easeOut}`,
  glow: `box-shadow ${durations.slow} ${easings.easeOut}, text-shadow ${durations.slow} ${easings.easeOut}`,
} as const;

// ============================================================
// CRT Effects
// ============================================================

/**
 * Scanline effect configuration
 */
export const scanlines = {
  // CSS gradient for scanline overlay
  gradient:
    'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0, 0, 0, 0.3) 2px, rgba(0, 0, 0, 0.3) 3px)',
  // Opacity of the scanline layer
  opacity: 0.15,
  // Animation duration for subtle movement
  animationDuration: '10s',
} as const;

/**
 * CRT screen curvature effect (for CSS transforms)
 */
export const crtCurvature = {
  // Subtle barrel distortion
  perspective: '1000px',
  rotateX: '1deg',
  // Vignette gradient for screen edges
  vignette:
    'radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.4) 100%)',
} as const;

/**
 * Flicker effect configuration
 */
export const flicker = {
  // Keyframe animation name (define in CSS)
  animation: 'pipboy-flicker',
  duration: '0.15s',
  iterationCount: 'infinite',
  // Intensity values for keyframes
  intensity: {
    min: 0.97,
    max: 1.0,
  },
} as const;

// ============================================================
// Component-specific tokens
// ============================================================

/**
 * Button variants
 */
export const button = {
  sizes: {
    sm: {
      padding: `${spacing[1]} ${spacing[3]}`,
      fontSize: fontSizes.sm,
    },
    md: {
      padding: `${spacing[2]} ${spacing[4]}`,
      fontSize: fontSizes.base,
    },
    lg: {
      padding: `${spacing[3]} ${spacing[6]}`,
      fontSize: fontSizes.lg,
    },
  },
  variants: {
    primary: {
      background: colors.phosphor[500],
      color: colors.terminal[500],
      border: `${borderWidths.medium} solid ${colors.phosphor[500]}`,
    },
    secondary: {
      background: 'transparent',
      color: colors.phosphor[500],
      border: `${borderWidths.medium} solid ${colors.phosphor[500]}`,
    },
    ghost: {
      background: 'transparent',
      color: colors.phosphor[500],
      border: `${borderWidths.thin} solid transparent`,
    },
    danger: {
      background: 'transparent',
      color: colors.state.danger,
      border: `${borderWidths.medium} solid ${colors.state.danger}`,
    },
  },
} as const;

/**
 * Input field tokens
 */
export const input = {
  background: colors.terminal[100],
  border: `${borderWidths.thin} solid ${colors.border.subtle}`,
  borderFocus: `${borderWidths.thin} solid ${colors.border.active}`,
  padding: `${spacing[2]} ${spacing[3]}`,
  fontSize: fontSizes.base,
} as const;

/**
 * Panel/card tokens
 */
export const panel = {
  background: colors.background.panel,
  border: `${borderWidths.thin} solid ${colors.border.default}`,
  padding: spacing[4],
  glow: glows.box.sm,
} as const;

/**
 * Status indicator tokens
 */
export const statusIndicator = {
  sizes: {
    sm: '8px',
    md: '12px',
    lg: '16px',
  },
  colors: {
    online: colors.phosphor[500],
    offline: colors.state.offline,
    busy: colors.state.warning,
    error: colors.state.danger,
  },
} as const;

// ============================================================
// Z-Index Scale
// ============================================================

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  popover: 400,
  tooltip: 500,
  overlay: 600,
  toast: 700,
} as const;

// ============================================================
// Breakpoints
// ============================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================
// Composite Theme Object
// ============================================================

/**
 * Complete Pip-Boy theme tokens
 */
export const pipboyTheme = {
  colors,
  fonts,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacing,
  spacing,
  borderWidths,
  radii,
  glows,
  shadows,
  durations,
  easings,
  transitions,
  scanlines,
  crtCurvature,
  flicker,
  button,
  input,
  panel,
  statusIndicator,
  zIndex,
  breakpoints,
} as const;

// Type exports for consumers
export type PipboyTheme = typeof pipboyTheme;
export type ThemeColors = typeof colors;
export type ThemeSpacing = typeof spacing;

export default pipboyTheme;
