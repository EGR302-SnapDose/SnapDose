import { ThemedText } from "@/components/themed-text";
import { auth, db } from "@/config/firebase";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
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
// Types
// ---------------------------------------------------------------------------
interface EditableProfile {
  displayName: string;
  diabetesType: "type1" | "type2" | string;
  dateOfBirth: string; // ISO string "YYYY-MM-DD" for editing
  diagnosisYear: string;
  glucoseUnit: "mg/dL" | "mmol/L";
  heightFeet: string;
  heightInches: string;
  weightLbs: string;
  insulinToCarbRatio: string;
  correctionFactor: string;
}

// ---------------------------------------------------------------------------
// Small reusable field components
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
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  inputBg: string;
  textColor: string;
}) {
  return (
    <TextInput
      style={[styles.input, { backgroundColor: inputBg, color: textColor }]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#888"
      keyboardType={keyboardType}
      autoCorrect={false}
    />
  );
}

function SegmentControl({
  options,
  selected,
  onSelect,
  accentColor,
  cardBg,
  textColor,
}: {
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (v: string) => void;
  accentColor: string;
  cardBg: string;
  textColor: string;
}) {
  return (
    <View style={[styles.segmentWrap, { backgroundColor: cardBg }]}>
      {options.map((opt) => {
        const active = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.segmentBtn,
              active && { backgroundColor: accentColor },
            ]}
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

  // Pull initial values from router params or leave blank so user fills them in.
  // In a real app you'd pass the existing values via router.push params or a
  // shared state/context so the form is pre-populated.
  const [form, setForm] = useState<EditableProfile>({
    displayName: (router as any).params?.displayName ?? "",
    diabetesType: (router as any).params?.diabetesType ?? "type1",
    dateOfBirth: (router as any).params?.dateOfBirth ?? "",
    diagnosisYear: (router as any).params?.diagnosisYear ?? "",
    glucoseUnit: (router as any).params?.glucoseUnit ?? "mg/dL",
    heightFeet: (router as any).params?.heightFeet ?? "",
    heightInches: (router as any).params?.heightInches ?? "",
    weightLbs: (router as any).params?.weightLbs ?? "",
    insulinToCarbRatio: (router as any).params?.insulinToCarbRatio ?? "",
    correctionFactor: (router as any).params?.correctionFactor ?? "",
  });

  const [saving, setSaving] = useState(false);

  function setField<K extends keyof EditableProfile>(
    key: K,
    value: EditableProfile[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert("Error", "You must be logged in to save changes.");
      return;
    }

    // Basic validation
    if (!form.displayName.trim()) {
      Alert.alert("Validation", "Display name is required.");
      return;
    }

    setSaving(true);
    try {
      // Parse DOB string "YYYY-MM-DD" → Firestore Timestamp-compatible Date
      let dobDate: Date | null = null;
      if (form.dateOfBirth) {
        const parsed = new Date(form.dateOfBirth);
        if (!isNaN(parsed.getTime())) dobDate = parsed;
      }

      const payload: Record<string, unknown> = {
        displayName: form.displayName.trim(),
        "profile.diabetesType": form.diabetesType,
        "profile.glucoseUnit": form.glucoseUnit,
        "profile.diagnosisYear": parseInt(form.diagnosisYear) || null,
        "profile.height.feet": parseInt(form.heightFeet) || 0,
        "profile.height.inches": parseInt(form.heightInches) || 0,
        "profile.weight.lbs": parseFloat(form.weightLbs) || 0,
        "insulinSettings.insulinToCarbRatio":
          parseFloat(form.insulinToCarbRatio) || 0,
        "insulinSettings.correctionFactor":
          parseFloat(form.correctionFactor) || 0,
      };

      if (dobDate) {
        payload["profile.dateOfBirth"] = dobDate;
      }

      await updateDoc(doc(db, "users", uid), payload);
      Alert.alert("Saved", "Your profile has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={["bottom"]}
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
              cardBg={inputBg}
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
              cardBg={inputBg}
              textColor={theme.text}
            />
          </SectionCard>

          {/* ── Insulin Settings ── */}
          <SectionCard title="Insulin Settings" cardBg={cardBg}>
            <FieldLabel label="Insulin-to-Carb Ratio (grams per unit)" />
            <StyledInput
              value={form.insulinToCarbRatio}
              onChangeText={(v) => setField("insulinToCarbRatio", v)}
              placeholder="10"
              keyboardType="decimal-pad"
              inputBg={inputBg}
              textColor={theme.text}
            />

            <FieldLabel label={`Correction Factor (${form.glucoseUnit} per unit)`} />
            <StyledInput
              value={form.correctionFactor}
              onChangeText={(v) => setField("correctionFactor", v)}
              placeholder="50"
              keyboardType="decimal-pad"
              inputBg={inputBg}
              textColor={theme.text}
            />
          </SectionCard>

          {/* ── Save Button ── */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: accentRed }]}
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