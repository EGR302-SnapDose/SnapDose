import { GlucoseCard } from "@/components/dashboard/glucose-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentMealsCard } from "@/components/dashboard/recent-meals-card";
import { ThemedView } from "@/components/themed-view";
import { ScrollView, StyleSheet } from "react-native";

export default function HomeScreen() {
    return (
        <ThemedView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
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
});