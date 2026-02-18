import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");
const CARD_SIZE = (width - 48) / 2;

// ─── Types ────────────────────────────────────────────────────────────────────
interface MealPlaceholder {
    id: string;
}

// ─── Placeholder Meal Card ────────────────────────────────────────────────────
const PlaceholderCard = () => (
    <View style={styles.card}>
        <View style={styles.cardImage}>
            <View style={styles.imagePlaceholderIcon}>
                <View style={styles.imagePlaceholderInner} />
                <View style={styles.imagePlaceholderCorner} />
            </View>
        </View>
        <View style={styles.cardFooter}>
            <Text style={styles.cardTitle}>Meal photo</Text>
            <View style={styles.cardMeta}>
                <Text style={styles.cardCarbs}>0g carbs</Text>
                <Text style={styles.cardCal}>— cal</Text>
            </View>
            <Text style={styles.cardTime}>--:-- --</Text>
        </View>
    </View>
);

// ─── Food Log Screen ──────────────────────────────────────────────────────────
const FoodLogScreen = () => {
    const placeholderMeals: MealPlaceholder[] = [
        { id: "1" },
        { id: "2" },
        { id: "3" },
        { id: "4" },
    ];

    return (
        <ScrollView
            style={styles.root}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* ── Weekly Summary ── */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryTrend}>↗</Text>
                    <Text style={styles.summaryHeading}>Weekly Summary</Text>
                </View>
                <View style={styles.summaryStats}>
                    <View>
                        <Text style={styles.summaryNumber}>0</Text>
                        <Text style={styles.summaryLabel}>Meals</Text>
                    </View>
                    <View style={styles.summarySpacer} />
                    <View style={{ alignItems: "center" }}>
                        <Text style={styles.summaryLabel}>Carbs</Text>
                    </View>
                    <View style={styles.summarySpacer} />
                    <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.summaryNumber}>0</Text>
                        <Text style={styles.summaryLabel}>Calories</Text>
                    </View>
                </View>
            </View>

            {/* ── Today ── */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>⊟</Text>
                <Text style={styles.sectionTitle}>TODAY</Text>
            </View>

            {/* ── Placeholder Grid ── */}
            <View style={styles.grid}>
                {placeholderMeals.map((meal) => (
                    <PlaceholderCard key={meal.id} />
                ))}
            </View>

            {/* ── Empty State ── */}
            <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}></Text>
                <Text style={styles.emptyTitle}>No meals logged yet</Text>
                <Text style={styles.emptySubtitle}>
                    Tap the Scan button to log your first meal. Your past meals
                    will appear here.
                </Text>
            </View>
        </ScrollView>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#111111",
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 32,
    },

    // Summary card
    summaryCard: {
        backgroundColor: "#1e1e1e",
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    summaryRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    summaryTrend: {
        fontSize: 16,
        color: "#ffffff",
        marginRight: 8,
    },
    summaryHeading: {
        fontSize: 16,
        fontWeight: "700",
        color: "#ffffff",
    },
    summaryStats: {
        flexDirection: "row",
        alignItems: "flex-end",
    },
    summaryNumber: {
        fontSize: 36,
        fontWeight: "700",
        color: "#ffffff",
        lineHeight: 42,
    },
    summaryLabel: {
        fontSize: 13,
        color: "#888888",
        marginTop: 2,
    },
    summarySpacer: {
        flex: 1,
    },

    // Section header
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
    },
    sectionIcon: {
        fontSize: 14,
        color: "#888888",
        marginRight: 6,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "700",
        color: "#888888",
        letterSpacing: 1.5,
    },

    // Grid
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    card: {
        width: CARD_SIZE,
        backgroundColor: "#1e1e1e",
        borderRadius: 16,
        marginBottom: 16,
        overflow: "hidden",
    },
    cardImage: {
        width: "100%",
        height: CARD_SIZE,
        backgroundColor: "#252525",
        alignItems: "center",
        justifyContent: "center",
    },
    imagePlaceholderIcon: {
        width: 40,
        height: 40,
        borderWidth: 2,
        borderColor: "#444444",
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
    },
    imagePlaceholderInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: "#444444",
        marginBottom: 2,
    },
    imagePlaceholderCorner: {
        position: "absolute",
        bottom: 6,
        left: 4,
        right: 4,
        height: 1.5,
        backgroundColor: "#444444",
        borderRadius: 1,
    },
    cardFooter: {
        padding: 12,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#ffffff",
        marginBottom: 4,
    },
    cardMeta: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    cardCarbs: {
        fontSize: 13,
        fontWeight: "600",
        color: "#ffffff",
    },
    cardCal: {
        fontSize: 13,
        color: "#888888",
    },
    cardTime: {
        fontSize: 12,
        color: "#555555",
        marginTop: 3,
    },

    // Empty state
    emptyState: {
        alignItems: "center",
        paddingVertical: 32,
        paddingHorizontal: 24,
    },
    emptyIcon: {
        fontSize: 40,
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#ffffff",
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: "#666666",
        textAlign: "center",
        lineHeight: 21,
    },
});

export default FoodLogScreen;
