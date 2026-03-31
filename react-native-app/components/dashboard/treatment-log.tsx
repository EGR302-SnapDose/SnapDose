import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { getAuth } from "firebase/auth";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { db } from "@/config/firebase";
import { colors, layout, radius, shadows, spacing, textStyles } from "@/constants/theme";

const API_BASE =
  "https://us-central1-egr302-snapdose.cloudfunctions.net/dexcom-auth";

const COMPACT_MAX_ROWS = 3;
const GLUCOSE_MATCH_WINDOW_MS = 15 * 60 * 1000;

type EventKind = "dose" | "meal";

interface TreatmentEvent {
  id: string;
  kind: EventKind;
  timestamp: Date;
  doseAmount?: number;
  doseType?: "Meal" | "Correction";
  carbsGrams?: number;
  foodsDetected?: string[];
  glucoseAtTime?: number | null;
}

interface GlucoseRecord {
  value: number;
  systemTime: string;
}

function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function findClosestGlucose(timestamp: Date, records: GlucoseRecord[]): number | null {
  if (!records.length) return null;
  const t = timestamp.getTime();
  let best = records[0];
  let bestDiff = Math.abs(new Date(records[0].systemTime).getTime() - t);
  for (const r of records) {
    const diff = Math.abs(new Date(r.systemTime).getTime() - t);
    if (diff < bestDiff) { bestDiff = diff; best = r; }
  }
  return bestDiff <= GLUCOSE_MATCH_WINDOW_MS ? best.value : null;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  return null;
}

function glucoseColor(value: number): string {
  if (value < 70 || value > 180) return colors.glucoseLow;
  if (value > 140) return colors.glucoseHigh;
  return colors.glucoseInRange;
}

const DOSE_COLOR = colors.primary;
const MEAL_COLOR = colors.accent;

function EventRow({
  event,
  isLast,
  compact = false,
}: {
  event: TreatmentEvent;
  isLast: boolean;
  compact?: boolean;
}) {
  const isDose = event.kind === "dose";
  const iconBg = isDose ? colors.primarySurface : colors.accent + "15";
  const iconColor = isDose ? DOSE_COLOR : MEAL_COLOR;

  const primaryLabel = isDose
    ? `${(event.doseAmount ?? 0).toFixed(1)}u ${event.doseType ?? ""}`
    : `${event.carbsGrams ?? 0}g carbs`;

  const secondaryLabel = isDose
    ? event.doseType === "Meal" ? "Meal bolus" : "Correction bolus"
    : event.foodsDetected?.length
    ? event.foodsDetected.slice(0, 2).join(", ")
    : "Meal";

  return (
    <>
      <View style={[rowStyles.row, compact && rowStyles.rowCompact]}>
        <View style={[rowStyles.iconWrap, { backgroundColor: iconBg }]}>
          {isDose
            ? <MaterialCommunityIcons name="pill" size={compact ? 15 : 17} color={iconColor} />
            : <Ionicons name="restaurant-outline" size={compact ? 15 : 17} color={iconColor} />
          }
        </View>

        <View style={rowStyles.labels}>
          <Text style={[rowStyles.primary, compact && rowStyles.primaryCompact]} numberOfLines={1}>
            {primaryLabel}
          </Text>
          <Text style={[rowStyles.secondary, compact && rowStyles.secondaryCompact]} numberOfLines={1}>
            {secondaryLabel}
          </Text>
        </View>

        <View style={rowStyles.right}>
          <Text style={rowStyles.time}>{formatTime(event.timestamp)}</Text>
          {event.glucoseAtTime != null && (
            <View style={rowStyles.glucosePill}>
              <View style={[rowStyles.dot, { backgroundColor: glucoseColor(event.glucoseAtTime) }]} />
              <Text style={[rowStyles.glucoseVal, { color: glucoseColor(event.glucoseAtTime) }]}>
                {event.glucoseAtTime}
              </Text>
            </View>
          )}
        </View>
      </View>
      {!isLast && <View style={rowStyles.separator} />}
    </>
  );
}

