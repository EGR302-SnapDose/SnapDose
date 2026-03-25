import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { StoredPhoto } from '@/services/photo-storage';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Keyboard,
  KeyboardEvent,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  UIManager,
  View,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = 280;

interface PhotoPreviewProps {
  photo: StoredPhoto;
  onRetake: () => void;
  onUsePhoto: (photo: StoredPhoto, notes?: string) => void;
  isProcessing?: boolean;
}

export function PhotoPreview({ photo, onRetake, onUsePhoto, isProcessing }: PhotoPreviewProps) {
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);

  // sheetAnim: slides the sheet in/out (0 = visible, SHEET_HEIGHT = hidden below)
  const sheetAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  // keyboardOffset: lifts the sheet up with the keyboard (0 = no keyboard, N = keyboard height)
  const keyboardOffset = useRef(new Animated.Value(0)).current;

  const barBg = useThemeColor({ light: '#F2F2F2', dark: '#1e1e1e' }, 'background');
  const iconColor = useThemeColor({ light: '#000', dark: '#fff' }, 'background');
  const mutedColor = useThemeColor({ light: '#888888', dark: '#888888' }, 'icon');
  const useButtonBg = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'background');
  const inputBg = useThemeColor({ light: '#fff', dark: '#2c2c2c' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const animateOffset = (toValue: number, event: KeyboardEvent) => {
      Animated.timing(keyboardOffset, {
        toValue,
        duration: event.duration ?? 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    };

    const showSub = Keyboard.addListener(showEvent, (e) => {
      animateOffset(e.endCoordinates.height, e);
    });

    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      animateOffset(0, e);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const openSheet = () => {
    setShowNotesInput(true);
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeSheet = () => {
    Keyboard.dismiss();
    Animated.timing(sheetAnim, {
      toValue: SHEET_HEIGHT,
      duration: 280,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setShowNotesInput(false));
  };

  const handleUsePhoto = () => {
    onUsePhoto(photo, notes.trim() || undefined);
  };

  // Sheet slides up from below AND lifts with the keyboard simultaneously
  const translateY = Animated.add(sheetAnim, Animated.multiply(keyboardOffset, -1));

  return (
    <ThemedView style={styles.container}>
      <Image source={{ uri: photo.uri }} style={styles.preview} resizeMode="cover" />

      {showNotesInput && (
        <>
          <TouchableWithoutFeedback onPress={closeSheet}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>
          <Animated.View
            style={[
              styles.bottomSheet,
              { backgroundColor: barBg },
              { transform: [{ translateY }] },
            ]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.notesHeader}>
              <ThemedText style={styles.notesTitle}>Notes for AI</ThemedText>
              <TouchableOpacity onPress={closeSheet}>
                <ThemedText style={[styles.doneButton, { color: useButtonBg }]}>
                  Save
                </ThemedText>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.notesInput, { backgroundColor: inputBg, color: textColor }]}
              placeholder="e.g., 'This is a small portion' or 'Include the drink'"
              placeholderTextColor={mutedColor}
              value={notes}
              onChangeText={setNotes}
              multiline
              autoFocus
            />
          </Animated.View>
        </>
      )}

      <View style={[styles.bottomBar, { backgroundColor: barBg }]}>
        <TouchableOpacity style={styles.sideButton} onPress={onRetake} disabled={isProcessing}>
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
          onPress={handleUsePhoto}
          disabled={isProcessing}
        >
          <ThemedText style={styles.useButtonText}>
            {isProcessing ? 'Analyzing...' : 'Use Photo'}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.notesButton} onPress={openSheet} disabled={isProcessing}>
          <Ionicons
            name={notes ? 'document-text' : 'document-text-outline'}
            size={24}
            color={isProcessing ? mutedColor : notes ? useButtonBg : iconColor}
          />
          <ThemedText
            style={[
              styles.buttonLabel,
              isProcessing && { color: mutedColor },
              notes && { color: useButtonBg },
            ]}
          >
            {notes ? 'Edit' : 'Notes for AI'}
          </ThemedText>
        </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  sideButton: {
    width: 60,
    alignItems: 'center',
    gap: 4,
  },
  notesButton: {
    minWidth: 70,
    alignItems: 'center',
    gap: 4,
  },
  buttonLabel: {
    fontSize: 12,
    textAlign: 'center',
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    // Extend well below the visible bottom so the sheet background
    // fills the gap behind the keyboard — no matter the device height.
    bottom: -500,
    paddingBottom: 500,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    minHeight: SHEET_HEIGHT,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  doneButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  notesInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
});