import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Pressable, StyleSheet, View } from "react-native";

interface DoseModeSelectorProps {
  mode: "meal" | "correction";
  onModeChange: (mode: "meal" | "correction") => void;
}

export function DoseModeSelector({ mode, onModeChange }: DoseModeSelectorProps) {
  const accent = useThemeColor({}, "accent");
  const buttonBg = useThemeColor({ light: "#F5F5F5", dark: "#1E2022" }, "background");

  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.button,
          mode === "meal" && { backgroundColor: accent },
        ]}
        onPress={() => onModeChange("meal")}
      >
        <ThemedText
          style={[
            styles.buttonText,
            mode === "meal" && { color: "#FFFFFF" },
          ]}
        >
          Meal Dose
        </ThemedText>
      </Pressable>

      <Pressable
        style={[
          styles.button,
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
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
