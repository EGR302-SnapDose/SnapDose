import { ThemedView } from '@/components/themed-view';
import { colors, layout, radius, shadows, spacing, textStyles } from '@/constants/theme';
import { loginUser } from '@/services/auth-service';
import { checkOnboardingStatus } from '@/services/user-service';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const passwordRef = useRef<TextInput>(null);

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
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Brand ── */}
            <View style={styles.header}>
              <Text style={styles.title}>SnapDose</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>

            {/* ── Form card ── */}
            <View style={styles.card}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  style={[styles.input, emailFocused && styles.inputFocused]}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Password</Text>
                <TextInput
                  ref={passwordRef}
                  style={[styles.input, passwordFocused && styles.inputFocused]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.82}
              >
                {loading ? (
                  <ActivityIndicator color={colors.textInverse} />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* ── Register link ── */}
            <TouchableOpacity
              onPress={() => router.push('/auth/register')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.registerLink}
            >
              <Text style={styles.linkText}>
                Don't have an account?{' '}
                <Text style={styles.linkTextBold}>Create one</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingVertical: layout.screenVerticalPadding,
  },

  // ── Brand ──────────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  title: {
    ...textStyles.largeTitleBold,
    color: colors.primary,
    marginBottom: spacing[1],
  },
  subtitle: {
    ...textStyles.callout,
    color: colors.textSecondary,
  },

  // ── Form card ──────────────────────────────────────────────────────────
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing[5],
    gap: spacing[4],
    ...shadows.card,
  },
  fieldGroup: {
    gap: spacing[1],
  },
  fieldLabel: {
    ...textStyles.footnoteSemibold,
    color: colors.textSecondary,
    marginLeft: spacing[1],
  },
  input: {
    height: layout.inputHeight,
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.inputBorder,
    paddingHorizontal: spacing[4],
    ...textStyles.body,
    color: colors.textPrimary,
  },
  inputFocused: {
    borderColor: colors.inputBorderFocus,
    borderWidth: 1.5,
  },

  // ── CTA ────────────────────────────────────────────────────────────────
  button: {
    height: layout.buttonHeightLg,
    backgroundColor: colors.buttonPrimary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[1],
    ...shadows.sm,
  },
  buttonDisabled: {
    backgroundColor: colors.buttonDisabled,
  },
  buttonText: {
    ...textStyles.calloutSemibold,
    color: colors.textInverse,
  },

  // ── Register link ───────────────────────────────────────────────────────
  registerLink: {
    alignItems: 'center',
    marginTop: spacing[6],
  },
  linkText: {
    ...textStyles.footnote,
    color: colors.textSecondary,
  },
  linkTextBold: {
    ...textStyles.footnoteSemibold,
    color: colors.textLink,
  },
});