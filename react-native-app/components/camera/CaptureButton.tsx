import { StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';

interface CameraControlsProps {
  onCapture: () => void;
  onFlip: () => void;
  onBack: () => void;
  isCapturing: boolean;
}

export function CameraControls({ onCapture, onFlip, onBack, isCapturing }: CameraControlsProps) {
  const buttonBg = useThemeColor({ light: '#fff', dark: '#fff' }, 'background');
  const borderColor = useThemeColor(
    { light: 'rgba(0,0,0,0.2)', dark: 'rgba(255,255,255,0.5)' },
    'background'
  );
  const iconColor = useThemeColor({ light: '#000', dark: '#fff' }, 'background');
  const barBg = useThemeColor({ light: '#F2F2F2', dark: '#1e1e1e' }, 'background');

  return (
    <View style={[styles.container, { backgroundColor: barBg }]}>
      <TouchableOpacity style={styles.sideButton} onPress={onBack}>
        <Ionicons name="chevron-back" size={24} color={iconColor} />
      </TouchableOpacity>

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

      <TouchableOpacity style={styles.sideButton} onPress={onFlip}>
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
    paddingHorizontal: 48,
    paddingBottom: 24,
    paddingTop: 16,
  },
  sideButton: {
    width: 40,
    height: 40,
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
  disabled: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
});
