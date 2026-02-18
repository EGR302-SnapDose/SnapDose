import OnboardingLayout from '@/components/onboarding/onboarding-layout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

export default function Step1Screen() {
  const [name, setName] = useState('');
  const [accentColor, setAccentColor] = useState('#EF4444');
  const router = useRouter();

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
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
            placeholderTextColor="#555"
            maxLength={50}
          />
        </View>
      </View>
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
    color: '#FFF',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#333',
  },
});