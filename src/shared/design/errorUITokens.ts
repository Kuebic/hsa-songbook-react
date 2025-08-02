/**
 * @file errorUITokens.ts
 * @description Design tokens for consistent error UI components
 * Provides semantic color palette, typography, spacing, and animation tokens
 */

// ==============================================
// SEMANTIC COLOR PALETTE
// ==============================================

/**
 * Semantic color tokens for different UI states
 * Includes light and dark mode variants with proper contrast ratios
 */
export const ErrorUIColors = {
  // Error colors (red palette)
  error: {
    50: '#fef2f2',   // Light background
    100: '#fee2e2',  // Light hover background
    200: '#fecaca',  // Light border
    300: '#fca5a5',  // Light accent
    500: '#ef4444',  // Base error color
    600: '#dc2626',  // Primary error (buttons, icons)
    700: '#b91c1c',  // Hover state
    800: '#991b1b',  // Text on light background
    900: '#7f1d1d',  // Dark text
  },

  // Warning colors (amber/orange palette)
  warning: {
    50: '#fffbeb',   // Light background
    100: '#fef3c7',  // Light hover background
    200: '#fed7aa',  // Light border
    300: '#fdba74',  // Light accent
    500: '#f59e0b',  // Base warning color
    600: '#d97706',  // Primary warning (buttons, icons)
    700: '#b45309',  // Hover state
    800: '#92400e',  // Text on light background
    900: '#78350f',  // Dark text
  },

  // Success colors (green palette)
  success: {
    50: '#f0fdf4',   // Light background
    100: '#dcfce7',  // Light hover background
    200: '#bbf7d0',  // Light border
    300: '#86efac',  // Light accent
    500: '#22c55e',  // Base success color
    600: '#16a34a',  // Primary success (buttons, icons)
    700: '#15803d',  // Hover state
    800: '#166534',  // Text on light background
    900: '#14532d',  // Dark text
  },

  // Info colors (blue palette)
  info: {
    50: '#eff6ff',   // Light background
    100: '#dbeafe',  // Light hover background
    200: '#bfdbfe',  // Light border
    300: '#93c5fd',  // Light accent
    500: '#3b82f6',  // Base info color
    600: '#2563eb',  // Primary info (buttons, icons)
    700: '#1d4ed8',  // Hover state
    800: '#1e40af',  // Text on light background
    900: '#1e3a8a',  // Dark text
  },

  // Neutral colors for text and backgrounds
  neutral: {
    50: '#f9fafb',   // Lightest background
    100: '#f3f4f6',  // Light background
    200: '#e5e7eb',  // Light border
    300: '#d1d5db',  // Medium border
    400: '#9ca3af',  // Disabled text
    500: '#6b7280',  // Secondary text
    600: '#4b5563',  // Primary text
    700: '#374151',  // Dark text
    800: '#1f2937',  // Darker text
    900: '#111827',  // Darkest text
  },
} as const;

// ==============================================
// TYPOGRAPHY SYSTEM
// ==============================================

/**
 * Typography tokens for error and status components
 * Includes font sizes, weights, and line heights
 */
export const ErrorUITypography = {
  // Error page titles (route errors, critical failures)
  title: {
    fontSize: '1.875rem',    // text-3xl (30px)
    fontWeight: '700',       // font-bold
    lineHeight: '2.25rem',   // leading-9
    letterSpacing: '-0.025em', // tracking-tight
  },

  // Error section headings (component errors, service errors)
  heading: {
    fontSize: '1.25rem',     // text-xl (20px)
    fontWeight: '600',       // font-semibold
    lineHeight: '1.75rem',   // leading-7
    letterSpacing: '-0.025em', // tracking-tight
  },

  // Sub-headings (error categories, status labels)
  subheading: {
    fontSize: '1.125rem',    // text-lg (18px)
    fontWeight: '500',       // font-medium
    lineHeight: '1.75rem',   // leading-7
  },

  // Primary error messages and descriptions
  body: {
    fontSize: '1rem',        // text-base (16px)
    fontWeight: '400',       // font-normal
    lineHeight: '1.5rem',    // leading-6
  },

  // Secondary text, details, hints
  caption: {
    fontSize: '0.875rem',    // text-sm (14px)
    fontWeight: '400',       // font-normal
    lineHeight: '1.25rem',   // leading-5
  },

  // Fine print, timestamps, technical details
  footnote: {
    fontSize: '0.75rem',     // text-xs (12px)
    fontWeight: '400',       // font-normal
    lineHeight: '1rem',      // leading-4
  },

  // Code snippets and error details
  code: {
    fontSize: '0.875rem',    // text-sm (14px)
    fontWeight: '400',       // font-normal
    lineHeight: '1.25rem',   // leading-5
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  },
} as const;

// ==============================================
// SPACING SYSTEM
// ==============================================

/**
 * Consistent spacing tokens for error UI components
 * Based on 4px grid system
 */
export const ErrorUISpacing = {
  // Component padding
  padding: {
    xs: '0.5rem',      // p-2 (8px)
    sm: '0.75rem',     // p-3 (12px)
    md: '1rem',        // p-4 (16px)
    lg: '1.5rem',      // p-6 (24px)
    xl: '2rem',        // p-8 (32px)
    '2xl': '3rem',     // p-12 (48px)
  },

  // Margins between elements
  margin: {
    xs: '0.25rem',     // m-1 (4px)
    sm: '0.5rem',      // m-2 (8px)
    md: '0.75rem',     // m-3 (12px)
    lg: '1rem',        // m-4 (16px)
    xl: '1.5rem',      // m-6 (24px)
    '2xl': '2rem',     // m-8 (32px)
  },

  // Gaps between flex/grid items
  gap: {
    xs: '0.25rem',     // gap-1 (4px)
    sm: '0.5rem',      // gap-2 (8px)
    md: '0.75rem',     // gap-3 (12px)
    lg: '1rem',        // gap-4 (16px)
    xl: '1.5rem',      // gap-6 (24px)
  },

  // Border radius for consistency
  radius: {
    sm: '0.25rem',     // rounded-sm (4px)
    md: '0.375rem',    // rounded-md (6px)
    lg: '0.5rem',      // rounded-lg (8px)
    xl: '0.75rem',     // rounded-xl (12px)
  },
} as const;

