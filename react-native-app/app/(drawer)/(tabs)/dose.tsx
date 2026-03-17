import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

import { CarbsInput } from '@/components/dosing/carbs-input';
import { DoseCalculation } from '@/components/dosing/dose-calculation';
import { DoseModeSelector } from '@/components/dosing/dose-mode-selector';
import { InsulinOnBoardCard } from '@/components/dosing/insulin-on-board-card';
import { TodayDosesList } from '@/components/dosing/today-doses-list';

interface Dose {
  id: string;
  time: string;
  amount: number;
  type: 'Meal' | 'Correction';
}

export default function DoseScreen() {
  const insets = useSafeAreaInsets();
  const accent = useThemeColor({}, 'accent');

  // State management
  const [mode, setMode] = useState<'meal' | 'correction'>('meal');
  const [carbs, setCarbs] = useState(0);
  const [activeInsulin, setActiveInsulin] = useState(2.5);
  const [carbRatio, setCarbRatio] = useState(10);
  const [todayDoses, setTodayDoses] = useState<Dose[]>([
    { id: '1', time: '08:30 AM', amount: 8.5, type: 'Meal' },
    { id: '2', time: '12:45 PM', amount: 2.0, type: 'Correction' },
    { id: '3', time: '06:00 PM', amount: 10.2, type: 'Meal' },
  ]);

  // Load user settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      const savedCarbRatio = await AsyncStorage.getItem('userCarbRatio');
      if (savedCarbRatio) setCarbRatio(parseInt(savedCarbRatio));
    };
    loadSettings();
  }, []);

  // Calculate recommended dose
  const calculateRecommendedDose = () => {
    const carbBasedDose = carbs / carbRatio;
    const adjustedDose = Math.max(0, carbBasedDose - activeInsulin);
    return adjustedDose;
  };

  const recommendedDose = calculateRecommendedDose();

  const handleDoseConfirm = () => {
    // TODO: Save dose to Firestore
    const newDose: Dose = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      amount: recommendedDose,
      type: mode === 'meal' ? 'Meal' : 'Correction',
    };
    setTodayDoses([newDose, ...todayDoses]);
    setCarbs(0);
  };

  const totalTodayDoses = todayDoses.reduce((sum, dose) => sum + dose.amount, 0);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>
            Insulin Dosing
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Calculate and log your insulin dose
          </ThemedText>
        </View>

        {/* Insulin On Board Card */}
        <InsulinOnBoardCard activeInsulin={activeInsulin} />

        {/* Dose Mode Selector */}
        <DoseModeSelector mode={mode} onModeChange={setMode} />

        {/* Carbs Input */}
        <CarbsInput value={carbs} onValueChange={setCarbs} />

        {/* Dose Calculation */}
        <DoseCalculation
          carbs={carbs}
          baseDose={carbRatio}
          insulinOnBoard={activeInsulin}
          recommendedDose={recommendedDose}
          onCalculate={handleDoseConfirm}
        />

        {/* Today's Doses List */}
        <TodayDosesList doses={todayDoses} totalDoses={totalTodayDoses} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
});
