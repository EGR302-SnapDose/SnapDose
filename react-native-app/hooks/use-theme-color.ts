/**
 * Theme color hook - bridges legacy color names to new semantic tokens
 */

import { colors } from '@/constants/theme';

// Map legacy color names to new semantic color tokens
const colorMapping: Record<string, string> = {
  text: colors.textPrimary,
  background: colors.background,
  tint: colors.primary,
  icon: colors.tabInactive,
  tabIconDefault: colors.tabInactive,
  tabIconSelected: colors.tabActive,
};

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: string
) {
  // If explicit color provided in props, use it
  const colorFromProps = props.light || props.dark;
  if (colorFromProps) {
    return colorFromProps;
  }

  // Otherwise, map to new semantic colors
  return colorMapping[colorName] ?? colors.textPrimary;
}
