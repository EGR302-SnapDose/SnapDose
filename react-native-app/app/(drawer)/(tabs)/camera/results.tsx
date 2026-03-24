import { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Alert, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { CarbEstimateDisplay } from '@/components/results/CarbEstimateDisplay';
import { FoodsDetectedList } from '@/components/results/FoodsDetectedList';
import { EditCarbsField } from '@/components/results/EditCarbsField';
import { DoseConfirmationSheet } from '@/components/dosing/dose-confirmation-sheet';
import { useMealByImage } from '@/hooks/use-meal-by-image';
import { useIOB } from '@/hooks/use-iob';
import { updateCarbEstimate } from '@/services/meal-service';
import { auth, db } from '@/config/firebase';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

function useColors() {
  const background = useThemeColor({}, 'background');
  const controlsBg = useThemeColor({ light: '#F2F2F2', dark: '#1e1e1e' }, 'background');
  const imageBg = useThemeColor({ light: '#E0E0E0', dark: '#252525' }, 'background');
  const accent = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'background');
  const muted = useThemeColor({ light: '#888888', dark: '#888888' }, 'icon');
  const border = useThemeColor({ light: '#CCCCCC', dark: '#333333' }, 'icon');
  const danger = useThemeColor({ light: '#FF3B30', dark: '#FF453A' }, 'icon');
  return { background, controlsBg, imageBg, accent, muted, border, danger };
}

export default function ResultsScreen() {
  const { imagePath, localUri } = useLocalSearchParams<{ imagePath: string; localUri: string }>();
  const { meal, isLoading, error } = useMealByImage(imagePath);
  const insulinOnBoard = useIOB();
  const colors = useColors();

  const [adjustedCarbs, setAdjustedCarbs] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [carbRatio, setCarbRatio] = useState(10);
  const [showDoseSheet, setShowDoseSheet] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) setCarbRatio(snap.data().insulinSettings?.insulinToCarbRatio || 10);
    });
    return unsub;
  }, []);

  const isProcessing = !meal || meal?.status === 'pending' || meal?.status === 'processing';
  const finalCarbs = adjustedCarbs ?? meal?.estimated_carbs_grams ?? 0;
  const recommendedDose = Math.max(0, finalCarbs / carbRatio - insulinOnBoard);

  const handleConfirm = async () => {
    if (!meal?.id) return;
    setIsSaving(true);
    try {
      await updateCarbEstimate(meal.id, finalCarbs);
      router.dismissAll();
    } catch (err) {
      Alert.alert('Error', 'Failed to save carb estimate. Please try again.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDoseConfirm = async () => {
    const user = auth.currentUser;
    if (!user || !meal) return;
    try {
      const doseId = Date.now().toString();
      await setDoc(doc(db, 'users', user.uid, 'doses', doseId), {
        id: doseId,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        amount: recommendedDose,
        type: 'Meal',
        timestamp: new Date(),
        mode: 'meal',
        correctionInsulin: null,
        mealId: meal.id,
      });
    } catch {
      Alert.alert('Error', 'Could not save dose. Please try again.');
    }
  };

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <ThemedText style={[styles.errorText, { color: colors.danger }]}>Failed to load results</ThemedText>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText style={{ color: colors.accent }}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.muted} />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Analysis Results</ThemedText>
          <View style={{ width: 32 }} />
        </View>

        <View style={[styles.imageContainer, { backgroundColor: colors.imageBg }]}>
          {localUri ? (
            <Image
              source={{ uri: localUri }}
              style={styles.heroImage}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={40} color={colors.muted} />
            </View>
          )}
        </View>

        {isProcessing && (
          <View style={[styles.processingBanner, { backgroundColor: `${colors.accent}15` }]}>
            <Ionicons name="time-outline" size={16} color={colors.accent} />
            <ThemedText style={[styles.processingText, { color: colors.accent }]}>
              Analyzing your photo...
            </ThemedText>
          </View>
        )}

        <CarbEstimateDisplay
          estimatedCarbs={meal?.estimated_carbs_grams ?? 0}
          confidence={meal?.confidence ?? 'low'}
          isLoading={isProcessing || isLoading}
        />

        <FoodsDetectedList
          foods={meal?.foods_detected ?? []}
          notes={meal?.notes}
          isLoading={isProcessing || isLoading}
        />

        {!isProcessing && !isLoading && meal && (
          <EditCarbsField
            initialValue={meal.estimated_carbs_grams}
            onValueChange={setAdjustedCarbs}
          />
        )}
      </ScrollView>

      {!isProcessing && !isLoading && meal && (
        <View style={[styles.bottomBar, { backgroundColor: colors.controlsBg, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.doseButton, { borderColor: colors.accent }]}
            onPress={() => setShowDoseSheet(true)}
          >
            <ThemedText style={[styles.doseButtonText, { color: colors.accent }]}>Dose Insulin</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: colors.accent }, isSaving && styles.disabled]}
            onPress={handleConfirm}
            disabled={isSaving}
          >
            <ThemedText style={[styles.confirmText, { color: colors.background }]}>
              {isSaving ? 'Saving...' : `Confirm ${finalCarbs}g`}
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      <DoseConfirmationSheet
        visible={showDoseSheet}
        mode="meal"
        dose={recommendedDose}
        carbs={finalCarbs}
        carbRatio={carbRatio}
        insulinOnBoard={insulinOnBoard}
        onConfirm={handleDoseConfirm}
        onCancel={() => setShowDoseSheet(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  backButton: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700' },
  imageContainer: { width: width - 32, height: (width - 32) * 0.75, borderRadius: 16, overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  processingBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10 },
  processingText: { fontSize: 14, fontWeight: '500' },
  bottomBar: { padding: 16, paddingBottom: 32, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12 },
  doseButton: { flex: 1, height: 52, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  doseButtonText: { fontSize: 15, fontWeight: '700' },
  confirmButton: { flex: 1, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  errorText: { fontSize: 16, fontWeight: '600' },
});