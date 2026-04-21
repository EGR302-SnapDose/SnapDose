import { ThemedText } from "@/components/themed-text";
import { useThemeColors, type ThemeColors } from "@/hooks/use-theme-colors";
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
import { useEffect, useMemo, useState } from "react";
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
  targetGlucoseMin: string;
  targetGlucoseMax: string;
  accentColor: string;
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
  targetGlucoseMin: "70",
  targetGlucoseMax: "180",
  accentColor: "#EF4444",
};

const ACCENT_COLORS = [
  '#EF4444', '#3B82F6', '#A855F7',
  '#10B981', '#F59E0B', '#EC4899',
];

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

// Sub-components are defined inside `EditProfileScreen` below so they can
// close over theme-aware `styles` / `colors` without prop-drilling.

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function EditProfileScreen() {
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const cardBg = c.surfaceSubtle;
  const inputBg = c.inputBackground;
  const textColor = c.textPrimary;
  const placeholderColor = c.inputPlaceholder;
  const accentRed = c.danger;

  // Theme-aware local sub-components (close over `styles`/`c`).
  const FieldLabel = ({ label }: { label: string }) => (
    <ThemedText style={styles.label}>{label}</ThemedText>
  );

  const StyledInput = ({
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
    editable = true,
  }: {
    value: string;
    onChangeText: (t: string) => void;
    placeholder?: string;
    keyboardType?: "default" | "numeric" | "decimal-pad" | "email-address";
    editable?: boolean;
  }) => (
    <TextInput
      style={[
        styles.input,
        { backgroundColor: inputBg, color: textColor },
        !editable && { opacity: 0.45 },
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={placeholderColor}
      keyboardType={keyboardType}
      autoCorrect={false}
      autoCapitalize="none"
      editable={editable}
    />
  );

  const SegmentControl = ({
    options,
    selected,
    onSelect,
  }: {
    options: { label: string; value: string }[];
    selected: string;
    onSelect: (v: string) => void;
  }) => (
    <View style={[styles.segmentWrap, { backgroundColor: inputBg }]}>
      {options.map((opt) => {
        const active = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.segmentBtn, active && { backgroundColor: accentRed }]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.8}
          >
            <ThemedText
              style={[
                styles.segmentText,
                { color: active ? "#fff" : textColor },
              ]}
            >
              {opt.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const SectionCard = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View style={[styles.sectionCard, { backgroundColor: cardBg }]}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      {children}
    </View>
  );

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
          targetGlucoseMin:   p.targetGlucose?.min   != null ? String(p.targetGlucose.min)   : "70",
          targetGlucoseMax:   p.targetGlucose?.max   != null ? String(p.targetGlucose.max)   : "180",
          accentColor:        data.accentColor ?? "#EF4444",
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
        accentColor:                          form.accentColor,
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
        style={[styles.safe, { backgroundColor: c.background }]}
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
        style={[styles.safe, { backgroundColor: c.background }]}
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
      style={[styles.safe, { backgroundColor: c.background }]}
      edges={["top", "bottom"]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={c.textPrimary} />
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
          <SectionCard title="Personal">
            <FieldLabel label="Display Name" />
            <StyledInput
              value={form.displayName}
              onChangeText={(v) => setField("displayName", v)}
              placeholder="Your full name"
            />

            <FieldLabel label="Email (read-only)" />
            <StyledInput
              value={form.email}
              onChangeText={() => {}}
              placeholder="—"
              keyboardType="email-address"
              editable={false}
            />

            <FieldLabel label="Date of Birth (YYYY-MM-DD)" />
            <StyledInput
              value={form.dateOfBirth}
              onChangeText={(v) => setField("dateOfBirth", v)}
              placeholder="1990-01-25"
            />

            <FieldLabel label="Diabetes Type" />
            <SegmentControl
              options={[
                { label: "Type 1", value: "type1" },
                { label: "Type 2", value: "type2" },
              ]}
              selected={form.diabetesType}
              onSelect={(v) => setField("diabetesType", v)}
            />

            <FieldLabel label="Diagnosis Year" />
            <StyledInput
              value={form.diagnosisYear}
              onChangeText={(v) => setField("diagnosisYear", v)}
              placeholder="2010"
              keyboardType="numeric"
            />
          </SectionCard>

          {/* ── Appearance ── */}
          <SectionCard title="Appearance">
            <FieldLabel label="Accent Color" />
            <View style={styles.colorGrid}>
              {ACCENT_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    form.accentColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setField("accentColor", color)}
                >
                  {form.accentColor === color && (
                    <Ionicons name="checkmark" size={24} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </SectionCard>

          {/* ── Physical ── */}
          <SectionCard title="Physical">
            <FieldLabel label="Height" />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <StyledInput
                  value={form.heightFeet}
                  onChangeText={(v) => setField("heightFeet", v)}
                  placeholder="Feet"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <StyledInput
                  value={form.heightInches}
                  onChangeText={(v) => setField("heightInches", v)}
                  placeholder="Inches"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <FieldLabel label="Weight (lbs)" />
            <StyledInput
              value={form.weightLbs}
              onChangeText={(v) => setField("weightLbs", v)}
              placeholder="150"
              keyboardType="decimal-pad"
            />
          </SectionCard>

          {/* ── Glucose ── */}
          <SectionCard title="Glucose">
            <FieldLabel label="Glucose Unit" />
            <SegmentControl
              options={[
                { label: "mg/dL", value: "mg/dL" },
                { label: "mmol/L", value: "mmol/L" },
              ]}
              selected={form.glucoseUnit}
              onSelect={(v) => setField("glucoseUnit", v as "mg/dL" | "mmol/L")}
            />

            <FieldLabel label={`Target Glucose Range (${form.glucoseUnit})`} />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <StyledInput
                  value={form.targetGlucoseMin}
                  onChangeText={(v) => setField("targetGlucoseMin", v)}
                  placeholder="Min (70)"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <StyledInput
                  value={form.targetGlucoseMax}
                  onChangeText={(v) => setField("targetGlucoseMax", v)}
                  placeholder="Max (180)"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </SectionCard>

          {/* ── Insulin Settings ── */}
          <SectionCard title="Insulin Settings">
            <FieldLabel label="Insulin-to-Carb Ratio (g carbs per unit)" />
            <StyledInput
              value={form.insulinToCarbRatio}
              onChangeText={(v) => setField("insulinToCarbRatio", v)}
              placeholder="10"
              keyboardType="decimal-pad"
            />

            <FieldLabel label={`Correction Factor (${form.glucoseUnit} drop per unit)`} />
            <StyledInput
              value={form.correctionFactor}
              onChangeText={(v) => setField("correctionFactor", v)}
              placeholder="50"
              keyboardType="decimal-pad"
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
const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
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
      color: c.textSecondary,
    },
    errorText: {
      fontSize: 15,
      textAlign: "center",
      color: c.textSecondary,
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
    headerTitle: { fontSize: 17, fontWeight: "700", color: c.textPrimary },
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
      color: c.textPrimary,
    },
    label: {
      fontSize: 13,
      fontWeight: "500",
      color: c.textSecondary,
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
    colorGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginTop: 8,
    },
    colorOption: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 3,
      borderColor: "transparent",
    },
    colorOptionSelected: {
      borderColor: c.textPrimary,
    },
  });