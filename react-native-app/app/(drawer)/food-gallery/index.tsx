import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { app, db } from "@/config/firebase";
import { useAccentColor } from "@/context/accent-color";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_SIZE = (width - 48) / 2;

interface Meal {
  id: string;
  imageUrl: string | null;
  imagePath: string;
  foodsDetected: string[];
  estimatedCarbs: number;
  confidence: string;
  createdAt: Date;
  status: string;
}

interface WeeklySummary {
  meals: number;
  carbs: number;
}

function startOfDay(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function resolveGsUri(gsUri: string): Promise<string> {
  const storage = getStorage(app);
  const path = gsUri.replace(/^gs:\/\/[^/]+\//, "");
  return getDownloadURL(ref(storage, path));
}

const MealCard = ({ meal, onPress }: { meal: Meal; onPress: () => void }) => {
  const c = useThemeColors();
  const [imageUrl, setImageUrl] = useState<string | null>(meal.imageUrl);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!imageUrl && meal.imagePath) {
      resolveGsUri(meal.imagePath)
        .then(setImageUrl)
        .catch(() => setImageError(true));
    }
  }, [meal.imagePath]);

  const timeStr = meal.createdAt.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const label = meal.foodsDetected[0] ?? "Meal";

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: c.surface }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {imageUrl && !imageError ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.cardImageFilled}
          contentFit="cover"
          cachePolicy="memory-disk"
          onError={() => setImageError(true)}
        />
      ) : (
        <View
          style={[styles.cardImage, { backgroundColor: c.surfaceSubtle }]}
        >
          <View
            style={[styles.imagePlaceholderIcon, { borderColor: c.border }]}
          >
            <View
              style={[
                styles.imagePlaceholderInner,
                { borderColor: c.border },
              ]}
            />
            <View
              style={[
                styles.imagePlaceholderCorner,
                { backgroundColor: c.border },
              ]}
            />
          </View>
        </View>
      )}
      <View style={styles.cardFooter}>
        <ThemedText style={styles.cardTitle} numberOfLines={1}>
          {label}
        </ThemedText>
        <View style={styles.cardMeta}>
          <ThemedText style={styles.cardCarbs}>
            {meal.estimatedCarbs}g carbs
          </ThemedText>
        </View>
        <ThemedText style={[styles.cardTime, { color: c.textTertiary }]}>
          {timeStr}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
};

const SkeletonCard = () => {
  const c = useThemeColors();
  return (
    <View style={[styles.card, { backgroundColor: c.surface }]}>
      <View
        style={[styles.cardImage, { backgroundColor: c.surfaceSubtle }]}
      />
      <View style={styles.cardFooter}>
        <View
          style={[
            styles.skeletonLine,
            { backgroundColor: c.surfaceSubtle, width: "60%" },
          ]}
        />
        <View
          style={[
            styles.skeletonLine,
            {
              backgroundColor: c.surfaceSubtle,
              width: "40%",
              marginTop: 6,
            },
          ]}
        />
      </View>
    </View>
  );
};

