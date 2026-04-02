import { auth, db } from "@/config/firebase";
import { colors, Colors, radius, spacing, textStyles, typography } from "@/constants/theme";
import { useAccentColor } from "@/context/accent-color";
import { useIOB } from "@/hooks/use-iob";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
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

function renderTrendIcon(trend: string, color: string) {
  const iconMap: Record<string, { name: string; count: number }> = {
    'doubleUp': { name: 'chevron-up', count: 2 },
    'singleUp': { name: 'chevron-up', count: 1 },
    'fortyFiveUp': { name: 'trending-up', count: 1 },
    'flat': { name: 'remove', count: 1 },
    'fortyFiveDown': { name: 'trending-down', count: 1 },
    'singleDown': { name: 'chevron-down', count: 1 },
    'doubleDown': { name: 'chevron-down', count: 2 },
  };

  const config = iconMap[trend] || { name: 'help', count: 1 };

  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array(config.count).fill(0).map((_, i) => (
        <Ionicons key={i} name={config.name as any} size={20} color={color} />
      ))}
    </View>
  );
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
  if (value < LOW_THRESHOLD) return colors.glucoseLow;
  if (value > HIGH_THRESHOLD) return colors.glucoseHigh;
  if (value > 140) return colors.glucoseHigh;
  return colors.glucoseInRange;
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

