import { useThemeColor } from "@/hooks/use-theme-color";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Dimensions,
  Pressable,
} from "react-native";
import { useState, useCallback } from "react";
import { getAuth } from "firebase/auth";
import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";
import { useFocusEffect } from "@react-navigation/native";
import Svg, { Polyline, Line, Rect, Text as SvgText } from "react-native-svg";

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
    case "doubleUp":
      return "^^";
    case "singleUp":
      return "^";
    case "fortyFiveUp":
      return "/";
    case "flat":
      return "-";
    case "fortyFiveDown":
      return "\\";
    case "singleDown":
      return "v";
    case "doubleDown":
      return "vv";
    default:
      return "-";
  }
}

function getTrendLabel(trend: string) {
  switch (trend) {
    case "doubleUp":
      return "Rising fast";
    case "singleUp":
      return "Rising";
    case "fortyFiveUp":
      return "Rising slightly";
    case "flat":
      return "Stable";
    case "fortyFiveDown":
      return "Falling slightly";
    case "singleDown":
      return "Falling";
    case "doubleDown":
      return "Falling fast";
    default:
      return "";
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

function GlucoseGraph({ records }: { records: EgvRecord[] }) {
  const screenWidth = Dimensions.get("window").width;
  const cardPadding = 32;
  const svgWidth = screenWidth - cardPadding - 2;
  const plotWidth = svgWidth - GRAPH_PADDING_LEFT - GRAPH_PADDING_RIGHT;
  const plotHeight = GRAPH_HEIGHT - GRAPH_PADDING_TOP - GRAPH_PADDING_BOTTOM;

  const validRecords = records.filter(
    (r) => r.value !== null && r.value >= 39 && r.value <= 401,
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
      (r) => `${scaleX(new Date(r.systemTime).getTime())},${scaleY(r.value!)}`,
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

export function GlucoseCard() {
  const borderColor = useThemeColor({}, "icon");
  const [reading, setReading] = useState<GlucoseReading | null>(null);
  const [records, setRecords] = useState<EgvRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const interval = setInterval(fetchGlucose, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }, []),
  );

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
      <View style={styles.graphContainer}>
        <GlucoseGraph records={records} />
      </View>
    </ThemedView>
  );
}

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
