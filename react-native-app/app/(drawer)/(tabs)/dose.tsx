import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

import { CarbsInput } from "@/components/dosing/carbs-input";
import { CorrectionInput } from "@/components/dosing/correction-input";
import { DoseCalculation } from "@/components/dosing/dose-calculation";
import { DoseConfirmationSheet } from "@/components/dosing/dose-confirmation-sheet";
import { DoseModeSelector } from "@/components/dosing/dose-mode-selector";
import { InsulinOnBoardCard } from "@/components/dosing/insulin-on-board-card";
import { TodayDosesList } from "@/components/dosing/today-doses-list";

import { auth, db } from "@/config/firebase";
import { doc, onSnapshot } from "firebase/firestore";

interface Dose {
  id: string;
  time: string;
  amount: number;
  type: "Meal" | "Correction";
}

export default function DoseScreen() {
  const insets = useSafeAreaInsets();
  const accent = useThemeColor({}, "accent");

  const [mode, setMode] = useState<"meal" | "correction">("meal");
  const [carbs, setCarbs] = useState(0);
  const [correctionInsulin, setCorrectionInsulin] = useState(0);
  const [activeInsulin, setActiveInsulin] = useState(2.5);
  const [carbRatio, setCarbRatio] = useState(10);
  const [correctionFactor, setCorrectionFactor] = useState(50);
  const [showConfirmationSheet, setShowConfirmationSheet] = useState(false);
  const [todayDoses, setTodayDoses] = useState<Dose[]>([
    { id: "1", time: "08:30 AM", amount: 2.5, type: "Meal" },
  ]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setCarbRatio(data.insulinSettings?.insulinToCarbRatio || 10);
          setCorrectionFactor(data.insulinSettings?.correctionFactor || 50);
        }
      },
      (error) => {
        console.error("Failed to load insulin settings:", error);
      },
    );

    return () => unsubscribe();
  }, []);

  const calculateRecommendedDose = () => {
    if (mode === "meal") {
      const carbBasedDose = carbs / carbRatio;
      const adjustedDose = Math.max(0, carbBasedDose - activeInsulin);
      return adjustedDose;
    } else {
      // Correction mode: Correction Insulin - IOB = Net Dose
      const netDose = Math.max(0, correctionInsulin - activeInsulin);
      return netDose;
    }
  };

  const recommendedDose = calculateRecommendedDose();

  const handleDoseConfirm = () => {
    setShowConfirmationSheet(true);
  };

  const handleSliderConfirm = () => {
    // Save dose to Firestore
    const newDose: Dose = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      amount: recommendedDose,
      type: mode === "meal" ? "Meal" : "Correction",
    };
    setTodayDoses([newDose, ...todayDoses]);

    // Reset the appropriate input based on mode
    if (mode === "meal") {
      setCarbs(0);
    } else {
      setCorrectionInsulin(0);
    }

    // Don't close the modal here - let the user close it manually after seeing the completion
  };

  const handleCancelConfirmation = () => {
    setShowConfirmationSheet(false);
  };

  const totalTodayDoses = todayDoses.reduce(
    (sum, dose) => sum + dose.amount,
    0,
  );

  return (
    <ThemedView
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>
            Insulin Dosing
          </ThemedText>
          <ThemedText style={styles.subtitle}>
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
          correctionInsulin={correctionInsulin}
          insulinOnBoard={activeInsulin}
          recommendedDose={recommendedDose}
          onCalculate={handleDoseConfirm}
        />

        <TodayDosesList doses={todayDoses} totalDoses={totalTodayDoses} />
      </ScrollView>

      <DoseConfirmationSheet
        visible={showConfirmationSheet}
        mode={mode}
        dose={recommendedDose}
        carbs={carbs}
        carbRatio={carbRatio}
        correctionInsulin={correctionInsulin}
        insulinOnBoard={activeInsulin}
        onConfirm={handleSliderConfirm}
        onCancel={handleCancelConfirmation}
      />
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
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
});