const FoodGalleryScreen = () => {
  const c = useThemeColors();
  const accent = useAccentColor();
  const router = useRouter();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState(false);
  const [weekly, setWeekly] = useState<WeeklySummary>({ meals: 0, carbs: 0 });

  const uid = getAuth(app).currentUser?.uid;

  useEffect(() => {
    if (!uid) return;

    const mealsRef = collection(db, "users", uid, "meal_carb_estimation");
    const q = query(mealsRef, orderBy("created_at", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data: Meal[] = snap.docs
          .filter((doc) => doc.data().status === "completed")
          .map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              imageUrl: null,
              imagePath: d.image_gs_uri ?? "",
              foodsDetected: d.foods_detected ?? [],
              estimatedCarbs: d.estimated_carbs_grams ?? 0,
              confidence: d.confidence ?? "",
              createdAt: (d.created_at as Timestamp).toDate(),
              status: d.status ?? "",
            };
          });
        setMeals(data);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        const weekMeals = data.filter((m) => m.createdAt >= sevenDaysAgo);
        setWeekly({
          meals: weekMeals.length,
          carbs: weekMeals.reduce((sum, m) => sum + m.estimatedCarbs, 0),
        });

        setLoading(false);
        setFirestoreError(false);
      },
      (err) => {
        console.error("Firestore onSnapshot error:", err);
        setLoading(false);
        setFirestoreError(true);
      },
    );

    return unsub;
  }, [uid]);

  const todayMeals = meals.filter((m) => m.createdAt >= startOfDay());

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const last7DaysMeals = meals.filter(
    (m) => m.createdAt >= sevenDaysAgo && m.createdAt < startOfDay(),
  );

  const mealsByDay = useMemo(
    () =>
      last7DaysMeals.reduce<Record<string, Meal[]>>((acc, meal) => {
        const label = meal.createdAt.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        });
        if (!acc[label]) acc[label] = [];
        acc[label].push(meal);
        return acc;
      }, {}),
    [last7DaysMeals],
  );

  const openMeal = (mealId: string) =>
    router.push({
      pathname: "/(drawer)/food-gallery/meal-detail" as any,
      params: { mealId },
    });

  const showEmpty = !loading && !firestoreError && meals.length === 0;

  return (
    <ThemedView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.summaryCard, { backgroundColor: c.surface }]}>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryTrend}>↗</ThemedText>
            <ThemedText style={styles.summaryHeading}>
              Weekly Summary
            </ThemedText>
          </View>
          <View style={styles.summaryStats}>
            <View>
              <ThemedText style={styles.summaryNumber}>
                {weekly.meals}
              </ThemedText>
              <ThemedText
                style={[styles.summaryLabel, { color: c.textSecondary }]}
              >
                Meals
              </ThemedText>
            </View>
            <View style={styles.summarySpacer} />
            <View style={{ alignItems: "center" }}>
              <ThemedText style={styles.summaryNumber}>
                {weekly.carbs}g
              </ThemedText>
              <ThemedText
                style={[styles.summaryLabel, { color: c.textSecondary }]}
              >
                Carbs
              </ThemedText>
            </View>
            <View style={styles.summarySpacer} />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText
            style={[styles.sectionIcon, { color: c.textSecondary }]}
          >
            ⊟
          </ThemedText>
          <ThemedText
            style={[styles.sectionTitle, { color: c.textSecondary }]}
          >
            TODAY
          </ThemedText>
        </View>

        {firestoreError ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyTitle}>
              Couldn&apos;t load meals
            </ThemedText>
            <ThemedText
              style={[styles.emptySubtitle, { color: c.textTertiary }]}
            >
              Check your connection and try again.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.grid}>
            {loading
              ? [1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)
              : todayMeals.map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    onPress={() => openMeal(meal.id)}
                  />
                ))}
          </View>
        )}

        {Object.entries(mealsByDay).map(([dayLabel, dayMeals]) => (
          <View key={dayLabel}>
            <View style={styles.sectionHeader}>
              <ThemedText
                style={[styles.sectionIcon, { color: c.textSecondary }]}
              >
                ⊟
              </ThemedText>
              <ThemedText
                style={[styles.sectionTitle, { color: c.textSecondary }]}
              >
                {dayLabel.toUpperCase()}
              </ThemedText>
            </View>
            <View style={styles.grid}>
              {dayMeals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  onPress={() => openMeal(meal.id)}
                />
              ))}
            </View>
          </View>
        ))}

        {showEmpty && (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyTitle}>No meals today</ThemedText>
            <ThemedText
              style={[styles.emptySubtitle, { color: c.textTertiary }]}
            >
              Tap the + button to log your first meal of the day.
            </ThemedText>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: accent }]}
        onPress={() => router.push("/(drawer)/(tabs)/camera")}
      >
        <ThemedText style={[styles.fabIcon, { color: c.textInverse }]}>
          ＋
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 },
  summaryCard: { borderRadius: 16, padding: 20, marginBottom: 20 },
  summaryRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  summaryTrend: { fontSize: 16, marginRight: 8 },
  summaryHeading: { fontSize: 16, fontWeight: "700" },
  summaryStats: { flexDirection: "row", alignItems: "flex-end" },
  summaryNumber: { fontSize: 36, fontWeight: "700", lineHeight: 42 },
  summaryLabel: { fontSize: 13, marginTop: 2 },
  summarySpacer: { flex: 1 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionIcon: { fontSize: 14, marginRight: 6 },
  sectionTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 1.5 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: CARD_SIZE,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: CARD_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  cardImageFilled: { width: "100%", height: CARD_SIZE },
  imagePlaceholderIcon: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    marginBottom: 2,
  },
  imagePlaceholderCorner: {
    position: "absolute",
    bottom: 6,
    left: 4,
    right: 4,
    height: 1.5,
    borderRadius: 1,
  },
  cardFooter: { padding: 12 },
  cardTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardCarbs: { fontSize: 13, fontWeight: "600" },
  cardTime: { fontSize: 12, marginTop: 3 },
  skeletonLine: { height: 12, borderRadius: 6 },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 21 },
  fab: {
    position: "absolute",
    bottom: 28,
    alignSelf: "center",
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  fabIcon: { fontSize: 28, lineHeight: 32 },
});

export default FoodGalleryScreen;
