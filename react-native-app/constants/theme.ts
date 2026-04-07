/**
 * SnapDose Design System — Apple HIG Compliant
 * SNAP-168 | Epic: SNAP-196 UI/UX Overhaul — Apple HIG Compliance
 *
 * References:
 *   - Apple HIG Foundations: Color, Typography, Layout
 *   - SF Pro type ramp: developer.apple.com/design/human-interface-guidelines/typography
 *   - Minimum touch target: 44×44pt (HIG: Accessibility > Buttons)
 *   - 8pt base grid, 4pt sub-grid (HIG: Layout > Spacing)
 *   - WCAG AA contrast ratio >= 4.5:1 for normal text
 */

// ---------------------------------------------------------------------------
// Internal palette — do not reference outside this file.
// All consumer code uses `colors.*` semantic tokens below.
// ---------------------------------------------------------------------------
const palette = {
  blue50: '#EFF6FF',
  blue500: '#3B82F6',
  blue600: '#2563EB',
  blue700: '#1D4ED8',
  blue900: '#1E3A5F',

  teal400: '#2DD4BF',
  teal500: '#14B8A6',
  teal600: '#0D9488',

  green500: '#22C55E',
  green600: '#16A34A',
  orange500: '#F97316',
  red500: '#EF4444',
  red600: '#DC2626',
  yellow500: '#EAB308',

  // iOS semantic neutral equivalents
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',   // ~secondarySystemBackground
  gray200: '#E5E7EB',   // ~separator
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',   // ~tertiaryLabel
  gray500: '#6B7280',   // ~secondaryLabel
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',   // ~label
  gray950: '#0F172A',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// ---------------------------------------------------------------------------
// Color tokens — semantic layer
// HIG: Use color purposefully; never rely on color alone to convey meaning.
// ---------------------------------------------------------------------------
export const colors = {
  primary: palette.blue600,
  primaryLight: palette.blue500,
  primaryDark: palette.blue700,
  primarySurface: palette.blue50,

  accent: palette.teal500,
  accentLight: palette.teal400,
  accentDark: palette.teal600,

  glucoseLow: palette.red500,
  glucoseInRange: palette.green500,
  glucoseHigh: palette.orange500,
  glucoseVeryHigh: palette.red600,

  success: palette.green500,
  successSurface: '#F0FDF4',
  warning: palette.yellow500,
  warningSurface: '#FEFCE8',
  danger: palette.red500,
  dangerSurface: '#FEF2F2',
  info: palette.blue500,
  infoSurface: palette.blue50,

  // Surfaces — mirrors iOS systemGroupedBackground / systemBackground
  background: '#F2F2F7',
  surface: palette.white,
  surfaceElevated: palette.white,
  surfaceSubtle: palette.gray100,
  overlay: 'rgba(0,0,0,0.4)',

  // Borders — mirrors iOS separator
  border: palette.gray200,
  borderStrong: palette.gray300,
  borderFocus: palette.blue600,

  // Text — mirrors iOS label hierarchy
  textPrimary: palette.gray900,
  textSecondary: palette.gray500,
  textTertiary: palette.gray400,
  textInverse: palette.white,
  textDisabled: palette.gray300,
  textLink: palette.blue600,
  textDanger: palette.red600,

  buttonPrimary: palette.blue600,
  buttonPrimaryPressed: palette.blue700,
  buttonSecondary: palette.gray100,
  buttonSecondaryPressed: palette.gray200,
  buttonDestructive: palette.red500,
  buttonDestructivePressed: palette.red600,
  buttonDisabled: palette.gray200,

  inputBackground: palette.white,
  inputBorder: palette.gray300,
  inputBorderFocus: palette.blue600,
  inputPlaceholder: palette.gray400,

  tabActive: palette.blue600,
  tabInactive: palette.gray400,
  tabBackground: palette.white,
} as const;

// ---------------------------------------------------------------------------
// Spacing — 8pt base grid, 4pt sub-grid (HIG standard)
// ---------------------------------------------------------------------------
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

// ---------------------------------------------------------------------------
// Border radius — HIG standard values
// ---------------------------------------------------------------------------
export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 10,   // HIG default button corner radius
  lg: 12,
  xl: 16,   // HIG card / modal sheet radius
  '2xl': 20,
  '3xl': 28,
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// Typography — Apple SF Pro type ramp (iOS default size category)
//
// HIG-specified text styles with sizes, weights, and letter spacing.
// In React Native, 'System' resolves to SF Pro on iOS automatically.
//
// Letter spacing values converted from Apple's tracking specs (pt → dp):
//   Apple tracking is in thousandths of an em. At size N, tracking T:
//   letterSpacing = N × T / 1000  — values below are the result of that calc.
//
// HIG line heights (in pt, at default size):
//   Large Title=41  Title1=34  Title2=28  Title3=25
//   Headline=22  Body=22  Callout=21  Subhead=20
//   Footnote=18  Caption1=16  Caption2=13
// ---------------------------------------------------------------------------
export const typography = {
  fonts: {
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
    mono: 'Courier New',
  },

  sizes: {
    tabBar: 10,
    caption2: 11,
    caption1: 12,
    footnote: 13,
    subheadline: 15,
    callout: 16,
    body: 17,
    title3: 20,
    title2: 22,
    title1: 28,
    largeTitle: 34,
  },

  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },

  tracking: {
    largeTitle: 0.37,
    title1: 0.36,
    title2: 0.35,
    title3: 0.38,
    headline: -0.43,
    body: -0.43,
    callout: -0.31,
    subheadline: -0.23,
    footnote: -0.08,
    caption1: 0,
    caption2: 0.07,
    tabBar: 0.12,
  },
} as const;

