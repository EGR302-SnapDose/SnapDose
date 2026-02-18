import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAccentColor } from "@/context/accent-color";
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

  const quickAdd = (amount: number) => {
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

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Total Carbohydrates</ThemedText>

      <View style={styles.inputSection}>
        <TouchableOpacity
          onPress={() => onValueChange(Math.max(0, value - 1))}
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
          {!isEditing && <ThemedText style={styles.unitText}>g</ThemedText>}
        </View>

        <TouchableOpacity
          onPress={() => onValueChange(value + 1)}
          style={styles.buttonWrapper}
        >
          <ThemedText style={styles.plusButton}>+</ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.quickAddContainer}>
        {[-25, -10, 10, 25].map((amount) => (
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
