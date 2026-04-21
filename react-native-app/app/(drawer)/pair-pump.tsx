import { auth } from "@/config/firebase";
import { useAccentColor } from "@/context/accent-color";
import { useThemeColors, type ThemeColors } from "@/hooks/use-theme-colors";
import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SNAPDOSE_API =
  "https://snapdose-api-1044774150297.us-central1.run.app/api";
const DEVICE_SERIAL = "tab5-001";

type Step = "instructions" | "entry" | "success";

interface PairedDevice {
  serialNumber: string;
  model: string;
  pairedAt: string;
}

export default function PairPumpScreen() {
  const accent = useAccentColor();
  const c = useThemeColors();
  const styles = useMemo(() => makeStyles(c), [c]);
  const [step, setStep] = useState<Step>("instructions");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [pairing, setPairing] = useState(false);
  const [paired, setPaired] = useState<PairedDevice | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleDigitChange = (value: string, index: number) => {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePair = async () => {
    const code = digits.join("");
    if (code.length !== 6) {
      Alert.alert("Invalid Code", "Please enter all 6 digits.");
      return;
    }

    setPairing(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${SNAPDOSE_API}/devices/pair`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pairingCode: code,
          serialNumber: DEVICE_SERIAL,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Pair failed:", res.status, text);
        Alert.alert(
          "Pairing Failed",
          res.status === 400
            ? "Invalid or expired code. Check the code on your pump screen and try again."
            : "Something went wrong. Please try again.",
        );
        return;
      }

      const data = await res.json();
      console.log("Pair response:", JSON.stringify(data));
      setPaired({
        serialNumber: data.serialNumber ?? data.serial ?? DEVICE_SERIAL,
        model: data.model ?? "OmniPod 5 Simulator",
        pairedAt: data.pairedAt ?? new Date().toISOString(),
      });
      setStep("success");
    } catch (err) {
      console.error("Pair error:", err);
      Alert.alert(
        "Error",
        "Could not connect to the server. Check your connection.",
      );
    } finally {
      setPairing(false);
    }
  };

  const handleDone = () => {
    router.back();
  };

  if (step === "instructions") {
    return (
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <View style={styles.container}>
          <View style={styles.iconWrap}>
            <View
              style={[styles.iconCircle, { backgroundColor: accent + "20" }]}
            >
              <Text style={[styles.iconText, { color: accent }]}>⌁</Text>
            </View>
          </View>

          <Text style={styles.heading}>Pair Your Pump</Text>
          <Text style={styles.sub}>
            Make sure your SnapDose pump simulator is powered on and connected
            to WiFi.
          </Text>

          <View style={styles.steps}>
            <View style={styles.stepRow}>
              <View style={[styles.stepBadge, { backgroundColor: accent }]}>
                <Text style={styles.stepBadgeText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Power on the Tab5 device and wait for it to connect to WiFi
              </Text>
            </View>
            <View style={styles.stepRow}>
              <View style={[styles.stepBadge, { backgroundColor: accent }]}>
                <Text style={styles.stepBadgeText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Tap the screen on the Tab5 to enter pairing mode
              </Text>
            </View>
            <View style={styles.stepRow}>
              <View style={[styles.stepBadge, { backgroundColor: accent }]}>
                <Text style={styles.stepBadgeText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                A 6-digit code will appear on the pump screen — enter it here
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: accent }]}
            onPress={() => setStep("entry")}
          >
            <Text style={styles.primaryButtonText}>Enter Code</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === "entry") {
    return (
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.container}>
            <Text style={styles.heading}>Enter Pairing Code</Text>
            <Text style={styles.sub}>
              Enter the 6-digit code shown on your pump screen. It expires in 10
              minutes.
            </Text>

            <View style={styles.digitRow}>
              {digits.map((d, i) => (
                <TextInput
                  key={i}
                  ref={(r) => {
                    inputRefs.current[i] = r;
                  }}
                  style={[
                    styles.digitInput,
                    {
                      borderColor: d ? accent : c.inputBorder,
                      color: accent,
                    },
                  ]}
                  placeholderTextColor={c.inputPlaceholder}
                  value={d}
                  onChangeText={(v) => handleDigitChange(v, i)}
                  onKeyPress={({ nativeEvent }) =>
                    handleKeyPress(nativeEvent.key, i)
                  }
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  selectTextOnFocus
                  autoFocus={i === 0}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: accent },
                (pairing || digits.join("").length !== 6) && { opacity: 0.5 },
              ]}
              onPress={handlePair}
              disabled={pairing || digits.join("").length !== 6}
            >
              {pairing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Pair Device</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setDigits(["", "", "", "", "", ""]);
                setStep("instructions");
              }}
              disabled={pairing}
            >
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <View style={[styles.iconCircle, { backgroundColor: c.successSurface }]}>
            <Text style={[styles.iconText, { color: c.success }]}>✓</Text>
          </View>
        </View>

        <Text style={styles.heading}>Pump Paired</Text>
        <Text style={styles.sub}>
          Your pump is now connected and ready to receive insulin delivery
          commands.
        </Text>

        {paired && (
          <View style={styles.deviceCard}>
            <View style={styles.deviceRow}>
              <Text style={styles.deviceLabel}>Device</Text>
              <Text style={styles.deviceValue}>{paired.model}</Text>
            </View>
            <View style={[styles.deviceRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.deviceLabel}>Serial</Text>
              <Text style={styles.deviceValue}>{paired.serialNumber}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: accent }]}
          onPress={handleDone}
        >
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    container: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 40,
    },
    iconWrap: {
      alignItems: "center",
      marginBottom: 24,
    },
    iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    iconText: {
      fontSize: 36,
      fontWeight: "700",
    },
    heading: {
      fontSize: 26,
      fontWeight: "700",
      textAlign: "center",
      marginBottom: 10,
      color: c.textPrimary,
    },
    sub: {
      fontSize: 15,
      color: c.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 32,
    },
    steps: {
      gap: 16,
      marginBottom: 40,
    },
    stepRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 14,
    },
    stepBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      marginTop: 1,
    },
    stepBadgeText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "700",
    },
    stepText: {
      fontSize: 15,
      color: c.textPrimary,
      lineHeight: 22,
      flex: 1,
    },
    digitRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 10,
      marginBottom: 40,
    },
    digitInput: {
      width: 48,
      height: 58,
      borderWidth: 2,
      borderRadius: 12,
      fontSize: 24,
      fontWeight: "700",
      backgroundColor: c.inputBackground,
    },
    primaryButton: {
      height: 52,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    primaryButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
    },
    secondaryButton: {
      height: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    secondaryButtonText: {
      fontSize: 15,
      color: c.textSecondary,
      fontWeight: "600",
    },
    deviceCard: {
      backgroundColor: c.surface,
      borderRadius: 14,
      paddingHorizontal: 16,
      marginBottom: 32,
    },
    deviceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    deviceLabel: {
      fontSize: 15,
      color: c.textSecondary,
    },
    deviceValue: {
      fontSize: 15,
      fontWeight: "600",
      color: c.textPrimary,
    },
  });
