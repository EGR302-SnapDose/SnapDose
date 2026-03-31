import { auth, db } from "@/config/firebase";
import { useIOB } from "@/hooks/use-iob";
import { colors, layout, radius, shadows, spacing, textStyles } from "@/constants/theme";
import { useFocusEffect } from "@react-navigation/native";
import { getAuth } from "firebase/auth";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Polyline,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

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
    case "doubleUp": return "↑↑";
    case "singleUp": return "↑";
    case "fortyFiveUp": return "↗";
    case "flat": return "→";
    case "fortyFiveDown": return "↘";
    case "singleDown": return "↓";
    case "doubleDown": return "↓↓";
    default: return "→";
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
  if (value < LOW_THRESHOLD) return colors.glucoseLow;
  if (value > HIGH_THRESHOLD) return colors.glucoseHigh;
  return colors.glucoseInRange;
}

function getRangeLabel(value: number): string {
  if (value < LOW_THRESHOLD) return "Low";
  if (value > HIGH_THRESHOLD) return "High";
  return "In Range";
}

function getTimeAgo(dateString: string) {
  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "Just now";
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

function computeTimeInRange(records: EgvRecord[]): number | null {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayRecords = records.filter((r) => {
    if (r.value === null) return false;
    return new Date(r.systemTime) >= todayStart;
  });
  if (todayRecords.length === 0) return null;
  const inRange = todayRecords.filter(
    (r) => r.value! >= LOW_THRESHOLD && r.value! <= HIGH_THRESHOLD
  );
  return Math.round((inRange.length / todayRecords.length) * 100);
}

function GlucoseGraph({
  records,
  accentColor,
}: {
  records: EgvRecord[];
  accentColor: string;
}) {
  const screenWidth = Dimensions.get("window").width;
  const svgWidth = screenWidth - layout.screenHorizontalPadding * 2 - spacing[4];
  const plotWidth = svgWidth - GRAPH_PADDING_LEFT - GRAPH_PADDING_RIGHT;
  const plotHeight = GRAPH_HEIGHT - GRAPH_PADDING_TOP - GRAPH_PADDING_BOTTOM;

  const validRecords = records.filter(
    (r) => r.value !== null && r.value >= 39 && r.value <= 401
  );

  if (validRecords.length < 2) {
    return (
      <View style={graphStyles.empty}>
        <Text style={graphStyles.emptyText}>Not enough data</Text>
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
    .map((r) => `${scaleX(new Date(r.systemTime).getTime())},${scaleY(r.value!)}`)
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
      <Defs>
        <LinearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={accentColor} stopOpacity="0.15" />
          <Stop offset="100%" stopColor={accentColor} stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* Range bands */}
      <Rect
        x={GRAPH_PADDING_LEFT} y={highY}
        width={plotWidth} height={lowY - highY}
        fill={colors.glucoseInRange} opacity={0.07}
      />
      <Rect
        x={GRAPH_PADDING_LEFT} y={GRAPH_PADDING_TOP}
        width={plotWidth} height={highY - GRAPH_PADDING_TOP}
        fill={colors.glucoseHigh} opacity={0.05}
      />
      <Rect
        x={GRAPH_PADDING_LEFT} y={lowY}
        width={plotWidth} height={GRAPH_PADDING_TOP + plotHeight - lowY}
        fill={colors.glucoseLow} opacity={0.05}
      />

      {/* Grid lines */}
      {yLabels.map((val) => (
        <Line
          key={val}
          x1={GRAPH_PADDING_LEFT} y1={scaleY(val)}
          x2={svgWidth - GRAPH_PADDING_RIGHT} y2={scaleY(val)}
          stroke={colors.border} strokeWidth={0.5} strokeDasharray="3,4"
        />
      ))}

      {/* Y labels */}
      {yLabels.map((val) => (
        <SvgText
          key={`l-${val}`}
          x={GRAPH_PADDING_LEFT - 6} y={scaleY(val) + 4}
          fontSize={10} fill={colors.textTertiary} textAnchor="end"
        >
          {val}
        </SvgText>
      ))}

      {/* X labels */}
      {hourLabels.map((h, i) => (
        <SvgText
          key={i} x={h.x} y={GRAPH_HEIGHT - 4}
          fontSize={10} fill={colors.textTertiary} textAnchor="middle"
        >
          {h.label}
        </SvgText>
      ))}

      {/* Line */}
      <Polyline
        points={points}
        fill="none"
        stroke={accentColor}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function StatCell({
  label,
  value,
  sub,
  valueColor,
  isLoading,
  isLast,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
  isLoading?: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={[statStyles.cell, !isLast && statStyles.cellBorder]}>
      <Text style={statStyles.label}>{label}</Text>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 4 }} />
      ) : (
        <>
          <Text style={[statStyles.value, valueColor ? { color: valueColor } : undefined]}>
            {value}
          </Text>
          {sub ? <Text style={statStyles.sub}>{sub}</Text> : null}
        </>
      )}
    </View>
  );
}

