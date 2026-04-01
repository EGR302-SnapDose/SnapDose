import { Image } from "expo-image";
import { router } from "expo-router";
import { getAuth } from "firebase/auth";
import {
    collection,
    limit,
    onSnapshot,
    orderBy,
    query,
    Timestamp,
    where,
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

import { app, db } from "@/config/firebase";
import { useAccentColor } from "@/context/accent-color";
import { useThemeColor } from "@/hooks/use-theme-color";
import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";
 
interface RecentMeal {
  id: string;
  imagePath: string;
  imageUrl: string | null;
  estimatedCarbs: number;
  createdAt: Date;
  foodsDetected: string[];
}
 
async function resolveGsUri(gsUri: string): Promise<string> {
  const storage = getStorage(app);
  const path = gsUri.replace(/^gs:\/\/[^/]+\//, "");
  return getDownloadURL(ref(storage, path));
}
 
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
 
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}
 
function MealRow({ meal, isLast, dividerColor }: {
  meal: RecentMeal;
  isLast: boolean;
  dividerColor: string;
}) {
  const imageBg = useThemeColor(
    { light: "#E8E8E8", dark: "#2A2A2A" },
    "background"
  );
  const subtleColor = useThemeColor(
    { light: "#888888", dark: "#888888" },
    "icon"
  );
  const accent = useAccentColor();
 
  const label = meal.foodsDetected[0] ?? "Meal";
  const timeStr = formatTimeAgo(meal.createdAt);
 
  return (
    <>
      <TouchableOpacity
        style={styles.mealRow}
        onPress={() =>
          router.push({
            pathname: "/(drawer)/(tabs)/food-gallery/meal-detail" as any,
            params: { mealId: meal.id },
          })
        }
        activeOpacity={0.7}
      >
        {/* Thumbnail */}
        <View style={[styles.thumbnail, { backgroundColor: imageBg }]}>
          {meal.imageUrl ? (
            <Image
              source={{ uri: meal.imageUrl }}
              style={styles.thumbnailImage}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <ThemedText style={[styles.thumbnailIcon, { color: subtleColor }]}>
                🍽
              </ThemedText>
            </View>
          )}
        </View>
 
        {/* Info */}
        <View style={styles.mealInfo}>
          <ThemedText style={styles.mealName} numberOfLines={1}>
            {label}
          </ThemedText>
          <ThemedText style={[styles.mealTime, { color: subtleColor }]}>
            {timeStr}
          </ThemedText>
        </View>
 
        {/* Carbs */}
        <View style={styles.carbsBadge}>
          <ThemedText style={[styles.carbsValue, { color: accent }]}>
            {meal.estimatedCarbs}g
          </ThemedText>
          <ThemedText style={[styles.carbsLabel, { color: subtleColor }]}>
            carbs
          </ThemedText>
        </View>
      </TouchableOpacity>
 
      {!isLast && (
        <View style={[styles.divider, { backgroundColor: dividerColor }]} />
      )}
    </>
  );
}
 
export function RecentMealsCard() {
  const borderColor = useThemeColor({}, "icon");
  const dividerColor = useThemeColor(
    { light: "#E0E0E0", dark: "#333333" },
    "icon"
  );
  const subtleColor = useThemeColor(
    { light: "#888888", dark: "#888888" },
    "icon"
  );
 
  const [meals, setMeals] = useState<RecentMeal[]>([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    const uid = getAuth(app).currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }
 
    const q = query(
      collection(db, "users", uid, "meal_carb_estimation"),
      where("status", "==", "completed"),
      orderBy("created_at", "desc"),
      limit(3)
    );
 
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data: RecentMeal[] = snap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            imagePath: d.image_gs_uri ?? "",
            imageUrl: null,
            estimatedCarbs: d.estimated_carbs_grams ?? 0,
            createdAt:
              d.created_at instanceof Timestamp
                ? d.created_at.toDate()
                : new Date(d.created_at),
            foodsDetected: d.foods_detected ?? [],
          };
        });
        setMeals(data);
        setLoading(false);
 
        // Resolve image URLs in the background
        data.forEach((meal, idx) => {
          if (!meal.imagePath) return;
          resolveGsUri(meal.imagePath)
            .then((url) => {
              setMeals((prev) =>
                prev.map((m, i) => (i === idx ? { ...m, imageUrl: url } : m))
              );
            })
            .catch(() => {});
        });
      },
      (err) => {
        console.error("RecentMealsCard snapshot error:", err);
        setLoading(false);
      }
    );
 
    return unsub;
  }, []);
 
  return (
    <ThemedView style={[styles.card, { borderColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="subtitle">Recent Meals</ThemedText>
        <TouchableOpacity
          onPress={() => router.push("/(drawer)/(tabs)/food-gallery" as any)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ThemedText style={[styles.seeAll, { color: subtleColor }]}>
            See all →
          </ThemedText>
        </TouchableOpacity>
      </View>
 
      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" />
        </View>
      ) : meals.length === 0 ? (
        <View style={styles.centered}>
          <ThemedText style={[styles.emptyText, { color: subtleColor }]}>
            No meals logged yet.{"\n"}Snap a meal to get started!
          </ThemedText>
        </View>
      ) : (
        meals.map((meal, idx) => (
          <MealRow
            key={meal.id}
            meal={meal}
            isLast={idx === meals.length - 1}
            dividerColor={dividerColor}
          />
        ))
      )}
    </ThemedView>
  );
}
 
const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: "500",
  },
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: "hidden",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  thumbnailPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnailIcon: {
    fontSize: 22,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 15,
    fontWeight: "500",
  },
  mealTime: {
    fontSize: 12,
    marginTop: 2,
  },
  carbsBadge: {
    alignItems: "flex-end",
  },
  carbsValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  carbsLabel: {
    fontSize: 11,
    marginTop: 1,
  },
  divider: {
    height: 1,
  },
  centered: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});