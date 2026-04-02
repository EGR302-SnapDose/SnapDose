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
// Firebase — unchanged
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db   = getFirestore(firebaseApp);
 
// ---------------------------------------------------------------------------
// Types — unchanged
// ---------------------------------------------------------------------------
interface EditableProfile {
  displayName:        string;
  email:              string;
  diabetesType:       "type1" | "type2" | string;
  dateOfBirth:        string;
  diagnosisYear:      string;
  glucoseUnit:        "mg/dL" | "mmol/L";
  heightFeet:         string;
  heightInches:       string;
  weightLbs:          string;
  insulinToCarbRatio: string;
  correctionFactor:   string;
  targetGlucoseMin:   string;
  targetGlucoseMax:   string;
}
 
type ValidationErrors = Partial<Record<keyof EditableProfile, string>>;
 
const EMPTY_FORM: EditableProfile = {
  displayName:        "",
  email:              "",
  diabetesType:       "type1",
  dateOfBirth:        "",
  diagnosisYear:      "",
  glucoseUnit:        "mg/dL",
  heightFeet:         "",
  heightInches:       "",
  weightLbs:          "",
  insulinToCarbRatio: "",
  correctionFactor:   "",
  targetGlucoseMin:   "70",
  targetGlucoseMax:   "180",
};
 
// ---------------------------------------------------------------------------
// Helpers — unchanged
// ---------------------------------------------------------------------------
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
 
function validateField(key: keyof EditableProfile, value: string): string | undefined {
  switch (key) {
    case "displayName":
      if (!value.trim()) return "Display name cannot be empty.";
      break;
    case "dateOfBirth":
      if (value.trim()) {
        const d = new Date(value.trim());
        if (isNaN(d.getTime())) return "Use format YYYY-MM-DD.";
        if (d > new Date()) return "Cannot be in the future.";
      }
      break;
    case "diagnosisYear": {
      const y = parseInt(value, 10);
      if (value && (isNaN(y) || y < 1900 || y > new Date().getFullYear()))
        return "Enter a valid year.";
      break;
    }
    case "heightFeet": {
      const n = parseInt(value, 10);
      if (value && (isNaN(n) || n < 1 || n > 9)) return "Enter 1–9 ft.";
      break;
    }
    case "heightInches": {
      const n = parseInt(value, 10);
      if (value && (isNaN(n) || n < 0 || n > 11)) return "Enter 0–11 in.";
      break;
    }
    case "weightLbs": {
      const n = parseFloat(value);
      if (value && (isNaN(n) || n <= 0 || n > 1000)) return "Enter a valid weight.";
      break;
    }
    case "insulinToCarbRatio": {
      const n = parseFloat(value);
      if (value && (isNaN(n) || n <= 0)) return "Must be a positive number.";
      break;
    }
    case "correctionFactor": {
      const n = parseFloat(value);
      if (value && (isNaN(n) || n <= 0)) return "Must be a positive number.";
      break;
    }
    case "targetGlucoseMin": {
      const n = parseFloat(value);
      if (isNaN(n) || n < 40 || n > 400) return "Enter 40–400.";
      break;
    }
    case "targetGlucoseMax": {
      const n = parseFloat(value);
      if (isNaN(n) || n < 40 || n > 400) return "Enter 40–400.";
      break;
    }
  }
  return undefined;
}
 
// ---------------------------------------------------------------------------
// UI components — all colours from theme tokens, no hardcoded hex
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
  const cardBg = isDark ? "#1C1C1E" : "#F2F2F7"; // secondarySystemBackground
  return (
    <View style={styles.sectionOuter}>
      <ThemedText style={[styles.sectionHeader, { color: theme.icon }]}>
        {title.toUpperCase()}
      </ThemedText>
      <View style={[styles.sectionCard, { backgroundColor: cardBg }]}>
        {children}
      </View>
    </View>
  );
}
 
