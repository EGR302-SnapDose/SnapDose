import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { StyleSheet, View } from "react-native";

interface InsulinOnBoardCardProps {
  activeInsulin: number;
}

export function InsulinOnBoardCard({ activeInsulin }: InsulinOnBoardCardProps) {
  const accent = useThemeColor({}, "accent");

  return (
    <ThemedView style={[styles.card, { backgroundColor: accent + "15" }]}>
      <ThemedText style={styles.label}>Insulin On Board</ThemedText>
      <View style={styles.valueContainer}>
        <ThemedText style={[styles.value, { color: accent }]}>
          {activeInsulin.toFixed(1)}u
        </ThemedText>
        <ThemedText style={styles.unit}>active</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  value: {
    fontSize: 32,
    fontWeight: "700",
  },
  unit: {
    fontSize: 14,
    opacity: 0.6,
  },
});
