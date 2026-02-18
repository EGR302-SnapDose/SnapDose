import { GlucoseCard } from "@/components/dashboard/glucose-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentMealsCard } from "@/components/dashboard/recent-meals-card";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
    const insets = useSafeAreaInsets();

    return (
        <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <ThemedText type="title" style={styles.header}>
                    SnapDose
                </ThemedText>
                <GlucoseCard />
                <RecentMealsCard />
                <QuickActions />
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 20,
    },
});
