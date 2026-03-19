import NumberInput from '@/components/onboarding/number-input';
import OnboardingLayout from '@/components/onboarding/onboarding-layout';
import { useThemeColor } from '@/hooks/use-theme-color';
import { saveOnboardingData } from '@/services/user-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Step7Screen() {
  const [targetGlucoseMin, setTargetGlucoseMin] = useState(70);
  const [targetGlucoseMax, setTargetGlucoseMax] = useState(180);
  const router = useRouter();
  const [accentColor, setAccentColor] = useState('#EF4444');
  const separatorColor = useThemeColor({ light: '#000000', dark: '#FFFFFF' }, 'text');

  useEffect(() => {
    AsyncStorage.getItem('onboarding_accentColor').then((color) => {
      if (color) setAccentColor(color);
    });
  }, []);

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem('onboarding_targetGlucoseMin', targetGlucoseMin.toString());
      await AsyncStorage.setItem('onboarding_targetGlucoseMax', targetGlucoseMax.toString());

      // Collect all onboarding data from AsyncStorage
      const displayName = await AsyncStorage.getItem('onboarding_displayName') || '';
      const accentColor = await AsyncStorage.getItem('onboarding_accentColor') || '#EF4444';
      const heightFeet = parseInt(await AsyncStorage.getItem('onboarding_heightFeet') || '5');
      const heightInches = parseInt(await AsyncStorage.getItem('onboarding_heightInches') || '8');
      const weight = parseInt(await AsyncStorage.getItem('onboarding_weight') || '150');
      const age = parseInt(await AsyncStorage.getItem('onboarding_age') || '25');
      const carbRatio = parseInt(await AsyncStorage.getItem('onboarding_carbRatio') || '10');
      const correctionFactor = parseInt(await AsyncStorage.getItem('onboarding_correctionFactor') || '50');

      // Save to Firebase
      const onboardingData = {
        displayName,
        accentColor,
        heightFeet,
        heightInches,
        weight,
        age,
        insulinToCarbRatio: carbRatio,
        correctionFactor,
        targetGlucoseMin,
        targetGlucoseMax,
      };

      await saveOnboardingData(onboardingData);

      // Mark as complete in AsyncStorage too
      await AsyncStorage.setItem('onboardingComplete', 'true');

      router.replace('/(drawer)/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  return (
    <OnboardingLayout
      currentStep={7}
      totalSteps={7}
      icon="fitness-outline"
      title="Target Glucose Range"
      subtitle="Set your target blood glucose levels"
      onNext={handleComplete}
      canProceed={true}
      accentColor={accentColor}
      nextButtonText="Get Started"
    >
      <View style={styles.container}>
        <View style={styles.settingsCard}>
          <View style={styles.inputRow}>
            <NumberInput
              value={targetGlucoseMax}
              onIncrement={() => setTargetGlucoseMax(m => Math.min(m + 5, 300))}
              onDecrement={() => setTargetGlucoseMax(m => Math.max(m - 5, 100))}
              onChange={(val) => setTargetGlucoseMax(Math.max(Math.min(val, 300), 100))}
              label="max (mg/dL)"
              min={100}
              max={300}
            />
            <Text style={[styles.separator, { color: separatorColor }]}>---</Text>
            <NumberInput
              value={targetGlucoseMin}
              onIncrement={() => setTargetGlucoseMin(m => Math.min(m + 5, 120))}
              onDecrement={() => setTargetGlucoseMin(m => Math.max(m - 5, 40))}
              onChange={(val) => setTargetGlucoseMin(Math.max(Math.min(val, 120), 40))}
              label="min (mg/dL)"
              min={40}
              max={120}
            />
          </View>
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
  settingsCard: {
    borderRadius: 20,
    width: '100%',
  },
  inputRow: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  separator: {
    fontSize: 48,
    fontWeight: '300',
    marginVertical: -20,
  },
});
