import React from "react";
import { View, ScrollView, StyleSheet, Dimensions } from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";

const { width } = Dimensions.get("window");
const CARD_SIZE = (width - 48) / 2;

interface MealPlaceholder {
    id: string;
}

const PlaceholderCard = () => {
    const cardBg = useThemeColor(
        { light: "#F2F2F2", dark: "#1e1e1e" },
        "background",
    );
    const imageBg = useThemeColor(
        { light: "#E0E0E0", dark: "#252525" },
        "background",
    );
    const borderColor = useThemeColor(
        { light: "#CCCCCC", dark: "#444444" },
        "icon",
    );
    const mutedColor = useThemeColor(
        { light: "#888888", dark: "#888888" },
        "icon",
    );
    const subtleColor = useThemeColor(
        { light: "#AAAAAA", dark: "#555555" },
        "icon",
    );

    return (
        <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={[styles.cardImage, { backgroundColor: imageBg }]}>
                <View style={[styles.imagePlaceholderIcon, { borderColor }]}>
                    <View
                        style={[styles.imagePlaceholderInner, { borderColor }]}
                    />
                    <View
                        style={[
                            styles.imagePlaceholderCorner,
                            { backgroundColor: borderColor },
                        ]}
                    />
                </View>
            </View>
            <View style={styles.cardFooter}>
                <ThemedText style={styles.cardTitle}>Meal photo</ThemedText>
                <View style={styles.cardMeta}>
                    <ThemedText style={styles.cardCarbs}>0g carbs</ThemedText>
                    <ThemedText style={[styles.cardCal, { color: mutedColor }]}>
                        — cal
                    </ThemedText>
                </View>
                <ThemedText style={[styles.cardTime, { color: subtleColor }]}>
                    --:-- --
                </ThemedText>
            </View>
        </View>
    );
};

const FoodLogScreen = () => {
    const summaryCardBg = useThemeColor(
        { light: "#F2F2F2", dark: "#1e1e1e" },
        "background",
    );
    const mutedColor = useThemeColor(
        { light: "#888888", dark: "#888888" },
        "icon",
    );
    const subtleColor = useThemeColor(
        { light: "#AAAAAA", dark: "#666666" },
        "icon",
    );

    const placeholderMeals: MealPlaceholder[] = [
        { id: "1" },
        { id: "2" },
        { id: "3" },
        { id: "4" },
    ];

    return (
        <ThemedView style={styles.root}>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View
                    style={[
                        styles.summaryCard,
                        { backgroundColor: summaryCardBg },
                    ]}
                >
                    <View style={styles.summaryRow}>
                        <ThemedText style={styles.summaryTrend}>↗</ThemedText>
                        <ThemedText style={styles.summaryHeading}>
                            Weekly Summary
                        </ThemedText>
                    </View>
                    <View style={styles.summaryStats}>
                        <View>
                            <ThemedText style={styles.summaryNumber}>
                                0
                            </ThemedText>
                            <ThemedText
                                style={[
                                    styles.summaryLabel,
                                    { color: mutedColor },
                                ]}
                            >
                                Meals
                            </ThemedText>
                        </View>
                        <View style={styles.summarySpacer} />
                        <View style={{ alignItems: "center" }}>
                            <ThemedText
                                style={[
                                    styles.summaryLabel,
                                    { color: mutedColor },
                                ]}
                            >
                                Carbs
                            </ThemedText>
                        </View>
                        <View style={styles.summarySpacer} />
                        <View style={{ alignItems: "flex-end" }}>
                            <ThemedText style={styles.summaryNumber}>
                                0
                            </ThemedText>
                            <ThemedText
                                style={[
                                    styles.summaryLabel,
                                    { color: mutedColor },
                                ]}
                            >
                                Calories
                            </ThemedText>
                        </View>
                    </View>
                </View>

                <View style={styles.sectionHeader}>
                    <ThemedText
                        style={[styles.sectionIcon, { color: mutedColor }]}
                    >
                        ⊟
                    </ThemedText>
                    <ThemedText
                        style={[styles.sectionTitle, { color: mutedColor }]}
                    >
                        TODAY
                    </ThemedText>
                </View>

                <View style={styles.grid}>
                    {placeholderMeals.map((meal) => (
                        <PlaceholderCard key={meal.id} />
                    ))}
                </View>

                <View style={styles.emptyState}>
                    <ThemedText style={styles.emptyTitle}>
                        No meals logged yet
                    </ThemedText>
                    <ThemedText
                        style={[styles.emptySubtitle, { color: subtleColor }]}
                    >
                        Tap the Scan button to log your first meal. Your past
                        meals will appear here.
                    </ThemedText>
                </View>
            </ScrollView>
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 32,
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
    summaryTrend: {
        fontSize: 16,
        marginRight: 8,
    },
    summaryHeading: {
        fontSize: 16,
        fontWeight: "700",
    },
    summaryStats: {
        flexDirection: "row",
        alignItems: "flex-end",
    },
    summaryNumber: {
        fontSize: 36,
        fontWeight: "700",
        lineHeight: 42,
    },
    summaryLabel: {
        fontSize: 13,
        marginTop: 2,
    },
    summarySpacer: {
        flex: 1,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
    },
    sectionIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 1.5,
    },
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
    cardFooter: {
        padding: 12,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: "700",
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
    },
    cardCal: {
        fontSize: 13,
    },
    cardTime: {
        fontSize: 12,
        marginTop: 3,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 32,
        paddingHorizontal: 24,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: "700",
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: "center",
        lineHeight: 21,
    },
});

export default FoodLogScreen;
