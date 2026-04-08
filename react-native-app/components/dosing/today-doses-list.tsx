import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { colors, Colors, radius, spacing, textStyles } from "@/constants/theme";
import { useAccentColor } from "@/context/accent-color";
import { useThemeColor } from "@/hooks/use-theme-color";
import { StyleSheet, View } from "react-native";

interface Dose {
  id: string;
  time: string;
  amount: number;
  type: "Meal" | "Correction";
}

interface TodayDosesListProps {
  doses: Dose[];
  totalDoses: number;
}

export function TodayDosesList({ doses, totalDoses }: TodayDosesListProps) {
  const accent = useAccentColor();

  const titleColor = useThemeColor(
    { light: colors.textPrimary, dark: Colors.dark.text },
    "text"
  );
  const containerBorder = useThemeColor(
    { light: colors.border, dark: Colors.dark.border },
    "border"
  );
  const rowBorder = useThemeColor(
    { light: colors.border, dark: Colors.dark.border },
    "border"
  );
  const timeColor = useThemeColor(
    { light: colors.textPrimary, dark: Colors.dark.text },
    "text"
  );
  const typeColor = useThemeColor(
    { light: colors.textSecondary, dark: '#B0B0B0' },
    "text"
  );
  const totalLabelColor = useThemeColor(
    { light: colors.textPrimary, dark: Colors.dark.text },
    "text"
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={[styles.title, { color: titleColor }]}>Today's Doses</ThemedText>

      <View style={[styles.listContainer, { borderColor: containerBorder }]}>
        {doses.map((dose, index) => (
          <View
            key={dose.id}
            style={[
              styles.doseRow,
              index !== doses.length - 1 && [styles.doseRowBorder, { borderBottomColor: rowBorder }],
            ]}
          >
            <View>
              <ThemedText style={[styles.time, { color: timeColor }]}>{dose.time}</ThemedText>
              <ThemedText style={[styles.doseType, { color: typeColor }]}>{dose.type}</ThemedText>
            </View>
            <ThemedText style={[styles.amount, { color: accent }]}>
              {dose.amount.toFixed(1)}u
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.totalContainer}>
        <ThemedText style={[styles.totalLabel, { color: totalLabelColor }]}>Total Today:</ThemedText>
        <ThemedText style={[styles.totalAmount, { color: accent }]}>
          {totalDoses.toFixed(1)}u
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[5],
  },
  title: {
    ...textStyles.calloutSemibold,
    marginBottom: spacing[3],
  },
  listContainer: {
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
  },
  doseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  doseRowBorder: {
    borderBottomWidth: 1,
  },
  time: {
    ...textStyles.calloutSemibold,
  },
  doseType: {
    ...textStyles.footnote,
    marginTop: spacing[1],
  },
  amount: {
    ...textStyles.calloutSemibold,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  totalLabel: {
    ...textStyles.calloutSemibold,
  },
  totalAmount: {
    ...textStyles.headline,
  },
});
