import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { MealConfidence } from '@/types/meal';

interface CarbEstimateDisplayProps {
  estimatedCarbs: number;
  confidence: MealConfidence;
  isLoading?: boolean;
}

const confidenceConfig = {
  high: { label: 'High Confidence', color: '#34C759' },
  medium: { label: 'Medium Confidence', color: '#FF9500' },
  low: { label: 'Low Confidence', color: '#FF3B30' },
};

export function CarbEstimateDisplay({
  estimatedCarbs,
  confidence,
  isLoading,
}: CarbEstimateDisplayProps) {
  const cardBg = useThemeColor({ light: '#F2F2F2', dark: '#1e1e1e' }, 'background');
  const mutedColor = useThemeColor({ light: '#888888', dark: '#888888' }, 'icon');
  const { label, color } = confidenceConfig[confidence] ?? confidenceConfig['low'];

  return (
    <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
      <ThemedText style={[styles.label, { color: mutedColor }]}>
        Estimated Carbohydrates
      </ThemedText>

      {isLoading ? (
        <View style={styles.loadingRow}>
          <View style={[styles.loadingBlock, { backgroundColor: mutedColor }]} />
        </View>
      ) : (
        <View style={styles.estimateRow}>
          <ThemedText style={styles.carbValue}>{estimatedCarbs}</ThemedText>
          <ThemedText style={[styles.carbUnit, { color: mutedColor }]}>g</ThemedText>
        </View>
      )}

      <View style={[styles.confidenceBadge, { backgroundColor: `${color}20` }]}>
        <View style={[styles.confidenceDot, { backgroundColor: color }]} />
        <ThemedText style={[styles.confidenceLabel, { color }]}>{label}</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  estimateRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  carbValue: {
    fontSize: 64,
    fontWeight: '700',
    lineHeight: 72,
  },
  carbUnit: {
    fontSize: 24,
    fontWeight: '600',
    paddingBottom: 10,
  },
  loadingRow: {
    height: 72,
    justifyContent: 'center',
  },
  loadingBlock: {
    width: 120,
    height: 48,
    borderRadius: 8,
    opacity: 0.2,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confidenceLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});