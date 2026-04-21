import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useSemanticColor } from '@/hooks/use-theme-colors';
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
  onCancel?: () => void;
  isProcessing?: boolean;
  /** 0–1 real upload progress from GCS state_changed events */
  uploadProgress?: number;
}

export function PhotoPreview({
  photo,
  onRetake,
  onUsePhoto,
  onCancel,
  isProcessing,
  uploadProgress = 0,
}: PhotoPreviewProps) {
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);

  // sheetAnim: slides the sheet in/out (0 = visible, SHEET_HEIGHT = hidden below)
  const sheetAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  // keyboardOffset: lifts the sheet up with the keyboard
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  // Animated progress bar width (0→1)
  const progressAnim = useRef(new Animated.Value(0)).current;

  const barBg = useThemeColor({ light: '#F2F2F2', dark: '#1e1e1e' }, 'background');
  const iconColor = useThemeColor({ light: '#000', dark: '#fff' }, 'background');
  const mutedColor = useThemeColor({ light: '#888888', dark: '#888888' }, 'icon');
  const useButtonBg = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'background');
  const inputBg = useThemeColor({ light: '#fff', dark: '#2c2c2c' }, 'background');
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');
  const progressTrackBg = useThemeColor({ light: '#E5E5EA', dark: '#3A3A3C' }, 'background');
  const dangerColor = useSemanticColor('danger');
  const handleColor = useSemanticColor('border');

  // Animate progress bar whenever uploadProgress changes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: uploadProgress,
      duration: 120,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false, // width animation can't use native driver
    }).start();
  }, [uploadProgress]);

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

    const showSub = Keyboard.addListener(showEvent, (e) => animateOffset(e.endCoordinates.height, e));
    const hideSub = Keyboard.addListener(hideEvent, (e) => animateOffset(0, e));

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

  const translateY = Animated.add(sheetAnim, Animated.multiply(keyboardOffset, -1));

  // Derive upload stage label for accessibility + UX copy
  const uploadLabel = (() => {
    if (!isProcessing) return 'Use Photo';
    if (uploadProgress < 1) return `Uploading… ${Math.round(uploadProgress * 100)}%`;
    return 'Processing…';
  })();

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
            <View style={[styles.sheetHandle, { backgroundColor: handleColor }]} />
            <View style={styles.notesHeader}>
              <ThemedText style={styles.notesTitle}>Notes for AI</ThemedText>
              <TouchableOpacity onPress={closeSheet}>
                <ThemedText style={[styles.doneButton, { color: useButtonBg }]}>Save</ThemedText>
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
        {/* Retake / Cancel — swap label while uploading */}
        <TouchableOpacity
          style={styles.sideButton}
          onPress={isProcessing ? onCancel : onRetake}
          disabled={isProcessing && !onCancel}
        >
          <Ionicons
            name={isProcessing ? 'close-outline' : 'refresh-outline'}
            size={24}
            color={isProcessing ? (onCancel ? dangerColor : mutedColor) : iconColor}
          />
          <ThemedText
            style={[
              styles.buttonLabel,
              isProcessing && onCancel && { color: dangerColor },
              isProcessing && !onCancel && { color: mutedColor },
            ]}
          >
            {isProcessing ? 'Cancel' : 'Retake'}
          </ThemedText>
        </TouchableOpacity>

        {/* Use Photo button with progress bar underneath */}
        <View style={styles.useButtonWrapper}>
          <TouchableOpacity
            style={[
              styles.useButton,
              { backgroundColor: useButtonBg },
              isProcessing && styles.disabled,
            ]}
            onPress={handleUsePhoto}
            disabled={isProcessing}
          >
            <ThemedText style={styles.useButtonText}>{uploadLabel}</ThemedText>
          </TouchableOpacity>

          {/* Progress track — only visible while uploading */}
          {isProcessing && (
            <View style={[styles.progressTrack, { backgroundColor: progressTrackBg }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { backgroundColor: useButtonBg },
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          )}
        </View>

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
              notes && !isProcessing && { color: useButtonBg },
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
  // Wrapper holds the button + progress track as a column
  useButtonWrapper: {
    alignItems: 'center',
    gap: 8,
  },
  useButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.7,
  },
  useButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Progress bar
  progressTrack: {
    width: 140,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  // Notes sheet
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
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