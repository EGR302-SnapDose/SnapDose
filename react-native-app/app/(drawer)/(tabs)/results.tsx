import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { CarbEstimateDisplay } from '@/components/results/CarbEstimateDisplay';
import { FoodsDetectedList } from '@/components/results/FoodsDetectedList';
import { EditCarbsField } from '@/components/results/EditCarbsField';
import { useMeal } from '@/hooks/use-meal';
import { updateCarbEstimate } from '@/services/meal-service';
import { Ionicons } from '@expo/vector-icons'; 

export default function ResultsScreen() {
  const { mealId } = useLocalSearchParams<{ mealId: string }>();
  const { meal, isLoading, error } = useMeal(mealId);
  const [adjustedCarbs, setAdjustedCarbs] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const controlsBg = useThemeColor({ light: '#F2F2F2', dark: '#1e1e1e' }, 'background');
  const confirmBg = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'background');
  const mutedColor = useThemeColor({ light: '#888888', dark: '#888888' }, 'icon');
  const errorColor = '#FF3B30';

  const isProcessing = meal?.status === 'pending' || meal?.status === 'processing';
  const finalCarbs = adjustedCarbs ?? meal?.estimated_carbs_grams ?? 0;

  const handleConfirm = async () => {
    if (!mealId) return;
    setIsSaving(true);
    try {
      await updateCarbEstimate(mealId, finalCarbs);
      router.push('/(drawer)/(tabs)');
    } catch (err) {
      Alert.alert('Error', 'Failed to save carb estimate. Please try again.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={errorColor} />
        <ThemedText style={[styles.errorText, { color: errorColor }]}>
          Failed to load results
        </ThemedText>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText style={{ color: confirmBg }}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={mutedColor} />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Analysis Results</ThemedText>
          <View style={{ width: 32 }} />
        </View>

        {/* Status banner while processing */}
        {isProcessing && (
          <View style={[styles.processingBanner, { backgroundColor: `${confirmBg}15` }]}>
            <Ionicons name="time-outline" size={16} color={confirmBg} />
            <ThemedText style={[styles.processingText, { color: confirmBg }]}>
              Analyzing your photo...
            </ThemedText>
          </View>
        )}

        {/* Carb estimate */}
        <CarbEstimateDisplay
          estimatedCarbs={meal?.estimated_carbs_grams ?? 0}
          confidence={meal?.confidence ?? 'low'}
          isLoading={isProcessing || isLoading}
        />

        {/* Foods detected */}
        <FoodsDetectedList
          foods={meal?.foods_detected ?? []}
          notes={meal?.notes}
          isLoading={isProcessing || isLoading}
        />

        {/* Edit carbs — only show once AI is done */}
        {!isProcessing && !isLoading && meal && (
          <EditCarbsField
            initialValue={meal.estimated_carbs_grams}
            onValueChange={setAdjustedCarbs}
          />
        )}
      </ScrollView>

      {/* Confirm button */}
      {!isProcessing && !isLoading && meal && (
        <View style={[styles.bottomBar, { backgroundColor: controlsBg }]}>
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: confirmBg }, isSaving && styles.disabled]}
            onPress={handleConfirm}
            disabled={isSaving}
          >
            <ThemedText style={styles.confirmText}>
              {isSaving ? 'Saving...' : `Confirm ${finalCarbs}g Carbs`}
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  processingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  processingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  bottomBar: {
    padding: 16,
    paddingBottom: 32,
  },
  confirmButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
  },
});