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
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get("window");

// ─── Stage definitions ───────────────────────────────────────────────────────
type StageStep = 0 | 1 | 2;
type Stage = { label: string; step: StageStep };

function getStage(status: string | null | undefined): Stage {
  if (status === 'processing') return { label: 'Analyzing food…', step: 1 };
  if (status === 'completed')  return { label: 'Calculating nutrition…', step: 2 };
  // null, undefined, 'pending', or any unknown value → uploading
  return { label: 'Uploading image…', step: 0 };
}

// ─── Multi-stage progress indicator component ─────────────────────────────────
interface ProgressIndicatorProps {
  step: StageStep;
  accent: string;
  muted: string;
  trackBg: string;
  onCancel: () => void;
}

const STAGE_LABELS = ['Uploading', 'Analyzing', 'Calculating'];
const STAGE_DESCRIPTIONS = ['Uploading image…', 'Analyzing food…', 'Calculating nutrition…'];
const MIN_STEP_MS = 1000;

function MultiStageProgressIndicator({
  step,
  accent,
  muted,
  trackBg,
  onCancel,
}: ProgressIndicatorProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bar0Anim = useRef(new Animated.Value(0)).current;
  const bar1Anim = useRef(new Animated.Value(0)).current;
  const barAnims = [bar0Anim, bar1Anim];

  // Restart pulse on each step change
  useEffect(() => {
    pulseAnim.setValue(1);
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [step]);

  // Fill connector bars as displayStep advances
  useEffect(() => {
    if (step >= 1) {
      Animated.timing(bar0Anim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    }
    if (step >= 2) {
      Animated.timing(bar1Anim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    }
  }, [step]);

  return (
    <View style={piStyles.wrapper}>
      <View style={piStyles.stepsRow}>
        {STAGE_LABELS.map((name, i) => {
          const isCompleted = i < step;
          const isActive = i === step;
          return (
            <View key={name} style={piStyles.stepCol}>
              {i > 0 && (
                <View style={[piStyles.connectorTrack, { backgroundColor: trackBg }]}>
                  <Animated.View
                    style={[
                      piStyles.connectorFill,
                      { backgroundColor: accent },
                      {
                        width: barAnims[i - 1].interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
              )}
              <View style={piStyles.dotCol}>
                <Animated.View
                  style={[
                    piStyles.dot,
                    { borderColor: isCompleted || isActive ? accent : muted },
                    isCompleted && { backgroundColor: accent },
                    isActive && { opacity: pulseAnim },
                  ]}
                >
                  {isCompleted
                    ? <Ionicons name="checkmark" size={11} color="#fff" />
                    : isActive
                      ? <View style={[piStyles.dotInner, { backgroundColor: accent }]} />
                      : null}
                </Animated.View>
                <ThemedText
                  style={[
                    piStyles.stepLabel,
                    { color: isActive ? accent : muted },
                    isActive && { fontWeight: '600' },
                  ]}
                  numberOfLines={1}
                >
                  {name}
                </ThemedText>
              </View>
            </View>
          );
        })}
      </View>

      <ThemedText style={[piStyles.stageText, { color: accent }]}>
        {STAGE_DESCRIPTIONS[step]}
      </ThemedText>

      <TouchableOpacity onPress={onCancel} style={piStyles.cancelButton} hitSlop={8}>
        <ThemedText style={[piStyles.cancelText, { color: muted }]}>Cancel</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const piStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  // Outer row holds [stepCol] items; connector bars are inside stepCol to the left of the dot
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    width: '100%',
  },
  // Each stepCol: [connector?] + [dotCol] side by side
  stepCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Dot stacked above label
  dotCol: {
    alignItems: 'center',
    gap: spacing[1],
  },
  connectorTrack: {
    width: 44,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  connectorFill: {
    height: '100%',
    borderRadius: 2,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepLabel: {
    fontSize: 11,
    marginTop: spacing[1],
    textAlign: 'center',
    minWidth: 64,
  },
  stageText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: spacing[1],
  },
  cancelButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
  },
  cancelText: {
    fontSize: 14,
  },
});

// ─── Color hook ───────────────────────────────────────────────────────────────
function useColors() {
  const background = useThemeColor({}, "background");
  // Matches the controls bar token used in camera/index.tsx
  const bottomBarBg = useThemeColor(
    { light: colors.surfaceSubtle, dark: Colors.dark.surface },
    "surface",
  );
  const imageBg = useThemeColor(
    { light: colors.surfaceSubtle, dark: Colors.dark.surface },
    "surface",
  );
  const cardBg = useThemeColor(
    { light: colors.surface, dark: Colors.dark.surface },
    "surface",
  );
  const accent = useAccentColor();
  const muted = useThemeColor(
    { light: colors.textSecondary, dark: Colors.dark.icon },
    "icon",
  );
  const border = useThemeColor(
    { light: colors.border, dark: Colors.dark.border },
    "border",
  );
  const danger = useThemeColor(
    { light: colors.danger, dark: "#FF453A" },
    "icon",
  );
  const progressTrackBg = useThemeColor(
    { light: '#E5E5EA', dark: '#3A3A3C' },
    'background'
  );
  return { background, bottomBarBg, imageBg, cardBg, accent, muted, border, danger, progressTrackBg };
}

// ─── Results screen ───────────────────────────────────────────────────────────
export default function ResultsScreen() {
  const { imagePath, localUri } = useLocalSearchParams<{ imagePath: string; localUri: string }>();
  const { meal, isLoading, error, status } = useMealByImage(imagePath);
  const insulinOnBoard = useIOB();
  const c = useColors();
  const insets = useSafeAreaInsets();

  const targetStep = getStage(status).step;
  const [visualStep, setVisualStep] = useState<StageStep>(0);
  const [showProgressIndicator, setShowProgressIndicator] = useState(true);
  const stageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStepTimeRef = useRef(Date.now());

  useEffect(() => {
    if (stageTimerRef.current) {
      clearTimeout(stageTimerRef.current);
      stageTimerRef.current = null;
    }
    lastStepTimeRef.current = Date.now();
    setVisualStep(0);
    setShowProgressIndicator(true);
  }, [imagePath]);

  const [adjustedCarbs, setAdjustedCarbs] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [carbRatio, setCarbRatio] = useState(10);
  const [showDoseSheet, setShowDoseSheet] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (stageTimerRef.current) {
      clearTimeout(stageTimerRef.current);
      stageTimerRef.current = null;
    }

    if (targetStep <= visualStep) {
      if (targetStep !== visualStep) {
        setVisualStep(targetStep);
      }
      return;
    }

    const advanceTo = (currentStep: StageStep) => {
      const nextStep = (currentStep + 1) as StageStep;
      const elapsed = Date.now() - lastStepTimeRef.current;
      const delay = Math.max(0, MIN_STEP_MS - elapsed);

      stageTimerRef.current = setTimeout(() => {
        lastStepTimeRef.current = Date.now();
        setVisualStep(nextStep);

        if (nextStep < targetStep) {
          advanceTo(nextStep);
        }
      }, delay);
    };

    advanceTo(visualStep);

    return () => {
      if (stageTimerRef.current) clearTimeout(stageTimerRef.current);
    };
  }, [targetStep, visualStep]);

  const backendProcessing = !meal || status === 'pending' || status === 'processing';

  useEffect(() => {
    if (backendProcessing) {
      setShowProgressIndicator(true);
      return;
    }

    if (visualStep < 2) {
      setShowProgressIndicator(true);
      return;
    }

    const finalHoldTimer = setTimeout(() => {
      setShowProgressIndicator(false);
    }, MIN_STEP_MS);

    return () => clearTimeout(finalHoldTimer);
  }, [backendProcessing, visualStep]);

  const isProcessing = backendProcessing || showProgressIndicator;
  const finalCarbs = adjustedCarbs ?? meal?.estimated_carbs_grams ?? 0;
  const recommendedDose = Math.max(0, finalCarbs / carbRatio - insulinOnBoard);

  useEffect(() => {
    if (!isProcessing) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }
    timeoutRef.current = setTimeout(() => setTimedOut(true), 60000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isProcessing]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists())
        setCarbRatio(snap.data().insulinSettings?.insulinToCarbRatio || 10);
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
      Alert.alert("Error", "Failed to save carb estimate. Please try again.");
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
      await setDoc(doc(db, "users", user.uid, "doses", doseId), {
        id: doseId,
        time: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        amount: recommendedDose,
        type: "Meal",
        timestamp: new Date(),
        mode: "meal",
        correctionInsulin: null,
        mealId: meal.id,
      });
    } catch {
      hapticError();
      Alert.alert("Error", "Could not save dose. Please try again.");
    }
  };

  if (error || timedOut) {
    return (
      <ThemedView style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={c.danger} />
        <ThemedText style={[styles.errorText, { color: c.danger }]}>
          {timedOut ? "Analysis is taking too long" : "Failed to load results"}
        </ThemedText>
        <ThemedText style={[styles.errorSubtext, { color: c.muted }]}>
          {timedOut
            ? "The server may be busy. Please try again."
            : "Something went wrong loading your results."}
        </ThemedText>
        <TouchableOpacity
          style={[styles.backLink, { borderColor: c.accent }]}
          onPress={() => router.back()}
        >
          <ThemedText style={[styles.backLinkText, { color: c.accent }]}>
            Go Back
          </ThemedText>
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={8}
          >
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

        {/* Multi-stage progress indicator — replaces static banner */}
        {isProcessing && (
          <MultiStageProgressIndicator
            step={visualStep}
            accent={c.accent}
            muted={c.muted}
            trackBg={c.progressTrackBg}
            onCancel={() => router.back()}
          />
        )}

        <CarbEstimateDisplay
          estimatedCarbs={meal?.estimated_carbs_grams ?? 0}
          confidence={meal?.confidence ?? "low"}
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

      {/* Bottom action bar */}
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
          <TouchableOpacity
            style={[styles.doseButton, { borderColor: c.accent }]}
            onPress={() => setShowDoseSheet(true)}
          >
            <ThemedText style={[styles.doseButtonText, { color: c.accent }]}>
              Dose Insulin
            </ThemedText>
          </TouchableOpacity>

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
              {isSaving ? "Saving..." : `Confirm ${finalCarbs}g`}
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
    justifyContent: "center",
    alignItems: "center",
    gap: spacing[4],
    paddingHorizontal: spacing[6],
  },
  content: {
    paddingHorizontal: spacing[4], // 16pt — HIG recommended iPhone margin
    paddingTop: spacing[3],
    gap: spacing[4],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing[1],
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...textStyles.headline, // 17pt semibold — HIG headline style
  },
  headerSpacer: {
    width: 44, // mirrors backButton width to keep title centered
  },
  imageContainer: {
    width: width - spacing[8], // full width minus 2× HIG margin (16pt each side)
    height: (width - spacing[8]) * 0.75,
    borderRadius: radius.xl, // 16pt — HIG card radius
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBar: {
    flexDirection: "row",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  doseButton: {
    flex: 1,
    height: 50, // HIG buttonHeightLg
    borderRadius: radius.lg,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  doseButtonText: {
    ...textStyles.calloutSemibold,
  },
  confirmButton: {
    flex: 1,
    height: 50,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    fontSize: typography.sizes.callout,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.5,
  },
  errorText: {
    ...textStyles.calloutSemibold,
    textAlign: "center",
  },
  errorSubtext: {
    ...textStyles.footnote,
    textAlign: "center",
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
