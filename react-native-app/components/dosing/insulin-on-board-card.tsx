import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { colors, Colors, layout, radius, spacing, textStyles } from "@/constants/theme";
import { useAccentColor } from "@/context/accent-color";
import { useThemeColor } from "@/hooks/use-theme-color";
import { StyleSheet, View } from "react-native";

interface InsulinOnBoardCardProps {
  activeInsulin: number;
}

export function InsulinOnBoardCard({ activeInsulin }: InsulinOnBoardCardProps) {
  const accent = useAccentColor();
  const statusColor = activeInsulin > 0 ? colors.success : colors.textTertiary;

  const cardBg = useThemeColor(
    { light: accent + "12", dark: Colors.dark.surface },
    "surface"
  );
  const cardBorder = useThemeColor(
    { light: colors.border, dark: Colors.dark.border },
    "border"
  );
  const labelColor = useThemeColor(
    { light: colors.textPrimary, dark: Colors.dark.text },
    "text"
  );
  const unitColor = useThemeColor(
    { light: colors.textSecondary, dark: '#B0B0B0' },
    "text"
  );

  return (
    <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={styles.header}>
        <ThemedText style={[styles.label, { color: labelColor }]}>Insulin On Board</ThemedText>
        <View
          style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}
        >
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <ThemedText style={[styles.statusText, { color: statusColor }]}>
            {activeInsulin > 0 ? "Active" : "None"}
          </ThemedText>
        </View>
      </View>
      <View style={styles.valueContainer}>
        <ThemedText style={[styles.value, { color: accent }]}>
          {activeInsulin.toFixed(1)}u
        </ThemedText>
        <ThemedText style={[styles.unit, { color: unitColor }]}>active</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing[4],
    borderRadius: radius.lg,
    marginBottom: spacing[5],
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  label: {
    ...textStyles.calloutSemibold,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...textStyles.caption1,
    fontWeight: "600",
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing[2],
  },
  value: {
    ...textStyles.glucoseDisplay,
    lineHeight: 60,
  },
  unit: {
    ...textStyles.footnote,
  },
});
