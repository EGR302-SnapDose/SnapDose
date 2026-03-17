import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
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
  const accent = useThemeColor({}, "accent");

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Today's Doses</ThemedText>

      <View style={[styles.listContainer, { borderColor: accent + "30" }]}>
        {doses.map((dose, index) => (
          <View key={dose.id} style={[styles.doseRow, index !== doses.length - 1 && styles.doseRowBorder]}>
            <View>
              <ThemedText style={styles.time}>{dose.time}</ThemedText>
              <ThemedText style={styles.doseType}>{dose.type}</ThemedText>
            </View>
            <ThemedText style={[styles.amount, { color: accent }]}>
              {dose.amount.toFixed(1)}u
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.totalContainer}>
        <ThemedText style={styles.totalLabel}>Total Today:</ThemedText>
        <ThemedText style={[styles.totalAmount, { color: accent }]}>
          {totalDoses.toFixed(1)}u
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  listContainer: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  doseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  doseRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  time: {
    fontSize: 15,
    fontWeight: "600",
  },
  doseType: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  amount: {
    fontSize: 15,
    fontWeight: "700",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
});
