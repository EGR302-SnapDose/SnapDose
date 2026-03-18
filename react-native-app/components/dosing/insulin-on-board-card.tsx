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
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 12,
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  value: {
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 38,
  },
  unit: {
    fontSize: 14,
    opacity: 0.6,
    lineHeight: 20,
  },
});
