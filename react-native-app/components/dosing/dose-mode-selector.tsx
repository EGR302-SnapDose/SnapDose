import { ThemedText } from "@/components/themed-text";
import { useAccentColor } from "@/context/accent-color";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { Pressable, StyleSheet, View } from "react-native";

interface DoseModeSelectorProps {
  mode: "meal" | "correction";
  onModeChange: (mode: "meal" | "correction") => void;
}

export function DoseModeSelector({
  mode,
  onModeChange,
}: DoseModeSelectorProps) {
  const accent = useAccentColor();
  const c = useThemeColors();
  const buttonBg = c.surfaceSubtle;
  const borderColor = c.border;

  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.button,
          { backgroundColor: buttonBg, borderColor: borderColor },
          mode === "meal" && { backgroundColor: accent },
        ]}
        onPress={() => onModeChange("meal")}
      >
        <ThemedText
          style={[styles.buttonText, mode === "meal" && { color: "#FFFFFF" }]}
        >
          Meal Dose
        </ThemedText>
      </Pressable>

      <Pressable
        style={[
          styles.button,
          { backgroundColor: buttonBg, borderColor: borderColor },
          mode === "correction" && { backgroundColor: accent },
        ]}
        onPress={() => onModeChange("correction")}
      >
        <ThemedText
          style={[
            styles.buttonText,
            mode === "correction" && { color: "#FFFFFF" },
          ]}
        >
          Correction Dose
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
