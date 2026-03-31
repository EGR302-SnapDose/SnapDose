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
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { app, db } from "@/config/firebase";
import { colors, layout, radius, shadows, spacing, textStyles } from "@/constants/theme";

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
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function MealRow({ meal, isLast }: { meal: RecentMeal; isLast: boolean }) {
  const label = meal.foodsDetected[0] ?? "Meal";
  const secondaryLabel = meal.foodsDetected.slice(1, 3).join(", ");

  return (
    <>
      <TouchableOpacity
        style={styles.row}
        onPress={() =>
          router.push({
            pathname: "/(drawer)/(tabs)/food-gallery/meal-detail" as any,
            params: { mealId: meal.id },
          })
        }
        activeOpacity={0.7}
      >
        {/* Thumbnail */}
        <View style={styles.thumbnail}>
          {meal.imageUrl ? (
            <Image
              source={{ uri: meal.imageUrl }}
              style={styles.thumbnailImage}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Text style={styles.thumbnailPlaceholderText}>?</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.rowInfo}>
          <Text style={styles.mealName} numberOfLines={1}>{label}</Text>
          {secondaryLabel ? (
            <Text style={styles.mealSub} numberOfLines={1}>{secondaryLabel}</Text>
          ) : (
            <Text style={styles.mealSub}>{formatTimeAgo(meal.createdAt)}</Text>
          )}
        </View>

        {/* Carb badge */}
        <View style={styles.carbBadge}>
          <Text style={styles.carbValue}>{meal.estimatedCarbs}</Text>
          <Text style={styles.carbUnit}>g carbs</Text>
        </View>
      </TouchableOpacity>

      {!isLast && (
        <View style={styles.separator} />
      )}
    </>
  );
}

export function RecentMealsCard() {
  const [meals, setMeals] = useState<RecentMeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = getAuth(app).currentUser?.uid;
    if (!uid) { setLoading(false); return; }

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
      () => setLoading(false)
    );

    return unsub;
  }, []);

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Recent Meals</Text>
          {meals.length > 0 && (
            <Text style={styles.headerSub}>{meals.length} logged today</Text>
          )}
        </View>
        <Pressable
          onPress={() => router.push("/(drawer)/(tabs)/food-gallery" as any)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.seeAll}>See All</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : meals.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Text style={styles.emptyIcon}>?</Text>
          </View>
          <Text style={styles.emptyTitle}>No meals logged yet</Text>
          <Text style={styles.emptyBody}>Snap a meal to start tracking carbs.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {meals.map((meal, idx) => (
            <MealRow key={meal.id} meal={meal} isLast={idx === meals.length - 1} />
          ))}
        </View>
      )}
    </View>
  );
}

const THUMB = 52;

const styles = StyleSheet.create({
  card: {
    marginHorizontal: layout.screenHorizontalPadding,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  headerTitle: {
    ...textStyles.headline,
    color: colors.textPrimary,
  },
  headerSub: {
    ...textStyles.caption1,
    color: colors.textTertiary,
    marginTop: 1,
  },
  seeAll: {
    ...textStyles.callout,
    color: colors.primary,
  },
  list: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[3],
    gap: spacing[3],
    minHeight: layout.minTouchTarget,
  },
  thumbnail: {
    width: THUMB,
    height: THUMB,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.surfaceSubtle,
    flexShrink: 0,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  thumbnailPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySurface,
  },
  thumbnailPlaceholderText: {
    ...textStyles.title3,
    color: colors.primary,
  },
  rowInfo: {
    flex: 1,
    gap: 3,
  },
  mealName: {
    ...textStyles.calloutSemibold,
    color: colors.textPrimary,
  },
  mealSub: {
    ...textStyles.caption1,
    color: colors.textTertiary,
  },
  carbBadge: {
    alignItems: "center",
    backgroundColor: colors.primarySurface,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.md,
    minWidth: 52,
  },
  carbValue: {
    ...textStyles.title3Semibold,
    color: colors.primary,
    lineHeight: 22,
  },
  carbUnit: {
    ...textStyles.caption2,
    color: colors.primary,
    opacity: 0.7,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: THUMB + spacing[3],
  },
  centered: {
    paddingVertical: spacing[8],
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[6],
    gap: spacing[2],
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[1],
  },
  emptyIcon: {
    ...textStyles.title2,
    color: colors.primary,
  },
  emptyTitle: {
    ...textStyles.calloutSemibold,
    color: colors.textPrimary,
  },
  emptyBody: {
    ...textStyles.footnote,
    color: colors.textTertiary,
    textAlign: "center",
  },
});
