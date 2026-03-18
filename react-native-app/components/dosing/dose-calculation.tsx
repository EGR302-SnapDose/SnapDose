import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, View } from "react-native";

interface DoseCalculationProps {
  mode: "meal" | "correction";
  carbs?: number;
  baseDose?: number;
  correctionInsulin?: number;
  insulinOnBoard: number;
  recommendedDose: number;
  onCalculate: () => void;
}

export function DoseCalculation({
  mode,
  carbs,
  baseDose,
  correctionInsulin,
  insulinOnBoard,
  recommendedDose,
  onCalculate,
}: DoseCalculationProps) {
  const accent = useThemeColor({}, "accent");

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.breakdown, { backgroundColor: accent + "10" }]}>
        <View style={styles.recommendedHeader}>
          <View style={styles.recommendedLabelRow}>
            <Ionicons name="calculator-outline" size={20} color={accent} />
            <ThemedText style={styles.recommendedLabel}>
              Recommended Dose
            </ThemedText>
          </View>
          <ThemedText style={[styles.recommendedDose, { color: accent }]}>
            {recommendedDose.toFixed(1)}u
          </ThemedText>
        </View>

        <View style={styles.divider} />

        {mode === "meal" ? (
          <>
            <View style={styles.breakdownRow}>
              <ThemedText style={styles.label}>Carbs entered:</ThemedText>
              <ThemedText style={styles.value}>{carbs || 0}g</ThemedText>
            </View>

            <View style={styles.breakdownRow}>
              <ThemedText style={styles.label}>
                Base dose (1:{baseDose}):
              </ThemedText>
              <ThemedText style={styles.value}>
                {((carbs || 0) / (baseDose || 1)).toFixed(1)}u
              </ThemedText>
            </View>

            <View style={styles.breakdownRow}>
              <ThemedText style={styles.label}>Insulin on board:</ThemedText>
              <ThemedText
                style={[
                  styles.value,
                  { color: insulinOnBoard > 0 ? accent : "inherit" },
                ]}
              >
                {insulinOnBoard > 0 ? "-" : ""}
                {insulinOnBoard.toFixed(1)}u
              </ThemedText>
            </View>

            <View style={[styles.breakdownRow, styles.totalRow]}>
              <ThemedText style={styles.totalLabel}>Adjusted dose:</ThemedText>
              <ThemedText style={[styles.totalValue, { color: accent }]}>
                {recommendedDose.toFixed(1)}u
              </ThemedText>
            </View>
          </>
        ) : (
          <>
            <View style={styles.breakdownRow}>
              <ThemedText style={styles.label}>Correction insulin:</ThemedText>
              <ThemedText style={styles.value}>
                {(correctionInsulin || 0).toFixed(1)}u
              </ThemedText>
            </View>

            <View style={styles.breakdownRow}>
              <ThemedText style={styles.label}>Insulin on board:</ThemedText>
              <ThemedText
                style={[
                  styles.value,
                  { color: insulinOnBoard > 0 ? accent : "inherit" },
                ]}
              >
                {insulinOnBoard > 0 ? "-" : ""}
                {insulinOnBoard.toFixed(1)}u
              </ThemedText>
            </View>

            <View style={[styles.breakdownRow, styles.totalRow]}>
              <ThemedText style={styles.totalLabel}>Net dose:</ThemedText>
              <ThemedText style={[styles.totalValue, { color: accent }]}>
                {recommendedDose.toFixed(1)}u
              </ThemedText>
            </View>
          </>
        )}
      </View>

      <Pressable
        style={[
          styles.calculateButton,
          { backgroundColor: accent },
          recommendedDose === 0 && styles.disabledButton,
        ]}
        onPress={onCalculate}
        disabled={recommendedDose === 0}
      >
        <View style={styles.buttonContent}>
          <MaterialCommunityIcons name="pill" size={24} color="#FFFFFF" />
          <ThemedText style={styles.calculateButtonText}>
            Confirm & Log Dose
          </ThemedText>
        </View>
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  recommendedHeader: {
    marginBottom: 12,
  },
  recommendedLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  recommendedLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  recommendedDose: {
    fontSize: 48,
    fontWeight: "700",
    lineHeight: 56,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 12,
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
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calculateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
