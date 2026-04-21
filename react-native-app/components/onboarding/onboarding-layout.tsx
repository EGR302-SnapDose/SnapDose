import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressBar from './progress-bar';

interface OnboardingLayoutProps {
  currentStep: number;
  totalSteps: number;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onNext: () => void;
  canProceed: boolean;
  nextButtonText?: string;
  accentColor: string;
}

export default function OnboardingLayout({
  currentStep,
  totalSteps,
  icon,
  title,
  subtitle,
  children,
  onNext,
  canProceed,
  nextButtonText = 'Next',
  accentColor,
}: OnboardingLayoutProps) {
  const router = useRouter();
  const c = useThemeColors();
  const backgroundColor = c.background;
  const iconContainerColor = c.surfaceSubtle;
  const iconColor = c.textPrimary;
  const titleColor = c.textPrimary;
  const subtitleColor = c.textSecondary;
  const backButtonColor = c.buttonSecondary;
  const backButtonTextColor = c.textPrimary;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <ThemedView style={styles.container}>
            <ProgressBar currentStep={currentStep} totalSteps={totalSteps} accentColor={accentColor} />

            <View style={[styles.iconContainer, { backgroundColor: iconContainerColor }]}>
              <Ionicons name={icon} size={40} color={iconColor} />
            </View>

            <ThemedText style={[styles.title, { color: titleColor }]}>{title}</ThemedText>
            {subtitle && <ThemedText style={[styles.subtitle, { color: subtitleColor }]}>{subtitle}</ThemedText>}

            <View style={styles.content}>
              {children}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.backButton, { backgroundColor: backButtonColor }]}
                onPress={handleBack}
              >
                <ThemedText style={[styles.backButtonText, { color: backButtonTextColor }]}>Back</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.nextButton,
                  { backgroundColor: accentColor },
                  !canProceed && styles.nextButtonDisabled,
                ]}
                onPress={onNext}
                disabled={!canProceed}
              >
                <ThemedText style={styles.nextButtonText}>{nextButtonText} →</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  backButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});