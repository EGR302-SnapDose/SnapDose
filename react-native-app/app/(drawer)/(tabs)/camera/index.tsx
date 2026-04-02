import { CameraPermissionPrompt } from '@/components/camera/CameraPermissionPrompt';
import { CameraControls } from '@/components/camera/CaptureButton';
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
import { SafeAreaView } from 'react-native-safe-area-context';

export type CapturedPhoto = {
  uri: string;
  base64?: string;
  width: number;
  height: number;
};

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
  const { askForPermission } = useCameraPermission();
  const { savePhoto, removePhoto } = usePhotoStorage();

  // HIG: Use semantic surface tokens — never hardcoded hex
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

  const handleRequestPermission = async () => {
    const result = await askForPermission();
    setGranted(result);
  };

  const toggleFacing = () => {
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
    <ThemedView style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
      <SafeAreaView
        style={[styles.controls, { backgroundColor: controlsBg }]}
        edges={['bottom']}
      >
        <CameraControls
          onCapture={handleCapture}
          onFlip={toggleFacing}
          onBack={() => router.push('/(drawer)/(tabs)' as any)}
          isCapturing={isCapturing}
        />
      </SafeAreaView>
      <Toast visible={showToast} message={toastMessage} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  // HIG: Controls bar sits at the bottom, respects safe area, uses
  // consistent padding from the 8pt grid. borderRadius on top corners
  // gives a sheet-like appearance matching iOS native camera UI.
  controls: {
    justifyContent: 'flex-end',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,

  },
});