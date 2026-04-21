/**
 * useThemeColors — returns the full semantic color palette for the current
 * color scheme (light or dark).
 *
 * Usage:
 *   const c = useThemeColors();
 *   <View style={{ backgroundColor: c.surface, borderColor: c.border }}>
 *     <Text style={{ color: c.textPrimary }}>Hi</Text>
 *   </View>
 *
 * For styles that can't be inlined (e.g. passed to StyleSheet.create),
 * wrap them in useMemo so they rebuild when the scheme flips:
 *
 *   const c = useThemeColors();
 *   const styles = useMemo(
 *     () => StyleSheet.create({ card: { backgroundColor: c.surface } }),
 *     [c]
 *   );
 */

import { colors, darkColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type ThemeColors = { readonly [K in keyof typeof colors]: string };

export function useThemeColors(): ThemeColors {
  const scheme = useColorScheme() ?? 'light';
  return (scheme === 'dark' ? darkColors : colors) as ThemeColors;
}

/**
 * Resolve a single semantic color by key for the current scheme.
 * Convenience wrapper for when you only need one token.
 */
export function useSemanticColor(key: keyof ThemeColors): string {
  return useThemeColors()[key];
}
