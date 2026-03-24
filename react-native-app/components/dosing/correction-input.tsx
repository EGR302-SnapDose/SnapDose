import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface CorrectionInputProps {
  value: number;
  onValueChange: (value: number) => void;
}

export function CorrectionInput({ value, onValueChange }: CorrectionInputProps) {
  const accent = useThemeColor({}, "accent");
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toFixed(1));
  const inputRef = useRef<TextInput>(null);

  const quickAdd = (amount: number) => {
    const newValue = Math.max(0, value + amount);
    onValueChange(Math.round(newValue * 10) / 10);
  };

  const handleTextChange = (text: string) => {
    setInputValue(text);
  };

  const handleBlur = () => {
    let numValue = parseFloat(inputValue);

    if (isNaN(numValue) || numValue < 0) {
      setInputValue(value.toFixed(1));
    } else {
      const roundedValue = Math.round(numValue * 10) / 10;
      onValueChange(roundedValue);
      setInputValue(roundedValue.toFixed(1));
    }
    setIsEditing(false);
    Keyboard.dismiss();
  };

  const handleFocus = () => {
    setIsEditing(true);
    setInputValue(value.toFixed(1));
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Correction Insulin</ThemedText>

      <View style={styles.inputSection}>
        <TouchableOpacity
          onPress={() => quickAdd(-0.1)}
          style={styles.buttonWrapper}
        >
          <ThemedText style={styles.minusButton}>−</ThemedText>
        </TouchableOpacity>

        <View style={styles.valueBox}>
          {isEditing ? (
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: accent }]}
              value={inputValue}
              onChangeText={handleTextChange}
              onBlur={handleBlur}
              onSubmitEditing={handleBlur}
              keyboardType="decimal-pad"
              returnKeyType="done"
              maxLength={5}
              autoFocus
            />
          ) : (
            <TouchableOpacity onPress={handleFocus}>
              <ThemedText style={[styles.valueText, { color: accent }]}>
                {value.toFixed(1)}
              </ThemedText>
            </TouchableOpacity>
          )}
          {!isEditing && <ThemedText style={styles.unitText}>u</ThemedText>}
        </View>

        <TouchableOpacity
          onPress={() => quickAdd(0.1)}
          style={styles.buttonWrapper}
        >
          <ThemedText style={styles.plusButton}>+</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.quickAddContainer}>
        {[-1, -0.5, 0.5, 1].map((amount) => (
          <Pressable
            key={amount}
            style={[styles.quickAddButton, { borderColor: accent }]}
            onPress={() => quickAdd(amount)}
          >
            <ThemedText style={[styles.quickAddText, { color: accent }]}>
              {amount > 0 ? `+${amount}` : `${amount}`}
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
    marginBottom: 16,
  },
  inputSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginBottom: 20,
  },
  buttonWrapper: {
    paddingBottom: 35,
  },
  minusButton: {
    fontSize: 32,
    fontWeight: "400",
    lineHeight: 32,
    width: 32,
    textAlign: "center",
  },
  plusButton: {
    fontSize: 32,
    fontWeight: "400",
    lineHeight: 32,
    width: 32,
    textAlign: "center",
  },
  valueBox: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  input: {
    fontSize: 48,
    fontWeight: "700",
    textAlign: "center",
    minWidth: 80,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderRadius: 8,
    borderColor: "#444",
  },
  valueText: {
    fontSize: 48,
    fontWeight: "700",
    lineHeight: 56,
  },
  unitText: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 4,
  },
  quickAddContainer: {
    flexDirection: "row",
    gap: 8,
  },
  quickAddButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  quickAddText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
