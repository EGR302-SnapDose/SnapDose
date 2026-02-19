import NumberInput from '@/components/onboarding/number-input';
import OnboardingLayout from '@/components/onboarding/onboarding-layout';
import { ThemedView } from '@/components/themed-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Step3Screen() {
  const [feet, setFeet] = useState(5);
  const [inches, setInches] = useState(8);
  const router = useRouter();
  const [accentColor, setAccentColor] = useState('#EF4444');
  const insets = useSafeAreaInsets();

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
    <ThemedView style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
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
              onChange={(val) => setFeet(Math.max(Math.min(val, 8), 3))}
              label="feet"
              min={3}
              max={8}
            />
            <NumberInput
              value={inches}
              onIncrement={() => setInches(i => (i + 1) % 12)}
              onDecrement={() => setInches(i => (i - 1 + 12) % 12)}
              onChange={(val) => setInches(val % 12)}
              label="inches"
            />
          </View>
        </View>
      </OnboardingLayout>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
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
    fontWeight: '300',
  },
});