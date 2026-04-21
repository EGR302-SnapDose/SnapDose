import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getAuth } from 'firebase/auth';
import {
    collection,
    onSnapshot,
    orderBy,
    query,
    Timestamp,
    where,
} from 'firebase/firestore';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { db } from '@/config/firebase';
import { colors, Colors } from '@/constants/theme';
import { useAccentColor } from '@/context/accent-color';
import { useThemeColor } from '@/hooks/use-theme-color';

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE =
  'https://us-central1-egr302-snapdose.cloudfunctions.net/dexcom-auth';
 
const COMPACT_MAX_ROWS = 3;
const GLUCOSE_MATCH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
 
// ─── Types ────────────────────────────────────────────────────────────────────
 
type EventKind = 'dose' | 'meal';
 
interface TreatmentEvent {
  id: string;
  kind: EventKind;
  timestamp: Date;
  // dose-specific
  doseAmount?: number;
  doseType?: 'Meal' | 'Correction';
  // meal-specific
  carbsGrams?: number;
  foodsDetected?: string[];
  // enriched
  glucoseAtTime?: number | null;
}
 
interface GlucoseRecord {
  value: number;
  systemTime: string;
}
 
// ─── Helpers ─────────────────────────────────────────────────────────────────
 
function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
 
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
 
function findClosestGlucose(
  timestamp: Date,
  records: GlucoseRecord[],
): number | null {
  if (!records.length) return null;
  const t = timestamp.getTime();
  let best = records[0];
  let bestDiff = Math.abs(new Date(records[0].systemTime).getTime() - t);
 
  for (const r of records) {
    const diff = Math.abs(new Date(r.systemTime).getTime() - t);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = r;
    }
  }
  return bestDiff <= GLUCOSE_MATCH_WINDOW_MS ? best.value : null;
}
 
function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  return null;
}
 
function glucoseColor(value: number): string {
  if (value < 70 || value > 180) return colors.glucoseLow;
  if (value > 140) return colors.glucoseHigh;
  return colors.glucoseInRange;
}
 
// ─── Sub-components ───────────────────────────────────────────────────────────
 
interface EventRowProps {
  event: TreatmentEvent;
  accent: string;
  mutedColor: string;
  dividerColor: string;
  isLast: boolean;
  compact?: boolean;
}
 
function EventRow({
  event,
  accent,
  mutedColor,
  dividerColor,
  isLast,
  compact = false,
}: EventRowProps) {
  const isDose = event.kind === 'dose';
 
  const iconNode = isDose ? (
    <MaterialCommunityIcons name="pill" size={compact ? 16 : 18} color={accent} />
  ) : (
    <Ionicons
      name="restaurant-outline"
      size={compact ? 16 : 18}
      color={accent}
    />
  );
 
  const primaryLabel = isDose
    ? `${(event.doseAmount ?? 0).toFixed(1)}u ${event.doseType ?? ''}`
    : `${event.carbsGrams ?? 0}g carbs`;
 
  const secondaryLabel = isDose
    ? event.doseType === 'Meal' ? 'Meal bolus' : 'Correction'
    : event.foodsDetected?.length
    ? event.foodsDetected.slice(0, 2).join(', ')
    : 'Meal';
 
  return (
    <View>
      <View style={[styles.eventRow, compact && styles.eventRowCompact]}>
        {/* Icon column */}
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: accent + '18' },
            compact && styles.iconBadgeCompact,
          ]}
        >
          {iconNode}
        </View>
 
        {/* Labels */}
        <View style={styles.eventLabels}>
          <ThemedText
            style={[styles.primaryLabel, compact && styles.primaryLabelCompact]}
            numberOfLines={1}
          >
            {primaryLabel}
          </ThemedText>
          <ThemedText
            style={[styles.secondaryLabel, { color: mutedColor }, compact && styles.secondaryLabelCompact]}
            numberOfLines={1}
          >
            {secondaryLabel}
          </ThemedText>
        </View>
 
        {/* Right column: time + glucose */}
        <View style={styles.eventRight}>
          <ThemedText
            style={[styles.timeLabel, { color: mutedColor }, compact && styles.timeLabelCompact]}
          >
            {formatTime(event.timestamp)}
          </ThemedText>
          {event.glucoseAtTime != null && (
            <View style={styles.glucosePill}>
              <View
                style={[
                  styles.glucoseDot,
                  { backgroundColor: glucoseColor(event.glucoseAtTime) },
                ]}
              />
              <ThemedText
                style={[
                  styles.glucoseValue,
                  { color: glucoseColor(event.glucoseAtTime) },
                  compact && styles.glucoseValueCompact,
                ]}
              >
                {event.glucoseAtTime}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
 
      {!isLast && (
        <View style={[styles.separator, { backgroundColor: dividerColor }]} />
      )}
    </View>
  );
}
 