function GlucoseGraph({ records, accent, borderColor, textColor, timeFrameHours = 24 }: { records: EgvRecord[]; accent?: string; borderColor?: string; textColor?: string; timeFrameHours?: number }) {
  const screenWidth = Dimensions.get("window").width;
  const cardPadding = 32;
  const svgWidth = screenWidth - cardPadding - 2;
  const plotWidth = svgWidth - GRAPH_PADDING_LEFT - GRAPH_PADDING_RIGHT;
  const plotHeight = GRAPH_HEIGHT - GRAPH_PADDING_TOP - GRAPH_PADDING_BOTTOM;

  const lineColor = accent || colors.primary;
  const graphBorderColor = borderColor || colors.border;
  const graphTextColor = textColor || colors.textSecondary;

  // Filter records to the selected time frame
  const now = Date.now();
  const cutoffTime = now - timeFrameHours * 60 * 60 * 1000;

  const validRecords = records.filter(
    (r) => r.value !== null && r.value >= 39 && r.value <= 401 && new Date(r.systemTime).getTime() >= cutoffTime
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

  // Adjust label interval based on time frame
  const labelIntervalHours = timeFrameHours <= 2 ? 0.5 : timeFrameHours <= 6 ? 1 : 2;
  const labelIntervalMs = labelIntervalHours * 60 * 60 * 1000;

  for (let t = startHour.getTime(); t < maxTime; t += labelIntervalMs) {
    const d = new Date(t);
    const hr = d.getHours();
    const min = d.getMinutes();
    const ampm = hr >= 12 ? "pm" : "am";
    const hr12 = hr % 12 || 12;
    // Show minutes for sub-hour intervals
    const label = labelIntervalHours < 1 ? `${hr12}:${min.toString().padStart(2, '0')}` : `${hr12}${ampm}`;
    hourLabels.push({ x: scaleX(t), label });
  }

  const yLabels = [70, 120, 180, 250];

  return (
    <Svg width={svgWidth} height={GRAPH_HEIGHT}>
      {/* In-range zone (green) */}
      <Rect
        x={GRAPH_PADDING_LEFT}
        y={highY}
        width={plotWidth}
        height={lowY - highY}
        fill={colors.glucoseInRange}
        opacity={0.25}
      />
      {/* High zone (red) */}
      <Rect
        x={GRAPH_PADDING_LEFT}
        y={GRAPH_PADDING_TOP}
        width={plotWidth}
        height={highY - GRAPH_PADDING_TOP}
        fill={colors.glucoseHigh}
        opacity={0.08}
      />
      {/* Low zone (red) */}
      <Rect
        x={GRAPH_PADDING_LEFT}
        y={lowY}
        width={plotWidth}
        height={GRAPH_PADDING_TOP + plotHeight - lowY}
        fill={colors.glucoseLow}
        opacity={0.08}
      />
      {yLabels.map((val) => (
        <Line
          key={val}
          x1={GRAPH_PADDING_LEFT}
          y1={scaleY(val)}
          x2={svgWidth - GRAPH_PADDING_RIGHT}
          y2={scaleY(val)}
          stroke={graphBorderColor}
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
          fill={graphTextColor}
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
          fill={graphTextColor}
          textAnchor="middle"
        >
          {h.label}
        </SvgText>
      ))}
      <Polyline
        points={points}
        fill="none"
        stroke={lineColor}
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
          <ThemedText style={infoStyles.value}>
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
  trackColor,
  isLoading,
}: {
  percent: number | null;
  accent: string;
  cardBg: string;
  trackColor: string;
  isLoading?: boolean;
}) {
  const size = 44;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = percent !== null ? (percent / 100) * circ : 0;

  const tirColor =
    percent === null
      ? colors.textTertiary
      : percent >= 70
      ? colors.glucoseInRange
      : percent >= 54
      ? colors.glucoseHigh
      : colors.glucoseLow;

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
              stroke={trackColor}
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
  const borderColor = useThemeColor({light: colors.border, dark: Colors.dark.border}, "border");
  const accent = useAccentColor();
  const cardBg = useThemeColor(
    { light: colors.surfaceSubtle, dark: Colors.dark.surface },
    "surface"
  );
  const graphBorderColor = useThemeColor(
    { light: colors.border, dark: Colors.dark.border },
    "border"
  );
  const graphTextColor = useThemeColor(
    { light: colors.textSecondary, dark: Colors.dark.icon },
    "icon"
  );
  const primaryColor = useThemeColor(
    { light: colors.primary, dark: Colors.dark.primary },
    "primary"
  );
  const trackColor = useThemeColor(
    { light: colors.border, dark: Colors.dark.border },
    "border"
  );

  const iob = useIOB();

  const [reading, setReading] = useState<GlucoseReading | null>(null);
  const [records, setRecords] = useState<EgvRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lastBolus, setLastBolus] = useState<LastBolus>(null);
  const [bolusLoading, setBolusLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<2 | 6 | 12>(2);

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
              <ActivityIndicator size="small" color={primaryColor} />
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
            <ActivityIndicator size="small" color={primaryColor} />
          ) : (
            <ThemedText style={styles.refreshButton}>Refresh</ThemedText>
          )}
        </Pressable>
      </View>

      {/* Current reading */}
      <View style={styles.readingRow}>
        <ThemedText
          style={[
            textStyles.glucoseDisplay,
            { color: getGlucoseColor(reading.value) },
          ]}
        >
          {reading.value}
        </ThemedText>
        <View style={styles.readingMeta}>
          <ThemedText style={styles.unit}>mg/dL</ThemedText>
          <View style={styles.trendContainer}>
            {renderTrendIcon(reading.trend, getGlucoseColor(reading.value))}
            <ThemedText style={[textStyles.callout, { color: colors.textSecondary }]}>
              {getTrendLabel(reading.trend)}
            </ThemedText>
          </View>
        </View>
      </View>
      <ThemedText style={styles.lastUpdated}>
        Updated {getTimeAgo(reading.systemTime)}
      </ThemedText>

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
          accent={iob > 0 ? accent : colors.textTertiary}
          cardBg={cardBg}
        />

        {/* Time in Range */}
        <TirRingCard
          percent={timeInRange}
          accent={accent}
          cardBg={cardBg}
          trackColor={trackColor}
          isLoading={loading}
        />
      </View>

      {/* Time Frame Selector */}
      <View style={styles.timeFrameRow}>
        {([2, 6, 12] as const).map((hours) => (
          <Pressable
            key={hours}
            style={[
              styles.timeFrameButton,
              { backgroundColor: timeFrame === hours ? accent : cardBg },
            ]}
            onPress={() => setTimeFrame(hours)}
          >
            <ThemedText
              style={[
                styles.timeFrameText,
                timeFrame === hours && styles.timeFrameTextActive,
              ]}
            >
              {hours}hr
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {/* Graph */}
      <View style={styles.graphContainer}>
        <GlucoseGraph records={records} accent={accent} borderColor={graphBorderColor} textColor={graphTextColor} timeFrameHours={timeFrame} />
      </View>
    </ThemedView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
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
    fontSize: typography.sizes.subheadline,
    color: colors.primary,
    fontWeight: "600",
  },
  readingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing[2],
    marginTop: spacing[2],
  },
  readingMeta: {
    paddingBottom: 6,
  },
  unit: {
    fontSize: typography.sizes.subheadline,
    opacity: 0.7,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  lastUpdated: {
    fontSize: typography.sizes.footnote,
    opacity: 0.5,
    marginTop: spacing[1],
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: typography.sizes.subheadline,
    opacity: 0.5,
    marginTop: spacing[2],
  },
  errorText: {
    fontSize: typography.sizes.subheadline,
    opacity: 0.6,
  },
  graphContainer: {
    marginTop: spacing[2],
    alignItems: "center",
  },
  timeFrameRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing[2],
    marginTop: spacing[3],
  },
  timeFrameButton: {
    paddingVertical: spacing[1] + 2,
    paddingHorizontal: spacing[3],
    borderRadius: radius.full,
  },
  timeFrameText: {
    fontSize: typography.sizes.caption1,
    fontWeight: "600",
    opacity: 0.6,
  },
  timeFrameTextActive: {
    color: colors.textInverse,
    opacity: 1,
  },
  graphEmpty: {
    height: GRAPH_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  graphEmptyText: {
    fontSize: typography.sizes.subheadline,
    opacity: 0.4,
  },
});

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing[2],
    marginTop: spacing[3] + spacing[1],
  },
  card: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing[2] + spacing[1],
    paddingHorizontal: spacing[2] + spacing[1],
    gap: spacing[1] / 2,
  },
  label: {
    fontSize: typography.sizes.caption2,
    fontWeight: "600",
    opacity: 0.6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: spacing[1] / 2,
  },
  value: {
    fontSize: typography.sizes.title3,
    fontWeight: "700",
    lineHeight: 22,
  },
  subValue: {
    fontSize: typography.sizes.caption2,
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