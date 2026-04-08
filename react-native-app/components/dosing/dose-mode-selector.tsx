import { ThemedText } from "@/components/themed-text";
import { colors, Colors, radius, spacing, textStyles } from "@/constants/theme";
import { useAccentColor } from "@/context/accent-color";
import { useThemeColor } from "@/hooks/use-theme-color";
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
  const buttonBg = useThemeColor(
    { light: "#F5F5F5", dark: "#1E2022" },
    "background",
  );
  const unselectedTextColor = useThemeColor(
    { light: colors.textPrimary, dark: Colors.dark.text },
    "text",
  );

  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.button,
          { backgroundColor: buttonBg, borderColor: colors.border },
          mode === "meal" && { backgroundColor: accent },
        ]}
        onPress={() => onModeChange("meal")}
      >
        <ThemedText
          style={[
            styles.buttonText,
            { color: unselectedTextColor },
            mode === "meal" && { color: colors.textInverse },
          ]}
        >
          Meal Dose
        </ThemedText>
      </Pressable>

      <Pressable
        style={[
          styles.button,
          { backgroundColor: buttonBg, borderColor: colors.border },
          mode === "correction" && { backgroundColor: accent },
        ]}
        onPress={() => onModeChange("correction")}
      >
        <ThemedText
          style={[
            styles.buttonText,
            { color: unselectedTextColor },
            mode === "correction" && { color: colors.textInverse },
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
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  button: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
  },
  buttonText: {
    ...textStyles.calloutSemibold,
  },
});
