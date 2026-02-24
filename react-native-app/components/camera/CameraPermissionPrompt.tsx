import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface CameraPermissionPromptProps {
  onRequestPermission: () => void;
  onCancel: () => void;
}

export function CameraPermissionPrompt({ onRequestPermission, onCancel }: CameraPermissionPromptProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Camera Access Required</Text>
      <Text style={styles.message}>We need camera access to take photos.</Text>
      <TouchableOpacity onPress={onRequestPermission}>
        <Text>Allow Camera</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onCancel}>
        <Text>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold' },
  message: { fontSize: 16, marginVertical: 10 },
});