// ---------------------------------------------------------------------------
// Text styles — pre-composed from the HIG type ramp.
// Use directly in StyleSheet.create() or as inline styles.
// Names match HIG terminology exactly for team clarity.
// ---------------------------------------------------------------------------
export const textStyles = {
  largeTitle: {
    fontSize: 34, fontWeight: '400' as const, letterSpacing: 0.37, lineHeight: 41,
  },
  largeTitleBold: {
    fontSize: 34, fontWeight: '700' as const, letterSpacing: 0.37, lineHeight: 41,
  },
  title1: {
    fontSize: 28, fontWeight: '400' as const, letterSpacing: 0.36, lineHeight: 34,
  },
  title1Bold: {
    fontSize: 28, fontWeight: '700' as const, letterSpacing: 0.36, lineHeight: 34,
  },
  title2: {
    fontSize: 22, fontWeight: '400' as const, letterSpacing: 0.35, lineHeight: 28,
  },
  title2Bold: {
    fontSize: 22, fontWeight: '700' as const, letterSpacing: 0.35, lineHeight: 28,
  },
  title3: {
    fontSize: 20, fontWeight: '400' as const, letterSpacing: 0.38, lineHeight: 25,
  },
  title3Semibold: {
    fontSize: 20, fontWeight: '600' as const, letterSpacing: 0.38, lineHeight: 25,
  },
  headline: {
    fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.43, lineHeight: 22,
  },
  body: {
    fontSize: 17, fontWeight: '400' as const, letterSpacing: -0.43, lineHeight: 22,
  },
  bodyBold: {
    fontSize: 17, fontWeight: '700' as const, letterSpacing: -0.43, lineHeight: 22,
  },
  callout: {
    fontSize: 16, fontWeight: '400' as const, letterSpacing: -0.31, lineHeight: 21,
  },
  calloutSemibold: {
    fontSize: 16, fontWeight: '600' as const, letterSpacing: -0.31, lineHeight: 21,
  },
  subheadline: {
    fontSize: 15, fontWeight: '400' as const, letterSpacing: -0.23, lineHeight: 20,
  },
  subheadlineSemibold: {
    fontSize: 15, fontWeight: '600' as const, letterSpacing: -0.23, lineHeight: 20,
  },
  footnote: {
    fontSize: 13, fontWeight: '400' as const, letterSpacing: -0.08, lineHeight: 18,
  },
  footnoteSemibold: {
    fontSize: 13, fontWeight: '600' as const, letterSpacing: -0.08, lineHeight: 18,
  },
  caption1: {
    fontSize: 12, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 16,
  },
  caption1Medium: {
    fontSize: 12, fontWeight: '500' as const, letterSpacing: 0, lineHeight: 16,
  },
  caption2: {
    fontSize: 11, fontWeight: '400' as const, letterSpacing: 0.07, lineHeight: 13,
  },
  caption2Semibold: {
    fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.07, lineHeight: 13,
  },
  tabBar: {
    fontSize: 10, fontWeight: '500' as const, letterSpacing: 0.12, lineHeight: 12,
  },

  // SnapDose-specific: glucose reading, dose display
  glucoseDisplay: {
    fontSize: 56, fontWeight: '700' as const, letterSpacing: -1, lineHeight: 60,
  },
  glucoseUnit: {
    fontSize: 17, fontWeight: '500' as const, letterSpacing: -0.43, lineHeight: 22,
  },
  doseDisplay: {
    fontSize: 28, fontWeight: '700' as const, letterSpacing: 0.36, lineHeight: 34,
  },
} as const;

