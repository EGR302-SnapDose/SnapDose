import PumpPairingSection from "@/components/ui/PumpPairingSection";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import { getAuth } from "firebase/auth";
import { doc, getFirestore, updateDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
 
const API_BASE =
    "https://us-central1-egr302-snapdose.cloudfunctions.net/dexcom-auth";
 
const db = getFirestore();
 
// ---------------------------------------------------------------------------
// AsyncStorage keys
// ---------------------------------------------------------------------------
const STORAGE_KEYS = {
    glucoseUnit:        "settings_glucoseUnit",
    highGlucoseAlert:   "settings_highGlucoseAlert",
    lowGlucoseAlert:    "settings_lowGlucoseAlert",
    mealReminders:      "settings_mealReminders",
};
 
// ---------------------------------------------------------------------------
// HIG section card — uppercase header above, card below
// ---------------------------------------------------------------------------
function SectionCard({
    title,
    children,
    theme,
}: {
    title: string;
    children: React.ReactNode;
    theme: typeof Colors["light"];
}) {
    const isDark = theme.background === "#000000";
    const cardBg = isDark ? "#1C1C1E" : "#F2F2F7";
    return (
        <View style={styles.sectionOuter}>
            <Text style={[styles.sectionHeader, { color: theme.icon }]}>
                {title.toUpperCase()}
            </Text>
            <View style={[styles.sectionCard, { backgroundColor: cardBg }]}>
                {children}
            </View>
        </View>
    );
}
 
// Plain display row — label left, value right
function InfoRow({
    label,
    value,
    isLast,
    theme,
}: {
    label: string;
    value: string;
    isLast?: boolean;
    theme: typeof Colors["light"];
}) {
    return (
        <>
            <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
                <Text style={[styles.rowValue, { color: theme.icon }]}>{value}</Text>
            </View>
            {!isLast && (
                <View style={[styles.separator, { backgroundColor: theme.tabIconDefault + "40" }]} />
            )}
        </>
    );
}
 
// Toggle row — label left, Switch right, persists to AsyncStorage + Firestore
function ToggleRow({
    label,
    value,
    onToggle,
    isLast,
    theme,
}: {
    label: string;
    value: boolean;
    onToggle: (v: boolean) => void;
    isLast?: boolean;
    theme: typeof Colors["light"];
}) {
    return (
        <>
            <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
                <Switch
                    value={value}
                    onValueChange={onToggle}
                    trackColor={{ false: theme.tabIconDefault, true: theme.tint }}
                    thumbColor={Platform.OS === "android" ? theme.tint : "#fff"}
                />
            </View>
            {!isLast && (
                <View style={[styles.separator, { backgroundColor: theme.tabIconDefault + "40" }]} />
            )}
        </>
    );
}
 
// Glucose unit segmented control row
function UnitRow({
    value,
    onChange,
    isLast,
    theme,
}: {
    value: "mg/dL" | "mmol/L";
    onChange: (v: "mg/dL" | "mmol/L") => void;
    isLast?: boolean;
    theme: typeof Colors["light"];
}) {
    const isDark = theme.background === "#000000";
    const segBg  = isDark ? "#2C2C2E" : "#E5E5EA";
    return (
        <>
            <View style={[styles.row, { flexDirection: "column", alignItems: "flex-start", gap: 10 }]}>
                <Text style={[styles.rowLabel, { color: theme.text }]}>Blood Glucose Unit</Text>
                <View style={[styles.segmentWrap, { backgroundColor: segBg }]}>
                    {(["mg/dL", "mmol/L"] as const).map((opt) => {
                        const active = value === opt;
                        return (
                            <Pressable
                                key={opt}
                                style={[
                                    styles.segmentBtn,
                                    active && { backgroundColor: theme.tint },
                                ]}
                                onPress={() => onChange(opt)}
                            >
                                <Text
                                    style={[
                                        styles.segmentText,
                                        { color: active ? "#fff" : theme.text },
                                    ]}
                                >
                                    {opt}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>
            {!isLast && (
                <View style={[styles.separator, { backgroundColor: theme.tabIconDefault + "40" }]} />
            )}
        </>
    );
}
 
// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function SettingsScreen() {
    const colorScheme = useColorScheme() ?? "light";
    const theme = Colors[colorScheme];
 
    const userId = getAuth().currentUser?.uid;
 
    // ── Dexcom state — unchanged ────────────────────────────────────────────
    const [dexcomConnected, setDexcomConnected] = useState(false);
    const [loading, setLoading]                 = useState(true);
    const [connecting, setConnecting]           = useState(false);
    const [cgmLastSeen, setCgmLastSeen]         = useState<string | undefined>(undefined);
 
    // ── Preference state ────────────────────────────────────────────────────
    const [glucoseUnit, setGlucoseUnit]         = useState<"mg/dL" | "mmol/L">("mg/dL");
    const [highGlucoseAlert, setHighGlucoseAlert] = useState(true);
    const [lowGlucoseAlert, setLowGlucoseAlert]   = useState(true);
    const [mealReminders, setMealReminders]       = useState(false);
 
    // ── Load preferences from AsyncStorage on mount ─────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const [unit, high, low, meal] = await Promise.all([
                    AsyncStorage.getItem(STORAGE_KEYS.glucoseUnit),
                    AsyncStorage.getItem(STORAGE_KEYS.highGlucoseAlert),
                    AsyncStorage.getItem(STORAGE_KEYS.lowGlucoseAlert),
                    AsyncStorage.getItem(STORAGE_KEYS.mealReminders),
                ]);
                if (unit)  setGlucoseUnit(unit as "mg/dL" | "mmol/L");
                if (high !== null) setHighGlucoseAlert(high === "true");
                if (low  !== null) setLowGlucoseAlert(low   === "true");
                if (meal !== null) setMealReminders(meal     === "true");
            } catch (err) {
                console.error("Failed to load settings:", err);
            }
        })();
    }, []);
 
    // ── Persist preference to AsyncStorage + Firestore ──────────────────────
    async function persistPref(
        key: string,
        value: string,
        firestoreField: string,
        firestoreValue: unknown,
    ) {
        try {
            await AsyncStorage.setItem(key, value);
            if (userId) {
                await updateDoc(doc(db, "users", userId), {
                    [`settings.${firestoreField}`]: firestoreValue,
                });
            }
        } catch (err) {
            console.error(`Failed to save ${key}:`, err);
            Alert.alert("Error", "Failed to save preference. Please try again.");
        }
    }
 
    async function handleGlucoseUnit(v: "mg/dL" | "mmol/L") {
        setGlucoseUnit(v);
        await persistPref(STORAGE_KEYS.glucoseUnit, v, "glucoseUnit", v);
    }
 
    async function handleHighGlucoseAlert(v: boolean) {
        setHighGlucoseAlert(v);
        await persistPref(STORAGE_KEYS.highGlucoseAlert, String(v), "highGlucoseAlert", v);
    }
 
    async function handleLowGlucoseAlert(v: boolean) {
        setLowGlucoseAlert(v);
        await persistPref(STORAGE_KEYS.lowGlucoseAlert, String(v), "lowGlucoseAlert", v);
    }
 
    async function handleMealReminders(v: boolean) {
        setMealReminders(v);
        await persistPref(STORAGE_KEYS.mealReminders, String(v), "mealReminders", v);
    }
 
    // ── Dexcom status — unchanged ────────────────────────────────────────────
    const checkDexcomStatus = async () => {
        if (!userId) return;
        try {
            const res  = await fetch(`${API_BASE}/status?userId=${userId}`);
            const data = await res.json();
            setDexcomConnected(data.connected);
            if (data.connected) setCgmLastSeen("Just now");
        } catch (err) {
            console.error("Failed to check Dexcom status:", err);
        } finally {
            setLoading(false);
        }
    };
 
    useFocusEffect(
        useCallback(() => {
            checkDexcomStatus();
        }, [userId]),
    );
 
    const connectDexcom = async () => {
        if (!userId) return;
        setConnecting(true);
        try {
            const res       = await fetch(`${API_BASE}/auth-url?userId=${userId}`);
            const { url }   = await res.json();
            await WebBrowser.openBrowserAsync(url);
            await checkDexcomStatus();
        } catch (err) {
            console.error("Failed to connect Dexcom:", err);
        } finally {
            setConnecting(false);
        }
    };
 
    // CGM status colour from theme tokens
    const cgmColor = loading
        ? theme.icon
        : dexcomConnected
          ? theme.tint
          : "#FF3B30"; // systemRed — error state
 
    return (
        <SafeAreaView
            style={[styles.safe, { backgroundColor: theme.background }]}
            edges={["bottom"]}
        >
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Page title ── */}
                <Text style={[styles.pageTitle, { color: theme.text }]}>Settings</Text>
 
                {/* ── Device Connections ── */}
                <SectionCard title="Device Connections" theme={theme}>
                    {/* Dexcom CGM row */}
                    <View style={styles.row}>
                        <View style={styles.rowLeft}>
                            <Ionicons
                                name="bluetooth"
                                size={18}
                                color={theme.icon}
                                style={{ marginRight: 8 }}
                            />
                            <Text style={[styles.rowLabel, { color: theme.text }]}>
                                Dexcom CGM
                            </Text>
                        </View>
                        <View style={styles.rowRight}>
                            <View style={styles.statusBadge}>
                                <View
                                    style={[styles.statusDot, { backgroundColor: cgmColor }]}
                                />
                                <Text style={[styles.statusText, { color: cgmColor }]}>
                                    {loading
                                        ? "Checking…"
                                        : dexcomConnected
                                          ? "Online"
                                          : "Offline"}
                                </Text>
                            </View>
                            {cgmLastSeen && (
                                <Text style={[styles.lastSeen, { color: theme.icon }]}>
                                    Last seen: {cgmLastSeen}
                                </Text>
                            )}
                            {!loading && !dexcomConnected && (
                                <Pressable
                                    style={[styles.connectButton, { backgroundColor: theme.tint }]}
                                    onPress={connectDexcom}
                                    disabled={connecting}
                                >
                                    {connecting ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={styles.connectButtonText}>Connect</Text>
                                    )}
                                </Pressable>
                            )}
                        </View>
                    </View>
                </SectionCard>
 
                {/* Pump pairing — external component, unchanged */}
                <PumpPairingSection />
 
                {/* ── Units ── */}
                <SectionCard title="Units" theme={theme}>
                    <UnitRow
                        value={glucoseUnit}
                        onChange={handleGlucoseUnit}
                        theme={theme}
                        isLast
                    />
                </SectionCard>
 
                {/* ── Notifications ── */}
                <SectionCard title="Notifications" theme={theme}>
                    <ToggleRow
                        label="High Glucose Alerts"
                        value={highGlucoseAlert}
                        onToggle={handleHighGlucoseAlert}
                        theme={theme}
                    />
                    <ToggleRow
                        label="Low Glucose Alerts"
                        value={lowGlucoseAlert}
                        onToggle={handleLowGlucoseAlert}
                        theme={theme}
                    />
                    <ToggleRow
                        label="Meal Reminders"
                        value={mealReminders}
                        onToggle={handleMealReminders}
                        theme={theme}
                        isLast
                    />
                </SectionCard>
 
                {/* ── Appearance ── */}
                <SectionCard title="Appearance" theme={theme}>
                    {/* Placeholder for Sprint 6 dark mode toggle */}
                    <View style={styles.row}>
                        <Text style={[styles.rowLabel, { color: theme.text }]}>Theme</Text>
                        <View style={styles.rowRight}>
                            <Text style={[styles.rowValue, { color: theme.icon }]}>
                                Light
                            </Text>
                            <Text style={[styles.comingSoon, { color: theme.icon }]}>
                                Dark mode coming in Sprint 6
                            </Text>
                        </View>
                    </View>
                </SectionCard>
 
                {/* ── Account ── */}
                <SectionCard title="Account" theme={theme}>
                    <InfoRow label="Language"    value="English" theme={theme} />
                    <InfoRow label="App Version" value="1.0.0"   theme={theme} isLast />
                </SectionCard>
 
            </ScrollView>
        </SafeAreaView>
    );
}
 
