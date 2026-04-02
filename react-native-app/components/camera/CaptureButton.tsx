import { colors, Colors, radius, spacing, textStyles } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Raw CameraView zoom prop values (0–1) for each preset label.
// 0   = device minimum (ultrawide / 0.5x on most modern phones)
// 0.2 = true 1x optical
// 0.3 = ~2x — tune this number if it's still too zoomed
export const ZOOM_PRESETS = [
  { label: '0.5x', value: 0 },
  { label: '1x',   value: 0.2 },
  { label: '2x',   value: 0.3 },
] as const;

interface CameraControlsProps {
  onCapture: () => void;
  onFlip: () => void;
  onBack: () => void;
  isCapturing: boolean;
  zoom: number;                        // current zoom (0–1), may be between presets
  onZoomChange: (value: number) => void;
}

export function CameraControls({
  onCapture,
  onFlip,
  isCapturing,
  zoom,
  onZoomChange,
}: CameraControlsProps) {
  const buttonBg = useThemeColor({ light: colors.surface, dark: Colors.dark.text }, 'surface');
  const borderColor = useThemeColor(
    { light: 'rgba(0,0,0,0.2)', dark: 'rgba(255,255,255,0.3)' },
    'border'
  );
  const iconColor = useThemeColor(
    { light: colors.textPrimary, dark: Colors.dark.text },
    'text'
  );
  const zoomActiveBg = useThemeColor(
    { light: 'rgba(0,0,0,0.12)', dark: 'rgba(255,255,255,0.15)' },
    'border'
  );

  // Highlight the nearest preset to the current zoom value
  const nearestPreset = ZOOM_PRESETS.reduce((prev, curr) =>
    Math.abs(curr.value - zoom) < Math.abs(prev.value - zoom) ? curr : prev
  );

  return (
    <View style={styles.container}>
      {/* Left slot — preset zoom buttons */}
      <View style={styles.sideSlot}>
        <View style={styles.zoomRow}>
          {ZOOM_PRESETS.map((preset) => {
            const active = nearestPreset.value === preset.value;
            return (
              <TouchableOpacity
                key={preset.label}
                onPress={() => onZoomChange(preset.value)}
                style={[styles.zoomBtn, active && { backgroundColor: zoomActiveBg }]}
                hitSlop={6}
              >
                <Text style={[
                  styles.zoomBtnText,
                  { color: iconColor },
                  active && styles.zoomBtnActive,
                ]}>
                  {preset.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

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

      {/* Right slot — flip camera */}
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
  zoomRow: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  zoomBtn: {
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  zoomBtnText: {
    ...textStyles.caption1,
    opacity: 0.6,
  },
  zoomBtnActive: {
    opacity: 1,
    fontWeight: '700',
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