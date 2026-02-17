import NumberInput from '@/components/onboarding/number-input';
import OnboardingLayout from '@/components/onboarding/onboarding-layout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Step3Screen() {
  const [feet, setFeet] = useState(5);
  const [inches, setInches] = useState(8);
  const router = useRouter();
  const [accentColor, setAccentColor] = useState('#EF4444');
  
  useEffect(() => {
    AsyncStorage.getItem('onboarding_accentColor').then((color) => {
      if (color) setAccentColor(color);
    });
  }, []);



  const handleNext = async () => {
    await AsyncStorage.setItem('onboarding_heightFeet', feet.toString());
    await AsyncStorage.setItem('onboarding_heightInches', inches.toString());
    router.push('/onboarding/step4');
  };

  return (
    <OnboardingLayout
      currentStep={3}
      totalSteps={6}
      icon="resize-outline"
      title="What's your height?"
      subtitle="This helps personalize your health data"
      onNext={handleNext}
      canProceed={true}
      accentColor={accentColor}
    >
      <View style={styles.container}>
        <View style={styles.inputRow}>
          <NumberInput
            value={feet}
            onIncrement={() => setFeet(f => Math.min(f + 1, 8))}
            onDecrement={() => setFeet(f => Math.max(f - 1, 3))}
            label="feet"
            min={3}
            max={8}
          />
          <Text style={styles.separator}>:</Text>
          <NumberInput
            value={inches}
            onIncrement={() => setInches(i => (i + 1) % 12)}
            onDecrement={() => setInches(i => (i - 1 + 12) % 12)}
            label="inches"
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
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  separator: {
    fontSize: 48,
    color: '#555',
    fontWeight: '300',
  },
});