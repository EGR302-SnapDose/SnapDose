import { DoseConfirmationSheet } from "@/components/dosing/dose-confirmation-sheet";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { app, auth, db } from "@/config/firebase";
import { useAccentColor } from "@/context/accent-color";
import { useIOB } from "@/hooks/use-iob";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { deleteMealEntry, subscribeMeal } from "@/services/meal-service";
import { MealCarbEstimate } from "@/types/meal";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
} from "firebase/storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface LinkedDose {
  id: string;
  amount: number;
  time: string;
  type: string;
}

async function resolveGsUri(gsUri: string): Promise<string> {
  const storage = getStorage(app);
  const path = gsUri.replace(/^gs:\/\/[^/]+\//, "");
  return getDownloadURL(ref(storage, path));
}

async function deleteGcsImage(gsUri: string): Promise<void> {
  const storage = getStorage(app);
  const path = gsUri.replace(/^gs:\/\/[^/]+\//, "");
  await deleteObject(ref(storage, path));
}

function formatTimestamp(date: Date): string {
  return (
    date.toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
    }) +
    " at " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

function confidenceColor(
  confidence: string,
  accent: string,
  danger: string,
  muted: string,
): string {
  if (confidence === "high") return accent;
  if (confidence === "low") return danger;
  return muted;
}

const MealDetailScreen = () => {
  const { mealId } = useLocalSearchParams<{ mealId: string }>();
  const router = useRouter();
  const c = useThemeColors();
  const accent = useAccentColor();
  const insets = useSafeAreaInsets();
  const insulinOnBoard = useIOB();

  const [meal, setMeal] = useState<MealCarbEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [carbRatio, setCarbRatio] = useState(10);
  const [showDoseSheet, setShowDoseSheet] = useState(false);
  const [linkedDose, setLinkedDose] = useState<LinkedDose | null>(null);
  const [doseLoading, setDoseLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists())
        setCarbRatio(snap.data().insulinSettings?.insulinToCarbRatio || 10);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!mealId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const unsub = subscribeMeal(
      mealId,
      (m) => {
        if (!m) {
          setNotFound(true);
        } else {
          setMeal(m);
        }
        setLoading(false);
      },
      () => {
        setLoadError(true);
        setLoading(false);
      },
    );
    return unsub;
  }, [mealId]);

  useEffect(() => {
    if (!meal?.image_gs_uri) return;
    resolveGsUri(meal.image_gs_uri)
      .then(setImageUrl)
      .catch(() => setImageError(true))
      .finally(() => setImageLoading(false));
  }, [meal?.image_gs_uri]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !mealId) {
      setDoseLoading(false);
      return;
    }
    const q = query(
      collection(db, "users", user.uid, "doses"),
      where("mealId", "==", mealId),
    );
    getDocs(q)
      .then((snap) => {
        if (!snap.empty) {
          const d = snap.docs[0].data();
          setLinkedDose({
            id: snap.docs[0].id,
            amount: d.amount,
            time: d.time,
            type: d.type,
          });
        }
        setDoseLoading(false);
      })
      .catch(() => setDoseLoading(false));
  }, [mealId]);

  const recommendedDose = Math.max(
    0,
    (meal?.estimated_carbs_grams ?? 0) / carbRatio - insulinOnBoard,
  );

  const handleDoseConfirm = async () => {
    const user = auth.currentUser;
    if (!user || !meal) return;
    try {
      const doseId = Date.now().toString();
      const time = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      await setDoc(doc(db, "users", user.uid, "doses", doseId), {
        id: doseId,
        time,
        amount: recommendedDose,
        type: "Meal",
        timestamp: new Date(),
        mode: "meal",
        correctionInsulin: null,
        mealId,
      });
      setLinkedDose({
        id: doseId,
        amount: recommendedDose,
        time,
        type: "Meal",
      });
    } catch {
      Alert.alert("Error", "Could not save dose. Please try again.");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Meal",
      "This will permanently remove this meal from your log.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!mealId || !meal) return;
            setDeleting(true);
            try {
              await deleteMealEntry(mealId);
              if (meal.image_gs_uri)
                await deleteGcsImage(meal.image_gs_uri).catch(() => {});
              router.back();
            } catch {
              Alert.alert(
                "Error",
                "Could not delete this meal. Please try again.",
              );
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={accent} />
      </ThemedView>
    );
  }

  if (loadError) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.notFoundTitle}>
          Couldn&apos;t load meal
        </ThemedText>
        <ThemedText
          style={[styles.notFoundSubtitle, { color: c.textSecondary }]}
        >
          Check your connection and try again.
        </ThemedText>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: c.border }]}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.backBtnText}>Go back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (notFound || !meal) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText style={styles.notFoundTitle}>Meal not found</ThemedText>
        <ThemedText
          style={[styles.notFoundSubtitle, { color: c.textSecondary }]}
        >
          This meal may have been deleted.
        </ThemedText>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: c.border }]}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.backBtnText}>Go back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const confidenceLabel =
    meal.confidence.charAt(0).toUpperCase() + meal.confidence.slice(1);
  const confColor = confidenceColor(
    meal.confidence,
    accent,
    c.danger,
    c.textSecondary,
  );

  return (
    <ThemedView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.imageContainer, { backgroundColor: c.surfaceSubtle }]}
        >
          {imageLoading && !imageError && (
            <ActivityIndicator
              style={StyleSheet.absoluteFill}
              size="large"
              color={accent}
            />
          )}
          {imageUrl && !imageError ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.heroImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
              onLoad={() => setImageLoading(false)}
            />
          ) : imageError ? (
            <View style={styles.imageFallback}>
              <ThemedText
                style={[styles.imageFallbackText, { color: c.textSecondary }]}
              >
                Image unavailable
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.topRow}>
            <View style={styles.carbBadge}>
              <ThemedText style={styles.carbValue}>
                {meal.estimated_carbs_grams}g
              </ThemedText>
              <ThemedText
                style={[styles.carbLabel, { color: c.textSecondary }]}
              >
                total carbs
              </ThemedText>
            </View>
            <View style={[styles.confidenceBadge, { borderColor: confColor }]}>
              <ThemedText style={[styles.confidenceText, { color: confColor }]}>
                {confidenceLabel} confidence
              </ThemedText>
            </View>
          </View>

          <ThemedText style={[styles.timestamp, { color: c.textSecondary }]}>
            {formatTimestamp(meal.created_at)}
          </ThemedText>

          <View style={[styles.section, { borderTopColor: c.border }]}>
            <ThemedText style={styles.sectionTitle}>Foods Detected</ThemedText>
            {meal.foods_detected.length > 0 ? (
              meal.foods_detected.map((food, i) => (
                <View
                  key={i}
                  style={[styles.foodRow, { borderBottomColor: c.border }]}
                >
                  <View
                    style={[styles.foodDot, { backgroundColor: accent }]}
                  />
                  <ThemedText style={styles.foodName}>{food}</ThemedText>
                </View>
              ))
            ) : (
              <ThemedText
                style={[styles.emptyFoods, { color: c.textSecondary }]}
              >
                No foods detected
              </ThemedText>
            )}
          </View>

          {meal.notes ? (
            <View style={[styles.section, { borderTopColor: c.border }]}>
              <ThemedText style={styles.sectionTitle}>Notes</ThemedText>
              <ThemedText
                style={[styles.notesText, { color: c.textSecondary }]}
              >
                {meal.notes}
              </ThemedText>
            </View>
          ) : null}

          <View style={[styles.section, { borderTopColor: c.border }]}>
            <ThemedText style={styles.sectionTitle}>Bolus</ThemedText>
            {doseLoading ? (
              <ActivityIndicator size="small" color={accent} />
            ) : linkedDose ? (
              <View
                style={[styles.doseCard, { backgroundColor: c.surface }]}
              >
                <View style={styles.doseCardRow}>
                  <ThemedText
                    style={[styles.doseCardLabel, { color: c.textSecondary }]}
                  >
                    Dose
                  </ThemedText>
                  <ThemedText
                    style={[styles.doseCardValue, { color: accent }]}
                  >
                    {linkedDose.amount.toFixed(1)}u
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.doseCardDivider,
                    { backgroundColor: c.border },
                  ]}
                />
                <View style={styles.doseCardRow}>
                  <ThemedText
                    style={[styles.doseCardLabel, { color: c.textSecondary }]}
                  >
                    Type
                  </ThemedText>
                  <ThemedText style={styles.doseCardValue}>
                    {linkedDose.type}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.doseCardDivider,
                    { backgroundColor: c.border },
                  ]}
                />
                <View style={styles.doseCardRow}>
                  <ThemedText
                    style={[styles.doseCardLabel, { color: c.textSecondary }]}
                  >
                    Time
                  </ThemedText>
                  <ThemedText style={styles.doseCardValue}>
                    {linkedDose.time}
                  </ThemedText>
                </View>
              </View>
            ) : (
              <ThemedText
                style={[styles.bolusPlaceholder, { color: c.textSecondary }]}
              >
                No dose recorded for this meal.
              </ThemedText>
            )}
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            borderTopColor: c.border,
            backgroundColor: c.background,
            paddingBottom: Math.max(24, insets.bottom + 12),
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.footerBtn, { borderColor: c.danger }]}
          onPress={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color={c.danger} />
          ) : (
            <ThemedText style={[styles.footerBtnText, { color: c.danger }]}>
              Delete
            </ThemedText>
          )}
        </TouchableOpacity>

        {!linkedDose && !doseLoading && (
          <TouchableOpacity
            style={[
              styles.footerBtn,
              styles.footerBtnFill,
              { backgroundColor: accent },
            ]}
            onPress={() => setShowDoseSheet(true)}
          >
            <ThemedText
              style={[styles.footerBtnText, { color: c.textInverse }]}
            >
              Dose Insulin
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      <DoseConfirmationSheet
        visible={showDoseSheet}
        mode="meal"
        dose={recommendedDose}
        carbs={meal.estimated_carbs_grams}
        carbRatio={carbRatio}
        insulinOnBoard={insulinOnBoard}
        onConfirm={handleDoseConfirm}
        onCancel={() => setShowDoseSheet(false)}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  content: { paddingBottom: 120 },
  imageContainer: { width, height: width * 0.85, position: "relative" },
  heroImage: { width: "100%", height: "100%" },
  imageFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  imageFallbackText: { fontSize: 14 },
  body: { padding: 20 },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  carbBadge: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  carbValue: { fontSize: 42, fontWeight: "800", lineHeight: 48 },
  carbLabel: { fontSize: 16, fontWeight: "500", marginBottom: 4 },
  confidenceBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  confidenceText: { fontSize: 12, fontWeight: "600" },
  timestamp: { fontSize: 13, marginBottom: 24 },
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 20,
    marginTop: 4,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  foodRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  foodDot: { width: 7, height: 7, borderRadius: 4, marginTop: 6 },
  foodName: { flex: 1, fontSize: 15, lineHeight: 22 },
  emptyFoods: { fontSize: 14, fontStyle: "italic" },
  notesText: { fontSize: 14, lineHeight: 21 },
  bolusPlaceholder: { fontSize: 14, fontStyle: "italic" },
  doseCard: { borderRadius: 12, padding: 16 },
  doseCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  doseCardLabel: { fontSize: 14 },
  doseCardValue: { fontSize: 14, fontWeight: "600" },
  doseCardDivider: { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 12,
  },
  footerBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  footerBtnFill: { borderWidth: 0 },
  footerBtnText: { fontSize: 15, fontWeight: "600" },
  notFoundTitle: { fontSize: 18, fontWeight: "700" },
  notFoundSubtitle: { fontSize: 14, textAlign: "center" },
  backBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRadius: 10,
  },
  backBtnText: { fontSize: 15, fontWeight: "600" },
});

export default MealDetailScreen;
