import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Pressable, StyleSheet, View } from "react-native";

interface DoseCalculationProps {
  carbs: number;
  baseDose: number;
  insulinOnBoard: number;
  recommendedDose: number;
  onCalculate: () => void;
}

export function DoseCalculation({
  carbs,
  baseDose,
  insulinOnBoard,
  recommendedDose,
  onCalculate,
}: DoseCalculationProps) {
  const accent = useThemeColor({}, "accent");

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.breakdown, { backgroundColor: accent + "10" }]}>
        <View style={styles.breakdownRow}>
          <ThemedText style={styles.label}>Carbs entered:</ThemedText>
          <ThemedText style={styles.value}>{carbs}g</ThemedText>
        </View>

        <View style={styles.breakdownRow}>
          <ThemedText style={styles.label}>Base dose (1:{baseDose}):</ThemedText>
          <ThemedText style={styles.value}>{(carbs / baseDose).toFixed(1)}u</ThemedText>
        </View>

        <View style={styles.breakdownRow}>
          <ThemedText style={styles.label}>Insulin on board:</ThemedText>
          <ThemedText style={[styles.value, { color: insulinOnBoard > 0 ? accent : "inherit" }]}>
            {insulinOnBoard > 0 ? "-" : ""}{insulinOnBoard.toFixed(1)}u
          </ThemedText>
        </View>

        <View style={[styles.breakdownRow, styles.totalRow]}>
          <ThemedText style={styles.totalLabel}>Adjusted dose:</ThemedText>
          <ThemedText style={[styles.totalValue, { color: accent }]}>
            {recommendedDose.toFixed(1)}u
          </ThemedText>
        </View>
      </View>

      <Pressable
        style={[styles.calculateButton, { backgroundColor: accent }]}
        onPress={onCalculate}
      >
        <ThemedText style={styles.calculateButtonText}>Confirm & Log Dose</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  breakdown: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    paddingTop: 12,
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    opacity: 0.7,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  calculateButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  calculateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
