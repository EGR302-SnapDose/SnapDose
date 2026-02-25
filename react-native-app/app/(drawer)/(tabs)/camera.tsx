import { useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { CameraView, CameraType, Camera } from 'expo-camera';
import { router } from 'expo-router';
import { useCameraPermission } from '@/hooks/use-camera-permissions';
import { CameraPermissionPrompt } from '@/components/camera/CameraPermissionPrompt';
import { CameraControls } from '@/components/camera/CaptureButton';

export type CapturedPhoto = {
  uri: string;
  base64?: string;
  width: number;
  height: number;
};

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [granted, setGranted] = useState(false);
  const { askForPermission } = useCameraPermission();

  useEffect(() => {
    Camera.getCameraPermissionsAsync().then((permission) => {
      setGranted(permission.granted);
    });
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
      if (photo) console.log('Photo taken:', photo.uri);
    } catch (error) {
      console.error('Failed to take photo:', error);
    } finally {
      setIsCapturing(false);
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

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
      <SafeAreaView style={styles.controls}>
        <CameraControls
          onCapture={handleCapture}
          onFlip={toggleFacing}
          onBack={() => router.push('/(drawer)/(tabs)')}
          isCapturing={isCapturing}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  controls: {
    justifyContent: 'flex-end',
  },
});