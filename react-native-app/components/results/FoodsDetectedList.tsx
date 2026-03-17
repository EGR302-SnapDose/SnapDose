import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';

interface FoodsDetectedListProps {
  foods: string[];
  notes?: string;
  isLoading?: boolean;
}

export function FoodsDetectedList({ foods, notes, isLoading }: FoodsDetectedListProps) {
  const cardBg = useThemeColor({ light: '#F2F2F2', dark: '#1e1e1e' }, 'background');
  const mutedColor = useThemeColor({ light: '#888888', dark: '#888888' }, 'icon');
  const iconColor = useThemeColor({ light: '#000', dark: '#fff' }, 'background');
  const dividerColor = useThemeColor({ light: '#E0E0E0', dark: '#2e2e2e' }, 'background');

  const hasNoFood = !isLoading && (foods.length === 0 || (foods.length === 1 && foods[0] === ''));

  return (
    <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
      <View style={styles.header}>
        <Ionicons name="restaurant-outline" size={18} color={iconColor} />
        <ThemedText style={styles.title}>Foods Detected</ThemedText>
      </View>

      <View style={[styles.divider, { backgroundColor: dividerColor }]} />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[styles.loadingRow, { backgroundColor: mutedColor, opacity: 0.15 }]}
            />
          ))}
        </View>
      ) : hasNoFood ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={[styles.emptyText, { color: mutedColor }]}>
            No foods detected
          </ThemedText>
          {notes ? (
            <ThemedText style={[styles.notesText, { color: mutedColor }]}>
              {notes}
            </ThemedText>
          ) : null}
        </View>
      ) : (
        <View style={styles.foodsList}>
          {foods.map((food, index) => (
            <View key={index} style={styles.foodRow}>
              <View style={[styles.foodDot, { backgroundColor: iconColor }]} />
              <ThemedText style={styles.foodName}>{food}</ThemedText>
            </View>
          ))}
          {notes ? (
            <ThemedText style={[styles.notesText, { color: mutedColor }]}>
              {notes}
            </ThemedText>
          ) : null}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
  },
  foodsList: {
    gap: 10,
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  foodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  foodName: {
    fontSize: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  emptyText: {
    fontSize: 15,
  },
  notesText: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
  loadingContainer: {
    gap: 10,
  },
  loadingRow: {
    height: 16,
    borderRadius: 8,
    width: '70%',
  },
});