interface SummaryBarProps {
  events: TreatmentEvent[];
  accent: string;
  mutedColor: string;
  cardBg: string;
}
 
function SummaryBar({ events, accent, mutedColor, cardBg }: SummaryBarProps) {
  const totalUnits = events
    .filter((e) => e.kind === 'dose')
    .reduce((s, e) => s + (e.doseAmount ?? 0), 0);
  const totalCarbs = events
    .filter((e) => e.kind === 'meal')
    .reduce((s, e) => s + (e.carbsGrams ?? 0), 0);
  const mealCount = events.filter((e) => e.kind === 'meal').length;
  const doseCount = events.filter((e) => e.kind === 'dose').length;
 
  const stats = [
    { label: 'Doses', value: doseCount.toString(), icon: 'pill' as const, isMCI: true },
    { label: 'Units', value: totalUnits.toFixed(1) + 'u', icon: 'pulse' as const, isMCI: true },
    { label: 'Meals', value: mealCount.toString(), icon: 'restaurant-outline' as const, isMCI: false },
    { label: 'Carbs', value: totalCarbs + 'g', icon: 'nutrition-outline' as const, isMCI: false },
  ];
 
  return (
    <View style={[styles.summaryBar, { backgroundColor: accent + '0D' }]}>
      {stats.map((s, i) => (
        <View
          key={s.label}
          style={[
            styles.statCell,
            i < stats.length - 1 && {
              borderRightWidth: StyleSheet.hairlineWidth,
              borderRightColor: accent + '30',
            },
          ]}
        >
          <ThemedText style={[styles.statValue, { color: accent }]}>
            {s.value}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: mutedColor }]}>
            {s.label}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}
 
// ─── Main hook ────────────────────────────────────────────────────────────────
 
function useTreatmentLog() {
  const [events, setEvents] = useState<TreatmentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const glucoseRecordsRef = useRef<GlucoseRecord[]>([]);
 
  const uid = getAuth().currentUser?.uid;
 
  // Fetch glucose history once
  useEffect(() => {
    if (!uid) return;
    fetch(`${API_BASE}/latest?userId=${uid}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.records) glucoseRecordsRef.current = data.records;
      })
      .catch(() => {});
  }, [uid]);
 
  // Merge helper — called after both collections update
  const mergeAndSet = useCallback(
    (
      doses: TreatmentEvent[],
      meals: TreatmentEvent[],
    ) => {
      const merged = [...doses, ...meals]
        .map((e) => ({
          ...e,
          glucoseAtTime: findClosestGlucose(
            e.timestamp,
            glucoseRecordsRef.current,
          ),
        }))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setEvents(merged);
      setLoading(false);
    },
    [],
  );
 
  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
 
    let latestDoses: TreatmentEvent[] = [];
    let latestMeals: TreatmentEvent[] = [];
    const today = todayStart();
 
    // ── Doses ──
    const dosesUnsub = onSnapshot(
      collection(db, 'users', uid, 'doses'),
      (snap) => {
        latestDoses = [];
        snap.forEach((doc) => {
          const d = doc.data();
          const ts = toDate(d.timestamp);
          if (!ts || ts < today) return;
          latestDoses.push({
            id: doc.id,
            kind: 'dose',
            timestamp: ts,
            doseAmount: d.amount as number,
            doseType: d.type as 'Meal' | 'Correction',
          });
        });
        mergeAndSet(latestDoses, latestMeals);
      },
      () => setLoading(false),
    );
 
    // ── Meals ──
    const mealsUnsub = onSnapshot(
      query(
        collection(db, 'users', uid, 'meal_carb_estimation'),
        where('status', '==', 'completed'),
        orderBy('created_at', 'desc'),
      ),
      (snap) => {
        latestMeals = [];
        snap.forEach((doc) => {
          const d = doc.data();
          const ts = toDate(d.created_at);
          if (!ts || ts < today) return;
          latestMeals.push({
            id: doc.id,
            kind: 'meal',
            timestamp: ts,
            carbsGrams: d.estimated_carbs_grams as number,
            foodsDetected: (d.foods_detected as string[]) ?? [],
          });
        });
        mergeAndSet(latestDoses, latestMeals);
      },
      () => setLoading(false),
    );
 
    return () => {
      dosesUnsub();
      mealsUnsub();
    };
  }, [uid, mergeAndSet]);
 
  return { events, loading };
}
 
// ─── Full-screen Modal list ───────────────────────────────────────────────────
 
interface FullLogModalProps {
  visible: boolean;
  onClose: () => void;
  events: TreatmentEvent[];
  loading: boolean;
}
 
function FullLogModal({
  visible,
  onClose,
  events,
  loading,
}: FullLogModalProps) {
  const insets = useSafeAreaInsets();
  const accent = useAccentColor();
  const background = useThemeColor({}, 'background');
  const cardBg = useThemeColor({ light: colors.surfaceSubtle, dark: Colors.dark.surface }, 'surface');
  const mutedColor = useThemeColor(
    { light: colors.textSecondary, dark: Colors.dark.icon },
    'icon',
  );
  const dividerColor = useThemeColor(
    { light: colors.border, dark: Colors.dark.border },
    'border',
  );
  const headerBorderColor = useThemeColor(
    { light: colors.border, dark: Colors.dark.border },
    'border',
  );
 
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
 
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 70,
          friction: 12,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(60);
      fadeAnim.setValue(0);
    }
  }, [visible]);
 
  const today = new Date();
  const dateLabel = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
 
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView
        style={[styles.modalRoot, { paddingTop: insets.top }]}
      >
        {/* Header */}
        <View
          style={[
            styles.modalHeader,
            { borderBottomColor: headerBorderColor },
          ]}
        >
          <View style={styles.modalTitleBlock}>
            <ThemedText style={styles.modalTitle}>Today's Log</ThemedText>
            <ThemedText style={[styles.modalDate, { color: mutedColor }]}>
              {dateLabel}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: cardBg }]}
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={18} color={mutedColor} />
          </TouchableOpacity>
        </View>
 
        {loading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color={accent} />
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyState}>
            <View
              style={[styles.emptyIcon, { backgroundColor: accent + '15' }]}
            >
              <Ionicons
                name="document-text-outline"
                size={32}
                color={accent}
              />
            </View>
            <ThemedText style={styles.emptyTitle}>No entries yet</ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: mutedColor }]}>
              Doses and meals logged today will appear here.
            </ThemedText>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.modalScroll,
              { paddingBottom: insets.bottom + 24 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Summary bar */}
            <SummaryBar
              events={events}
              accent={accent}
              mutedColor={mutedColor}
              cardBg={cardBg}
            />
 
            {/* Timeline */}
            <View style={styles.timelineLabel}>
              <View
                style={[styles.timelineDot, { backgroundColor: accent }]}
              />
              <ThemedText
                style={[styles.timelineLabelText, { color: mutedColor }]}
              >
                CHRONOLOGICAL — NEWEST FIRST
              </ThemedText>
            </View>
 
            <View
              style={[
                styles.fullListCard,
                { backgroundColor: cardBg },
              ]}
            >
              {events.map((event, idx) => (
                <EventRow
                  key={event.id}
                  event={event}
                  accent={accent}
                  mutedColor={mutedColor}
                  dividerColor={dividerColor}
                  isLast={idx === events.length - 1}
                  compact={false}
                />
              ))}
            </View>
          </ScrollView>
        )}
      </ThemedView>
    </Modal>
  );
}
 
// ─── Compact widget ───────────────────────────────────────────────────────────
 
export function TreatmentLogCard() {
  const [modalOpen, setModalOpen] = useState(false);
  const { events, loading } = useTreatmentLog();
 
  const accent = useAccentColor();
  const borderColor = useThemeColor(
    { light: colors.border, dark: Colors.dark.border },
    'border',
  );
  const mutedColor = useThemeColor(
    { light: colors.textSecondary, dark: Colors.dark.icon },
    'icon',
  );
  const dividerColor = useThemeColor(
    { light: colors.border, dark: Colors.dark.border },
    'border',
  );
  const arrowBg = useThemeColor(
    { light: colors.surfaceSubtle, dark: Colors.dark.surface },
    'surface',
  );
 
  const compactEvents = events.slice(0, COMPACT_MAX_ROWS);
  const overflow = events.length - COMPACT_MAX_ROWS;
 
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (loading) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [loading]);
 
  return (
    <>
      <View style={[styles.card, { borderColor }]}>
        {/* Card header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <MaterialCommunityIcons
              name="clipboard-pulse-outline"
              size={17}
              color={accent}
            />
            <ThemedText style={styles.cardTitle}>Today's Log</ThemedText>
          </View>
 
          <TouchableOpacity
            style={[styles.expandButton, { backgroundColor: arrowBg }]}
            onPress={() => setModalOpen(true)}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityLabel="Expand treatment log"
          >
            <Ionicons name="expand-outline" size={15} color={accent} />
          </TouchableOpacity>
        </View>
 
        {/* Body */}
        {loading ? (
          <View style={styles.skeletonContainer}>
            {[0.7, 0.55, 0.65].map((w, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.skeletonRow,
                  { backgroundColor: borderColor, opacity: pulseAnim },
                  { width: `${w * 100}%` },
                ]}
              />
            ))}
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyCompact}>
            <ThemedText style={[styles.emptyCompactText, { color: mutedColor }]}>
              No entries today
            </ThemedText>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {compactEvents.map((event, idx) => (
              <EventRow
                key={event.id}
                event={event}
                accent={accent}
                mutedColor={mutedColor}
                dividerColor={dividerColor}
                isLast={idx === compactEvents.length - 1 && overflow <= 0}
                compact
              />
            ))}
 
            {overflow > 0 && (
              <TouchableOpacity
                style={[styles.viewAllRow, { borderTopColor: dividerColor }]}
                onPress={() => setModalOpen(true)}
              >
                <ThemedText style={[styles.viewAllText, { color: accent }]}>
                  +{overflow} more entr{overflow === 1 ? 'y' : 'ies'}
                </ThemedText>
                <Ionicons name="chevron-forward" size={14} color={accent} />
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
 
// ─── Styles ───────────────────────────────────────────────────────────────────
 
const styles = StyleSheet.create({
  // ── Compact card ──────────────────────────────────────────────────
  card: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 10,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  expandButton: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    paddingBottom: 4,
  },
  skeletonContainer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
  },
  skeletonRow: {
    height: 12,
    borderRadius: 6,
  },
  emptyCompact: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    alignItems: 'center',
  },
  emptyCompactText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 14,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
 
  // ── Event row (shared) ────────────────────────────────────────────
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  eventRowCompact: {
    paddingVertical: 9,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconBadgeCompact: {
    width: 28,
    height: 28,
    borderRadius: 7,
  },
  eventLabels: {
    flex: 1,
    gap: 1,
  },
  primaryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryLabelCompact: {
    fontSize: 13,
  },
  secondaryLabel: {
    fontSize: 12,
  },
  secondaryLabelCompact: {
    fontSize: 11,
  },
  eventRight: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  timeLabelCompact: {
    fontSize: 11,
  },
  glucosePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  glucoseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  glucoseValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  glucoseValueCompact: {
    fontSize: 11,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 14,
  },
 
  // ── Summary bar ───────────────────────────────────────────────────
  summaryBar: {
    flexDirection: 'row',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
 
  // ── Modal ─────────────────────────────────────────────────────────
  modalRoot: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitleBlock: {
    gap: 2,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalDate: {
    fontSize: 13,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    paddingTop: 20,
  },
  fullListCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  timelineLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  timelineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  timelineLabelText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
});