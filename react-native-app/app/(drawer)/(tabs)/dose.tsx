import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useIOB, refreshIOB } from "@/hooks/use-iob";

import { CarbsInput } from "@/components/dosing/carbs-input";
import { CorrectionInput } from "@/components/dosing/correction-input";
import { DoseCalculation } from "@/components/dosing/dose-calculation";
import { DoseConfirmationSheet } from "@/components/dosing/dose-confirmation-sheet";
import { DoseModeSelector } from "@/components/dosing/dose-mode-selector";
import { InsulinOnBoardCard } from "@/components/dosing/insulin-on-board-card";
import { TodayDosesList } from "@/components/dosing/today-doses-list";

import { auth, db } from "@/config/firebase";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";

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
  const activeInsulin = useIOB();
  const [carbRatio, setCarbRatio] = useState(10);
  const [correctionFactor, setCorrectionFactor] = useState(50);
  const [showConfirmationSheet, setShowConfirmationSheet] = useState(false);
  const [todayDoses, setTodayDoses] = useState<Dose[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const dosesRef = collection(db, "users", user.uid, "doses");

    const unsubscribe = onSnapshot(
      dosesRef,
      (snapshot) => {
        const doses: Dose[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          doses.push({
            id: doc.id,
            time: data.time,
            amount: data.amount,
            type: data.type,
          });
        });
        // Sort by id (timestamp) in descending order (newest first)
        setTodayDoses(doses.sort((a, b) => parseInt(b.id) - parseInt(a.id)));
      },
      (error) => {
        console.error("Failed to load doses:", error);
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

  const handleSliderConfirm = async () => {
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

    // Save to Firebase
    const user = auth.currentUser;
    if (user) {
      try {
        const dosesRef = doc(
          db,
          "users",
          user.uid,
          "doses",
          newDose.id,
        );
        await setDoc(dosesRef, {
          ...newDose,
          timestamp: new Date(),
          mode: mode,
          carbsEntered: mode === "meal" ? carbs : null,
          correctionInsulin: mode === "correction" ? correctionInsulin : null,
        });

        // Also save insulin boluses to the boluses collection for IOB calculation
        // Only save if this is actual insulin being delivered
        if (recommendedDose > 0) {
          const bolusesRef = doc(
            db,
            "users",
            user.uid,
            "boluses",
            newDose.id,
          );
          await setDoc(bolusesRef, {
            units: recommendedDose,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        console.error("Failed to save dose to Firebase:", error);
      }
    }

    // Refresh IOB immediately after dose is saved
    refreshIOB();

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Immediately refresh IOB data
    refreshIOB();
    // Wait a moment then stop the refresh animation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={accent}
          />
        }
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
