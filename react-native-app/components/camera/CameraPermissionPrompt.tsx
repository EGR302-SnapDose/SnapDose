import { SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

interface CameraPermissionPromptProps {
  onRequestPermission: () => void;
  onCancel: () => void;
}

export function CameraPermissionPrompt({
  onRequestPermission,
  onCancel,
}: CameraPermissionPromptProps) {
  const buttonBg = useThemeColor({ light: '#000', dark: '#fff' }, 'background');
  const buttonText = useThemeColor({ light: '#fff', dark: '#000' }, 'background');
  const mutedColor = useThemeColor({ light: '#888888', dark: '#888888' }, 'icon');

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.message}>
        Camera access is required to take photos.
      </ThemedText>
      <TouchableOpacity
        style={[styles.grantButton, { backgroundColor: buttonBg }]}
        onPress={onRequestPermission}
      >
        <ThemedText style={[styles.grantButtonText, { color: buttonText }]}>
          Grant Permission
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <ThemedText style={[styles.cancelButtonText, { color: mutedColor }]}>
          Cancel
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  grantButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  grantButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 16,
  },
});