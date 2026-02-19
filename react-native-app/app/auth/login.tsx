import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { loginUser } from '@/services/auth-service';
import { checkOnboardingStatus } from '@/services/user-service';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const textColor = useThemeColor({}, 'text');
    const subtitleColor = useThemeColor({ light: '#888', dark: '#999' }, 'icon');
    const inputBackground = useThemeColor({ light: '#f0f0f0', dark: '#1A1A1A' }, 'background');
    const inputPlaceholder = useThemeColor({ light: '#aaa', dark: '#666' }, 'icon');
    const colorScheme = useColorScheme();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }

        setLoading(true);
        try {
            await loginUser(email, password);
            const hasCompletedOnboarding = await checkOnboardingStatus();
            if (hasCompletedOnboarding) {
                router.replace('/(drawer)/(tabs)');
            } else {
                router.replace('/onboarding/step1');
            }
        } catch (error: any) {
            Alert.alert('Login Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

  return (
    <ThemedView style={styles.container}>
      <Text style={[styles.title, { color: textColor }]}>SnapDose</Text>
      <Text style={[styles.subtitle, { color: subtitleColor }]}>Login to your account</Text>

      <View style={styles.form}>
        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, color: textColor }]}
          placeholder="Email"
          placeholderTextColor={inputPlaceholder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={[styles.input, { backgroundColor: inputBackground, color: textColor }]}
          placeholder="Password"
          placeholderTextColor={inputPlaceholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth/register')}>
          <Text style={[styles.linkText, { color: subtitleColor }]}>
            Don't have an account? <Text style={styles.linkTextBold}>Create one here</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  input: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  linkText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  linkTextBold: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
