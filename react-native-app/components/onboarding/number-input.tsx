import { useThemeColor } from '@/hooks/use-theme-color';
import React, { useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface NumberInputProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onChange?: (value: number) => void;
  label?: string;
  min?: number;
  max?: number;
}

export default function NumberInput({
  value,
  onIncrement,
  onDecrement,
  onChange,
  label,
  min,
  max,
}: NumberInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());
  const inputRef = useRef<TextInput>(null);

  const canDecrement = min === undefined || value > min;
  const canIncrement = max === undefined || value < max;
  const valueColor = useThemeColor({ light: '#000000', dark: '#FFFFFF' }, 'text');
  const labelColor = useThemeColor({ light: '#555555', dark: '#888888' }, 'text');
  const inputBackground = useThemeColor({ light: '#f0f0f0', dark: '#1A1A1A' }, 'background');
  const inputBorder = useThemeColor({ light: '#ddd', dark: '#333' }, 'icon');

  const handleTextChange = (text: string) => {
    setInputValue(text);
  };

  const handleBlur = () => {
    let numValue = parseInt(inputValue, 10);

    if (isNaN(numValue)) {
      setInputValue(value.toString());
    } else {
      if (min !== undefined && numValue < min) {
        numValue = min;
      }
      if (max !== undefined && numValue > max) {
        numValue = max;
      }
      onChange?.(numValue);
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
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, !canDecrement && styles.buttonDisabled]}
        onPress={onDecrement}
        disabled={!canDecrement}
      >
        <Text style={[styles.buttonText, !canDecrement && styles.buttonTextDisabled]}>−</Text>
      </TouchableOpacity>

      <View style={styles.valueContainer}>
        {isEditing ? (
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: valueColor, borderColor: inputBorder, backgroundColor: inputBackground }]}
            value={inputValue}
            onChangeText={handleTextChange}
            onBlur={handleBlur}
            onSubmitEditing={handleBlur}
            keyboardType="number-pad"
            returnKeyType="done"
            maxLength={3}
            autoFocus
          />
        ) : (
          <TouchableOpacity onPress={handleFocus}>
            <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
          </TouchableOpacity>
        )}
        {label && !isEditing && <Text style={[styles.label, { color: labelColor }]}>{label}</Text>}
      </View>

      <TouchableOpacity
        style={[styles.button, !canIncrement && styles.buttonDisabled]}
        onPress={onIncrement}
        disabled={!canIncrement}
      >
        <Text style={[styles.buttonText, !canIncrement && styles.buttonTextDisabled]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 30,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: '300',
    marginTop: -9,
  },
  buttonTextDisabled: {
    color: '#666',
  },
  valueContainer: {
    alignItems: 'center',
    minWidth: 60,
  },
  input: {
    fontSize: 52,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 70,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderRadius: 8,
  },
  value: {
    fontSize: 52,
    fontWeight: '700',
    lineHeight: 80,
  },
  label: {
    fontSize: 14,
    marginTop: 4,
  },
});