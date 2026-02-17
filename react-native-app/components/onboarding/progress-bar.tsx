import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  accentColor: string;
}

export default function ProgressBar({ currentStep, totalSteps, accentColor }: ProgressBarProps) {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepText}>Step {currentStep} of {totalSteps}</Text>
        <Text style={styles.percentText}>{Math.round(percentage)}%</Text>
      </View>
      <View style={styles.barBackground}>
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
    color: '#888',
  },
  percentText: {
    fontSize: 14,
    color: '#888',
  },
  barBackground: {
    width: '100%',
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barProgress: {
    height: '100%',
    borderRadius: 2,
  },
});