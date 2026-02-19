import OnboardingLayout from '@/components/onboarding/onboarding-layout';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';


export default function Step1Screen() {
  const [name, setName] = useState('');
  const [accentColor, setAccentColor] = useState('#EF4444');
  const router = useRouter();

  const inputBackground = useThemeColor({ light: '#F0F0F0', dark: '#1A1A1A' }, 'background');
  const inputColor = useThemeColor({ light: '#000000', dark: '#FFFFFF' }, 'text');
  const inputBorderColor = useThemeColor({ light: '#CCCCCC', dark: '#333333' }, 'icon');
  const placeholderColor = useThemeColor({ light: '#999999', dark: '#555555' }, 'icon');

  useEffect(() => {
    AsyncStorage.getItem('onboarding_accentColor').then((color) => {
      if (color) setAccentColor(color);
    });
  }, []);

  const handleNext = async () => {
    if (name.trim()) {
      await AsyncStorage.setItem('onboarding_displayName', name.trim());
      const existingColor = await AsyncStorage.getItem('onboarding_accentColor');
      if (!existingColor) {
        await AsyncStorage.setItem('onboarding_accentColor', '#EF4444');
      }
      router.push('/onboarding/step2');
    }
  };

  return (
    <OnboardingLayout
      currentStep={1}
      totalSteps={6}
      icon="person-outline"
      title="Create Your Profile"
      subtitle="Let's get to know you better"
      onNext={handleNext}
      canProceed={name.trim().length > 0}
      accentColor={accentColor}
    >
      <ThemedView style={styles.container}>
        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Full Name</ThemedText>
          <TextInput
            style={[styles.input, {
              backgroundColor: inputBackground,
              color: inputColor,
              borderColor: inputBorderColor,
            }]}
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
            placeholderTextColor={placeholderColor}
            maxLength={50}
          />
        </View>
      </ThemedView>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    gap: 32,
  },
  inputContainer: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    borderWidth: 1,
  },
});