function TirCell({ percent, isLoading }: { percent: number | null; isLoading?: boolean }) {
  const size = 38;
  const stroke = 3.5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = percent !== null ? (percent / 100) * circ : 0;
  const tirColor =
    percent === null ? colors.textTertiary
    : percent >= 70 ? colors.glucoseInRange
    : percent >= 54 ? colors.glucoseHigh
    : colors.glucoseLow;

  return (
    <View style={[statStyles.cell]}>
      <Text style={statStyles.label}>Time in Range</Text>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 4 }} />
      ) : (
        <View style={statStyles.tirRow}>
          <Svg width={size} height={size}>
            <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.border} strokeWidth={stroke} fill="none" />
            {percent !== null && (
              <Circle
                cx={size / 2} cy={size / 2} r={r}
                stroke={tirColor} strokeWidth={stroke} fill="none"
                strokeDasharray={`${filled} ${circ - filled}`}
                strokeDashoffset={circ / 4}
                strokeLinecap="round"
              />
            )}
          </Svg>
          <View>
            <Text style={[statStyles.value, { color: tirColor }]}>
              {percent !== null ? `${percent}%` : "—"}
            </Text>
            <Text style={statStyles.sub}>70–180</Text>
          </View>
        </View>
      )}
    </View>
  );
}

