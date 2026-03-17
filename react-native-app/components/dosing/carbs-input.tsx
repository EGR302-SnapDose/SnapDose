import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Pressable, StyleSheet, View } from "react-native";

interface CarbsInputProps {
  value: number;
  onValueChange: (value: number) => void;
}

export function CarbsInput({ value, onValueChange }: CarbsInputProps) {
  const accent = useThemeColor({}, "accent");

  const quickAdd = (amount: number) => {
    onValueChange(value + amount);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Total Carbohydrates</ThemedText>

      <View style={styles.inputSection}>
        <Pressable onPress={() => onValueChange(Math.max(0, value - 1))}>
          <ThemedText style={styles.minusButton}>−</ThemedText>
        </Pressable>

        <View style={styles.valueBox}>
          <ThemedText style={[styles.valueText, { color: accent }]}>
            {value}
          </ThemedText>
          <ThemedText style={styles.unitText}>g</ThemedText>
        </View>

        <Pressable onPress={() => onValueChange(value + 1)}>
          <ThemedText style={styles.plusButton}>+</ThemedText>
        </Pressable>
      </View>

      <View style={styles.quickAddContainer}>
        {[10, 15, 20, 25].map((amount) => (
          <Pressable
            key={amount}
            style={[styles.quickAddButton, { borderColor: accent }]}
            onPress={() => quickAdd(amount)}
          >
            <ThemedText style={[styles.quickAddText, { color: accent }]}>
              +{amount}
            </ThemedText>
          </Pressable>
        ))}
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
  inputSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 16,
  },
  minusButton: {
    fontSize: 28,
    fontWeight: "300",
  },
  plusButton: {
    fontSize: 28,
    fontWeight: "300",
  },
  valueBox: {
    alignItems: "center",
    minWidth: 80,
  },
  valueText: {
    fontSize: 40,
    fontWeight: "700",
  },
  unitText: {
    fontSize: 14,
    opacity: 0.6,
  },
  quickAddContainer: {
    flexDirection: "row",
    gap: 8,
  },
  quickAddButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
  },
  quickAddText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
