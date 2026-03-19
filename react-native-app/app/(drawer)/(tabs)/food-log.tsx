import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Alert, Modal, } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Colors } from "@/constants/theme";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker/build/ImagePicker";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, Timestamp, getDocs, } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app, db } from "@/config/firebase";

const { width } = Dimensions.get("window");
const CARD_SIZE = (width - 48) / 2;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Meal {
    id: string;
    imageUrl: string;
    name: string;
    carbs: number;
    calories: number;
    loggedAt: Date;
    userId: string;
}

interface WeeklySummary {
    meals: number;
    carbs: number;
    calories: number;
}

// ─── Theme hook ───────────────────────────────────────────────────────────────
// Centralises all color lookups so every component reads from Colors tokens.

function useFoodLogColors() {
    // Surface colors — slightly offset from the true background
    const cardBg = useThemeColor(
        { light: "#F2F2F2", dark: "#1C1C1E" },
        "background",
    );
    // Deeper inset (image placeholder area inside a card)
    const imageBg = useThemeColor(
        { light: "#E5E5EA", dark: "#2C2C2E" },
        "background",
    );
    // True app background
    const background = useThemeColor({}, "background");
    // Primary text
    const text = useThemeColor({}, "text");
    // Subdued label text — maps to Colors.*.icon
    const muted = useThemeColor({}, "icon");
    // Even more subdued, used for timestamps / subtitles
    const subtle = useThemeColor(
        { light: "#AEAEB2", dark: "#636366" },
        "icon",
    );
    // Divider / placeholder border
    const border = useThemeColor(
        { light: "#C7C7CC", dark: "#3A3A3C" },
        "icon",
    );
    // Accent / interactive — tint from Colors
    const tint = useThemeColor({}, "tint");
    const accent = useThemeColor({}, "accent");

    return { cardBg, imageBg, background, text, muted, subtle, border, tint, accent };
}

// ─── Gemini helper ────────────────────────────────────────────────────────────

async function analyzeImageWithGemini(base64Image: string): Promise<{
    name: string;
    carbs: number;
    calories: number;
}> {
    const GCP_PROXY_URL = process.env.EXPO_PUBLIC_GEMINI_PROXY_URL ?? "";

    const prompt = `You are a nutrition expert. Analyze this food image and respond ONLY with a valid JSON object (no markdown, no explanation) in exactly this shape:
{"name":"<meal name>","carbs":<grams as integer>,"calories":<kcal as integer>}`;

    const response = await fetch(GCP_PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image, prompt }),
    });

    if (!response.ok) throw new Error(`Gemini proxy error: ${response.status}`);

    const raw: string = await response.json();
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
}

// ─── Firestore helpers ────────────────────────────────────────────────────────

function getMealsRef(uid: string) {
    return collection(db, "users", uid, "meals");
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

// ─── MealCard ─────────────────────────────────────────────────────────────────

const MealCard = ({ meal }: { meal: Meal }) => {
    const { cardBg, muted, subtle } = useFoodLogColors();

    const timeStr = meal.loggedAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Image
                source={{ uri: meal.imageUrl }}
                style={styles.cardImageFilled}
                contentFit="cover"          
                cachePolicy="memory-disk" 
            />
            <View style={styles.cardFooter}>
                <ThemedText style={styles.cardTitle} numberOfLines={1}>
                    {meal.name}
                </ThemedText>
                <View style={styles.cardMeta}>
                    <ThemedText style={styles.cardCarbs}>
                        {meal.carbs}g carbs
                    </ThemedText>
                    <ThemedText style={[styles.cardCal, { color: muted }]}>
                        {meal.calories} cal
                    </ThemedText>
                </View>
                <ThemedText style={[styles.cardTime, { color: subtle }]}>
                    {timeStr}
                </ThemedText>
            </View>
        </View>
    );
};

// ─── PlaceholderCard ──────────────────────────────────────────────────────────

