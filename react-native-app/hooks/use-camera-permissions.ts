import { Alert, Linking } from 'react-native';
import { Camera } from 'expo-camera';

interface UseCameraPermissionReturn {
  askForPermission: () => Promise<boolean>;
}

export function useCameraPermission(): UseCameraPermissionReturn {
  const askForPermission = async (): Promise<boolean> => {
    const permission = await Camera.getCameraPermissionsAsync();

    if (permission.granted) return true;

    if (permission.canAskAgain) {
      const result = await Camera.requestCameraPermissionsAsync();
      return result.granted;
    }

    Alert.alert(
      'Camera Access Required',
      'Please enable camera access in your device settings to use this feature.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  };

  return {
    askForPermission,
  };
}