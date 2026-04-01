/**
 * Theme color hook - bridges legacy color names to new semantic tokens
 * Now with proper light/dark mode support
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light
) {
  const theme = useColorScheme() ?? 'light';

  // If explicit colors provided, use them based on scheme
  const colorFromProps = theme === 'dark' ? props.dark : props.light;
  if (colorFromProps) {
    return colorFromProps;
  }

  // Otherwise use Colors mapping for the current theme
  return Colors[theme][colorName] ?? Colors[theme].text;
}
