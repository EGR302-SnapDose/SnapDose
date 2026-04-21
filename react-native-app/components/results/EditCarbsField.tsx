import { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSemanticColor } from '@/hooks/use-theme-colors';
import { Ionicons } from '@expo/vector-icons';

interface EditCarbsFieldProps {
  initialValue: number;
  onValueChange: (value: number) => void;
}

export function EditCarbsField({ initialValue, onValueChange }: EditCarbsFieldProps) {
  const [inputValue, setInputValue] = useState(String(initialValue));
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardBg = useThemeColor({ light: '#F2F2F2', dark: '#1e1e1e' }, 'background');
  const inputBg = useThemeColor({ light: '#fff', dark: '#2a2a2a' }, 'background');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#3a3a3a' }, 'background');
  const activeBorderColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'background');
  const mutedColor = useThemeColor({ light: '#888888', dark: '#888888' }, 'icon');
  const iconColor = useThemeColor({ light: '#000', dark: '#fff' }, 'background');
  const errorColor = useSemanticColor('danger');

  // Sync if AI updates the value while not editing
  useEffect(() => {
    if (!isEditing) {
      setInputValue(String(initialValue));
    }
  }, [initialValue]);

  const validate = (value: string): boolean => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      setError('Please enter a valid number');
      return false;
    }
    if (num < 0) {
      setError('Carbs must be a positive number');
      return false;
    }
    if (num > 999) {
      setError('Value seems too high, please check');
      return false;
    }
    setError(null);
    return true;
  };

  const handleChange = (value: string) => {
    setInputValue(value);
    setIsEditing(true);
    if (error) validate(value);
  };

  const handleConfirm = () => {
    if (validate(inputValue)) {
      onValueChange(parseFloat(inputValue));
      setIsEditing(false);
    }
  };

  const handleReset = () => {
    setInputValue(String(initialValue));
    setIsEditing(false);
    setError(null);
    onValueChange(initialValue);
  };

  return (
    <ThemedView style={[styles.card, { backgroundColor: cardBg }]}>
      <View style={styles.header}>
        <Ionicons name="create-outline" size={18} color={iconColor} />
        <ThemedText style={styles.title}>Adjust Carbs</ThemedText>
      </View>

      <ThemedText style={[styles.hint, { color: mutedColor }]}>
        Override the AI estimate if needed
      </ThemedText>

      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: inputBg,
              borderColor: error ? errorColor : isEditing ? activeBorderColor : borderColor,
              color: iconColor,
            },
          ]}
          value={inputValue}
          onChangeText={handleChange}
          keyboardType="decimal-pad"
          returnKeyType="done"
          onSubmitEditing={handleConfirm}
          selectTextOnFocus
        />
        <ThemedText style={[styles.unit, { color: mutedColor }]}>g carbs</ThemedText>

        {isEditing && (
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Ionicons name="close-circle" size={20} color={mutedColor} />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <ThemedText style={[styles.errorText, { color: errorColor }]}>
          {error}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    fontSize: 13,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  unit: {
    fontSize: 15,
    fontWeight: '500',
  },
  resetButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 13,
  },
});