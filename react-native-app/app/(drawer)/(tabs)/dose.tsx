import React, { useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CarbsInput } from "@/components/dosing/carbs-input";
import { CorrectionInput } from "@/components/dosing/correction-input";
import { DoseCalculation } from "@/components/dosing/dose-calculation";
import { DoseConfirmationSheet } from "@/components/dosing/dose-confirmation-sheet";
import { DoseModeSelector } from "@/components/dosing/dose-mode-selector";
import { InsulinOnBoardCard } from "@/components/dosing/insulin-on-board-card";
import { TodayDosesList } from "@/components/dosing/today-doses-list";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { colors, Colors, layout, spacing, textStyles } from "@/constants/theme";
import { auth, db } from "@/config/firebase";
import { useAccentColor } from "@/context/accent-color";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useGlucose } from "@/hooks/use-glucose";
import { refreshIOB, useIOB } from "@/hooks/use-iob";
import { calculateDose } from "@/utils/dose-calculator";
import {
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
} from "firebase/firestore";

const SNAPDOSE_API =
  "https://snapdose-api-1044774150297.us-central1.run.app/api";

interface Dose {
  id: string;
  time: string;
  amount: number;
  type: "Meal" | "Correction";
}

export default function DoseScreen() {
  const insets = useSafeAreaInsets();
  const accent = useAccentColor();
  const headerTitleColor = useThemeColor(
    { light: colors.textPrimary, dark: Colors.dark.text },
    "text"
  );
  const headerSubtitleColor = useThemeColor(
    { light: colors.textSecondary, dark: '#B0B0B0' },
    "text"
  );

  const [mode, setMode] = useState<"meal" | "correction">("meal");
  const [carbs, setCarbs] = useState(0);
  const [correctionInsulin, setCorrectionInsulin] = useState(0);
  const activeInsulin = useIOB();
  const currentGlucose = useGlucose();
  const [carbRatio, setCarbRatio] = useState(10);
  const [correctionFactor, setCorrectionFactor] = useState(50);
  const [targetGlucoseMin, setTargetGlucoseMin] = useState(70);
  const [targetGlucoseMax, setTargetGlucoseMax] = useState(180);
  const [showConfirmationSheet, setShowConfirmationSheet] = useState(false);
  const [todayDoses, setTodayDoses] = useState<Dose[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setCarbRatio(data.insulinSettings?.insulinToCarbRatio || 10);
          setCorrectionFactor(data.insulinSettings?.correctionFactor || 50);
          setTargetGlucoseMin(data.profile?.targetGlucose?.min || 70);
          setTargetGlucoseMax(data.profile?.targetGlucose?.max || 180);
        }
      },
      (error) => console.error("Failed to load insulin settings:", error),
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const todayStartMs = new Date().setHours(0, 0, 0, 0);
    const q = query(
      collection(db, "users", user.uid, "boluses"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const doses: Dose[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt as number;
          if (!createdAt || createdAt < todayStartMs) return;

          doses.push({
            id: doc.id,
            time: new Date(createdAt).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            amount: data.unitsRequested ?? 0,
            type: (data.carbsG ?? 0) > 0 ? "Meal" : "Correction",
          });
        });
        setTodayDoses(doses);
      },
      (error) => console.error("Failed to load boluses:", error),
    );

    return () => unsubscribe();
  }, []);

  const calculateCorrectionDose = () => {
    if (currentGlucose === null) return 0;
    if (currentGlucose > targetGlucoseMax) {
      return (currentGlucose - targetGlucoseMax) / correctionFactor;
    } else if (currentGlucose < targetGlucoseMin) {
      return (currentGlucose - targetGlucoseMin) / correctionFactor;
    }
    return 0;
  };

  const calculateRecommendedDose = () => {
    if (mode === "meal") {
      if (currentGlucose !== null) {
        return calculateDose({
          carbs,
          currentGlucose,
          targetLow: targetGlucoseMin,
          targetHigh: targetGlucoseMax,
          correctionFactor,
          icr: carbRatio,
          iob: activeInsulin,
        });
      }
      return Math.max(0, carbs / carbRatio - activeInsulin);
    } else {
      return Math.max(0, correctionInsulin - activeInsulin);
    }
  };

  const correctionDose = calculateCorrectionDose();
  const recommendedDose = calculateRecommendedDose();

  const handleSliderConfirm = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const user = auth.currentUser;
      if (!user || !token) return;

      const response = await fetch(`${SNAPDOSE_API}/bolus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          units: recommendedDose,
          carbsGrams: mode === "meal" ? carbs : 0,
          glucoseLevel: currentGlucose ?? 100,
          bolusType: mode === "meal" ? "MEAL" : "CORRECTION",
          deviceId: "tab5-001",
          insulinOnBoard: activeInsulin,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("Bolus POST failed:", response.status, err);
      }
    } catch (error) {
      console.error("Failed to send bolus:", error);
    }

    refreshIOB();
    if (mode === "meal") {
      setCarbs(0);
    } else {
      setCorrectionInsulin(0);
    }
  };

  const totalTodayDoses = todayDoses.reduce((sum, d) => sum + d.amount, 0);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refreshIOB();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing[8] }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={accent}
          />
        }
      >
        <View style={styles.header}>
          <ThemedText type="title" style={[styles.headerTitle, { color: headerTitleColor }]}>
            Insulin Dosing
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: headerSubtitleColor }]}>
            Calculate and log your insulin dose
          </ThemedText>
        </View>

        <InsulinOnBoardCard activeInsulin={activeInsulin} />
        <DoseModeSelector mode={mode} onModeChange={setMode} />

        {mode === "meal" ? (
          <CarbsInput value={carbs} onValueChange={setCarbs} />
        ) : (
          <CorrectionInput
            value={correctionInsulin}
            onValueChange={setCorrectionInsulin}
          />
        )}

        <DoseCalculation
          mode={mode}
          carbs={carbs}
          baseDose={carbRatio}
          correctionDose={correctionDose}
          correctionFactor={correctionFactor}
          correctionInsulin={correctionInsulin}
          insulinOnBoard={activeInsulin}
          recommendedDose={recommendedDose}
          onCalculate={() => setShowConfirmationSheet(true)}
        />

        <TodayDosesList doses={todayDoses} totalDoses={totalTodayDoses} />
      </ScrollView>

      <DoseConfirmationSheet
        visible={showConfirmationSheet}
        mode={mode}
        dose={recommendedDose}
        carbs={carbs}
        carbRatio={carbRatio}
        correctionDose={correctionDose}
        correctionFactor={correctionFactor}
        correctionInsulin={correctionInsulin}
        insulinOnBoard={activeInsulin}
        onConfirm={handleSliderConfirm}
        onCancel={() => setShowConfirmationSheet(false)}
        accentColor={accent}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: spacing[4],
    paddingBottom: spacing[8],
  },
  header: { marginBottom: spacing[6] },
  headerTitle: {
    ...textStyles.title1Bold,
    marginBottom: spacing[1],
  },
  subtitle: {
    ...textStyles.callout,
  },
});
