import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ActivityIndicator,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { getAuth } from "firebase/auth";
import * as WebBrowser from "expo-web-browser";
import { useFocusEffect } from "@react-navigation/native";

const API_BASE =
    "https://us-central1-egr302-snapdose.cloudfunctions.net/dexcom-auth";

export default function SettingsScreen() {
    const [dexcomConnected, setDexcomConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);

    const userId = getAuth().currentUser?.uid;

    const checkDexcomStatus = async () => {
        if (!userId) return;
        try {
            const res = await fetch(`${API_BASE}/status?userId=${userId}`);
            const data = await res.json();
            setDexcomConnected(data.connected);
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
        <View style={styles.container}>
            <Text style={styles.title}>Settings</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Integrations</Text>

                <View style={styles.row}>
                    <View style={styles.rowText}>
                        <Text style={styles.label}>Dexcom CGM</Text>
                        <Text style={styles.status}>
                            {loading
                                ? "Checking..."
                                : dexcomConnected
                                  ? "Connected"
                                  : "Not connected"}
                        </Text>
                    </View>

                    {loading ? (
                        <ActivityIndicator />
                    ) : dexcomConnected ? (
                        <View style={styles.connectedBadge}>
                            <Text style={styles.connectedText}>Connected</Text>
                        </View>
                    ) : (
                        <Pressable
                            style={styles.connectButton}
                            onPress={connectDexcom}
                            disabled={connecting}
                        >
                            {connecting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.connectButtonText}>
                                    Connect
                                </Text>
                            )}
                        </Pressable>
                    )}
                </View>
            </View>
        </View>
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
    connectedBadge: {
        backgroundColor: "#E8F5E9",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
    },
    connectedText: {
        color: "#4CAF50",
        fontWeight: "600",
        fontSize: 14,
    },
});
