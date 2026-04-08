import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { colors, Colors, layout, radius, spacing, textStyles } from "@/constants/theme";
import { useAccentColor } from "@/context/accent-color";
import { useThemeColor } from "@/hooks/use-theme-color";
import { hapticLight } from "@/utils/haptics";
import { useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface CarbsInputProps {
  value: number;
  onValueChange: (value: number) => void;
}

export function CarbsInput({ value, onValueChange }: CarbsInputProps) {
  const accent = useAccentColor();
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());
  const inputRef = useRef<TextInput>(null);

  const cardBg = useThemeColor(
    { light: colors.surfaceSubtle, dark: Colors.dark.surface },
    "surface"
  );
  const cardBorder = useThemeColor(
    { light: colors.border, dark: Colors.dark.border },
    "border"
  );
  const buttonBg = useThemeColor(
    { light: colors.buttonSecondary, dark: Colors.dark.border },
    "background"
  );
  const inputBg = useThemeColor(
    { light: colors.inputBackground, dark: Colors.dark.surface },
    "surface"
  );
  const inputBorder = useThemeColor(
    { light: colors.inputBorder, dark: Colors.dark.border },
    "border"
  );
  const titleColor = useThemeColor(
    { light: colors.textPrimary, dark: Colors.dark.text },
    "text"
  );
  const unitColor = useThemeColor(
    { light: colors.textSecondary, dark: '#B0B0B0' },
    "text"
  );
  const buttonTextColor = useThemeColor(
    { light: colors.textPrimary, dark: Colors.dark.text },
    "text"
  );

  const quickAdd = (amount: number) => {
    hapticLight();
    onValueChange(Math.max(0, value + amount));
  };

  const handleTextChange = (text: string) => {
    setInputValue(text);
  };

  const handleBlur = () => {
    let numValue = parseInt(inputValue, 10);

    if (isNaN(numValue) || numValue < 0) {
      setInputValue(value.toString());
    } else {
      hapticLight();
      onValueChange(numValue);
      setInputValue(numValue.toString());
    }
    setIsEditing(false);
    Keyboard.dismiss();
  };

  const handleFocus = () => {
    setIsEditing(true);
    setInputValue(value.toString());
  };

  const handleDecrement = () => {
    hapticLight();
    onValueChange(Math.max(0, value - 1));
  };

  const handleIncrement = () => {
    hapticLight();
    onValueChange(value + 1);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={[styles.title, { color: titleColor }]}>Total Carbohydrates</ThemedText>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.inputSection}>
          <TouchableOpacity
            onPress={handleDecrement}
            style={[styles.button, { backgroundColor: buttonBg }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ThemedText style={[styles.minusButton, { color: buttonTextColor }]}>−</ThemedText>
          </TouchableOpacity>

          <View style={styles.valueBox}>
            {isEditing ? (
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: accent, borderColor: accent, backgroundColor: inputBg }]}
                value={inputValue}
                onChangeText={handleTextChange}
                onBlur={handleBlur}
                onSubmitEditing={handleBlur}
                keyboardType="number-pad"
                returnKeyType="done"
                maxLength={4}
                autoFocus
              />
            ) : (
              <TouchableOpacity onPress={handleFocus}>
                <ThemedText style={[styles.valueText, { color: accent }]}>
                  {value}
                </ThemedText>
              </TouchableOpacity>
            )}
            {!isEditing && <ThemedText style={[styles.unitText, { color: unitColor }]}>g</ThemedText>}
          </View>

          <TouchableOpacity
            onPress={handleIncrement}
            style={[styles.button, { backgroundColor: buttonBg }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ThemedText style={[styles.plusButton, { color: buttonTextColor }]}>+</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.quickAddContainer}>
          {[-25, -10, 10, 25].map((amount) => (
            <Pressable
              key={amount}
              style={[styles.quickAddButton, { borderColor: accent, backgroundColor: cardBg }]}
              onPress={() => quickAdd(amount)}
            >
              <ThemedText style={[styles.quickAddText, { color: accent }]}>
                {amount > 0 ? `+${amount}` : `${amount}`}
              </ThemedText>
            </Pressable>
          ))}
        </View>
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
  card: {
    borderRadius: radius.lg,
    padding: spacing[4],
    borderWidth: 1,
  },
  inputSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[5],
    marginBottom: spacing[4],
  },
  button: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.md,
  },
  minusButton: {
    ...textStyles.title2,
    lineHeight: 32,
    textAlign: "center",
  },
  plusButton: {
    ...textStyles.title2,
    lineHeight: 32,
    textAlign: "center",
  },
  valueBox: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  input: {
    ...textStyles.glucoseDisplay,
    textAlign: "center",
    minWidth: 80,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 2,
    borderRadius: radius.md,
  },
  valueText: {
    ...textStyles.glucoseDisplay,
    lineHeight: 60,
  },
  unitText: {
    ...textStyles.footnote,
    marginTop: spacing[1],
  },
  quickAddContainer: {
    flexDirection: "row",
    gap: spacing[2],
  },
  quickAddButton: {
    flex: 1,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  quickAddText: {
    ...textStyles.calloutSemibold,
  },
});
