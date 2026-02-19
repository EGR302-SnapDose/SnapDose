import OnboardingLayout from '@/components/onboarding/onboarding-layout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ACCENT_COLORS = [
  '#EF4444',
  '#3B82F6', 
  '#A855F7', 
  '#10B981', 
  '#F59E0B', 
  '#EC4899',
];

export default function Step2Screen() {
  const [selectedColor, setSelectedColor] = useState('#EF4444');
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.getItem('onboarding_accentColor').then((color) => {
      if (color) setSelectedColor(color);
    });
  }, []);

  const handleColorSelect = async (color: string) => {
    setSelectedColor(color);
    await AsyncStorage.setItem('onboarding_accentColor', color);
  };

  const handleNext = async () => {
    router.push('/onboarding/step3');
  };

  return (
    <OnboardingLayout
      currentStep={2}
      totalSteps={6}
      icon="color-palette-outline"
      title="Choose Your Accent Color"
      subtitle="Personalize your experience"
      onNext={handleNext}
      canProceed={true}
      accentColor={selectedColor}
    >
      <View style={styles.colorGrid}>
        {ACCENT_COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              selectedColor === color && styles.colorOptionSelected,
            ]}
            onPress={() => handleColorSelect(color)}
          >
            {selectedColor === color && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
    maxWidth: 300,
  },
  colorOption: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#FFF',
  },
  checkmark: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: '700',
  },
});