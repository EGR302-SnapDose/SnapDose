import { useThemeColor } from "@/hooks/use-theme-color";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";

// DUMMY DATA FOR SPRINT 2 DEMO, will be DELETED later.
const SYNTHETIC_GLUCOSE_DATA = {
  value: 124,
  unit: "mg/dL",
  trend: "stable",
  lastUpdated: "2 min ago",
};

function getTrendArrow(trend: string) {
  switch (trend) {
    case "rising":
      return "^";
    case "falling":
      return "v";
    default:
      return "-";
  }
}

function getGlucoseColor(value: number) {
  if (value < 70) return "#E53935";
  if (value > 180) return "#E53935";
  if (value > 140) return "#FB8C00";
  return "#43A047";
}

export function GlucoseCard() {
  const borderColor = useThemeColor({}, "icon");

  return (
    <ThemedView style={[styles.card, { borderColor }]}>
      <ThemedText type="subtitle">Glucose</ThemedText>

      <View style={styles.readingRow}>
        <ThemedText
          style={[
            styles.glucoseValue,
            { color: getGlucoseColor(SYNTHETIC_GLUCOSE_DATA.value) },
          ]}
        >
          {SYNTHETIC_GLUCOSE_DATA.value}
        </ThemedText>
        <View style={styles.readingMeta}>
          <ThemedText style={styles.unit}>
            {SYNTHETIC_GLUCOSE_DATA.unit}
          </ThemedText>
          <ThemedText style={styles.trend}>
            {getTrendArrow(SYNTHETIC_GLUCOSE_DATA.trend)}
          </ThemedText>
        </View>
      </View>

      <ThemedText style={styles.lastUpdated}>
        Updated {SYNTHETIC_GLUCOSE_DATA.lastUpdated}
      </ThemedText>

      <View style={[styles.graphPlaceholder, { borderColor }]}>
        <ThemedText style={styles.placeholderText}>
          12-hour trend graph
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  readingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  glucoseValue: {
    fontSize: 48,
    fontWeight: "bold",
    lineHeight: 52,
  },
  readingMeta: {
    paddingBottom: 6,
  },
  unit: {
    fontSize: 14,
    opacity: 0.7,
  },
  trend: {
    fontSize: 14,
    opacity: 0.7,
  },
  lastUpdated: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 4,
  },
  graphPlaceholder: {
    height: 120,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: "dashed",
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 14,
    opacity: 0.4,
  },
});