// ==============================================
// ANIMATION TOKENS
// ==============================================

/**
 * Animation tokens for smooth transitions and micro-interactions
 */
export const ErrorUIAnimations = {
  // Transition durations
  duration: {
    fast: '150ms',       // Quick feedback (button hover)
    normal: '200ms',     // Standard transitions
    slow: '300ms',       // Emphasis transitions
    slower: '500ms',     // Error state changes
  },

  // Easing functions
  easing: {
    ease: 'ease',                                    // Standard easing
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',          // Ease in
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',         // Ease out
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',     // Ease in-out
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Bounce effect
  },

  // Common animation patterns
  fadeIn: {
    from: { opacity: '0' },
    to: { opacity: '1' },
    duration: '200ms',
    easing: 'cubic-bezier(0, 0, 0.2, 1)',
  },

  slideUp: {
    from: { transform: 'translateY(10px)', opacity: '0' },
    to: { transform: 'translateY(0)', opacity: '1' },
    duration: '200ms',
    easing: 'cubic-bezier(0, 0, 0.2, 1)',
  },

  shake: {
    keyframes: '0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); } 20%, 40%, 60%, 80% { transform: translateX(2px); }',
    duration: '500ms',
    easing: 'ease-in-out',
  },

  pulse: {
    keyframes: '0%, 100% { opacity: 1; } 50% { opacity: 0.7; }',
    duration: '1000ms',
    easing: 'ease-in-out',
    iteration: 'infinite',
  },
} as const;

// ==============================================
// ICON SYSTEM
// ==============================================

/**
 * Icon configuration for different error states
 * Provides consistent icon sizing and semantic meanings
 */
export const ErrorUIIcons = {
  // Icon sizes
  size: {
    xs: '1rem',        // 16px
    sm: '1.25rem',     // 20px
    md: '1.5rem',      // 24px
    lg: '2rem',        // 32px
    xl: '2.5rem',      // 40px
    '2xl': '3rem',     // 48px
  },

  // Semantic icon mappings
  semantic: {
    error: 'ExclamationTriangleIcon',
    warning: 'ExclamationTriangleIcon',
    success: 'CheckCircleIcon',
    info: 'InformationCircleIcon',
    storage: 'CircleStackIcon',
    network: 'WifiIcon',
    sync: 'ArrowPathIcon',
    component: 'WrenchScrewdriverIcon',
    route: 'MapIcon',
    async: 'BoltIcon',
  },
} as const;

// ==============================================
// COMPONENT VARIANTS
// ==============================================

/**
 * Pre-defined component variants for different error contexts
 */
export const ErrorUIVariants = {
  error: {
    backgroundColor: ErrorUIColors.error[50],
    borderColor: ErrorUIColors.error[200],
    textColor: ErrorUIColors.error[800],
    iconColor: ErrorUIColors.error[600],
    buttonColor: ErrorUIColors.error[600],
  },

  warning: {
    backgroundColor: ErrorUIColors.warning[50],
    borderColor: ErrorUIColors.warning[200],
    textColor: ErrorUIColors.warning[800],
    iconColor: ErrorUIColors.warning[600],
    buttonColor: ErrorUIColors.warning[600],
  },

  success: {
    backgroundColor: ErrorUIColors.success[50],
    borderColor: ErrorUIColors.success[200],
    textColor: ErrorUIColors.success[800],
    iconColor: ErrorUIColors.success[600],
    buttonColor: ErrorUIColors.success[600],
  },

  info: {
    backgroundColor: ErrorUIColors.info[50],
    borderColor: ErrorUIColors.info[200],
    textColor: ErrorUIColors.info[800],
    iconColor: ErrorUIColors.info[600],
    buttonColor: ErrorUIColors.info[600],
  },
} as const;

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

/**
 * Get color variant based on error type
 */
export function getErrorUIVariant(type: 'error' | 'warning' | 'success' | 'info') {
  return ErrorUIVariants[type];
}

/**
 * Get typography styles as CSS properties
 */
export function getTypographyStyles(variant: keyof typeof ErrorUITypography) {
  const typography = ErrorUITypography[variant];
  return {
    fontSize: typography.fontSize,
    fontWeight: typography.fontWeight,
    lineHeight: typography.lineHeight,
    letterSpacing: typography.letterSpacing || 'normal',
    fontFamily: typography.fontFamily || 'inherit',
  };
}

/**
 * Get animation CSS properties
 */
export function getAnimationStyles(animation: keyof typeof ErrorUIAnimations) {
  if (animation === 'duration' || animation === 'easing') {
    return {};
  }
  return ErrorUIAnimations[animation];
}

// Type exports for TypeScript support
export type ErrorUIColorKey = keyof typeof ErrorUIColors;
export type ErrorUITypographyKey = keyof typeof ErrorUITypography;
export type ErrorUISpacingKey = keyof typeof ErrorUISpacing;
export type ErrorUIAnimationKey = keyof typeof ErrorUIAnimations;
export type ErrorUIVariantKey = keyof typeof ErrorUIVariants;