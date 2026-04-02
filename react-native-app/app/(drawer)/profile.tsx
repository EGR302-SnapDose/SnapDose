import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { auth, db } from "@/config/firebase";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
 
// ---------------------------------------------------------------------------
// Types — unchanged
// ---------------------------------------------------------------------------
interface UserProfile {
  displayName: string;
  email: string;
  profile: {
    diabetesType: string;
    dateOfBirth: { toDate: () => Date };
    diagnosisYear: number;
    glucoseUnit: string;
    height: { feet: number; inches: number; cm: number };
    weight: { lbs: number; kg: number };
    insulinUnits: string;
    targetGlucose?: { min: number; max: number };
  };
  insulinSettings: {
    correctionFactor: number;
    insulinToCarbRatio: number;
  };
}
 
// ---------------------------------------------------------------------------
// Helpers — unchanged
// ---------------------------------------------------------------------------
function calcAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}
 
function formatDiabetesType(type: string): string {
  if (type === "type1") return "Type 1 Diabetes";
  if (type === "type2") return "Type 2 Diabetes";
  return type;
}
 
// ---------------------------------------------------------------------------
// HIG Inset Grouped Section
// cardBg  = secondarySystemBackground  (#F2F2F7 light / #1C1C1E dark)
// rowBg   = systemBackground           (#FFFFFF light / #000000 dark)
// ---------------------------------------------------------------------------
function SectionCard({
  title,
  children,
  theme,
}: {
  title: string;
  children: React.ReactNode;
  theme: typeof Colors["light"];
}) {
  const isDark = theme.background === "#000000";
  const cardBg = isDark ? "#1C1C1E" : "#F2F2F7";
 
  return (
    <View style={styles.sectionOuter}>
      {/* HIG uppercase section header above the card */}
      <ThemedText style={[styles.sectionHeader, { color: theme.icon }]}>
        {title.toUpperCase()}
      </ThemedText>
      <View style={[styles.sectionCard, { backgroundColor: cardBg }]}>
        {children}
      </View>
    </View>
  );
}
 