const PlaceholderCard = () => {
    const { cardBg, imageBg, border, muted, subtle } = useFoodLogColors();

    return (
        <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={[styles.cardImage, { backgroundColor: imageBg }]}>
                <View style={[styles.imagePlaceholderIcon, { borderColor: border }]}>
                    <View style={[styles.imagePlaceholderInner, { borderColor: border }]} />
                    <View style={[styles.imagePlaceholderCorner, { backgroundColor: border }]} />
                </View>
            </View>
            <View style={styles.cardFooter}>
                <ThemedText style={styles.cardTitle}>Meal photo</ThemedText>
                <View style={styles.cardMeta}>
                    <ThemedText style={styles.cardCarbs}>0g carbs</ThemedText>
                    <ThemedText style={[styles.cardCal, { color: muted }]}>
                        — cal
                    </ThemedText>
                </View>
                <ThemedText style={[styles.cardTime, { color: subtle }]}>
                    --:-- --
                </ThemedText>
            </View>
        </View>
    );
};

// ─── CameraModal ──────────────────────────────────────────────────────────────

interface CameraModalProps {
    visible: boolean;
    onClose: () => void;
    onCapture: (base64: string, uri: string) => void;
}

const CameraModal = ({ visible, onClose, onCapture }: CameraModalProps) => {
    const { background, border, accent } = useFoodLogColors();
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = React.useRef<CameraView>(null);

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
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
                    <View style={[styles.cameraPermissionBox, { backgroundColor: background }]}>
                        <ThemedText>Camera permission required</ThemedText>
                    </View>
                )}
                <View style={styles.cameraControls}>
                    <TouchableOpacity
                        style={[styles.cameraBtn, { borderColor: border }]}
                        onPress={onClose}
                    >
                        <ThemedText style={styles.cameraBtnText}>Cancel</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.cameraBtn, styles.captureBtn, { backgroundColor: accent, borderColor: accent }]}
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

// ─── FoodLogScreen ────────────────────────────────────────────────────────────

