import { StyleSheet, View, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { StoredPhoto } from '@/services/photo-storage';

interface PhotoPreviewProps {
  photo: StoredPhoto;
  onRetake: () => void;
  onUsePhoto: (photo: StoredPhoto) => void;
  isProcessing?: boolean;
}

export function PhotoPreview({ photo, onRetake, onUsePhoto, isProcessing }: PhotoPreviewProps) {
  const barBg = useThemeColor({ light: '#F2F2F2', dark: '#1e1e1e' }, 'background');
  const iconColor = useThemeColor({ light: '#000', dark: '#fff' }, 'background');
  const mutedColor = useThemeColor({ light: '#888888', dark: '#888888' }, 'icon');
  const useButtonBg = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'background');

  return (
    <ThemedView style={styles.container}>
      <Image source={{ uri: photo.uri }} style={styles.preview} resizeMode="cover" />

      <View style={[styles.bottomBar, { backgroundColor: barBg }]}>
        <TouchableOpacity
          style={styles.sideButton}
          onPress={onRetake}
          disabled={isProcessing}
        >
          <Ionicons
            name="refresh-outline"
            size={24}
            color={isProcessing ? mutedColor : iconColor}
          />
          <ThemedText style={[styles.buttonLabel, isProcessing && { color: mutedColor }]}>
            Retake
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.useButton, { backgroundColor: useButtonBg }, isProcessing && styles.disabled]}
          onPress={() => onUsePhoto(photo)}
          disabled={isProcessing}
        >
          <ThemedText style={styles.useButtonText}>
            {isProcessing ? 'Analyzing...' : 'Use Photo'}
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.sideButton} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  preview: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  sideButton: {
    width: 72,
    alignItems: 'center',
    gap: 4,
  },
  buttonLabel: {
    fontSize: 12,
  },
  useButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  useButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});