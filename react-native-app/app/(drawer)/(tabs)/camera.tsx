import { StyleSheet, View } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CameraScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      {/* Viewfinder area */}
      <View style={styles.viewfinder}>
        {/* Camera icon + label */}
        <View style={styles.promptContainer}>
          <IconSymbol
            name="camera"
            size={72}
            color="#555"
            style={styles.cameraIcon}
          />
          <ThemedText type="defaultSemiBold" style={styles.promptTitle}>
            Point at your food
          </ThemedText>
          <ThemedText style={styles.promptSubtitle}>
            AI will analyze nutrition
          </ThemedText>
        </View>

        {/* Shutter button */}
        <View style={[styles.shutterWrapper, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.shutterOuter}>
            <View style={styles.shutterInner} />
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewfinder: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 40,
  },
  promptContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  cameraIcon: {
    marginBottom: 8,
    opacity: 0.5,
  },
  promptTitle: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '600',
  },
  promptSubtitle: {
    fontSize: 14,
    color: '#888',
  },
  shutterWrapper: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#333',
  },
});