const FoodLogScreen = () => {
    const { cardBg, muted, subtle, accent } = useFoodLogColors();

    const [meals, setMeals] = useState<Meal[]>([]);
    const [loadingMeals, setLoadingMeals] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [cameraOpen, setCameraOpen] = useState(false);
    const [weekly, setWeekly] = useState<WeeklySummary>({
        meals: 0,
        carbs: 0,
        calories: 0,
    });

    const auth = getAuth(app);
    const uid = auth.currentUser?.uid;

    // Real-time listener — today's meals
    useEffect(() => {
        if (!uid) return;
        const q = query(
            getMealsRef(uid),
            where("loggedAt", ">=", Timestamp.fromDate(startOfDay())),
            orderBy("loggedAt", "desc"),
        );
        const unsub = onSnapshot(q, (snap) => {
            setMeals(
                snap.docs.map((doc) => ({
                    id: doc.id,
                    ...(doc.data() as Omit<Meal, "id" | "loggedAt">),
                    loggedAt: (doc.data().loggedAt as Timestamp).toDate(),
                })),
            );
            setLoadingMeals(false);
        });
        return unsub;
    }, [uid]);

    // Weekly summary — re-fetch when today's meal count changes
    useEffect(() => {
        if (!uid) return;
        const q = query(
            getMealsRef(uid),
            where("loggedAt", ">=", Timestamp.fromDate(startOfWeek())),
        );
        getDocs(q).then((snap) => {
            let carbs = 0;
            let calories = 0;
            snap.docs.forEach((d) => {
                carbs += d.data().carbs ?? 0;
                calories += d.data().calories ?? 0;
            });
            setWeekly({ meals: snap.size, carbs, calories });
        });
    }, [uid, meals.length]);

    const handleCapture = useCallback(
        async (base64: string, localUri: string) => {
            if (!uid) return;
            setCameraOpen(false);
            setAnalyzing(true);
            try {
                const nutrition = await analyzeImageWithGemini(base64);
                const storage = getStorage(app);
                const imageRef = ref(storage, `users/${uid}/meals/${Date.now()}.jpg`);
                const blob = await (await fetch(localUri)).blob();
                await uploadBytes(imageRef, blob, { contentType: "image/jpeg" });
                const imageUrl = await getDownloadURL(imageRef);
                await addDoc(getMealsRef(uid), {
                    imageUrl,
                    name: nutrition.name,
                    carbs: nutrition.carbs,
                    calories: nutrition.calories,
                    loggedAt: Timestamp.now(),
                    userId: uid,
                });
            } catch (err) {
                console.error(err);
                Alert.alert(
                    "Failed to log meal",
                    "Something went wrong analyzing your photo. Please try again.",
                );
            } finally {
                setAnalyzing(false);
            }
        },
        [uid],
    );

    const showPlaceholders = loadingMeals;
    const showEmpty = !loadingMeals && meals.length === 0;

    return (
        <ThemedView style={styles.root}>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Weekly Summary */}
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
                        <View style={{ alignItems: "flex-end" }}>
                            <ThemedText style={styles.summaryNumber}>
                                {weekly.calories}
                            </ThemedText>
                            <ThemedText style={[styles.summaryLabel, { color: muted }]}>
                                Calories
                            </ThemedText>
                        </View>
                    </View>
                </View>

                {/* Section header */}
                <View style={styles.sectionHeader}>
                    <ThemedText style={[styles.sectionIcon, { color: muted }]}>
                        ⊟
                    </ThemedText>
                    <ThemedText style={[styles.sectionTitle, { color: muted }]}>
                        TODAY
                    </ThemedText>
                </View>

                {/* Meal grid */}
                <View style={styles.grid}>
                    {showPlaceholders
                        ? [1, 2, 3, 4].map((i) => <PlaceholderCard key={i} />)
                        : meals.map((meal) => <MealCard key={meal.id} meal={meal} />)}
                </View>

                {/* Analyzing indicator */}
                {analyzing && (
                    <View style={[styles.analyzingCard, { backgroundColor: cardBg }]}>
                        <ActivityIndicator size="small" color={accent} />
                        <ThemedText style={styles.analyzingText}>
                            Analyzing meal…
                        </ThemedText>
                    </View>
                )}

                {/* Empty state */}
                {showEmpty && (
                    <View style={styles.emptyState}>
                        <ThemedText style={styles.emptyTitle}>
                            No meals logged yet
                        </ThemedText>
                        <ThemedText style={[styles.emptySubtitle, { color: subtle }]}>
                            Tap the Scan button to log your first meal. Your past
                            meals will appear here.
                        </ThemedText>
                    </View>
                )}
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: accent }]}
                onPress={() => setCameraOpen(true)}
                disabled={analyzing}
            >
                {analyzing ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <ThemedText style={styles.fabIcon}>＋</ThemedText>
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

// ─── Styles ───────────────────────────────────────────────────────────────────
// No color values live here — all colors are injected at render time via
// useFoodLogColors() so they respond correctly to theme changes.

const styles = StyleSheet.create({
    root: { flex: 1 },
    content: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 100,
    },
    summaryCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    summaryRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
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
    cardImageFilled: {
        width: "100%",
        height: CARD_SIZE,
    },
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
    cardCal: { fontSize: 13 },
    cardTime: { fontSize: 12, marginTop: 3 },
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
    fabIcon: { fontSize: 28, color: "#fff", lineHeight: 32 },
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
        paddingVertical: 24,
        paddingHorizontal: 16,
        backgroundColor: "#000",
    },
    cameraBtn: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        borderWidth: 1,
    },
    captureBtn: {
        paddingHorizontal: 32,
    },
    cameraBtnText: { fontSize: 15, fontWeight: "600", color: "#fff" },
});

export default FoodLogScreen;