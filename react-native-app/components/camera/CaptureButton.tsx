import { colors, Colors, spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

interface CameraControlsProps {
  onCapture: () => void;
  onFlip: () => void;
  onBack: () => void;  // kept in props for API compatibility, unused
  isCapturing: boolean;
}

export function CameraControls({ onCapture, onFlip, isCapturing }: CameraControlsProps) {
  const buttonBg = useThemeColor({ light: colors.surface, dark: Colors.dark.text }, 'surface');
  const borderColor = useThemeColor(
    { light: 'rgba(0,0,0,0.2)', dark: 'rgba(255,255,255,0.3)' },
    'border'
  );
  const iconColor = useThemeColor(
    { light: colors.textPrimary, dark: Colors.dark.text },
    'text'
  );

  return (
    // No backgroundColor here — lets the parent controls bar show through cleanly
    <View style={styles.container}>
      {/* Empty view keeps the capture button centered */}
      <View style={styles.sideSlot} />

      <TouchableOpacity
        style={[
          styles.captureButton,
          { backgroundColor: buttonBg, borderColor },
          isCapturing && styles.disabled,
        ]}
        onPress={onCapture}
        disabled={isCapturing}
      >
        {isCapturing ? (
          <ActivityIndicator color="#000" />
        ) : (
          <View style={[styles.captureButtonInner, { backgroundColor: buttonBg }]} />
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.sideSlot} onPress={onFlip}>
        <Ionicons name="camera-reverse-outline" size={24} color={iconColor} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[12],
    paddingBottom: spacing[6],
    paddingTop: spacing[4],
  },
  sideSlot: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
  },
  captureButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  disabled: {
    opacity: 0.6,
  },
});