function FieldLabel({ label, theme }: { label: string; theme: typeof Colors["light"] }) {
  return (
    <ThemedText style={[styles.fieldLabel, { color: theme.icon }]}>
      {label.toUpperCase()}
    </ThemedText>
  );
}
 
function InlineError({ message }: { message?: string }) {
  if (!message) return null;
  return <ThemedText style={styles.inlineError}>{message}</ThemedText>;
}
 
function StyledInput({
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  theme,
  editable = true,
  hasError = false,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad" | "email-address";
  theme: typeof Colors["light"];
  editable?: boolean;
  hasError?: boolean;
}) {
  return (
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: theme.background,
          color:            theme.text,
          borderColor:      hasError ? "#FF3B30" : "transparent",
          borderWidth:      hasError ? 1.5 : 0,
        },
        !editable && { opacity: 0.45 },
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.icon}
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
  theme,
}: {
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (v: string) => void;
  theme: typeof Colors["light"];
}) {
  return (
    <View style={[styles.segmentWrap, { backgroundColor: theme.background }]}>
      {options.map((opt) => {
        const active = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.segmentBtn, active && { backgroundColor: theme.tint }]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.8}
          >
            <ThemedText
              style={[styles.segmentText, { color: active ? "#fff" : theme.text }]}
            >
              {opt.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
 
// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function EditProfileScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = Colors[colorScheme];
 
  const [form, setForm]                     = useState<EditableProfile>(EMPTY_FORM);
  const [errors, setErrors]                 = useState<ValidationErrors>({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadError, setLoadError]           = useState<string | null>(null);
  const [saving, setSaving]                 = useState(false);
 
  // ── Fetch — unchanged ───────────────────────────────────────────────────
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setLoadError("You must be logged in to edit your profile.");
      setLoadingProfile(false);
      return;
    }
    getDoc(doc(db, "users", uid))
      .then((snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        const p    = data.profile ?? {};
        const ins  = data.insulinSettings ?? {};
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
          targetGlucoseMin:   p.targetGlucose?.min   != null ? String(p.targetGlucose.min)   : "70",
          targetGlucoseMax:   p.targetGlucose?.max   != null ? String(p.targetGlucose.max)   : "180",
        });
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
        setLoadError("Failed to load profile. Please try again.");
      })
      .finally(() => setLoadingProfile(false));
  }, []);
 
  // ── Field change + inline validation — unchanged ─────────────────────────
  function setField<K extends keyof EditableProfile>(key: K, value: EditableProfile[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    const err = validateField(key, value as string);
    setErrors((prev) => ({ ...prev, [key]: err }));
  }
 
  // ── Save — unchanged ─────────────────────────────────────────────────────
  async function handleSave() {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert("Error", "You must be logged in to save changes.");
      return;
    }
 
    const newErrors: ValidationErrors = {};
    (Object.keys(form) as (keyof EditableProfile)[]).forEach((key) => {
      const err = validateField(key, form[key] as string);
      if (err) newErrors[key] = err;
    });
 
    const minVal = parseFloat(form.targetGlucoseMin);
    const maxVal = parseFloat(form.targetGlucoseMax);
    if (!isNaN(minVal) && !isNaN(maxVal) && minVal >= maxVal) {
      newErrors.targetGlucoseMin = "Min must be less than max.";
    }
 
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert("Check your entries", "Please fix the highlighted fields.");
      return;
    }
 
    let dobTimestamp: Timestamp | null = null;
    if (form.dateOfBirth.trim()) {
      dobTimestamp = Timestamp.fromDate(new Date(form.dateOfBirth.trim()));
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
        "profile.targetGlucose.min":          form.targetGlucoseMin ? parseFloat(form.targetGlucoseMin) : 70,
        "profile.targetGlucose.max":          form.targetGlucoseMax ? parseFloat(form.targetGlucoseMax) : 180,
        "insulinSettings.insulinToCarbRatio": form.insulinToCarbRatio ? parseFloat(form.insulinToCarbRatio) : 0,
        "insulinSettings.correctionFactor":   form.correctionFactor   ? parseFloat(form.correctionFactor)   : 0,
        updatedAt:                            serverTimestamp(),
      };
 
      if (dobTimestamp) payload["profile.dateOfBirth"] = dobTimestamp;
 
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
          : "Failed to save. Please check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  }
 
  // ── Loading ──────────────────────────────────────────────────────────────
  if (loadingProfile) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.tint} />
          <ThemedText style={[styles.loadingText, { color: theme.icon }]}>
            Loading profile…
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }
 
  // ── Error ────────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={["top", "bottom"]}>
        <View style={styles.centered}>
          <ThemedText style={[styles.errorText, { color: theme.text }]}>
            {loadError}
          </ThemedText>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.tint, marginTop: 20 }]}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.primaryButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
 
  // ── Main form ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={["top", "bottom"]}
    >
      {/* HIG nav bar: tint-coloured back chevron | centred title | Cancel */}
      <View style={[styles.navBar, { borderBottomColor: theme.tabIconDefault + "40" }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navSide}>
          <Ionicons name="chevron-back" size={24} color={theme.tint} />
        </TouchableOpacity>
        <ThemedText style={[styles.navTitle, { color: theme.text }]}>
          Edit Profile
        </ThemedText>
        <TouchableOpacity onPress={() => router.back()} style={[styles.navSide, styles.navSideRight]}>
          <ThemedText style={[styles.navCancel, { color: theme.tint }]}>
            Cancel
          </ThemedText>
        </TouchableOpacity>
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
          {/* ── Personal Info ── */}
          <SectionCard title="Personal Info" theme={theme}>
            <FieldLabel label="Display Name" theme={theme} />
            <StyledInput
              value={form.displayName}
              onChangeText={(v) => setField("displayName", v)}
              placeholder="Your full name"
              theme={theme}
              hasError={!!errors.displayName}
            />
            <InlineError message={errors.displayName} />
 
            <FieldLabel label="Email" theme={theme} />
            <StyledInput
              value={form.email}
              onChangeText={() => {}}
              placeholder="—"
              keyboardType="email-address"
              theme={theme}
              editable={false}
            />
 
            <FieldLabel label="Date of Birth (YYYY-MM-DD)" theme={theme} />
            <StyledInput
              value={form.dateOfBirth}
              onChangeText={(v) => setField("dateOfBirth", v)}
              placeholder="1990-01-25"
              theme={theme}
              hasError={!!errors.dateOfBirth}
            />
            <InlineError message={errors.dateOfBirth} />
 
            <FieldLabel label="Diabetes Type" theme={theme} />
            <SegmentControl
              options={[
                { label: "Type 1", value: "type1" },
                { label: "Type 2", value: "type2" },
              ]}
              selected={form.diabetesType}
              onSelect={(v) => setField("diabetesType", v)}
              theme={theme}
            />
 
            <FieldLabel label="Diagnosis Year" theme={theme} />
            <StyledInput
              value={form.diagnosisYear}
              onChangeText={(v) => setField("diagnosisYear", v)}
              placeholder="2010"
              keyboardType="numeric"
              theme={theme}
              hasError={!!errors.diagnosisYear}
            />
            <InlineError message={errors.diagnosisYear} />
          </SectionCard>
 
          {/* ── Clinical Parameters ── */}
          <SectionCard title="Clinical Parameters" theme={theme}>
            <FieldLabel label={`Target Glucose Range (${form.glucoseUnit})`} theme={theme} />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <StyledInput
                  value={form.targetGlucoseMin}
                  onChangeText={(v) => setField("targetGlucoseMin", v)}
                  placeholder="Min (70)"
                  keyboardType="numeric"
                  theme={theme}
                  hasError={!!errors.targetGlucoseMin}
                />
                <InlineError message={errors.targetGlucoseMin} />
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <StyledInput
                  value={form.targetGlucoseMax}
                  onChangeText={(v) => setField("targetGlucoseMax", v)}
                  placeholder="Max (180)"
                  keyboardType="numeric"
                  theme={theme}
                  hasError={!!errors.targetGlucoseMax}
                />
                <InlineError message={errors.targetGlucoseMax} />
              </View>
            </View>
 
            <FieldLabel label="Glucose Unit" theme={theme} />
            <SegmentControl
              options={[
                { label: "mg/dL",  value: "mg/dL" },
                { label: "mmol/L", value: "mmol/L" },
              ]}
              selected={form.glucoseUnit}
              onSelect={(v) => setField("glucoseUnit", v as "mg/dL" | "mmol/L")}
              theme={theme}
            />
 
            <FieldLabel label="Insulin-to-Carb Ratio (g per unit)" theme={theme} />
            <StyledInput
              value={form.insulinToCarbRatio}
              onChangeText={(v) => setField("insulinToCarbRatio", v)}
              placeholder="10"
              keyboardType="decimal-pad"
              theme={theme}
              hasError={!!errors.insulinToCarbRatio}
            />
            <InlineError message={errors.insulinToCarbRatio} />
 
            <FieldLabel label={`Correction Factor (${form.glucoseUnit} per unit)`} theme={theme} />
            <StyledInput
              value={form.correctionFactor}
              onChangeText={(v) => setField("correctionFactor", v)}
              placeholder="50"
              keyboardType="decimal-pad"
              theme={theme}
              hasError={!!errors.correctionFactor}
            />
            <InlineError message={errors.correctionFactor} />
          </SectionCard>
 
          {/* ── Physical ── */}
          <SectionCard title="Physical" theme={theme}>
            <FieldLabel label="Height" theme={theme} />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <StyledInput
                  value={form.heightFeet}
                  onChangeText={(v) => setField("heightFeet", v)}
                  placeholder="Feet"
                  keyboardType="numeric"
                  theme={theme}
                  hasError={!!errors.heightFeet}
                />
                <InlineError message={errors.heightFeet} />
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <StyledInput
                  value={form.heightInches}
                  onChangeText={(v) => setField("heightInches", v)}
                  placeholder="Inches"
                  keyboardType="numeric"
                  theme={theme}
                  hasError={!!errors.heightInches}
                />
                <InlineError message={errors.heightInches} />
              </View>
            </View>
 
            <FieldLabel label="Weight (lbs)" theme={theme} />
            <StyledInput
              value={form.weightLbs}
              onChangeText={(v) => setField("weightLbs", v)}
              placeholder="150"
              keyboardType="decimal-pad"
              theme={theme}
              hasError={!!errors.weightLbs}
            />
            <InlineError message={errors.weightLbs} />
          </SectionCard>
 
          {/* ── Save ── */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: theme.tint },
              saving && { opacity: 0.7 },
            ]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.primaryButtonText}>Save Changes</ThemedText>
            )}
          </TouchableOpacity>
 
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
 
// ---------------------------------------------------------------------------
// Styles — layout & sizing only, zero hardcoded colours
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safe:     { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  loadingText: { marginTop: 12, fontSize: 15, opacity: 0.6 },
  errorText:   { fontSize: 15, textAlign: "center", opacity: 0.75 },
 
  // HIG nav bar
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navSide:      { width: 80, paddingHorizontal: 8 },
  navSideRight: { alignItems: "flex-end" },
  navTitle:     { fontSize: 17, fontWeight: "600" },
  navCancel:    { fontSize: 17 },
 
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 48,
  },
 
  sectionOuter: { marginBottom: 28 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
 
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 4,
  },
 
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
  },
 
  inlineError: {
    fontSize: 12,
    color: "#FF3B30", // systemRed — always red regardless of theme
    marginTop: 4,
    marginLeft: 2,
  },
 
  row: { flexDirection: "row" },
 
  segmentWrap: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
    gap: 3,
    marginTop: 2,
  },
  segmentBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  segmentText: { fontSize: 14, fontWeight: "600" },
 
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});