import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import PumpPairingSection from '@/components/ui/PumpPairingSection';
import { db } from "@/config/firebase";
import { colors, Colors } from "@/constants/theme";
import { useAccentColor } from "@/context/accent-color";
import { useThemeColor } from "@/hooks/use-theme-color";
import { hapticLight } from "@/utils/haptics";
import { useFocusEffect } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import { getAuth } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

const API_BASE =
    "https://us-central1-egr302-snapdose.cloudfunctions.net/dexcom-auth";

const ACCENT_COLORS = [
    '#EF4444',
    '#3B82F6',
    '#A855F7',
    '#10B981',
    '#F59E0B',
    '#EC4899',
];

export default function SettingsScreen() {
    const [dexcomConnected, setDexcomConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [cgmLastSeen, setCgmLastSeen] = useState<string | undefined>(undefined);
    const [selectedAccentColor, setSelectedAccentColor] = useState('#3B82F6');
    const [savingColor, setSavingColor] = useState(false);
    const userId = getAuth().currentUser?.uid;
    const currentAccent = useAccentColor();

    // Theme colors
    const rowBg = useThemeColor(
        { light: colors.surfaceSubtle, dark: Colors.dark.surface },
        "surface"
    );
    const sectionTitleColor = useThemeColor(
        { light: colors.textSecondary, dark: Colors.dark.icon },
        "icon"
    );
    const statusColor = useThemeColor(
        { light: colors.textSecondary, dark: Colors.dark.icon },
        "icon"
    );

    const checkDexcomStatus = async () => {
        if (!userId) return;
        try {
            const res = await fetch(`${API_BASE}/status?userId=${userId}`);
            const data = await res.json();
            setDexcomConnected(data.connected);
            if (data.connected) {
                setCgmLastSeen('Just now');
            }
            // Load accent color from Firebase
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                const accentColor = userDoc.data().accentColor;
                if (accentColor) {
                    setSelectedAccentColor(accentColor);
                }
            }
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
            const res = await fetch(`${API_BASE}/auth-url?userId=${userId}`);
            const { url } = await res.json();
            await WebBrowser.openBrowserAsync(url);
            await checkDexcomStatus();
        } catch (err) {
            console.error("Failed to connect Dexcom:", err);
        } finally {
            setConnecting(false);
        }
    };

    const handleColorSelect = async (color: string) => {
        if (!userId) return;
        hapticLight();
        setSelectedAccentColor(color);
        setSavingColor(true);
        try {
            await updateDoc(doc(db, 'users', userId), {
                accentColor: color,
            });
        } catch (err) {
            console.error("Failed to save accent color:", err);
        } finally {
            setSavingColor(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <ThemedText style={styles.title}>Settings</ThemedText>

                <View style={styles.section}>
                    <ThemedText style={[styles.sectionTitle, { color: sectionTitleColor }]}>
                        Integrations
                    </ThemedText>

                    {/* Dexcom CGM Row */}
                    <View style={[styles.row, { backgroundColor: rowBg }]}>
                        <ThemedText style={styles.label}>Dexcom CGM</ThemedText>

                        <View style={styles.rowRight}>
                            <View style={styles.statusBadge}>
                                <View style={[styles.statusDot, {
                                    backgroundColor: loading ? '#888' : dexcomConnected ? '#4CAF50' : '#F44336'
                                }]} />
                                <ThemedText style={[styles.statusText, {
                                    color: loading ? '#888' : dexcomConnected ? '#4CAF50' : '#F44336'
                                }]}>
                                    {loading ? 'Checking...' : dexcomConnected ? 'Online' : 'Offline'}
                                </ThemedText>
                            </View>
                            {cgmLastSeen && (
                                <ThemedText style={[styles.lastSeen, { color: statusColor }]}>
                                    Last seen: {cgmLastSeen}
                                </ThemedText>
                            )}
                            {!loading && !dexcomConnected && (
                                <Pressable
                                    style={styles.connectButton}
                                    onPress={connectDexcom}
                                    disabled={connecting}
                                >
                                    {connecting ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <ThemedText style={styles.connectButtonText}>Connect</ThemedText>
                                    )}
                                </Pressable>
                            )}
                        </View>
                    </View>
                </View>

                {/* Pump Connection Section */}
                <PumpPairingSection />

                {/* Units Section */}
                <View style={styles.section}>
                    <ThemedText style={[styles.sectionTitle, { color: sectionTitleColor }]}>
                        Units
                    </ThemedText>
                    <View style={[styles.row, { backgroundColor: rowBg }]}>
                        <View style={styles.rowText}>
                            <ThemedText style={styles.label}>Blood Glucose</ThemedText>
                            <ThemedText style={[styles.status, { color: statusColor }]}>mg/dL</ThemedText>
                        </View>
                    </View>
                    <View style={[styles.row, { backgroundColor: rowBg }]}>
                        <View style={styles.rowText}>
                            <ThemedText style={styles.label}>Carbohydrates</ThemedText>
                            <ThemedText style={[styles.status, { color: statusColor }]}>grams</ThemedText>
                        </View>
                    </View>
                </View>

                {/* Notifications Section */}
                <View style={styles.section}>
                    <ThemedText style={[styles.sectionTitle, { color: sectionTitleColor }]}>
                        Notifications
                    </ThemedText>
                    <View style={[styles.row, { backgroundColor: rowBg }]}>
                        <View style={styles.rowText}>
                            <ThemedText style={styles.label}>High Glucose Alerts</ThemedText>
                            <ThemedText style={[styles.status, { color: statusColor }]}>Enabled</ThemedText>
                        </View>
                    </View>
                    <View style={[styles.row, { backgroundColor: rowBg }]}>
                        <View style={styles.rowText}>
                            <ThemedText style={styles.label}>Low Glucose Alerts</ThemedText>
                            <ThemedText style={[styles.status, { color: statusColor }]}>Enabled</ThemedText>
                        </View>
                    </View>
                    <View style={[styles.row, { backgroundColor: rowBg }]}>
                        <View style={styles.rowText}>
                            <ThemedText style={styles.label}>Meal Reminders</ThemedText>
                            <ThemedText style={[styles.status, { color: statusColor }]}>Disabled</ThemedText>
                        </View>
                    </View>
                </View>

                {/* App Preferences Section */}
                <View style={styles.section}>
                    <ThemedText style={[styles.sectionTitle, { color: sectionTitleColor }]}>
                        App Preferences
                    </ThemedText>

                    {/* Theme Color */}
                    <View style={[styles.colorSection, { backgroundColor: rowBg }]}>
                        <ThemedText style={styles.label}>Theme Color</ThemedText>
                        <View style={styles.colorGrid}>
                            {ACCENT_COLORS.map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: color },
                                        selectedAccentColor === color && {
                                            borderColor: '#FFF',
                                            borderWidth: 3,
                                        },
                                    ]}
                                    onPress={() => handleColorSelect(color)}
                                    disabled={savingColor}
                                >
                                    {selectedAccentColor === color && (
                                        <ThemedText style={styles.checkmark}>✓</ThemedText>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={[styles.row, { backgroundColor: rowBg }]}>
                        <View style={styles.rowText}>
                            <ThemedText style={styles.label}>Theme</ThemedText>
                            <ThemedText style={[styles.status, { color: statusColor }]}>System</ThemedText>
                        </View>
                    </View>
                    <View style={[styles.row, { backgroundColor: rowBg }]}>
                        <View style={styles.rowText}>
                            <ThemedText style={styles.label}>Language</ThemedText>
                            <ThemedText style={[styles.status, { color: statusColor }]}>English</ThemedText>
                        </View>
                    </View>
                    <View style={[styles.row, { backgroundColor: rowBg }]}>
                        <View style={styles.rowText}>
                            <ThemedText style={styles.label}>App Version</ThemedText>
                            <ThemedText style={[styles.status, { color: statusColor }]}>1.0.0</ThemedText>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 12,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginBottom: 8,
    },
    rowText: {
        flex: 1,
    },
    label: {
        fontSize: 16,
        fontWeight: "500",
    },
    status: {
        fontSize: 13,
        marginTop: 2,
    },
    connectButton: {
        backgroundColor: "#4CAF50",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    connectButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
    rowRight: {
        alignItems: 'flex-end',
        gap: 6,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
    },
    lastSeen: {
        fontSize: 11,
    },
    colorSection: {
        borderRadius: 10,
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
        marginTop: 12,
    },
    colorOption: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'transparent',
    },
    checkmark: {
        fontSize: 24,
        color: '#FFF',
        fontWeight: '700',
    },
});
