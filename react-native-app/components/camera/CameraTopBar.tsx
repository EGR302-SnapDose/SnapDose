import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface CameraTopBarProps {
  onCancel: () => void;
  onFlip: () => void;
}

export function CameraTopBar({ onCancel, onFlip }: CameraTopBarProps) {
  const overlayBg = useThemeColor(
    { light: 'rgba(255,255,255,0.15)', dark: 'rgba(0,0,0,0.3)' },
    'background'
  );

  return (
    <View style={[styles.topBar, { backgroundColor: overlayBg }]}>
      <TouchableOpacity style={styles.button} onPress={onCancel}>
        <ThemedText style={styles.buttonText}>Cancel</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={onFlip}>
        <ThemedText style={styles.buttonText}>Flip</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? 16 : 12,
  },
  button: {
    padding: 8,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '500',
  },
});