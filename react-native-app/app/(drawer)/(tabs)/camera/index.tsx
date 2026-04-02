import { CameraPermissionPrompt } from '@/components/camera/CameraPermissionPrompt';
import { CameraControls, ZOOM_PRESETS } from '@/components/camera/CaptureButton';
import { PhotoPreview } from '@/components/camera/PhotoPreview';
import { ThemedView } from '@/components/themed-view';
import { Toast } from '@/components/ui/Toast';
import { Colors, colors, radius, spacing } from '@/constants/theme';
import { useCameraPermission } from '@/hooks/use-camera-permissions';
import { usePhotoStorage } from '@/hooks/use-photo-storage';
import { useThemeColor } from '@/hooks/use-theme-color';
import { uploadImageToGCS } from '@/services/gcs-upload-service';
import { StoredPhoto } from '@/services/photo-storage';
import { Camera, CameraType, CameraView } from 'expo-camera';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

export type CapturedPhoto = {
  uri: string;
  base64?: string;
  width: number;
  height: number;
};

// Clamp helper
const clamp = (val: number, min: number, max: number) =>
  Math.min(max, Math.max(min, val));

// Full allowed range for pinch (0 = ultrawide, 0.5 = ~2x)
const PINCH_MIN = 0;
const PINCH_MAX = 0.5;

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [granted, setGranted] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<StoredPhoto | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Photo uploaded!');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // zoom is a plain number 0–0.5; default to 1x preset
  const [zoom, setZoom] = useState(ZOOM_PRESETS[1].value);
  const pinchStartZoom = useRef(ZOOM_PRESETS[1].value);

  const { askForPermission } = useCameraPermission();
  const { savePhoto, removePhoto } = usePhotoStorage();

  const controlsBg = useThemeColor(
    { light: colors.surfaceSubtle, dark: Colors.dark.surface },
    'surface'
  );

  useEffect(() => {
    Camera.getCameraPermissionsAsync().then((permission) => {
      setGranted(permission.granted);
    });
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // ── Pinch gesture ──────────────────────────────────────────────────────────
  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      pinchStartZoom.current = zoom;
    })
    .onUpdate((e) => {
      // Additive delta with sensitivity factor so it feels natural
      const next = pinchStartZoom.current + (e.scale - 1) * 0.25;
      setZoom(clamp(next, PINCH_MIN, PINCH_MAX));
    })
    .runOnJS(true);

  const handleRequestPermission = async () => {
    const result = await askForPermission();
    setGranted(result);
  };

  const toggleFacing = () => {
    setZoom(ZOOM_PRESETS[1].value); // reset to 1x on flip
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const handleCapture = async () => {
    if (isCapturing || !cameraRef.current) return;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        exif: false,
      });
      if (photo) {
        const stored = await savePhoto(photo.uri, photo.base64, photo.width, photo.height);
        if (stored) setPreviewPhoto(stored);
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = async () => {
    if (previewPhoto) await removePhoto(previewPhoto.fileName);
    setPreviewPhoto(null);
  };

  const handleUsePhoto = async (photo: StoredPhoto, notes?: string) => {
    setIsProcessing(true);
    try {
      const uploadResult = await uploadImageToGCS(photo.uri, photo.fileName, undefined, notes);

      if (!uploadResult.success || !uploadResult.fileName) {
        throw new Error(uploadResult.error ?? 'Upload failed');
      }

      setPreviewPhoto(null);
      setToastMessage('Photo uploaded!');
      setShowToast(true);

      toastTimer.current = setTimeout(() => {
        setShowToast(false);
        router.push({
          pathname: '/(drawer)/(tabs)/camera/results' as any,
          params: { imagePath: uploadResult.fileName, localUri: photo.uri },
        });
      }, 1500);

    } catch (error) {
      console.error('Failed to process photo:', error);
      setToastMessage('Upload failed, please try again.');
      setShowToast(true);
      toastTimer.current = setTimeout(() => setShowToast(false), 2500);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!granted) {
    return (
      <CameraPermissionPrompt
        onRequestPermission={handleRequestPermission}
        onCancel={() => router.push('/(drawer)/(tabs)' as any)}
      />
    );
  }

  if (previewPhoto) {
    return (
      <PhotoPreview
        photo={previewPhoto}
        onRetake={handleRetake}
        onUsePhoto={handleUsePhoto}
        isProcessing={isProcessing}
      />
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <ThemedView style={styles.container}>
        <GestureDetector gesture={pinchGesture}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            zoom={zoom}
          />
        </GestureDetector>

        <SafeAreaView
          style={[styles.controls, { backgroundColor: controlsBg }]}
          edges={['bottom']}
        >
          <CameraControls
            onCapture={handleCapture}
            onFlip={toggleFacing}
            onBack={() => router.push('/(drawer)/(tabs)' as any)}
            isCapturing={isCapturing}
            zoom={zoom}
            onZoomChange={setZoom}
          />
        </SafeAreaView>

        <Toast visible={showToast} message={toastMessage} />
      </ThemedView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  controls: {
    justifyContent: 'flex-end',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
});