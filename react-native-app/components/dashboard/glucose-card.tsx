import { auth, db } from "@/config/firebase";
import { useIOB } from "@/hooks/use-iob";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useFocusEffect } from "@react-navigation/native";
import { getAuth } from "firebase/auth";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from "react-native-svg";
import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";

const API_BASE =
  "https://us-central1-egr302-snapdose.cloudfunctions.net/dexcom-auth";

const GRAPH_HEIGHT = 160;
const GRAPH_PADDING_LEFT = 40;
const GRAPH_PADDING_RIGHT = 12;
const GRAPH_PADDING_TOP = 12;
const GRAPH_PADDING_BOTTOM = 24;
const GLUCOSE_MIN = 40;
const GLUCOSE_MAX = 300;
const LOW_THRESHOLD = 70;
const HIGH_THRESHOLD = 180;

function getTrendArrow(trend: string) {
  switch (trend) {
    case "doubleUp": return "^^";
    case "singleUp": return "^";
    case "fortyFiveUp": return "/";
    case "flat": return "-";
    case "fortyFiveDown": return "\\";
    case "singleDown": return "v";
    case "doubleDown": return "vv";
    default: return "-";
  }
}

function getTrendLabel(trend: string) {
  switch (trend) {
    case "doubleUp": return "Rising fast";
    case "singleUp": return "Rising";
    case "fortyFiveUp": return "Rising slightly";
    case "flat": return "Stable";
    case "fortyFiveDown": return "Falling slightly";
    case "singleDown": return "Falling";
    case "doubleDown": return "Falling fast";
    default: return "";
  }
}

function getGlucoseColor(value: number) {
  if (value < LOW_THRESHOLD) return "#E53935";
  if (value > HIGH_THRESHOLD) return "#E53935";
  if (value > 140) return "#FB8C00";
  return "#43A047";
}

function getTimeAgo(dateString: string) {
  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin === 1) return "1 min ago";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  const remainMin = diffMin % 60;
  if (diffHr === 1 && remainMin === 0) return "1 hr ago";
  if (diffHr === 1) return `1 hr ${remainMin} min ago`;
  if (remainMin === 0) return `${diffHr} hrs ago`;
  return `${diffHr} hrs ${remainMin} min ago`;
}

type EgvRecord = {
  value: number | null;
  trend: string;
  systemTime: string;
  status?: string | null;
};

type GlucoseReading = {
  value: number;
  trend: string;
  systemTime: string;
};

type LastBolus = {
  amount: number;
  time: string;
  type: string;
} | null;

/** Compute time-in-range for today's records (70–180 mg/dL) */
function computeTimeInRange(records: EgvRecord[]): number | null {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayRecords = records.filter((r) => {
    if (r.value === null) return false;
    const t = new Date(r.systemTime);
    return t >= todayStart;
  });

  if (todayRecords.length === 0) return null;

  const inRange = todayRecords.filter(
    (r) => r.value! >= LOW_THRESHOLD && r.value! <= HIGH_THRESHOLD
  );

  return Math.round((inRange.length / todayRecords.length) * 100);
}

