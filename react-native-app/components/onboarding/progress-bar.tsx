import { useThemeColors } from '@/hooks/use-theme-colors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  accentColor: string;
}

export default function ProgressBar({ currentStep, totalSteps, accentColor }: ProgressBarProps) {
  const c = useThemeColors();
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.stepText, { color: c.textSecondary }]}>Step {currentStep} of {totalSteps}</Text>
        <Text style={[styles.percentText, { color: c.textSecondary }]}>{Math.round(percentage)}%</Text>
      </View>
      <View style={[styles.barBackground, { backgroundColor: c.border }]}>
        <View style={[styles.barProgress, { width: `${percentage}%`, backgroundColor: accentColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepText: {
    fontSize: 14,
  },
  percentText: {
    fontSize: 14,
  },
  barBackground: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barProgress: {
    height: '100%',
    borderRadius: 2,
  },
});