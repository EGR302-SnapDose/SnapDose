import NumberInput from '@/components/onboarding/number-input';
import OnboardingLayout from '@/components/onboarding/onboarding-layout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function Step5Screen() {
  const [age, setAge] = useState(25);
  const router = useRouter();
  const [accentColor, setAccentColor] = useState('#EF4444');

  useEffect(() => {
    AsyncStorage.getItem('onboarding_accentColor').then((color) => {
      if (color) setAccentColor(color);
    });
  }, []);
  

  const handleNext = async () => {
    await AsyncStorage.setItem('onboarding_age', age.toString());
    router.push('/onboarding/step6');
  };

  return (
    <OnboardingLayout
      currentStep={5}
      totalSteps={6}
      icon="calendar-outline"
      title="What's your age?"
      subtitle="Help us understand your health needs"
      onNext={handleNext}
      canProceed={true}
      accentColor={accentColor}
    >
      <View style={styles.container}>
        <NumberInput
          value={age}
          onIncrement={() => setAge(a => Math.min(a + 1, 120))}
          onDecrement={() => setAge(a => Math.max(a - 1, 1))}
          label="years"
          min={1}
          max={120}
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