// HIG inset grouped row — separator between rows, not cards
function InfoRow({
  icon,
  label,
  value,
  isLast,
  theme,
  shrinkValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isLast?: boolean;
  theme: typeof Colors["light"];
  shrinkValue?: boolean;
}) {
  return (
    <>
      <View style={[styles.infoRow, { backgroundColor: "transparent" }]}>
        <View style={styles.infoLeft}>
          <View style={styles.infoIconWrap}>{icon}</View>
          <ThemedText style={[styles.infoLabel, { color: theme.text }]}>
            {label}
          </ThemedText>
        </View>
        <ThemedText
          style={[
            styles.infoValue,
            { color: theme.icon },
            shrinkValue && styles.infoValueShrink,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit={shrinkValue}
          minimumFontScale={0.85}
        >
          {value}
        </ThemedText>
      </View>
      {/* HIG hairline separator — not shown after last row */}
      {!isLast && (
        <View
          style={[
            styles.separator,
            { backgroundColor: theme.tabIconDefault + "40" },
          ]}
        />
      )}
    </>
  );
}
 
// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
  const isDark = colorScheme === "dark";
 
  // HIG semantic background layers derived from theme
  const cardBg   = isDark ? "#1C1C1E" : "#F2F2F7"; // secondarySystemBackground
  const avatarBg = isDark ? "#1C1C1E" : "#F2F2F7"; // same layer as card
 
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
 
  // ── Fetch — unchanged ───────────────────────────────────────────────────
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setError("Not logged in.");
      setLoading(false);
      return;
    }
    getDoc(doc(db, "users", uid))
      .then((snap) => {
        if (snap.exists()) {
          setUserData(snap.data() as UserProfile);
        } else {
          setError("Profile not found.");
        }
      })
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);
 
  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={theme.tint} />
      </ThemedView>
    );
  }
 
  if (error || !userData) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>{error ?? "Something went wrong."}</ThemedText>
      </ThemedView>
    );
  }
 
  // ── Derived display values — unchanged ──────────────────────────────────
  const { profile, insulinSettings, displayName } = userData;
  const dob         = profile.dateOfBirth?.toDate?.();
  const age         = dob ? calcAge(dob) : "—";
  const weightLbs   = profile.weight?.lbs ?? "—";
  const heightStr   =
    profile.height?.feet != null
      ? `${profile.height.feet}'${profile.height.inches}"`
      : "—";
  const glucoseUnit       = profile.glucoseUnit ?? "mg/dL";
  const carbRatio         = insulinSettings?.insulinToCarbRatio
    ? `1:${insulinSettings.insulinToCarbRatio}g`
    : "—";
  const correctionFactor  = insulinSettings?.correctionFactor
    ? `${insulinSettings.correctionFactor} ${glucoseUnit}`
    : "—";
  const targetGlucoseMax  = profile.targetGlucose?.max ?? 180;
  const targetGlucoseMin  = profile.targetGlucose?.min ?? 70;
 
  const initials = displayName
    ? displayName
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";
 
  // ── Edit button navigation — unchanged ──────────────────────────────────
  const goToEdit = () =>
    router.push({
      pathname: "/edit-profile" as any,
      params: {
        displayName,
        diabetesType:       profile.diabetesType,
        dateOfBirth:        dob ? dob.toISOString().split("T")[0] : "",
        diagnosisYear:      profile.diagnosisYear ? String(profile.diagnosisYear) : "",
        glucoseUnit:        profile.glucoseUnit ?? "mg/dL",
        heightFeet:         profile.height?.feet   != null ? String(profile.height.feet)   : "",
        heightInches:       profile.height?.inches != null ? String(profile.height.inches) : "",
        weightLbs:          profile.weight?.lbs    != null ? String(profile.weight.lbs)    : "",
        insulinToCarbRatio: insulinSettings?.insulinToCarbRatio ? String(insulinSettings.insulinToCarbRatio) : "",
        correctionFactor:   insulinSettings?.correctionFactor   ? String(insulinSettings.correctionFactor)   : "",
        targetGlucoseMin:   String(targetGlucoseMin),
        targetGlucoseMax:   String(targetGlucoseMax),
      },
    });
 
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
 
        {/* ── Avatar + name hero card ── */}
        <View style={[styles.heroCard, { backgroundColor: cardBg }]}>
          {/* Avatar circle — tint-coloured ring, icon-coloured bg */}
          <View
            style={[
              styles.avatarWrap,
              {
                backgroundColor: avatarBg,
                borderColor: theme.tint,
              },
            ]}
          >
            <ThemedText style={[styles.avatarInitials, { color: theme.tint }]}>
              {initials}
            </ThemedText>
          </View>
 
          <ThemedText style={[styles.profileName, { color: theme.text }]}>
            {displayName}
          </ThemedText>
          <ThemedText style={[styles.profileSub, { color: theme.icon }]}>
            {formatDiabetesType(profile.diabetesType)}
          </ThemedText>
 
          {/* HIG primary button — filled, rounded, tint colour */}
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: theme.tint }]}
            onPress={goToEdit}
            activeOpacity={0.85}
          >
            <ThemedText style={styles.editButtonText}>Edit Profile</ThemedText>
          </TouchableOpacity>
        </View>
 
        {/* ── Basic Information ── */}
        <SectionCard title="Basic Information" theme={theme}>
          <InfoRow
            icon={<Ionicons name="calendar-outline" size={18} color={theme.icon} />}
            label="Age"
            value={`${age} years`}
            theme={theme}
          />
          <InfoRow
            icon={<Feather name="shopping-bag" size={18} color={theme.icon} />}
            label="Weight"
            value={`${weightLbs} lbs`}
            theme={theme}
          />
          <InfoRow
            icon={<MaterialCommunityIcons name="human-male-height" size={18} color={theme.icon} />}
            label="Height"
            value={heightStr}
            theme={theme}
            isLast
          />
        </SectionCard>
 
        {/* ── Target Glucose Range ── */}
        <SectionCard title="Target Glucose Range" theme={theme}>
          <InfoRow
            icon={<MaterialCommunityIcons name="trending-up" size={18} color={theme.icon} />}
            label="Maximum"
            value={`${targetGlucoseMax} ${glucoseUnit}`}
            theme={theme}
          />
          <InfoRow
            icon={<MaterialCommunityIcons name="target" size={18} color={theme.icon} />}
            label="Minimum"
            value={`${targetGlucoseMin} ${glucoseUnit}`}
            theme={theme}
            isLast
          />
        </SectionCard>
 
        {/* ── Insulin Settings ── */}
        <SectionCard title="Insulin Settings" theme={theme}>
          <InfoRow
            icon={<MaterialCommunityIcons name="pulse" size={18} color={theme.icon} />}
            label="Carb Ratio"
            value={carbRatio}
            theme={theme}
          />
          <InfoRow
            icon={<MaterialCommunityIcons name="pulse" size={18} color={theme.icon} />}
            label="Correction Factor"
            value={correctionFactor}
            theme={theme}
            isLast
          />
        </SectionCard>
 
        {/* ── Account ── */}
        <SectionCard title="Account" theme={theme}>
          <InfoRow
            icon={<Ionicons name="mail-outline" size={18} color={theme.icon} />}
            label="Email"
            value={userData.email}
            theme={theme}
            shrinkValue
          />
          <InfoRow
            icon={<Ionicons name="calendar-outline" size={18} color={theme.icon} />}
            label="Diagnosis Year"
            value={`${profile.diagnosisYear}`}
            theme={theme}
            isLast
          />
        </SectionCard>
 
      </ScrollView>
    </SafeAreaView>
  );
}
 
// ---------------------------------------------------------------------------
// Styles — layout & sizing only, zero hardcoded colours
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safe:         { flex: 1 },
  centered:     { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll:       { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 0, // gaps handled by sectionOuter marginTop
  },
 
  // ── Hero card ──
  heroCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 4,
    marginBottom: 32,
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  avatarInitials: { fontSize: 24, fontWeight: "700" },
  profileName:    { fontSize: 20, fontWeight: "700" },
  profileSub:     { fontSize: 14, marginBottom: 4 },
  editButton: {
    marginTop: 14,
    width: "100%",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
 
  // ── Section ──
  sectionOuter:  { marginBottom: 28 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 12,
    overflow: "hidden",
    paddingHorizontal: 16,
  },
 
  // ── Row ──
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
  },
  infoLeft:    { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 0 },
  infoIconWrap:{ width: 24, alignItems: "center" },
  infoLabel:   { fontSize: 16 },
  infoValue:   { fontSize: 16, fontWeight: "500" },
  infoValueShrink: { flexShrink: 1, maxWidth: "55%", textAlign: "right" },
 
  // HIG hairline separator
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 44 },
});
 