import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function SectionCard({
  title,
  children,
  cardBg,
}: {
  title: string;
  children: React.ReactNode;
  cardBg: string;
}) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: cardBg }]}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      {children}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  isLast,
  rowBg,
  shrinkValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isLast?: boolean;
  rowBg: string;
  shrinkValue?: boolean;
}) {
  return (
    <>
      <View style={[styles.infoRow, { backgroundColor: rowBg }]}>
        <View style={styles.infoLeft}>
          <View style={styles.infoIconWrap}>{icon}</View>
          <ThemedText style={styles.infoLabel}>{label}</ThemedText>
        </View>
        <ThemedText
          style={[styles.infoValue, shrinkValue && styles.infoValueShrink]}
          numberOfLines={1}
          adjustsFontSizeToFit={shrinkValue}
          minimumFontScale={0.85}
        >
          {value}
        </ThemedText>
      </View>
      {!isLast && <View style={styles.rowGap} />}
    </>
  );
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const theme = Colors[colorScheme];

  const cardBg = colorScheme === "dark" ? "#1c1c1c" : "#f2f2f2";
  const rowBg = colorScheme === "dark" ? "#2a2a2a" : "#e8e8e8";
  const avatarBg = colorScheme === "dark" ? "#2e1a1a" : "#fde8e8";
  const iconColor = colorScheme === "dark" ? "#8a8a8a" : "#888";
  const accentRed = "#e84040";

  const displayName = "DISPLAY_NAME";
  const initials = "DN";
  const diabetesType = "DIABETES_TYPE";
  const age = "AGE";
  const weightLbs = "WEIGHT";
  const heightStr = "HEIGHT";
  const glucoseUnit = "mg/dL";
  const carbRatio = "CARB_RATIO";
  const correctionFactor = "CORRECTION_FACTOR";
  const email = "EMAIL";
  const diagnosisYear = "DIAGNOSIS_YEAR";

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={["bottom"]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.profileCard, { backgroundColor: cardBg }]}>
          <View style={[styles.avatarWrap, { backgroundColor: avatarBg }]}>
            <ThemedText style={[styles.avatarInitials, { color: accentRed }]}>
              {initials}
            </ThemedText>
          </View>

          <ThemedText style={styles.profileName}>{displayName}</ThemedText>
          <ThemedText style={[styles.profileSub, { color: theme.icon }]}>
            {diabetesType}
          </ThemedText>

          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: accentRed }]}
            onPress={() => router.push("/edit-profile" as any)}
            activeOpacity={0.85}
          >
            <ThemedText style={styles.editButtonText}>Edit Profile</ThemedText>
          </TouchableOpacity>
        </View>

        <SectionCard title="Basic Information" cardBg={cardBg}>
          <InfoRow
            icon={<Ionicons name="calendar-outline" size={18} color={iconColor} />}
            label="Age"
            value={`${age} years`}
            rowBg={rowBg}
          />
          <InfoRow
            icon={<Feather name="shopping-bag" size={18} color={iconColor} />}
            label="Weight"
            value={`${weightLbs} lbs`}
            rowBg={rowBg}
          />
          <InfoRow
            icon={<MaterialCommunityIcons name="human-male-height" size={18} color={iconColor} />}
            label="Height"
            value={heightStr}
            rowBg={rowBg}
            isLast
          />
        </SectionCard>

        <SectionCard title="Target Glucose Range" cardBg={cardBg}>
          <InfoRow
            icon={<MaterialCommunityIcons name="trending-up" size={18} color={iconColor} />}
            label="Maximum"
            value={`180 ${glucoseUnit}`}
            rowBg={rowBg}
          />
          <InfoRow
            icon={<MaterialCommunityIcons name="target" size={18} color={iconColor} />}
            label="Minimum"
            value={`70 ${glucoseUnit}`}
            rowBg={rowBg}
            isLast
          />
        </SectionCard>

        <SectionCard title="Insulin Settings" cardBg={cardBg}>
          <InfoRow
            icon={<MaterialCommunityIcons name="pulse" size={18} color={iconColor} />}
            label="Carb Ratio"
            value={carbRatio}
            rowBg={rowBg}
          />
          <InfoRow
            icon={<MaterialCommunityIcons name="pulse" size={18} color={iconColor} />}
            label="Correction Factor"
            value={correctionFactor}
            rowBg={rowBg}
            isLast
          />
        </SectionCard>

        <SectionCard title="Account" cardBg={cardBg}>
          <InfoRow
            icon={<Ionicons name="mail-outline" size={18} color={iconColor} />}
            label="Email"
            value={email}
            rowBg={rowBg}
            shrinkValue
          />
          <InfoRow
            icon={<Ionicons name="calendar-outline" size={18} color={iconColor} />}
            label="Diagnosis Year"
            value={diagnosisYear}
            rowBg={rowBg}
            isLast
          />
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 14,
  },
  profileCard: {
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    gap: 4,
  },
  avatarWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: "700",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
  },
  profileSub: {
    fontSize: 14,
    marginBottom: 4,
  },
  editButton: {
    marginTop: 12,
    width: "100%",
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: "center",
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  sectionCard: {
    borderRadius: 18,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  infoIconWrap: {
    width: 24,
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 15,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  infoValueShrink: {
    flexShrink: 1,
    maxWidth: "70%",
    textAlign: "right",
  },
  rowGap: {
    height: 6,
  },
});