import { useThemeColor } from "@/hooks/use-theme-color";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";

// DUMMY DATA FOR SPRINT 2 DEMO, will be DELETED later.
const SYNTHETIC_MEALS = [
  { id: "1", name: "Pasta", carbs: 32, time: "12:30pm" },
  { id: "2", name: "Steak", carbs: 26, time: "4:35pm" },
  { id: "3", name: "Chicken", carbs: 18, time: "7:00pm" },
];

export function RecentMealsCard() {
  const borderColor = useThemeColor({}, "icon");
  const dividerColor = useThemeColor(
    { light: "#E0E0E0", dark: "#333333" },
    "icon",
  );

  return (
    <ThemedView style={[styles.card, { borderColor }]}>
      <ThemedText type="subtitle">Recent Meals</ThemedText>

      {SYNTHETIC_MEALS.map((meal, index) => (
        <View key={meal.id}>
          <View style={styles.mealRow}>
            <View style={styles.mealInfo}>
              <ThemedText style={styles.mealName}>{meal.name}</ThemedText>
              <ThemedText style={styles.mealTime}>{meal.time}</ThemedText>
            </View>
            <ThemedText style={styles.mealCarbs}>{meal.carbs}</ThemedText>
          </View>
          {index < SYNTHETIC_MEALS.length - 1 && (
            <View style={[styles.divider, { backgroundColor: dividerColor }]} />
          )}
        </View>
      ))}
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
  mealRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "500",
  },
  mealTime: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 2,
  },
  mealCarbs: {
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.8,
  },
  divider: {
    height: 1,
  },
});
