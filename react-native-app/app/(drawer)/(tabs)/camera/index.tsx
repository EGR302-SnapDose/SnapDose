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
import { hapticError, hapticLight } from '@/utils/haptics';
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

const PINCH_MIN = 0;
const PINCH_MAX = 0.3;

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [granted, setGranted] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<StoredPhoto | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref to abort an in-flight upload
  const uploadCancelRef = useRef<(() => void) | null>(null);
  const cancelRequestedRef = useRef(false);

  const [zoom, setZoom] = useState<number>(ZOOM_PRESETS[1].value);
  const pinchStartZoom = useRef<number>(ZOOM_PRESETS[1].value);

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

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      pinchStartZoom.current = zoom;
    })
    .onUpdate((e) => {
      const next = pinchStartZoom.current + (e.scale - 1) * 0.25;
      setZoom(clamp(next, PINCH_MIN, PINCH_MAX));
    })
    .runOnJS(true);

  const handleRequestPermission = async () => {
    const result = await askForPermission();
    setGranted(result);
  };

  const toggleFacing = () => {
    setZoom(ZOOM_PRESETS[1].value);
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

  const handleCancelUpload = () => {
    cancelRequestedRef.current = true;
    if (uploadCancelRef.current) {
      uploadCancelRef.current();
      uploadCancelRef.current = null;
    }
    setIsProcessing(false);
    setUploadProgress(0);
  };

  const handleUsePhoto = async (photo: StoredPhoto, notes?: string) => {
    setIsProcessing(true);
    setUploadProgress(0);
    cancelRequestedRef.current = false;

    try {
      const uploadResult = await uploadImageToGCS(
        photo.uri,
        photo.fileName,
        (progress) => {
          setUploadProgress(progress.percentage);
        },
        notes,
        // Pass a cancel registration callback if the service supports it
        (cancelFn) => {
          if (cancelRequestedRef.current) {
            cancelFn();
            return;
          }
          uploadCancelRef.current = cancelFn;
        }
      );

      if (uploadResult.canceled) {
        return;
      }

      if (!uploadResult.success || !uploadResult.fileName) {
        throw new Error(uploadResult.error ?? 'Upload failed');
      }

      setPreviewPhoto(null);
      // Navigate immediately — no toast delay so the results screen
      // mounts while the Cloud Function is still processing, giving
      // the stage indicator time to animate through all three steps.
      router.push({
        pathname: '/(drawer)/(tabs)/camera/results' as any,
        params: { imagePath: uploadResult.fileName, localUri: photo.uri },
      });

    } catch (error: any) {
      // Swallow cancellation — user deliberately aborted, no error toast needed
      if (error?.code === 'storage/canceled' || error?.code === 'storage/cancelled') {
        return;
      }
      hapticError();
      console.error('Failed to process photo:', error);
      setToastMessage('Upload failed, please try again.');
      setShowToast(true);
      toastTimer.current = setTimeout(() => setShowToast(false), 2500);
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
      uploadCancelRef.current = null;
      cancelRequestedRef.current = false;
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
        onCancel={handleCancelUpload}
        isProcessing={isProcessing}
        uploadProgress={uploadProgress}
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