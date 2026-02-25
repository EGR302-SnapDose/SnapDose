import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

interface CaptureButtonProps {
  onPress: () => void;
  isCapturing: boolean;
}

export function CaptureButton({ onPress, isCapturing }: CaptureButtonProps) {
  const buttonBg = useThemeColor({ light: '#fff', dark: '#fff' }, 'background');
  const borderColor = useThemeColor(
    { light: 'rgba(0,0,0,0.2)', dark: 'rgba(255,255,255,0.5)' },
    'background'
  );
  const indicatorColor = useThemeColor({ light: '#000', dark: '#000' }, 'background');

  return (
    <TouchableOpacity
      style={[
        styles.captureButton,
        { backgroundColor: buttonBg, borderColor },
        isCapturing && styles.disabled,
      ]}
      onPress={onPress}
      disabled={isCapturing}
    >
      {isCapturing ? (
        <ActivityIndicator color={indicatorColor} />
      ) : (
        <View style={[styles.captureButtonInner, { backgroundColor: buttonBg }]} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
  },
  disabled: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
});