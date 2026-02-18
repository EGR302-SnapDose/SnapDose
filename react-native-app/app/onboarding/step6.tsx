import NumberInput from '@/components/onboarding/number-input';
import OnboardingLayout from '@/components/onboarding/onboarding-layout';
import { useThemeColor } from '@/hooks/use-theme-color';
import { saveOnboardingData } from '@/services/user-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Step6Screen() {
  const [carbRatio, setCarbRatio] = useState(10);
  const [correctionFactor, setCorrectionFactor] = useState(50);
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
      await AsyncStorage.setItem('onboarding_carbRatio', carbRatio.toString());
      await AsyncStorage.setItem('onboarding_correctionFactor', correctionFactor.toString());
      
      // Collect all onboarding data from AsyncStorage
      const displayName = await AsyncStorage.getItem('onboarding_displayName') || '';
      const accentColor = await AsyncStorage.getItem('onboarding_accentColor') || '#EF4444';
      const heightFeet = parseInt(await AsyncStorage.getItem('onboarding_heightFeet') || '5');
      const heightInches = parseInt(await AsyncStorage.getItem('onboarding_heightInches') || '8');
      const weight = parseInt(await AsyncStorage.getItem('onboarding_weight') || '150');
      const age = parseInt(await AsyncStorage.getItem('onboarding_age') || '25');
      
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
      currentStep={6}
      totalSteps={6}
      icon="medical-outline"
      title="Insulin Settings"
      subtitle="Configure your insulin ratios"
      onNext={handleComplete}
      canProceed={true}
      accentColor={accentColor}
      nextButtonText="Get Started"
    >
      <View style={styles.container}>
        <View style={styles.settingsCard}>
          <View style={styles.inputRow}>
            <NumberInput
              value={carbRatio}
              onIncrement={() => setCarbRatio(c => Math.min(c + 1, 50))}
              onDecrement={() => setCarbRatio(c => Math.max(c - 1, 1))}
              label="carb ratio"
              min={1}
              max={50}
            />
            <Text style={[styles.separator, { color: separatorColor }]}>---</Text>
            <NumberInput
              value={correctionFactor}
              onIncrement={() => setCorrectionFactor(f => Math.min(f + 1, 200))}
              onDecrement={() => setCorrectionFactor(f => Math.max(f - 1, 10))}
              label="correction factor"
              min={10}
              max={200}
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