function GlucoseGraph({ records }: { records: EgvRecord[] }) {
  const screenWidth = Dimensions.get("window").width;
  const cardPadding = 32;
  const svgWidth = screenWidth - cardPadding - 2;
  const plotWidth = svgWidth - GRAPH_PADDING_LEFT - GRAPH_PADDING_RIGHT;
  const plotHeight = GRAPH_HEIGHT - GRAPH_PADDING_TOP - GRAPH_PADDING_BOTTOM;

  const validRecords = records.filter(
    (r) => r.value !== null && r.value >= 39 && r.value <= 401
  );

  if (validRecords.length < 2) {
    return (
      <View style={styles.graphEmpty}>
        <ThemedText style={styles.graphEmptyText}>
          Not enough data for graph
        </ThemedText>
      </View>
    );
  }

  const times = validRecords.map((r) => new Date(r.systemTime).getTime());
  const minTime = times[0];
  const maxTime = times[times.length - 1];
  const timeRange = maxTime - minTime || 1;

  const scaleX = (t: number) =>
    GRAPH_PADDING_LEFT + ((t - minTime) / timeRange) * plotWidth;

  const scaleY = (v: number) => {
    const clamped = Math.max(GLUCOSE_MIN, Math.min(GLUCOSE_MAX, v));
    return (
      GRAPH_PADDING_TOP +
      plotHeight -
      ((clamped - GLUCOSE_MIN) / (GLUCOSE_MAX - GLUCOSE_MIN)) * plotHeight
    );
  };

  const points = validRecords
    .map(
      (r) => `${scaleX(new Date(r.systemTime).getTime())},${scaleY(r.value!)}`
    )
    .join(" ");

  const lowY = scaleY(LOW_THRESHOLD);
  const highY = scaleY(HIGH_THRESHOLD);

  const hourLabels: { x: number; label: string }[] = [];
  const startHour = new Date(minTime);
  startHour.setMinutes(0, 0, 0);
  startHour.setHours(startHour.getHours() + 1);
  for (let t = startHour.getTime(); t < maxTime; t += 2 * 60 * 60 * 1000) {
    const d = new Date(t);
    const hr = d.getHours();
    const ampm = hr >= 12 ? "pm" : "am";
    const hr12 = hr % 12 || 12;
    hourLabels.push({ x: scaleX(t), label: `${hr12}${ampm}` });
  }

  const yLabels = [70, 120, 180, 250];

  return (
    <Svg width={svgWidth} height={GRAPH_HEIGHT}>
      <Rect
        x={GRAPH_PADDING_LEFT}
        y={highY}
        width={plotWidth}
        height={lowY - highY}
        fill="#E8F5E9"
        opacity={0.4}
      />
      <Rect
        x={GRAPH_PADDING_LEFT}
        y={GRAPH_PADDING_TOP}
        width={plotWidth}
        height={highY - GRAPH_PADDING_TOP}
        fill="#FFEBEE"
        opacity={0.3}
      />
      <Rect
        x={GRAPH_PADDING_LEFT}
        y={lowY}
        width={plotWidth}
        height={GRAPH_PADDING_TOP + plotHeight - lowY}
        fill="#FFEBEE"
        opacity={0.3}
      />
      {yLabels.map((val) => (
        <Line
          key={val}
          x1={GRAPH_PADDING_LEFT}
          y1={scaleY(val)}
          x2={svgWidth - GRAPH_PADDING_RIGHT}
          y2={scaleY(val)}
          stroke="#ddd"
          strokeWidth={0.5}
          strokeDasharray="4,4"
        />
      ))}
      {yLabels.map((val) => (
        <SvgText
          key={`label-${val}`}
          x={GRAPH_PADDING_LEFT - 6}
          y={scaleY(val) + 4}
          fontSize={10}
          fill="#999"
          textAnchor="end"
        >
          {val}
        </SvgText>
      ))}
      {hourLabels.map((h, i) => (
        <SvgText
          key={i}
          x={h.x}
          y={GRAPH_HEIGHT - 4}
          fontSize={10}
          fill="#999"
          textAnchor="middle"
        >
          {h.label}
        </SvgText>
      ))}
      <Polyline
        points={points}
        fill="none"
        stroke="#1976D2"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Info Cards ───────────────────────────────────────────────────────────────

function InfoCard({
  label,
  value,
  subValue,
  accent,
  cardBg,
  isLoading,
}: {
  label: string;
  value: string;
  subValue?: string;
  accent: string;
  cardBg: string;
  isLoading?: boolean;
}) {
  return (
    <View style={[infoStyles.card, { backgroundColor: cardBg }]}>
      <ThemedText style={infoStyles.label}>{label}</ThemedText>
      {isLoading ? (
        <ActivityIndicator size="small" color={accent} style={{ marginTop: 4 }} />
      ) : (
        <>
          <ThemedText style={[infoStyles.value, { color: accent }]}>
            {value}
          </ThemedText>
          {subValue ? (
            <ThemedText style={infoStyles.subValue}>{subValue}</ThemedText>
          ) : null}
        </>
      )}
    </View>
  );
}

function TirRingCard({
  percent,
  accent,
  cardBg,
  isLoading,
}: {
  percent: number | null;
  accent: string;
  cardBg: string;
  isLoading?: boolean;
}) {
  const size = 44;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = percent !== null ? (percent / 100) * circ : 0;

  const tirColor =
    percent === null
      ? "#9BA1A6"
      : percent >= 70
      ? "#43A047"
      : percent >= 54
      ? "#FB8C00"
      : "#E53935";

  return (
    <View style={[infoStyles.card, { backgroundColor: cardBg }]}>
      <ThemedText style={infoStyles.label}>Time in Range</ThemedText>
      {isLoading ? (
        <ActivityIndicator size="small" color={accent} style={{ marginTop: 4 }} />
      ) : (
        <View style={infoStyles.tirRow}>
          <Svg width={size} height={size}>
            {/* Track */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke="#E0E0E0"
              strokeWidth={stroke}
              fill="none"
            />
            {/* Fill */}
            {percent !== null && (
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={tirColor}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${filled} ${circ - filled}`}
                strokeDashoffset={circ / 4}
                strokeLinecap="round"
              />
            )}
          </Svg>
          <View style={infoStyles.tirTextWrap}>
            <ThemedText style={[infoStyles.value, { color: tirColor }]}>
              {percent !== null ? `${percent}%` : "—"}
            </ThemedText>
            <ThemedText style={infoStyles.subValue}>70–180</ThemedText>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function GlucoseCard() {
  const borderColor = useThemeColor({}, "icon");
  const accent = useThemeColor({}, "accent");
  const cardBg = useThemeColor(
    { light: "#F4F6F8", dark: "#1A1A1A" },
    "background"
  );

  const iob = useIOB();

  const [reading, setReading] = useState<GlucoseReading | null>(null);
  const [records, setRecords] = useState<EgvRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lastBolus, setLastBolus] = useState<LastBolus>(null);
  const [bolusLoading, setBolusLoading] = useState(true);

  // ── Fetch last bolus from Firestore ──────────────────────────────────────
  const fetchLastBolus = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setBolusLoading(false);
      return;
    }
    try {
      const dosesRef = collection(db, "users", uid, "doses");
      const q = query(dosesRef, orderBy("timestamp", "desc"), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setLastBolus({
          amount: data.amount ?? 0,
          time: data.time ?? "",
          type: data.type ?? "Dose",
        });
      } else {
        setLastBolus(null);
      }
    } catch (err) {
      console.error("Failed to fetch last bolus:", err);
      setLastBolus(null);
    } finally {
      setBolusLoading(false);
    }
  }, []);

  // ── Fetch glucose data ────────────────────────────────────────────────────
  const fetchGlucose = async (isRefresh = false) => {
    const userId = getAuth().currentUser?.uid;
    if (!userId) {
      setError("Not signed in");
      setLoading(false);
      return;
    }

    if (isRefresh) setRefreshing(true);

    try {
      const [realtimeRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/realtime?minutes=10&maxCount=1`),
        fetch(`${API_BASE}/latest?userId=${userId}`),
      ]);

      const historyData = historyRes.ok
        ? await historyRes.json().catch(() => null)
        : null;

      if (realtimeRes.ok) {
        const realtimeData = await realtimeRes.json();
        if (realtimeData.latest) {
          setReading({
            value: realtimeData.latest.value,
            trend: realtimeData.latest.trend || "flat",
            systemTime: realtimeData.latest.systemTime,
          });
          setError(null);
        }
      } else if (historyData?.latest) {
        setReading({
          value: historyData.latest.value,
          trend: historyData.latest.trend || "flat",
          systemTime: historyData.latest.systemTime,
        });
        setError(null);
      } else {
        setError("No recent readings");
      }

      if (historyData?.records) {
        setRecords(historyData.records);
      }
    } catch (err) {
      console.error("Glucose fetch error:", err);
      setError("Connection error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchGlucose();
      fetchLastBolus();
      const interval = setInterval(fetchGlucose, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }, [fetchLastBolus])
  );

  // Re-fetch bolus when IOB changes (new dose just logged)
  useEffect(() => {
    if (!bolusLoading) fetchLastBolus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iob]);

  const timeInRange = computeTimeInRange(records);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <ThemedView style={[styles.card, { borderColor }]}>
        <ThemedText type="subtitle">Glucose</ThemedText>
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>
            Fetching glucose data...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error || !reading) {
    return (
      <ThemedView style={[styles.card, { borderColor }]}>
        <View style={styles.headerRow}>
          <ThemedText type="subtitle">Glucose</ThemedText>
          <Pressable
            style={styles.refreshTouchable}
            onPress={() => fetchGlucose(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#1976D2" />
            ) : (
              <ThemedText style={styles.refreshButton}>Refresh</ThemedText>
            )}
          </Pressable>
        </View>
        <View style={styles.centered}>
          <ThemedText style={styles.errorText}>
            {error || "No data available"}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <ThemedView style={[styles.card, { borderColor }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <ThemedText type="subtitle">Glucose</ThemedText>
        <Pressable
          style={styles.refreshTouchable}
          onPress={() => fetchGlucose(true)}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#1976D2" />
          ) : (
            <ThemedText style={styles.refreshButton}>Refresh</ThemedText>
          )}
        </Pressable>
      </View>

      {/* Current reading */}
      <View style={styles.readingRow}>
        <ThemedText
          style={[
            styles.glucoseValue,
            { color: getGlucoseColor(reading.value) },
          ]}
        >
          {reading.value}
        </ThemedText>
        <View style={styles.readingMeta}>
          <ThemedText style={styles.unit}>mg/dL</ThemedText>
          <ThemedText style={styles.trend}>
            {getTrendArrow(reading.trend)} {getTrendLabel(reading.trend)}
          </ThemedText>
        </View>
      </View>
      <ThemedText style={styles.lastUpdated}>
        Updated {getTimeAgo(reading.systemTime)}
      </ThemedText>

      {/* Graph */}
      <View style={styles.graphContainer}>
        <GlucoseGraph records={records} />
      </View>

      {/* ── Info Cards ── */}
      <View style={infoStyles.row}>
        {/* Last Bolus */}
        <InfoCard
          label="Last Bolus"
          value={
            lastBolus
              ? `${lastBolus.amount.toFixed(1)}u`
              : "—"
          }
          subValue={
            lastBolus
              ? `${lastBolus.type} · ${lastBolus.time}`
              : "No doses today"
          }
          accent={accent}
          cardBg={cardBg}
          isLoading={bolusLoading}
        />

        {/* Active IOB */}
        <InfoCard
          label="Active IOB"
          value={`${iob.toFixed(1)}u`}
          subValue={iob > 0 ? "insulin active" : "no active insulin"}
          accent={iob > 0 ? accent : "#9BA1A6"}
          cardBg={cardBg}
        />

        {/* Time in Range */}
        <TirRingCard
          percent={timeInRange}
          accent={accent}
          cardBg={cardBg}
          isLoading={loading}
        />
      </View>
    </ThemedView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  refreshTouchable: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshButton: {
    fontSize: 14,
    color: "#1976D2",
    fontWeight: "600",
  },
  readingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  glucoseValue: {
    fontSize: 48,
    fontWeight: "bold",
    lineHeight: 52,
  },
  readingMeta: {
    paddingBottom: 6,
  },
  unit: {
    fontSize: 14,
    opacity: 0.7,
  },
  trend: {
    fontSize: 14,
    opacity: 0.7,
  },
  lastUpdated: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 4,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.5,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    opacity: 0.6,
  },
  graphContainer: {
    marginTop: 12,
    alignItems: "center",
  },
  graphEmpty: {
    height: GRAPH_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  graphEmptyText: {
    fontSize: 14,
    opacity: 0.4,
  },
});

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  card: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    opacity: 0.5,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 22,
  },
  subValue: {
    fontSize: 10,
    opacity: 0.5,
    marginTop: 1,
  },
  // TIR ring card
  tirRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  tirTextWrap: {
    flex: 1,
  },
});