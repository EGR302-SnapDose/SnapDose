import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { colors, Colors, layout, radius, spacing, textStyles } from "@/constants/theme";
import { useAccentColor } from "@/context/accent-color";
import { useThemeColor } from "@/hooks/use-theme-color";
import { hapticHeavy } from "@/utils/haptics";
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, View } from "react-native";

interface DoseCalculationProps {
  mode: "meal" | "correction";
  carbs?: number;
  baseDose?: number;
  correctionDose?: number;
  correctionFactor?: number;
  correctionInsulin?: number;
  insulinOnBoard: number;
  recommendedDose: number;
  onCalculate: () => void;
}

export function DoseCalculation({
  mode,
  carbs,
  baseDose,
  correctionDose,
  correctionFactor,
  correctionInsulin,
  insulinOnBoard,
  recommendedDose,
  onCalculate,
}: DoseCalculationProps) {
  const accent = useAccentColor();

  const breakdownBg = useThemeColor(
    { light: accent + "10", dark: Colors.dark.surface },
    "surface"
  );
  const breakdownBorder = useThemeColor(
    { light: colors.border, dark: Colors.dark.border },
    "border"
  );
  const dividerColor = useThemeColor(
    { light: colors.border, dark: Colors.dark.border },
    "border"
  );
  const labelColor = useThemeColor(
    { light: colors.textSecondary, dark: '#B0B0B0' },
    "text"
  );
  const valueColor = useThemeColor(
    { light: colors.textPrimary, dark: Colors.dark.text },
    "text"
  );
  const recommendedLabelColor = useThemeColor(
    { light: colors.textSecondary, dark: '#B0B0B0' },
    "text"
  );
  const buttonTextColor = useThemeColor(
    { light: colors.textInverse, dark: colors.textInverse },
    "text"
  );
  const iobColor = useThemeColor(
    { light: colors.warning, dark: colors.warning },
    "icon"
  );

  const handleCalculate = () => {
    hapticHeavy();
    onCalculate();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.breakdown, { backgroundColor: breakdownBg, borderColor: breakdownBorder }]}>
        <View style={styles.recommendedHeader}>
          <View style={styles.recommendedLabelRow}>
            <Ionicons name="calculator-outline" size={20} color={accent} />
            <ThemedText style={[styles.recommendedLabel, { color: recommendedLabelColor }]}>
              Recommended Dose
            </ThemedText>
          </View>
          <ThemedText style={[styles.recommendedDose, { color: accent }]}>
            {recommendedDose.toFixed(1)}u
          </ThemedText>
        </View>

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        {mode === "meal" ? (
          <>
            <View style={styles.breakdownRow}>
              <ThemedText style={[styles.label, { color: labelColor }]}>Carbs entered:</ThemedText>
              <ThemedText style={[styles.value, { color: valueColor }]}>{carbs || 0}g</ThemedText>
            </View>

            <View style={styles.breakdownRow}>
              <ThemedText style={[styles.label, { color: labelColor }]}>
                Base dose (1:{baseDose}):
              </ThemedText>
              <ThemedText style={[styles.value, { color: valueColor }]}>
                {((carbs || 0) / (baseDose || 1)).toFixed(1)}u
              </ThemedText>
            </View>

            <View style={styles.breakdownRow}>
              <ThemedText style={[styles.label, { color: labelColor }]}>
                Correction ({correctionFactor}):
              </ThemedText>
              <ThemedText style={[styles.value, { color: valueColor }]}>
                {correctionDose !== undefined && correctionDose !== 0
                  ? `${correctionDose > 0 ? "+" : ""}${correctionDose.toFixed(1)}u`
                  : "0.0u"}
              </ThemedText>
            </View>

            <View style={styles.breakdownRow}>
              <ThemedText style={[styles.label, { color: labelColor }]}>Insulin on board:</ThemedText>
              <ThemedText
                style={[
                  styles.value,
                  { color: insulinOnBoard > 0 ? iobColor : valueColor },
                ]}
              >
                {insulinOnBoard > 0 ? "-" : ""}
                {insulinOnBoard.toFixed(1)}u
              </ThemedText>
            </View>

            <View style={[styles.breakdownRow, styles.totalRow]}>
              <ThemedText style={[styles.totalLabel, { color: valueColor }]}>Adjusted dose:</ThemedText>
              <ThemedText style={[styles.totalValue, { color: accent }]}>
                {recommendedDose.toFixed(1)}u
              </ThemedText>
            </View>
          </>
        ) : (
          <>
            <View style={styles.breakdownRow}>
              <ThemedText style={[styles.label, { color: labelColor }]}>Correction insulin:</ThemedText>
              <ThemedText style={[styles.value, { color: valueColor }]}>
                {(correctionInsulin || 0).toFixed(1)}u
              </ThemedText>
            </View>

            <View style={styles.breakdownRow}>
              <ThemedText style={[styles.label, { color: labelColor }]}>Insulin on board:</ThemedText>
              <ThemedText
                style={[
                  styles.value,
                  { color: insulinOnBoard > 0 ? iobColor : valueColor },
                ]}
              >
                {insulinOnBoard > 0 ? "-" : ""}
                {insulinOnBoard.toFixed(1)}u
              </ThemedText>
            </View>

            <View style={[styles.breakdownRow, styles.totalRow]}>
              <ThemedText style={[styles.totalLabel, { color: valueColor }]}>Net dose:</ThemedText>
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
        onPress={handleCalculate}
        disabled={recommendedDose === 0}
      >
        <View style={styles.buttonContent}>
          <MaterialCommunityIcons
            name="pill"
            size={24}
            color={buttonTextColor}
          />
          <ThemedText style={[styles.calculateButtonText, { color: buttonTextColor }]}>
            Confirm & Log Dose
          </ThemedText>
        </View>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[5],
  },
  breakdown: {
    borderRadius: radius.lg,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
  },
  recommendedHeader: {
    marginBottom: spacing[3],
  },
  recommendedLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  recommendedLabel: {
    ...textStyles.footnote,
  },
  recommendedDose: {
    ...textStyles.glucoseDisplay,
    textAlign: "center",
  },
  divider: {
    height: 1,
    marginVertical: spacing[3],
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing[2],
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing[3],
    marginTop: spacing[2],
  },
  label: {
    ...textStyles.footnote,
  },
  totalLabel: {
    ...textStyles.footnoteSemibold,
  },
  value: {
    ...textStyles.callout,
    fontWeight: "500",
  },
  totalValue: {
    ...textStyles.headline,
    fontWeight: "700",
  },
  calculateButton: {
    height: layout.buttonHeightMd,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  calculateButtonText: {
    ...textStyles.headline,
  },
});
