import { useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { CameraView, CameraType, Camera } from 'expo-camera';
import { router } from 'expo-router';
import { useCameraPermission } from '@/hooks/use-camera-permissions';
import { usePhotoStorage } from '@/hooks/use-photo-storage';
import { StoredPhoto } from '@/services/photo-storage';
import { CameraPermissionPrompt } from '@/components/camera/CameraPermissionPrompt';
import { CameraControls } from '@/components/camera/CaptureButton';
import { PhotoPreview } from '@/components/camera/PhotoPreview';
import { Toast } from '@/components/ui/Toast';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

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
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { askForPermission } = useCameraPermission();
  const { savePhoto, removePhoto } = usePhotoStorage();
  const controlsBg = useThemeColor({ light: '#F2F2F2', dark: '#1e1e1e' }, 'background');

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

  const handleUsePhoto = async (photo: StoredPhoto) => {
    setIsProcessing(true);
    try {
      // TODO: send photo.base64 to AI API here

      // Go back to camera and show toast
      setPreviewPhoto(null);
      setShowToast(true);
      toastTimer.current = setTimeout(() => setShowToast(false), 2500);
    } catch (error) {
      console.error('Failed to process photo:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!granted) {
    return (
      <CameraPermissionPrompt
        onRequestPermission={handleRequestPermission}
        onCancel={() => router.back()}
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
      <SafeAreaView style={[styles.controls, { backgroundColor: controlsBg }]}>
        <CameraControls
          onCapture={handleCapture}
          onFlip={toggleFacing}
          onBack={() => router.push('/(drawer)/(tabs)')}
          isCapturing={isCapturing}
        />
      </SafeAreaView>
      <Toast visible={showToast} message="Photo saved!" />
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
  controls: {
    justifyContent: 'flex-end',
  },
});