// ---------------------------------------------------------------------------
// Shadows
// ---------------------------------------------------------------------------
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: palette.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.11,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: palette.blue900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
} as const;

// ---------------------------------------------------------------------------
// Layout constants
// HIG: 16-20pt horizontal margins on iPhone; 44pt minimum touch targets.
// ---------------------------------------------------------------------------
export const layout = {
  screenHorizontalPadding: spacing[4],  // 16pt — HIG recommended iPhone margin
  screenVerticalPadding: spacing[6],    // 24pt
  cardPadding: spacing[4],              // 16pt
  sectionSpacing: spacing[6],           // 24pt between major sections
  itemSpacing: spacing[2],              // 8pt between list items

  // HIG minimum touch target (Accessibility > Buttons)
  minTouchTarget: 44,

  // Standard component heights
  buttonHeightSm: 32,
  buttonHeightMd: 44,            // = minTouchTarget
  buttonHeightLg: 50,
  inputHeight: 44,               // = minTouchTarget
  navBarHeight: 44,
  tabBarContentHeight: 49,       // HIG standard tab bar content height
  tabBarHeight: 83,              // 49 + approx safe area
} as const;

// ---------------------------------------------------------------------------
// Animation — HIG: motion should be purposeful and feel natural.
// ---------------------------------------------------------------------------
export const animation = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
  },
  spring: {
    gentle: { damping: 20, stiffness: 120, mass: 1 },
    responsive: { damping: 15, stiffness: 200, mass: 0.8 },
    snappy: { damping: 25, stiffness: 350, mass: 0.9 },
  },
} as const;

// ---------------------------------------------------------------------------
// Glucose range utilities — ADA clinical thresholds
// HIG: Always pair color with a text label (color alone is not accessible).
// ---------------------------------------------------------------------------
export const glucoseRange = {
  URGENT_LOW: 55,
  LOW: 70,
  HIGH: 180,
  VERY_HIGH: 250,
  URGENT_HIGH: 300,

  getColor(value: number): string {
    if (value < this.LOW) return colors.glucoseLow;
    if (value <= this.HIGH) return colors.glucoseInRange;
    if (value <= this.VERY_HIGH) return colors.glucoseHigh;
    return colors.glucoseVeryHigh;
  },

  getLabel(value: number): 'Low' | 'In Range' | 'High' | 'Very High' {
    if (value < this.LOW) return 'Low';
    if (value <= this.HIGH) return 'In Range';
    if (value <= this.VERY_HIGH) return 'High';
    return 'Very High';
  },

  isUrgent(value: number): boolean {
    return value < this.URGENT_LOW || value > this.URGENT_HIGH;
  },
} as const;

// ---------------------------------------------------------------------------
// Colors (light/dark) — backward compatibility for useThemeColor hook
// Maps legacy color names to semantic tokens. Both themes use the same
// values since SnapDose currently only supports light mode.
// ---------------------------------------------------------------------------
export const Colors = {
  light: {
    text: colors.textPrimary,
    background: colors.background,
    tint: colors.primary,
    icon: colors.tabInactive,
    tabIconDefault: colors.tabInactive,
    tabIconSelected: colors.tabActive,
    accent: colors.accent,
    surface: colors.surface,
    border: colors.border,
    primary: colors.primary,
  },
  dark: {
    text: palette.gray50,              // Light text for dark bg
    background: palette.black,          // Pure black background
    tint: palette.blue500,             // Lighter blue for visibility
    icon: palette.gray400,             // Muted gray icons
    tabIconDefault: palette.gray500,   // Inactive tab icons
    tabIconSelected: palette.blue500,  // Active tab (lighter blue)
    accent: '#34D399',                 // Brighter emerald for dark mode
    surface: '#1A1A1A',                // Slightly elevated surface
    border: palette.gray700,           // Visible borders on dark (#374151)
    primary: palette.blue500,          // Primary action color
  },
} as const;

// ---------------------------------------------------------------------------
// Root export
// ---------------------------------------------------------------------------
export const theme = {
  colors,
  spacing,
  radius,
  typography,
  textStyles,
  shadows,
  layout,
  animation,
  glucoseRange,
} as const;

export type Theme = typeof theme;
export type ColorKey = keyof typeof colors;
export type SpacingKey = keyof typeof spacing;
export type RadiusKey = keyof typeof radius;
export type TextStyleKey = keyof typeof textStyles;