export function GlucoseCard() {
  const iob = useIOB();
  const [reading, setReading] = useState<GlucoseReading | null>(null);
  const [records, setRecords] = useState<EgvRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastBolus, setLastBolus] = useState<LastBolus>(null);
  const [bolusLoading, setBolusLoading] = useState(true);

  const fetchLastBolus = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) { setBolusLoading(false); return; }
    try {
      const q = query(
        collection(db, "users", uid, "doses"),
        orderBy("timestamp", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setLastBolus({ amount: data.amount ?? 0, time: data.time ?? "", type: data.type ?? "Dose" });
      } else {
        setLastBolus(null);
      }
    } catch {
      setLastBolus(null);
    } finally {
      setBolusLoading(false);
    }
  }, []);

  const fetchGlucose = async (isRefresh = false) => {
    const userId = getAuth().currentUser?.uid;
    if (!userId) { setError("Not signed in"); setLoading(false); return; }
    if (isRefresh) setRefreshing(true);
    try {
      const [realtimeRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/realtime?minutes=10&maxCount=1`),
        fetch(`${API_BASE}/latest?userId=${userId}`),
      ]);
      const historyData = historyRes.ok ? await historyRes.json().catch(() => null) : null;
      if (realtimeRes.ok) {
        const data = await realtimeRes.json();
        if (data.latest) {
          setReading({ value: data.latest.value, trend: data.latest.trend || "flat", systemTime: data.latest.systemTime });
          setError(null);
        }
      } else if (historyData?.latest) {
        setReading({ value: historyData.latest.value, trend: historyData.latest.trend || "flat", systemTime: historyData.latest.systemTime });
        setError(null);
      } else {
        setError("No recent readings");
      }
      if (historyData?.records) setRecords(historyData.records);
    } catch {
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

  useEffect(() => {
    if (!bolusLoading) fetchLastBolus();
  }, [iob]);

  const timeInRange = computeTimeInRange(records);

  if (loading) {
    return (
      <View style={styles.card}>
        <View style={[styles.accentStrip, { backgroundColor: colors.border }]} />
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching glucose…</Text>
        </View>
      </View>
    );
  }

  if (error || !reading) {
    return (
      <View style={styles.card}>
        <View style={[styles.accentStrip, { backgroundColor: colors.danger }]} />
        <View style={styles.heroSection}>
          <Text style={[styles.glucoseNumber, { color: colors.textTertiary }]}>—</Text>
          <Pressable onPress={() => fetchGlucose(true)} disabled={refreshing} style={styles.refreshButton}>
            {refreshing
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Text style={styles.refreshLabel}>Refresh</Text>
            }
          </Pressable>
        </View>
        <Text style={styles.errorText}>{error || "No data available"}</Text>
      </View>
    );
  }

  const glucoseColor = getGlucoseColor(reading.value);
  const rangeLabel = getRangeLabel(reading.value);

  return (
    <View style={styles.card}>
      {/* Status accent strip */}
      <View style={[styles.accentStrip, { backgroundColor: glucoseColor }]} />

      <View style={styles.inner}>
        {/* Hero row */}
        <View style={styles.heroSection}>
          <View style={styles.heroLeft}>
            {/* Status pill above the number */}
            <View style={[styles.statusPill, { backgroundColor: glucoseColor + "18" }]}>
              <View style={[styles.statusDot, { backgroundColor: glucoseColor }]} />
              <Text style={[styles.statusLabel, { color: glucoseColor }]}>{rangeLabel}</Text>
            </View>

            <Text style={[styles.glucoseNumber, { color: glucoseColor }]}>
              {reading.value}
            </Text>

            <View style={styles.heroMeta}>
              <Text style={styles.unit}>mg/dL</Text>
              <View style={styles.trendRow}>
                <Text style={[styles.trendArrow, { color: glucoseColor }]}>
                  {getTrendArrow(reading.trend)}
                </Text>
                <Text style={styles.trendLabel}>{getTrendLabel(reading.trend)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.heroRight}>
            <Pressable onPress={() => fetchGlucose(true)} disabled={refreshing} style={styles.refreshButton}>
              {refreshing
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Text style={styles.refreshLabel}>Refresh</Text>
              }
            </Pressable>
            <Text style={styles.updatedAt}>{getTimeAgo(reading.systemTime)}</Text>
          </View>
        </View>

        {/* Graph */}
        <View style={styles.graphWrap}>
          <GlucoseGraph records={records} accentColor={glucoseColor} />
        </View>

        {/* Stats strip */}
        <View style={styles.statsStrip}>
          <StatCell
            label="Last Bolus"
            value={lastBolus ? `${lastBolus.amount.toFixed(1)}u` : "—"}
            sub={lastBolus ? lastBolus.type : "No doses today"}
            valueColor={lastBolus ? colors.primary : colors.textTertiary}
            isLoading={bolusLoading}
          />
          <StatCell
            label="Active IOB"
            value={`${iob.toFixed(1)}u`}
            sub={iob > 0 ? "insulin active" : "clear"}
            valueColor={iob > 0 ? colors.primary : colors.textTertiary}
          />
          <TirCell percent={timeInRange} isLoading={loading} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: layout.screenHorizontalPadding,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    flexDirection: "row",
    overflow: "hidden",
    ...shadows.card,
  },
  accentStrip: {
    width: 4,
    borderTopLeftRadius: radius.xl,
    borderBottomLeftRadius: radius.xl,
  },
  inner: {
    flex: 1,
    padding: spacing[4],
  },
  heroSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroLeft: {
    gap: spacing[1],
  },
  heroRight: {
    alignItems: "flex-end",
    gap: spacing[2],
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: spacing[1],
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    ...textStyles.caption1Medium,
    fontWeight: "600",
  },
  glucoseNumber: {
    fontSize: 72,
    fontWeight: "800",
    letterSpacing: -3,
    lineHeight: 76,
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    marginTop: 2,
  },
  unit: {
    ...textStyles.subheadline,
    color: colors.textTertiary,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  trendArrow: {
    ...textStyles.subheadlineSemibold,
  },
  trendLabel: {
    ...textStyles.subheadline,
    color: colors.textSecondary,
  },
  refreshButton: {
    minWidth: layout.minTouchTarget,
    minHeight: layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshLabel: {
    ...textStyles.callout,
    color: colors.primary,
  },
  updatedAt: {
    ...textStyles.caption1,
    color: colors.textTertiary,
  },
  graphWrap: {
    marginTop: spacing[2],
    marginHorizontal: -spacing[1],
  },
  statsStrip: {
    flexDirection: "row",
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[10],
    gap: spacing[2],
  },
  loadingText: {
    ...textStyles.footnote,
    color: colors.textTertiary,
  },
  errorText: {
    ...textStyles.subheadline,
    color: colors.textSecondary,
    marginTop: spacing[2],
  },
});

const statStyles = StyleSheet.create({
  cell: {
    flex: 1,
    paddingHorizontal: spacing[2],
    gap: 2,
  },
  cellBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
  label: {
    ...textStyles.caption2Semibold,
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  value: {
    ...textStyles.title3Semibold,
    color: colors.textPrimary,
    marginTop: 2,
  },
  sub: {
    ...textStyles.caption1,
    color: colors.textTertiary,
    marginTop: 1,
  },
  tirRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginTop: 2,
  },
});

const graphStyles = StyleSheet.create({
  empty: {
    height: GRAPH_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    ...textStyles.footnote,
    color: colors.textTertiary,
  },
});