// ---------------------------------------------------------------------------
// Styles — layout only, zero hardcoded colours
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
    safe:   { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 40,
    },
 
    pageTitle: {
        fontSize: 34,
        fontWeight: "700",
        letterSpacing: 0.37,
        marginBottom: 28,
    },
 
    // Section
    sectionOuter:  { marginBottom: 28 },
    sectionHeader: {
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 0.5,
        marginBottom: 6,
        marginLeft: 4,
    },
    sectionCard: {
        borderRadius: 12,
        overflow: "hidden",
        paddingHorizontal: 16,
    },
 
    // Row
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 13,
        minHeight: 44, // HIG minimum tap target
    },
    rowLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    rowRight: {
        alignItems: "flex-end",
        gap: 4,
    },
    rowLabel: { fontSize: 16 },
    rowValue: { fontSize: 16, fontWeight: "500" },
 
    // HIG hairline separator
    separator: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 0,
    },
 
    // CGM status
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 13,
        fontWeight: "600",
    },
    lastSeen: {
        fontSize: 11,
    },
 
    // Connect button
    connectButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        minHeight: 36,
        justifyContent: "center",
    },
    connectButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
 
    // Glucose unit segment
    segmentWrap: {
        flexDirection: "row",
        borderRadius: 10,
        padding: 3,
        gap: 3,
        alignSelf: "stretch",
    },
    segmentBtn: {
        flex: 1,
        borderRadius: 8,
        paddingVertical: 8,
        alignItems: "center",
    },
    segmentText: {
        fontSize: 14,
        fontWeight: "600",
    },
 
    // Appearance placeholder
    comingSoon: {
        fontSize: 11,
        fontStyle: "italic",
        marginTop: 2,
    },
});