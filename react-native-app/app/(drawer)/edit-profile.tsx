import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ---------------------------------------------------------------------------
// Firebase — initialise once, re-use if already initialised
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface EditableProfile {
  displayName: string;
  email: string;
  diabetesType: "type1" | "type2" | string;
  dateOfBirth: string; // "YYYY-MM-DD" while editing
  diagnosisYear: string;
  glucoseUnit: "mg/dL" | "mmol/L";
  heightFeet: string;
  heightInches: string;
  weightLbs: string;
  insulinToCarbRatio: string;
  correctionFactor: string;
}

const EMPTY_FORM: EditableProfile = {
  displayName: "",
  email: "",
  diabetesType: "type1",
  dateOfBirth: "",
  diagnosisYear: "",
  glucoseUnit: "mg/dL",
  heightFeet: "",
  heightInches: "",
  weightLbs: "",
  insulinToCarbRatio: "",
  correctionFactor: "",
};

// Safely converts a Firestore Timestamp (or anything date-like) to "YYYY-MM-DD"
function timestampToISO(ts: unknown): string {
  if (!ts) return "";
  try {
    const date =
      ts instanceof Timestamp
        ? ts.toDate()
        : typeof (ts as any).toDate === "function"
        ? (ts as any).toDate()
        : new Date(ts as any);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Reusable UI pieces
// ---------------------------------------------------------------------------
function FieldLabel({ label }: { label: string }) {
  return <ThemedText style={styles.label}>{label}</ThemedText>;
}

function StyledInput({
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  inputBg,
  textColor,
  editable = true,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad" | "email-address";
  inputBg: string;
  textColor: string;
  editable?: boolean;
}) {
  return (
    <TextInput
      style={[
        styles.input,
        { backgroundColor: inputBg, color: textColor },
        !editable && { opacity: 0.45 },
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#888"
      keyboardType={keyboardType}
      autoCorrect={false}
      autoCapitalize="none"
      editable={editable}
    />
  );
}

function SegmentControl({
  options,
  selected,
  onSelect,
  accentColor,
  pillBg,
  textColor,
}: {
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (v: string) => void;
  accentColor: string;
  pillBg: string;
  textColor: string;
}) {
  return (
    <View style={[styles.segmentWrap, { backgroundColor: pillBg }]}>
      {options.map((opt) => {
        const active = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.segmentBtn, active && { backgroundColor: accentColor }]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.8}
          >
            <ThemedText
              style={[styles.segmentText, { color: active ? "#fff" : textColor }]}
            >
              {opt.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

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

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function EditProfileScreen() {
  const colorScheme = useColorScheme() ?? "dark";
  const theme = Colors[colorScheme];
  const cardBg = colorScheme === "dark" ? "#1c1c1c" : "#f2f2f2";
  const inputBg = colorScheme === "dark" ? "#2a2a2a" : "#e8e8e8";
  const accentRed = "#e84040";

  const [form, setForm] = useState<EditableProfile>(EMPTY_FORM);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Fetch existing profile from Firestore on mount ──────────────────────
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setLoadError("You must be logged in to edit your profile.");
      setLoadingProfile(false);
      return;
    }

    getDoc(doc(db, "users", uid))
      .then((snap) => {
        if (!snap.exists()) {
          // No doc yet — form stays blank so user can fill from scratch
          return;
        }

        const data = snap.data();
        const p = data.profile ?? {};
        const ins = data.insulinSettings ?? {};

        setForm({
          displayName:        data.displayName ?? "",
          email:              data.email ?? auth.currentUser?.email ?? "",
          diabetesType:       p.diabetesType ?? "type1",
          dateOfBirth:        timestampToISO(p.dateOfBirth),
          diagnosisYear:      p.diagnosisYear != null ? String(p.diagnosisYear) : "",
          glucoseUnit:        p.glucoseUnit ?? "mg/dL",
          heightFeet:         p.height?.feet   != null ? String(p.height.feet)   : "",
          heightInches:       p.height?.inches != null ? String(p.height.inches) : "",
          weightLbs:          p.weight?.lbs    != null ? String(p.weight.lbs)    : "",
          insulinToCarbRatio: ins.insulinToCarbRatio != null ? String(ins.insulinToCarbRatio) : "",
          correctionFactor:   ins.correctionFactor   != null ? String(ins.correctionFactor)   : "",
        });
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
        setLoadError("Failed to load profile. Please try again.");
      })
      .finally(() => setLoadingProfile(false));
  }, []);

  function setField<K extends keyof EditableProfile>(key: K, value: EditableProfile[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ── Validate & write back to Firestore ───────────────────────────────────
  async function handleSave() {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert("Error", "You must be logged in to save changes.");
      return;
    }
    if (!form.displayName.trim()) {
      Alert.alert("Validation", "Display name cannot be empty.");
      return;
    }

    let dobTimestamp: Timestamp | null = null;
    if (form.dateOfBirth.trim()) {
      const parsed = new Date(form.dateOfBirth.trim());
      if (isNaN(parsed.getTime())) {
        Alert.alert("Validation", "Date of birth must be YYYY-MM-DD.");
        return;
      }
      if (parsed > new Date()) {
        Alert.alert("Validation", "Date of birth cannot be in the future.");
        return;
      }
      dobTimestamp = Timestamp.fromDate(parsed);
    }

    setSaving(true);
    try {
      const feetNum   = parseInt(form.heightFeet,   10) || 0;
      const inchesNum = parseInt(form.heightInches, 10) || 0;
      const cmNum     = Math.round((feetNum * 12 + inchesNum) * 2.54);
      const lbsNum    = parseFloat(form.weightLbs) || 0;
      const kgNum     = Math.round(lbsNum * 0.453592 * 10) / 10;

      const payload: Record<string, unknown> = {
        displayName:                          form.displayName.trim(),
        "profile.diabetesType":               form.diabetesType,
        "profile.glucoseUnit":                form.glucoseUnit,
        "profile.diagnosisYear":              form.diagnosisYear ? parseInt(form.diagnosisYear, 10) : null,
        "profile.height.feet":                feetNum,
        "profile.height.inches":              inchesNum,
        "profile.height.cm":                  cmNum,
        "profile.weight.lbs":                 lbsNum,
        "profile.weight.kg":                  kgNum,
        "insulinSettings.insulinToCarbRatio": form.insulinToCarbRatio ? parseFloat(form.insulinToCarbRatio) : 0,
        "insulinSettings.correctionFactor":   form.correctionFactor   ? parseFloat(form.correctionFactor)   : 0,
        updatedAt:                            serverTimestamp(),
      };

      if (dobTimestamp) {
        payload["profile.dateOfBirth"] = dobTimestamp;
      }

      await updateDoc(doc(db, "users", uid), payload);
      Alert.alert("Saved", "Your profile has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error("Save error:", err);
      Alert.alert(
        "Error",
        err?.code === "permission-denied"
          ? "Permission denied. Check your Firestore security rules."
          : "Failed to save. Please check your connection and try again."
      );
    } finally {
      setSaving(false);
    }
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loadingProfile) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.background }]}
        edges={["top", "bottom"]}
      >
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={accentRed} />
          <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: theme.background }]}
        edges={["top", "bottom"]}
      >
        <View style={styles.centered}>
          <ThemedText style={styles.errorText}>{loadError}</ThemedText>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: accentRed, marginTop: 20 }]}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.saveButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={["top", "bottom"]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: inputBg }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={colorScheme === "dark" ? "#fff" : "#000"}
          />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Edit Profile</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Personal ── */}
          <SectionCard title="Personal" cardBg={cardBg}>
            <FieldLabel label="Display Name" />
            <StyledInput
              value={form.displayName}
              onChangeText={(v) => setField("displayName", v)}
              placeholder="Your full name"
              inputBg={inputBg}
              textColor={theme.text}
            />

            <FieldLabel label="Email (read-only)" />
            <StyledInput
              value={form.email}
              onChangeText={() => {}}
              placeholder="—"
              keyboardType="email-address"
              inputBg={inputBg}
              textColor={theme.text}
              editable={false}
            />

            <FieldLabel label="Date of Birth (YYYY-MM-DD)" />
            <StyledInput
              value={form.dateOfBirth}
              onChangeText={(v) => setField("dateOfBirth", v)}
              placeholder="1990-01-25"
              inputBg={inputBg}
              textColor={theme.text}
            />

            <FieldLabel label="Diabetes Type" />
            <SegmentControl
              options={[
                { label: "Type 1", value: "type1" },
                { label: "Type 2", value: "type2" },
              ]}
              selected={form.diabetesType}
              onSelect={(v) => setField("diabetesType", v)}
              accentColor={accentRed}
              pillBg={inputBg}
              textColor={theme.text}
            />

            <FieldLabel label="Diagnosis Year" />
            <StyledInput
              value={form.diagnosisYear}
              onChangeText={(v) => setField("diagnosisYear", v)}
              placeholder="2010"
              keyboardType="numeric"
              inputBg={inputBg}
              textColor={theme.text}
            />
          </SectionCard>

          {/* ── Physical ── */}
          <SectionCard title="Physical" cardBg={cardBg}>
            <FieldLabel label="Height" />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <StyledInput
                  value={form.heightFeet}
                  onChangeText={(v) => setField("heightFeet", v)}
                  placeholder="Feet"
                  keyboardType="numeric"
                  inputBg={inputBg}
                  textColor={theme.text}
                />
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <StyledInput
                  value={form.heightInches}
                  onChangeText={(v) => setField("heightInches", v)}
                  placeholder="Inches"
                  keyboardType="numeric"
                  inputBg={inputBg}
                  textColor={theme.text}
                />
              </View>
            </View>

            <FieldLabel label="Weight (lbs)" />
            <StyledInput
              value={form.weightLbs}
              onChangeText={(v) => setField("weightLbs", v)}
              placeholder="150"
              keyboardType="decimal-pad"
              inputBg={inputBg}
              textColor={theme.text}
            />
          </SectionCard>

          {/* ── Glucose ── */}
          <SectionCard title="Glucose" cardBg={cardBg}>
            <FieldLabel label="Glucose Unit" />
            <SegmentControl
              options={[
                { label: "mg/dL", value: "mg/dL" },
                { label: "mmol/L", value: "mmol/L" },
              ]}
              selected={form.glucoseUnit}
              onSelect={(v) => setField("glucoseUnit", v as "mg/dL" | "mmol/L")}
              accentColor={accentRed}
              pillBg={inputBg}
              textColor={theme.text}
            />
          </SectionCard>

          {/* ── Insulin Settings ── */}
          <SectionCard title="Insulin Settings" cardBg={cardBg}>
            <FieldLabel label="Insulin-to-Carb Ratio (g carbs per unit)" />
            <StyledInput
              value={form.insulinToCarbRatio}
              onChangeText={(v) => setField("insulinToCarbRatio", v)}
              placeholder="10"
              keyboardType="decimal-pad"
              inputBg={inputBg}
              textColor={theme.text}
            />

            <FieldLabel label={`Correction Factor (${form.glucoseUnit} drop per unit)`} />
            <StyledInput
              value={form.correctionFactor}
              onChangeText={(v) => setField("correctionFactor", v)}
              placeholder="50"
              keyboardType="decimal-pad"
              inputBg={inputBg}
              textColor={theme.text}
            />
          </SectionCard>

          {/* ── Save ── */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: accentRed },
              saving && { opacity: 0.7 },
            ]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    opacity: 0.6,
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
    opacity: 0.75,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
    gap: 14,
  },
  sectionCard: {
    borderRadius: 18,
    padding: 16,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    opacity: 0.6,
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  row: { flexDirection: "row" },
  segmentWrap: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: "center",
  },
  segmentText: { fontSize: 14, fontWeight: "600" },
  saveButton: {
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});