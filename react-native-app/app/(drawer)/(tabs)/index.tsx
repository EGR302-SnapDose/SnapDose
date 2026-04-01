import { GlucoseCard } from "@/components/dashboard/glucose-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentMealsCard } from "@/components/dashboard/recent-meals-card";
import { TreatmentLogCard } from "@/components/dashboard/treatment-log";
import { ThemedView } from "@/components/themed-view";
import { spacing } from "@/constants/theme";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
    const insets = useSafeAreaInsets();

    return (
        <ThemedView style={styles.container}>
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    {
                        paddingBottom: insets.bottom + spacing[10],
                    }
                ]}
                showsVerticalScrollIndicator={false}
            >
                <GlucoseCard />
                <QuickActions />
                <TreatmentLogCard />
                <RecentMealsCard />
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing[5],
        paddingTop: spacing[5],
    },
});