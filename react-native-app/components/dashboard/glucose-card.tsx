import { useThemeColor } from "@/hooks/use-theme-color";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { useState, useCallback } from "react";
import { getAuth } from "firebase/auth";
import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";
import { useFocusEffect } from "@react-navigation/native";

const API_BASE =
    "https://us-central1-egr302-snapdose.cloudfunctions.net/dexcom-auth";

function getTrendArrow(trend: string) {
    switch (trend) {
        case "doubleUp":
            return "^^";
        case "up":
            return "^";
        case "fortyFiveUp":
            return "/";
        case "flat":
            return "-";
        case "fortyFiveDown":
            return "\\";
        case "down":
            return "v";
        case "doubleDown":
            return "vv";
        default:
            return "-";
    }
}

function getTrendLabel(trend: string) {
    switch (trend) {
        case "doubleUp":
            return "Rising fast";
        case "up":
            return "Rising";
        case "fortyFiveUp":
            return "Rising slightly";
        case "flat":
            return "Stable";
        case "fortyFiveDown":
            return "Falling slightly";
        case "down":
            return "Falling";
        case "doubleDown":
            return "Falling fast";
        default:
            return "Unknown";
    }
}

function getGlucoseColor(value: number) {
    if (value < 70) return "#E53935";
    if (value > 180) return "#E53935";
    if (value > 140) return "#FB8C00";
    return "#43A047";
}

type GlucoseReading = {
    value: number;
    trend: string;
    systemTime: string;
};

export function GlucoseCard() {
    const borderColor = useThemeColor({}, "icon");
    const [reading, setReading] = useState<GlucoseReading | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchGlucose = async () => {
        const userId = getAuth().currentUser?.uid;
        if (!userId) {
            setError("Not signed in");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/latest?userId=${userId}`);

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to fetch");
                setLoading(false);
                return;
            }

            const data = await res.json();

            if (!data.latest) {
                setError("No recent readings");
                setLoading(false);
                return;
            }

            setReading({
                value: data.latest.value,
                trend: data.latest.trend || "flat",
                systemTime: data.latest.systemTime,
            });
            setError(null);
        } catch (err) {
            console.error("Glucose fetch error:", err);
            setError("Connection error");
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchGlucose();
            const interval = setInterval(fetchGlucose, 5 * 60 * 1000);
            return () => clearInterval(interval);
        }, []),
    );

    if (loading) {
        return (
            <ThemedView style={[styles.card, { borderColor }]}>
                <ThemedText type="subtitle">Glucose</ThemedText>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" />
                    <ThemedText style={styles.loadingText}>
                        Fetching glucose data...
                    </ThemedText>
                </View>
            </ThemedView>
        );
    }

    if (error || !reading) {
        return (
            <ThemedView style={[styles.card, { borderColor }]}>
                <ThemedText type="subtitle">Glucose</ThemedText>
                <View style={styles.centered}>
                    <ThemedText style={styles.errorText}>
                        {error || "No data available"}
                    </ThemedText>
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={[styles.card, { borderColor }]}>
            <ThemedText type="subtitle">Glucose</ThemedText>
            <View style={styles.readingRow}>
                <ThemedText
                    style={[
                        styles.glucoseValue,
                        { color: getGlucoseColor(reading.value) },
                    ]}
                >
                    {reading.value}
                </ThemedText>
                <View style={styles.readingMeta}>
                    <ThemedText style={styles.unit}>mg/dL</ThemedText>
                    <ThemedText style={styles.trend}>
                        {getTrendArrow(reading.trend)}{" "}
                        {getTrendLabel(reading.trend)}
                    </ThemedText>
                </View>
            </View>
            <ThemedText style={styles.lastUpdated}>
                Latest reading: {new Date(reading.systemTime).toLocaleString()}
            </ThemedText>
            <View style={[styles.graphPlaceholder, { borderColor }]}>
                <ThemedText style={styles.placeholderText}>
                    12-hour trend graph
                </ThemedText>
            </View>
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
    readingRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 8,
        marginTop: 8,
    },
    glucoseValue: {
        fontSize: 48,
        fontWeight: "bold",
        lineHeight: 52,
    },
    readingMeta: {
        paddingBottom: 6,
    },
    unit: {
        fontSize: 14,
        opacity: 0.7,
    },
    trend: {
        fontSize: 14,
        opacity: 0.7,
    },
    lastUpdated: {
        fontSize: 12,
        opacity: 0.5,
        marginTop: 4,
    },
    centered: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 32,
    },
    loadingText: {
        fontSize: 14,
        opacity: 0.5,
        marginTop: 8,
    },
    errorText: {
        fontSize: 14,
        opacity: 0.6,
    },
    graphPlaceholder: {
        height: 120,
        borderWidth: 1,
        borderRadius: 8,
        borderStyle: "dashed",
        marginTop: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    placeholderText: {
        fontSize: 14,
        opacity: 0.4,
    },
});
