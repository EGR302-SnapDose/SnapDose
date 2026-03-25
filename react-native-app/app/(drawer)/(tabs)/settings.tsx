import PumpPairingSection from '@/components/ui/PumpPairingSection';
import { useFocusEffect } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import { getAuth } from "firebase/auth";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
const API_BASE =
    "https://us-central1-egr302-snapdose.cloudfunctions.net/dexcom-auth";

export default function SettingsScreen() {
    const [dexcomConnected, setDexcomConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [cgmLastSeen, setCgmLastSeen] = useState<string | undefined>(undefined);
    const userId = getAuth().currentUser?.uid;

    const checkDexcomStatus = async () => {
        if (!userId) return;
        try {
            const res = await fetch(`${API_BASE}/status?userId=${userId}`);
            const data = await res.json();
setDexcomConnected(data.connected);
if (data.connected) {
    setCgmLastSeen('Just now');
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

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Settings</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Integrations</Text>

                {/* Dexcom CGM Row */}
<View style={styles.row}>
    <Text style={styles.label}>Dexcom CGM</Text>

    <View style={styles.rowRight}>
        <View style={styles.statusBadge}>
            <View style={[styles.statusDot, {
                backgroundColor: loading ? '#888' : dexcomConnected ? '#4CAF50' : '#F44336'
            }]} />
            <Text style={[styles.statusText, {
                color: loading ? '#888' : dexcomConnected ? '#4CAF50' : '#F44336'
            }]}>
                {loading ? 'Checking...' : dexcomConnected ? 'Online' : 'Offline'}
            </Text>
        </View>
        {cgmLastSeen && <Text style={styles.lastSeen}>Last seen: {cgmLastSeen}</Text>}
        {!loading && !dexcomConnected && (
            <Pressable
                style={styles.connectButton}
                onPress={connectDexcom}
                disabled={connecting}
            >
                {connecting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.connectButtonText}>Connect</Text>
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
                <Text style={styles.sectionTitle}>Units</Text>
                <View style={styles.row}>
                    <View style={styles.rowText}>
                        <Text style={styles.label}>Blood Glucose</Text>
                        <Text style={styles.status}>mg/dL</Text>
                    </View>
                </View>
                <View style={styles.row}>
                    <View style={styles.rowText}>
                        <Text style={styles.label}>Carbohydrates</Text>
                        <Text style={styles.status}>grams</Text>
                    </View>
                </View>
            </View>

            {/* Notifications Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notifications</Text>
                <View style={styles.row}>
                    <View style={styles.rowText}>
                        <Text style={styles.label}>High Glucose Alerts</Text>
                        <Text style={styles.status}>Enabled</Text>
                    </View>
                </View>
                <View style={styles.row}>
                    <View style={styles.rowText}>
                        <Text style={styles.label}>Low Glucose Alerts</Text>
                        <Text style={styles.status}>Enabled</Text>
                    </View>
                </View>
                <View style={styles.row}>
                    <View style={styles.rowText}>
                        <Text style={styles.label}>Meal Reminders</Text>
                        <Text style={styles.status}>Disabled</Text>
                    </View>
                </View>
            </View>

            {/* App Preferences Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>App Preferences</Text>
                <View style={styles.row}>
                    <View style={styles.rowText}>
                        <Text style={styles.label}>Theme</Text>
                        <Text style={styles.status}>Light</Text>
                    </View>
                </View>
                <View style={styles.row}>
                    <View style={styles.rowText}>
                        <Text style={styles.label}>Language</Text>
                        <Text style={styles.status}>English</Text>
                    </View>
                </View>
                <View style={styles.row}>
                    <View style={styles.rowText}>
                        <Text style={styles.label}>App Version</Text>
                        <Text style={styles.status}>1.0.0</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#fff",
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
        color: "#666",
        marginBottom: 12,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: "#f8f8f8",
        borderRadius: 10,
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
        color: "#888",
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
        color: '#888',
    },
});
