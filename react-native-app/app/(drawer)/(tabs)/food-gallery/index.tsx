import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { app, db } from "@/config/firebase";
import { useAccentColor } from "@/context/accent-color";
import { useThemeColor } from "@/hooks/use-theme-color";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import {
    launchImageLibraryAsync,
    MediaType,
    requestMediaLibraryPermissionsAsync,
} from "expo-image-picker";
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
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

function useColors() {
  const cardBg = useThemeColor(
    { light: "#F2F2F2", dark: "#1C1C1E" },
    "background",
  );
  const imageBg = useThemeColor(
    { light: "#E0E0E0", dark: "#252525" },
    "background",
  );
  const background = useThemeColor({}, "background");
  const muted = useThemeColor({ light: "#888888", dark: "#888888" }, "icon");
  const subtle = useThemeColor({ light: "#AAAAAA", dark: "#555555" }, "icon");
  const border = useThemeColor({ light: "#CCCCCC", dark: "#444444" }, "icon");
  const accent = useAccentColor();
  return { cardBg, imageBg, background, muted, subtle, border, accent };
}

function startOfWeek(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
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
  const { cardBg, imageBg, border, subtle } = useColors();
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
      style={[styles.card, { backgroundColor: cardBg }]}
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
        <View style={[styles.cardImage, { backgroundColor: imageBg }]}>
          <View style={[styles.imagePlaceholderIcon, { borderColor: border }]}>
            <View
              style={[styles.imagePlaceholderInner, { borderColor: border }]}
            />
            <View
              style={[
                styles.imagePlaceholderCorner,
                { backgroundColor: border },
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
        <ThemedText style={[styles.cardTime, { color: subtle }]}>
          {timeStr}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
};

const SkeletonCard = () => {
  const { cardBg, imageBg } = useColors();
  return (
    <View style={[styles.card, { backgroundColor: cardBg }]}>
      <View style={[styles.cardImage, { backgroundColor: imageBg }]} />
      <View style={styles.cardFooter}>
        <View
          style={[
            styles.skeletonLine,
            { backgroundColor: imageBg, width: "60%" },
          ]}
        />
        <View
          style={[
            styles.skeletonLine,
            { backgroundColor: imageBg, width: "40%", marginTop: 6 },
          ]}
        />
      </View>
    </View>
  );
};

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (base64: string, uri: string) => void;
}

const CameraModal = ({ visible, onClose, onCapture }: CameraModalProps) => {
  const { background, border, accent } = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = React.useRef<CameraView>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible && !permission?.granted) requestPermission();
  }, [visible]);

  const takePicture = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({
      base64: true,
      quality: 0.7,
    });
    if (photo?.base64 && photo.uri) onCapture(photo.base64, photo.uri);
  };

  const pickFromGallery = async () => {
    await requestMediaLibraryPermissionsAsync();
    const result = await launchImageLibraryAsync({
      mediaTypes: "images" as MediaType,
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0].base64 && result.assets[0].uri) {
      onCapture(result.assets[0].base64, result.assets[0].uri);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.cameraContainer, { backgroundColor: "#000" }]}>
        {permission?.granted ? (
          <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        ) : (
          <View
            style={[
              styles.cameraPermissionBox,
              { backgroundColor: background },
            ]}
          >
            <ThemedText>Camera permission required</ThemedText>
          </View>
        )}
        <View
          style={[
            styles.cameraControls,
            { paddingBottom: Math.max(24, insets.bottom + 16) },
          ]}
        >
          <TouchableOpacity
            style={[styles.cameraBtn, { borderColor: border }]}
            onPress={onClose}
          >
            <ThemedText style={styles.cameraBtnText}>Cancel</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.cameraBtn,
              styles.captureBtn,
              { backgroundColor: accent, borderColor: accent },
            ]}
            onPress={takePicture}
          >
            <ThemedText style={[styles.cameraBtnText, { color: "#fff" }]}>
              Capture
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cameraBtn, { borderColor: border }]}
            onPress={pickFromGallery}
          >
            <ThemedText style={styles.cameraBtnText}>Gallery</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const FoodGalleryScreen = () => {
  const { cardBg, muted, subtle, accent, background } = useColors();
  const router = useRouter();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
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

        const weekStart = startOfWeek();
        const weeklyMeals = data.filter((m) => m.createdAt >= weekStart);
        setWeekly({
          meals: weeklyMeals.length,
          carbs: weeklyMeals.reduce((sum, m) => sum + m.estimatedCarbs, 0),
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

  const handleCapture = useCallback(
    async (base64: string, localUri: string) => {
      if (!uid) return;
      setCameraOpen(false);
      setAnalyzing(true);
      try {
        const storage = getStorage(app);
        const imageRef = ref(storage, `users/${uid}/meals/${Date.now()}.jpg`);
        const blob = await (await fetch(localUri)).blob();
        await (async () => {
          const { uploadBytes } = await import("firebase/storage");
          await uploadBytes(imageRef, blob, { contentType: "image/jpeg" });
        })();
      } catch {
        Alert.alert(
          "Upload failed",
          "Could not upload your photo. Please try again.",
        );
      } finally {
        setAnalyzing(false);
      }
    },
    [uid],
  );

  const todayMeals = meals.filter((m) => m.createdAt >= startOfDay());
  const showEmpty = !loading && !firestoreError && todayMeals.length === 0;

  return (
    <ThemedView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.summaryCard, { backgroundColor: cardBg }]}>
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
              <ThemedText style={[styles.summaryLabel, { color: muted }]}>
                Meals
              </ThemedText>
            </View>
            <View style={styles.summarySpacer} />
            <View style={{ alignItems: "center" }}>
              <ThemedText style={styles.summaryNumber}>
                {weekly.carbs}g
              </ThemedText>
              <ThemedText style={[styles.summaryLabel, { color: muted }]}>
                Carbs
              </ThemedText>
            </View>
            <View style={styles.summarySpacer} />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionIcon, { color: muted }]}>
            ⊟
          </ThemedText>
          <ThemedText style={[styles.sectionTitle, { color: muted }]}>
            TODAY
          </ThemedText>
        </View>

        {firestoreError ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyTitle}>
              Couldn't load meals
            </ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: subtle }]}>
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
                    onPress={() =>
                      router.push({
                        pathname: "/(drawer)/(tabs)/food-gallery/meal-detail",
                        params: { mealId: meal.id },
                      })
                    }
                  />
                ))}
          </View>
        )}

        {analyzing && (
          <View style={[styles.analyzingCard, { backgroundColor: cardBg }]}>
            <ActivityIndicator size="small" color={accent} />
            <ThemedText style={styles.analyzingText}>
              Uploading meal…
            </ThemedText>
          </View>
        )}

        {showEmpty && (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyTitle}>No meals today</ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: subtle }]}>
              Tap the + button to log your first meal of the day.
            </ThemedText>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: accent }]}
        onPress={() => setCameraOpen(true)}
        disabled={analyzing}
      >
        {analyzing ? (
          <ActivityIndicator color={background} />
        ) : (
          <ThemedText style={[styles.fabIcon, { color: background }]}>
            ＋
          </ThemedText>
        )}
      </TouchableOpacity>

      <CameraModal
        visible={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCapture}
      />
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
  analyzingCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  analyzingText: { fontSize: 14 },
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
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  cameraPermissionBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 24,
    paddingHorizontal: 16,
    backgroundColor: "#000",
  },
  cameraBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  captureBtn: { paddingHorizontal: 32 },
  cameraBtnText: { fontSize: 15, fontWeight: "600", color: "#fff" },
});

export default FoodGalleryScreen;
