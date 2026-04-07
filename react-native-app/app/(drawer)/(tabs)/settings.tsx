import { db } from "@/config/firebase";
import { useAccentColor } from "@/context/accent-color";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { getAuth } from "firebase/auth";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE =
  "https://us-central1-egr302-snapdose.cloudfunctions.net/dexcom-auth";
const SNAPDOSE_API =
  "https://snapdose-api-1044774150297.us-central1.run.app/api";

const ACCENT_COLORS = [
  "#EF4444",
  "#3B82F6",
  "#A855F7",
  "#10B981",
  "#F59E0B",
  "#EC4899",
];

interface PumpInfo {
  serialNumber: string;
  model: string;
  pairedAt: string | null;
  online: boolean;
  status: string;
}

function PumpSection() {
  const [pump, setPump] = useState<PumpInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState(false);
  const accent = useAccentColor();
  const userId = getAuth().currentUser?.uid ?? "";
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const sectionBgColor = useThemeColor(
    { light: "#f8f8f8", dark: "#1C1C1E" },
    "background",
  );
  const labelColor = useThemeColor({ light: "#000", dark: "#fff" }, "text");
  const statusColor = useThemeColor({ light: "#888", dark: "#aaa" }, "text");
  const sectionTitleColor = useThemeColor(
    { light: "#666", dark: "#999" },
    "text",
  );

  useEffect(() => {
    if (!userId) return;

    const unsub = onSnapshot(doc(db, "users", userId), (snap) => {
      if (!snap.exists()) {
        setPump(null);
        setLoading(false);
        return;
      }
      const pumpData = snap.data()?.devices?.insulinPump;
      if (!pumpData?.serialNumber) {
        setPump(null);
      } else {
        setPump({
          serialNumber: pumpData.serialNumber,
          model: pumpData.model ?? "OmniPod 5 Simulator",
          pairedAt: pumpData.pairedAt ?? null,
          online: pumpData.online ?? false,
          status: pumpData.status ?? "PAIRED",
        });
      }
      setLoading(false);
    });

    return unsub;
  }, [userId]);

  useEffect(() => {
    if (pump?.online) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [pump?.online]);

  const handleDeactivate = () => {
    Alert.alert(
      "Unpair Pump",
      "This will disconnect the pump from your account. The device will need to be re-paired to receive doses.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unpair",
          style: "destructive",
          onPress: async () => {
            if (!pump) return;
            setDeactivating(true);
            try {
              const token = await getAuth().currentUser?.getIdToken();
              await fetch(
                `${SNAPDOSE_API}/devices/${pump.serialNumber}/deactivate`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                },
              );
            } catch (err) {
              console.error("Deactivate failed:", err);
            } finally {
              setDeactivating(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>
          Insulin Pump
        </Text>
        <View
          style={[
            styles.row,
            { backgroundColor: sectionBgColor, justifyContent: "center" },
          ]}
        >
          <ActivityIndicator size="small" color="#888" />
        </View>
      </View>
    );
  }

  if (!pump) {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>
          Insulin Pump
        </Text>
        <View style={[styles.row, { backgroundColor: sectionBgColor }]}>
          <View style={styles.rowText}>
            <Text style={[styles.label, { color: labelColor }]}>
              No pump paired
            </Text>
            <Text style={[styles.status, { color: statusColor }]}>
              Pair a device to enable insulin delivery
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.pairButton, { backgroundColor: accent }]}
          onPress={() => router.push("/(drawer)/pair-pump" as any)}
        >
          <Text style={styles.pairButtonText}>Pair Pump</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pairedDate = pump.pairedAt
    ? new Date(
        typeof pump.pairedAt === "number" ? pump.pairedAt : pump.pairedAt,
      ).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>
        Insulin Pump
      </Text>

      <View style={[styles.row, { backgroundColor: sectionBgColor }]}>
        <View style={styles.rowText}>
          <Text style={[styles.label, { color: labelColor }]}>Device</Text>
          <Text style={[styles.status, { color: statusColor }]}>
            {pump.model}
          </Text>
        </View>
      </View>

      <View style={[styles.row, { backgroundColor: sectionBgColor }]}>
        <View style={styles.rowText}>
          <Text style={[styles.label, { color: labelColor }]}>Serial</Text>
          <Text style={[styles.status, { color: statusColor }]}>
            {pump.serialNumber}
          </Text>
        </View>
      </View>

      {pairedDate && (
        <View style={[styles.row, { backgroundColor: sectionBgColor }]}>
          <View style={styles.rowText}>
            <Text style={[styles.label, { color: labelColor }]}>Paired</Text>
            <Text style={[styles.status, { color: statusColor }]}>
              {pairedDate}
            </Text>
          </View>
        </View>
      )}

      <View style={[styles.row, { backgroundColor: sectionBgColor }]}>
        <View style={styles.rowText}>
          <Text style={[styles.label, { color: labelColor }]}>Status</Text>
          <View style={styles.statusBadge}>
            <Animated.View
              style={[
                styles.statusDot,
                {
                  backgroundColor: pump.online ? "#4CAF50" : "#F44336",
                  opacity: pump.online ? pulseAnim : 1,
                },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: pump.online ? "#4CAF50" : "#F44336" },
              ]}
            >
              {pump.online ? "Online" : "Offline"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.pumpActions}>
        <TouchableOpacity
          style={[styles.pairButton, { backgroundColor: accent, flex: 1 }]}
          onPress={() => router.push("/(drawer)/pair-pump" as any)}
        >
          <Text style={styles.pairButtonText}>Change Pump</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.unpairButton, { borderColor: "#F44336", flex: 1 }]}
          onPress={handleDeactivate}
          disabled={deactivating}
        >
          {deactivating ? (
            <ActivityIndicator size="small" color="#F44336" />
          ) : (
            <Text style={styles.unpairButtonText}>Unpair</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const [dexcomConnected, setDexcomConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [cgmLastSeen, setCgmLastSeen] = useState<string | undefined>(undefined);
  const [selectedAccentColor, setSelectedAccentColor] = useState("#3B82F6");
  const [savingColor, setSavingColor] = useState(false);
  const userId = getAuth().currentUser?.uid;
  const currentAccent = useAccentColor();

  const backgroundColor = useThemeColor(
    { light: "#fff", dark: "#000" },
    "background",
  );
  const sectionBgColor = useThemeColor(
    { light: "#f8f8f8", dark: "#1C1C1E" },
    "background",
  );
  const titleColor = useThemeColor({ light: "#000", dark: "#fff" }, "text");
  const sectionTitleColor = useThemeColor(
    { light: "#666", dark: "#999" },
    "text",
  );
  const labelColor = useThemeColor({ light: "#000", dark: "#fff" }, "text");
  const statusColor = useThemeColor({ light: "#888", dark: "#aaa" }, "text");

  const checkDexcomStatus = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/status?userId=${userId}`);
      const data = await res.json();
      setDexcomConnected(data.connected);
      if (data.connected) setCgmLastSeen("Just now");
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const accentColor = userDoc.data().accentColor;
        if (accentColor) setSelectedAccentColor(accentColor);
      }
    } catch (err) {
      console.error("Failed to check Dexcom status:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      checkDexcomStatus();
    }, [userId]),
  );

  const connectDexcom = async () => {
    if (!userId) return;
    setConnecting(true);
    try {
      const res = await fetch(`${API_BASE}/auth-url?userId=${userId}`);
      const { url } = await res.json();
      await WebBrowser.openBrowserAsync(url);
      await checkDexcomStatus();
    } catch (err) {
      console.error("Failed to connect Dexcom:", err);
    } finally {
      setConnecting(false);
    }
  };

  const handleColorSelect = async (color: string) => {
    if (!userId) return;
    setSelectedAccentColor(color);
    setSavingColor(true);
    try {
      await updateDoc(doc(db, "users", userId), { accentColor: color });
    } catch (err) {
      console.error("Failed to save accent color:", err);
    } finally {
      setSavingColor(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: titleColor }]}>Settings</Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>
          Integrations
        </Text>

        <View style={[styles.row, { backgroundColor: sectionBgColor }]}>
          <Text style={[styles.label, { color: labelColor }]}>Dexcom CGM</Text>
          <View style={styles.rowRight}>
            <View style={styles.statusBadge}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: loading
                      ? "#888"
                      : dexcomConnected
                        ? "#4CAF50"
                        : "#F44336",
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  {
                    color: loading
                      ? "#888"
                      : dexcomConnected
                        ? "#4CAF50"
                        : "#F44336",
                  },
                ]}
              >
                {loading
                  ? "Checking..."
                  : dexcomConnected
                    ? "Online"
                    : "Offline"}
              </Text>
            </View>
            {cgmLastSeen && (
              <Text style={[styles.lastSeen, { color: statusColor }]}>
                Last seen: {cgmLastSeen}
              </Text>
            )}
            {!loading && !dexcomConnected && (
              <Pressable
                style={styles.connectButton}
                onPress={connectDexcom}
                disabled={connecting}
              >
                {connecting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.connectButtonText}>Connect</Text>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </View>

      <PumpSection />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>
          Units
        </Text>
        <View style={[styles.row, { backgroundColor: sectionBgColor }]}>
          <View style={styles.rowText}>
            <Text style={[styles.label, { color: labelColor }]}>
              Blood Glucose
            </Text>
            <Text style={[styles.status, { color: statusColor }]}>mg/dL</Text>
          </View>
        </View>
        <View style={[styles.row, { backgroundColor: sectionBgColor }]}>
          <View style={styles.rowText}>
            <Text style={[styles.label, { color: labelColor }]}>
              Carbohydrates
            </Text>
            <Text style={[styles.status, { color: statusColor }]}>grams</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>
          Notifications
        </Text>
        <View style={[styles.row, { backgroundColor: sectionBgColor }]}>
          <View style={styles.rowText}>
            <Text style={[styles.label, { color: labelColor }]}>
              High Glucose Alerts
            </Text>
            <Text style={[styles.status, { color: statusColor }]}>Enabled</Text>
          </View>
        </View>
        <View style={[styles.row, { backgroundColor: sectionBgColor }]}>
          <View style={styles.rowText}>
            <Text style={[styles.label, { color: labelColor }]}>
              Low Glucose Alerts
            </Text>
            <Text style={[styles.status, { color: statusColor }]}>Enabled</Text>
          </View>
        </View>
        <View style={[styles.row, { backgroundColor: sectionBgColor }]}>
          <View style={styles.rowText}>
            <Text style={[styles.label, { color: labelColor }]}>
              Meal Reminders
            </Text>
            <Text style={[styles.status, { color: statusColor }]}>
              Disabled
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>
          App Preferences
        </Text>

        <View
          style={[styles.colorSection, { backgroundColor: sectionBgColor }]}
        >
          <Text style={[styles.label, { color: labelColor }]}>Theme Color</Text>
          <View style={styles.colorGrid}>
            {ACCENT_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedAccentColor === color && {
                    borderColor: "#FFF",
                    borderWidth: 3,
                  },
                ]}
                onPress={() => handleColorSelect(color)}
                disabled={savingColor}
              >
                {selectedAccentColor === color && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.row, { backgroundColor: sectionBgColor }]}>
          <View style={styles.rowText}>
            <Text style={[styles.label, { color: labelColor }]}>Theme</Text>
            <Text style={[styles.status, { color: statusColor }]}>Light</Text>
          </View>
        </View>
        <View style={[styles.row, { backgroundColor: sectionBgColor }]}>
          <View style={styles.rowText}>
            <Text style={[styles.label, { color: labelColor }]}>Language</Text>
            <Text style={[styles.status, { color: statusColor }]}>English</Text>
          </View>
        </View>
        <View style={[styles.row, { backgroundColor: sectionBgColor }]}>
          <View style={styles.rowText}>
            <Text style={[styles.label, { color: labelColor }]}>
              App Version
            </Text>
            <Text style={[styles.status, { color: statusColor }]}>1.0.0</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  rowText: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
  status: {
    fontSize: 13,
    marginTop: 2,
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  lastSeen: {
    fontSize: 11,
  },
  connectButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  connectButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  pairButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  pairButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  pumpActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  unpairButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1.5,
  },
  unpairButtonText: {
    color: "#F44336",
    fontWeight: "600",
    fontSize: 14,
  },
  colorSection: {
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginTop: 12,
  },
  colorOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "transparent",
  },
  checkmark: {
    fontSize: 24,
    color: "#FFF",
    fontWeight: "700",
  },
});
