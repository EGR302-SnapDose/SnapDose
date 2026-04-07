import { DoseConfirmationSheet } from '@/components/dosing/dose-confirmation-sheet';
import { CarbEstimateDisplay } from '@/components/results/CarbEstimateDisplay';
import { EditCarbsField } from '@/components/results/EditCarbsField';
import { FoodsDetectedList } from '@/components/results/FoodsDetectedList';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { auth, db } from '@/config/firebase';
import { colors, Colors, radius, spacing, textStyles, typography } from '@/constants/theme';
import { useAccentColor } from '@/context/accent-color';
import { useIOB } from '@/hooks/use-iob';
import { useMealByImage } from '@/hooks/use-meal-by-image';
import { useThemeColor } from '@/hooks/use-theme-color';
import { updateCarbEstimate } from '@/services/meal-service';
import { hapticError, hapticSuccess } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

function useColors() {
  const background = useThemeColor({}, 'background');
  // Matches the controls bar token used in camera/index.tsx
  const bottomBarBg = useThemeColor(
    { light: colors.surfaceSubtle, dark: Colors.dark.surface },
    'surface'
  );
  const imageBg = useThemeColor(
    { light: colors.surfaceSubtle, dark: Colors.dark.surface },
    'surface'
  );
  const cardBg = useThemeColor(
    { light: colors.surface, dark: Colors.dark.surface },
    'surface'
  );
  const accent = useAccentColor();
  const muted = useThemeColor(
    { light: colors.textSecondary, dark: Colors.dark.icon },
    'icon'
  );
  const border = useThemeColor(
    { light: colors.border, dark: Colors.dark.border },
    'border'
  );
  const danger = useThemeColor(
    { light: colors.danger, dark: '#FF453A' },
    'icon'
  );
  return { background, bottomBarBg, imageBg, cardBg, accent, muted, border, danger };
}

export default function ResultsScreen() {
  const { imagePath, localUri } = useLocalSearchParams<{ imagePath: string; localUri: string }>();
  const { meal, isLoading, error } = useMealByImage(imagePath);
  const insulinOnBoard = useIOB();
  const c = useColors();
  const insets = useSafeAreaInsets();

  const [adjustedCarbs, setAdjustedCarbs] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [carbRatio, setCarbRatio] = useState(10);
  const [showDoseSheet, setShowDoseSheet] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isProcessing = !meal || meal?.status === 'pending' || meal?.status === 'processing';
  const finalCarbs = adjustedCarbs ?? meal?.estimated_carbs_grams ?? 0;
  const recommendedDose = Math.max(0, finalCarbs / carbRatio - insulinOnBoard);

  useEffect(() => {
    if (!isProcessing) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }
    timeoutRef.current = setTimeout(() => setTimedOut(true), 60000);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [isProcessing]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) setCarbRatio(snap.data().insulinSettings?.insulinToCarbRatio || 10);
    });
    return unsub;
  }, []);

  const handleConfirm = async () => {
    if (!meal?.id) return;
    setIsSaving(true);
    try {
      await updateCarbEstimate(meal.id, finalCarbs);
      hapticSuccess();
      router.dismissAll();
    } catch (err) {
      hapticError();
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
      hapticError();
      Alert.alert('Error', 'Could not save dose. Please try again.');
    }
  };

  if (error || timedOut) {
    return (
      <ThemedView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={c.danger} />
        <ThemedText style={[styles.errorText, { color: c.danger }]}>
          {timedOut ? 'Analysis is taking too long' : 'Failed to load results'}
        </ThemedText>
        <ThemedText style={[styles.errorSubtext, { color: c.muted }]}>
          {timedOut
            ? 'The server may be busy. Please try again.'
            : 'Something went wrong loading your results.'}
        </ThemedText>
        <TouchableOpacity
          style={[styles.backLink, { borderColor: c.accent }]}
          onPress={() => router.back()}
        >
          <ThemedText style={[styles.backLinkText, { color: c.accent }]}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing[10] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header — HIG: back chevron left, title centered, spacer right */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={c.muted} />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Analysis Results</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {/* Hero image */}
        <View style={[styles.imageContainer, { backgroundColor: c.imageBg }]}>
          {localUri ? (
            <Image
              source={{ uri: localUri }}
              style={styles.heroImage}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={40} color={c.muted} />
            </View>
          )}
        </View>

        {/* Processing banner */}
        {isProcessing && (
          <View style={[styles.processingBanner, { backgroundColor: `${c.accent}18` }]}>
            <Ionicons name="time-outline" size={16} color={c.accent} />
            <ThemedText style={[styles.processingText, { color: c.accent }]}>
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

      {/* Bottom action bar — mirrors camera controls bar styling */}
      {!isProcessing && !isLoading && meal && (
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: c.bottomBarBg,
              borderTopColor: c.border,
              paddingBottom: insets.bottom + spacing[4],
            },
          ]}
        >
          {/* Outline button — accent border/text */}
          <TouchableOpacity
            style={[styles.doseButton, { borderColor: c.accent }]}
            onPress={() => setShowDoseSheet(true)}
          >
            <ThemedText style={[styles.doseButtonText, { color: c.accent }]}>
              Dose Insulin
            </ThemedText>
          </TouchableOpacity>

          {/* Filled button — accent background, matches "Use Photo" feel */}
          <TouchableOpacity
            style={[
              styles.confirmButton,
              { backgroundColor: c.accent },
              isSaving && styles.disabled,
            ]}
            onPress={handleConfirm}
            disabled={isSaving}
          >
            <ThemedText style={[styles.confirmText, { color: colors.surface }]}>
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
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[4],
    paddingHorizontal: spacing[6],
  },

  // ── Scroll content ──────────────────────────────────────────────────────────
  content: {
    paddingHorizontal: spacing[4],   // 16pt — HIG recommended iPhone margin
    paddingTop: spacing[3],
    gap: spacing[4],
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  // HIG: minimum 44×44pt touch target
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...textStyles.headline,           // 17pt semibold — HIG headline style
  },
  headerSpacer: {
    width: 44,                        // mirrors backButton width to keep title centered
  },

  // ── Hero image ──────────────────────────────────────────────────────────────
  imageContainer: {
    width: width - spacing[8],        // full width minus 2× HIG margin (16pt each side)
    height: (width - spacing[8]) * 0.75,
    borderRadius: radius.xl,          // 16pt — HIG card radius
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Processing banner ────────────────────────────────────────────────────────
  processingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
  },
  processingText: {
    ...textStyles.footnote,
    fontWeight: '500',
  },

  // ── Bottom action bar ────────────────────────────────────────────────────────
  // Matches camera screen controls bar: same surface token, same rounded top corners
  bottomBar: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  // Outline pill — secondary action
  doseButton: {
    flex: 1,
    height: 50,                       // HIG buttonHeightLg
    borderRadius: radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doseButtonText: {
    ...textStyles.calloutSemibold,
  },
  // Filled pill — primary action, accent bg
  confirmButton: {
    flex: 1,
    height: 50,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: typography.sizes.callout,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },

  // ── Error state ──────────────────────────────────────────────────────────────
  errorText: {
    ...textStyles.calloutSemibold,
    textAlign: 'center',
  },
  errorSubtext: {
    ...textStyles.footnote,
    textAlign: 'center',
    marginTop: spacing[1],
    marginBottom: spacing[2],
  },
  backLink: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  backLinkText: {
    ...textStyles.calloutSemibold,
  },
});