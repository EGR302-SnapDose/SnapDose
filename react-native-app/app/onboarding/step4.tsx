import NumberInput from '@/components/onboarding/number-input';
import OnboardingLayout from '@/components/onboarding/onboarding-layout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function Step4Screen() {
  const [weight, setWeight] = useState(150);
  const router = useRouter();
  const [accentColor, setAccentColor] = useState('#EF4444');

  useEffect(() => {
    AsyncStorage.getItem('onboarding_accentColor').then((color) => {
      if (color) setAccentColor(color);
    });
  }, []);


  const handleNext = async () => {
    await AsyncStorage.setItem('onboarding_weight', weight.toString());
    router.push('/onboarding/step5');
  };

  return (
    <OnboardingLayout
      currentStep={4}
      totalSteps={6}
      icon="scale-outline"
      title="What's your weight?"
      subtitle="Track your health metrics"
      onNext={handleNext}
      canProceed={true}
      accentColor={accentColor}
    >
      <View style={styles.container}>
        <NumberInput
          value={weight}
          onIncrement={() => setWeight(w => Math.min(w + 1, 500))}
          onDecrement={() => setWeight(w => Math.max(w - 1, 50))}
          label="lbs"
          min={50}
          max={500}
        />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
});