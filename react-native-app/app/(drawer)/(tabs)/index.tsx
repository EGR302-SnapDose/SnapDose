import { GlucoseCard } from "@/components/dashboard/glucose-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentMealsCard } from "@/components/dashboard/recent-meals-card";
import { TreatmentLogCard } from "@/components/dashboard/treatment-log";
import { auth } from "@/config/firebase";
import { colors, layout, spacing, textStyles } from "@/constants/theme";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

function GreetingHeader() {
  const [firstName, setFirstName] = useState("");

  useEffect(() => {
    const name = auth.currentUser?.displayName;
    if (name) setFirstName(name.split(" ")[0]);
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <View style={styles.greeting}>
      <Text style={styles.greetingText}>
        {greeting}{firstName ? `, ${firstName}` : ""}
      </Text>
      <Text style={styles.greetingDate}>
        {new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <GreetingHeader />
      <GlucoseCard />
      <QuickActions />
      <TreatmentLogCard />
      <RecentMealsCard />
      <View style={{ height: layout.tabBarHeight + spacing[4] }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing[2],
    gap: spacing[3],
  },
  greeting: {
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: spacing[3],
    paddingBottom: spacing[1],
    gap: 2,
  },
  greetingText: {
    ...textStyles.title1Bold,
    color: colors.textPrimary,
  },
  greetingDate: {
    ...textStyles.subheadline,
    color: colors.textSecondary,
  },
});