function SummaryStrip({ events }: { events: TreatmentEvent[] }) {
  const totalUnits = events.filter((e) => e.kind === "dose").reduce((s, e) => s + (e.doseAmount ?? 0), 0);
  const totalCarbs = events.filter((e) => e.kind === "meal").reduce((s, e) => s + (e.carbsGrams ?? 0), 0);
  const doseCount = events.filter((e) => e.kind === "dose").length;
  const mealCount = events.filter((e) => e.kind === "meal").length;

  const stats = [
    { label: "Doses", value: String(doseCount), color: DOSE_COLOR },
    { label: "Units", value: `${totalUnits.toFixed(1)}u`, color: DOSE_COLOR },
    { label: "Meals", value: String(mealCount), color: MEAL_COLOR },
    { label: "Carbs", value: `${totalCarbs}g`, color: MEAL_COLOR },
  ];

  return (
    <View style={summaryStyles.strip}>
      {stats.map((s, i) => (
        <View
          key={s.label}
          style={[summaryStyles.cell, i < stats.length - 1 && summaryStyles.cellBorder]}
        >
          <Text style={[summaryStyles.value, { color: s.color }]}>{s.value}</Text>
          <Text style={summaryStyles.label}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

function useTreatmentLog() {
  const [events, setEvents] = useState<TreatmentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const glucoseRef = useRef<GlucoseRecord[]>([]);
  const uid = getAuth().currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    fetch(`${API_BASE}/latest?userId=${uid}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.records) glucoseRef.current = data.records; })
      .catch(() => {});
  }, [uid]);

  const mergeAndSet = useCallback((doses: TreatmentEvent[], meals: TreatmentEvent[]) => {
    const merged = [...doses, ...meals]
      .map((e) => ({ ...e, glucoseAtTime: findClosestGlucose(e.timestamp, glucoseRef.current) }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setEvents(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    let latestDoses: TreatmentEvent[] = [];
    let latestMeals: TreatmentEvent[] = [];
    const today = todayStart();

    const dosesUnsub = onSnapshot(
      collection(db, "users", uid, "doses"),
      (snap) => {
        latestDoses = [];
        snap.forEach((doc) => {
          const d = doc.data();
          const ts = toDate(d.timestamp);
          if (!ts || ts < today) return;
          latestDoses.push({ id: doc.id, kind: "dose", timestamp: ts, doseAmount: d.amount, doseType: d.type });
        });
        mergeAndSet(latestDoses, latestMeals);
      },
      () => setLoading(false)
    );

    const mealsUnsub = onSnapshot(
      query(
        collection(db, "users", uid, "meal_carb_estimation"),
        where("status", "==", "completed"),
        orderBy("created_at", "desc")
      ),
      (snap) => {
        latestMeals = [];
        snap.forEach((doc) => {
          const d = doc.data();
          const ts = toDate(d.created_at);
          if (!ts || ts < today) return;
          latestMeals.push({ id: doc.id, kind: "meal", timestamp: ts, carbsGrams: d.estimated_carbs_grams, foodsDetected: d.foods_detected ?? [] });
        });
        mergeAndSet(latestDoses, latestMeals);
      },
      () => setLoading(false)
    );

    return () => { dosesUnsub(); mealsUnsub(); };
  }, [uid, mergeAndSet]);

  return { events, loading };
}

function FullLogModal({
  visible,
  onClose,
  events,
  loading,
}: {
  visible: boolean;
  onClose: () => void;
  events: TreatmentEvent[];
  loading: boolean;
}) {
  const insets = useSafeAreaInsets();
  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[modalStyles.root, { backgroundColor: colors.background }]}>
        <View style={[modalStyles.header, { paddingTop: insets.top + spacing[4] }]}>
          <View>
            <Text style={modalStyles.title}>Today's Log</Text>
            <Text style={modalStyles.date}>{dateLabel}</Text>
          </View>
          <Pressable style={modalStyles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>

        {loading ? (
          <View style={modalStyles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : events.length === 0 ? (
          <View style={modalStyles.centered}>
            <View style={[modalStyles.emptyIcon, { backgroundColor: colors.primarySurface }]}>
              <Ionicons name="document-text-outline" size={28} color={colors.primary} />
            </View>
            <Text style={modalStyles.emptyTitle}>No entries yet</Text>
            <Text style={modalStyles.emptyBody}>Doses and meals logged today will appear here.</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[modalStyles.scroll, { paddingBottom: insets.bottom + spacing[6] }]}
          >
            <SummaryStrip events={events} />
            <Text style={modalStyles.sectionLabel}>ENTRIES — NEWEST FIRST</Text>
            <View style={modalStyles.listCard}>
              {events.map((event, idx) => (
                <EventRow
                  key={event.id}
                  event={event}
                  isLast={idx === events.length - 1}
                />
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

export function TreatmentLogCard() {
  const [modalOpen, setModalOpen] = useState(false);
  const { events, loading } = useTreatmentLog();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (loading) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [loading]);

  const compactEvents = events.slice(0, COMPACT_MAX_ROWS);
  const overflow = events.length - COMPACT_MAX_ROWS;

  return (
    <>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <View style={styles.titleIconWrap}>
              <MaterialCommunityIcons name="clipboard-pulse-outline" size={15} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Today's Log</Text>
          </View>
          <Pressable
            style={styles.expandButton}
            onPress={() => setModalOpen(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="expand-outline" size={14} color={colors.primary} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.skeletons}>
            {[0.7, 0.5, 0.6].map((w, i) => (
              <Animated.View
                key={i}
                style={[styles.skeleton, { width: `${w * 100}%`, opacity: pulseAnim }]}
              />
            ))}
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="document-text-outline" size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.emptyTitle}>No entries today</Text>
              <Text style={styles.emptyBody}>Log a meal or dose to see it here.</Text>
            </View>
          </View>
        ) : (
          <View style={styles.list}>
            {compactEvents.map((event, idx) => (
              <EventRow
                key={event.id}
                event={event}
                isLast={idx === compactEvents.length - 1 && overflow <= 0}
                compact
              />
            ))}
            {overflow > 0 && (
              <TouchableOpacity style={styles.viewMore} onPress={() => setModalOpen(true)}>
                <Text style={styles.viewMoreText}>
                  +{overflow} more {overflow === 1 ? "entry" : "entries"}
                </Text>
                <Ionicons name="chevron-forward" size={13} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <FullLogModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        events={events}
        loading={loading}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: layout.screenHorizontalPadding,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  titleIconWrap: {
    width: 26,
    height: 26,
    borderRadius: radius.xs + 2,
    backgroundColor: colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    ...textStyles.headline,
    color: colors.textPrimary,
  },
  expandButton: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingBottom: spacing[2],
  },
  skeletons: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    gap: spacing[2],
  },
  skeleton: {
    height: 11,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceSubtle,
  },
  emptyState: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  emptyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySurface,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  emptyTitle: {
    ...textStyles.calloutSemibold,
    color: colors.textPrimary,
  },
  emptyBody: {
    ...textStyles.caption1,
    color: colors.textTertiary,
    marginTop: 2,
  },
  viewMore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[1],
    paddingVertical: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginHorizontal: spacing[4],
  },
  viewMoreText: {
    ...textStyles.footnoteSemibold,
    color: colors.primary,
  },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
    minHeight: layout.minTouchTarget,
  },
  rowCompact: {
    paddingVertical: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  labels: {
    flex: 1,
    gap: 2,
  },
  primary: {
    ...textStyles.calloutSemibold,
    color: colors.textPrimary,
  },
  primaryCompact: {
    ...textStyles.subheadlineSemibold,
    color: colors.textPrimary,
  },
  secondary: {
    ...textStyles.footnote,
    color: colors.textSecondary,
  },
  secondaryCompact: {
    ...textStyles.caption1,
    color: colors.textSecondary,
  },
  right: {
    alignItems: "flex-end",
    gap: 3,
    flexShrink: 0,
  },
  time: {
    ...textStyles.caption1,
    color: colors.textTertiary,
  },
  glucosePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  glucoseVal: {
    ...textStyles.caption1Medium,
    fontWeight: "700",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing[4] + 32 + spacing[3],
  },
});

const summaryStyles = StyleSheet.create({
  strip: {
    flexDirection: "row",
    marginHorizontal: spacing[4],
    marginBottom: spacing[5],
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  cell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing[3],
    gap: 2,
  },
  cellBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
  value: {
    ...textStyles.title3Semibold,
  },
  label: {
    ...textStyles.caption2Semibold,
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});

const modalStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    ...textStyles.title2Bold,
    color: colors.textPrimary,
  },
  date: {
    ...textStyles.footnote,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingTop: spacing[5],
  },
  sectionLabel: {
    ...textStyles.caption2Semibold,
    color: colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[2],
    marginTop: spacing[2],
  },
  listCard: {
    marginHorizontal: spacing[4],
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.sm,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[10],
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    ...textStyles.title3Semibold,
    color: colors.textPrimary,
  },
  emptyBody: {
    ...textStyles.footnote,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
