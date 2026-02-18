import { useThemeColor } from '@/hooks/use-theme-color';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NumberInputProps {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  label?: string;
  min?: number;
  max?: number;
}

export default function NumberInput({
  value,
  onIncrement,
  onDecrement,
  label,
  min,
  max,
}: NumberInputProps) {
  const canDecrement = min === undefined || value > min;
  const canIncrement = max === undefined || value < max;
  const valueColor = useThemeColor({ light: '#000000', dark: '#FFFFFF' }, 'text');
  const labelColor = useThemeColor({ light: '#555555', dark: '#888888' }, 'text');

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
        <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
        {label && <Text style={[styles.label, { color: labelColor }]}>{label}</Text>}
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