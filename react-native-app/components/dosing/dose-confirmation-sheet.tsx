import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { hapticError, hapticHeavy, hapticSuccess } from "@/utils/haptics";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Modal,
    PanResponder,
    Pressable,
    StyleSheet,
    View,
} from "react-native";

interface DoseConfirmationSheetProps {
  visible: boolean;
  mode: "meal" | "correction";
  dose: number;
  carbs?: number;
  carbRatio?: number;
  correctionDose?: number;
  correctionFactor?: number;
  correctionInsulin?: number;
  insulinOnBoard: number;
  onConfirm: () => void;
  onCancel: () => void;
  accentColor?: string;
}

export function DoseConfirmationSheet({
  visible,
  mode,
  dose,
  carbs,
  carbRatio,
  correctionDose,
  correctionFactor,
  correctionInsulin,
  insulinOnBoard,
  onConfirm,
  onCancel,
  accentColor,
}: DoseConfirmationSheetProps) {
  const themeAccent = useThemeColor({}, "accent");
  const accent = accentColor || themeAccent;
  const backgroundColor = useThemeColor(
    { light: "#FFFFFF", dark: "#1C1C1E" },
    "background",
  );
  const borderColor = useThemeColor(
    { light: "#E5E5E5", dark: "#2A2A2A" },
    "icon",
  );
  const warningBgColor = useThemeColor(
    { light: "#f6eb8a", dark: "#a08000aa" },
    "background",
  );
  const warningTextColor = useThemeColor(
    { light: "#333333", dark: "#ffd11a" },
    "text",
  );

  const [dosingPhase, setDosingPhase] = useState<
    "confirming" | "dosing" | "complete" | "cancelled"
  >("confirming");
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const sliderWidthRef = useRef(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const slidePosition = useRef(0);
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const dosingTimerRef = useRef<number | null>(null);
  const warningTimerRef = useRef<number | null>(null);
  const SLIDER_THRESHOLD = 0.85;

  useEffect(() => {
    if (!visible) {
      slideAnim.setValue(0);
      slidePosition.current = 0;
      setDosingPhase("confirming");
      setWarningAcknowledged(false);
      setShowConfirmButton(false);
      checkmarkScale.setValue(0);
      checkmarkOpacity.setValue(0);
      if (dosingTimerRef.current) {
        clearTimeout(dosingTimerRef.current);
        dosingTimerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
    } else {
      warningTimerRef.current = setTimeout(() => {
        setShowConfirmButton(true);
      }, 3000);
    }
    return () => {
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
    };
  }, [visible]);

  useEffect(() => {
    if (dosingPhase === "dosing") {
      dosingTimerRef.current = setTimeout(() => {
        onConfirm();
        setDosingPhase("complete");
      }, 4000);

      return () => {
        if (dosingTimerRef.current) {
          clearTimeout(dosingTimerRef.current);
          dosingTimerRef.current = null;
        }
      };
    } else if (dosingPhase === "complete") {
      hapticSuccess();
      Animated.parallel([
        Animated.spring(checkmarkScale, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(checkmarkOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (dosingPhase === "cancelled") {
      hapticError();
      Animated.parallel([
        Animated.spring(checkmarkScale, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(checkmarkOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [dosingPhase]);

  const handleCancelDosing = () => {
    if (dosingTimerRef.current) {
      clearTimeout(dosingTimerRef.current);
      dosingTimerRef.current = null;
    }
    setDosingPhase("cancelled");
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => {
        slideAnim.setOffset(slidePosition.current);
        slideAnim.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const maxSlide = sliderWidthRef.current - 60;
        const newValue = Math.max(0, Math.min(gestureState.dx, maxSlide));
        slideAnim.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        slideAnim.flattenOffset();
        const maxSlide = sliderWidthRef.current - 60;
        const currentValue = slidePosition.current + gestureState.dx;
        const clampedValue = Math.max(0, Math.min(currentValue, maxSlide));
        const progress = clampedValue / maxSlide;

        if (progress >= SLIDER_THRESHOLD) {
          slidePosition.current = maxSlide;
          hapticHeavy();
          Animated.spring(slideAnim, {
            toValue: maxSlide,
            useNativeDriver: false,
          }).start(() => {
            setDosingPhase("dosing");
          });
        } else {
          slidePosition.current = 0;
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <Pressable
        style={styles.overlay}
        onPress={dosingPhase === "confirming" ? onCancel : undefined}
      >
        <Pressable
          style={[
            dosingPhase === "confirming" ? styles.sheet : styles.dosingSheet,
            { backgroundColor },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />

          {dosingPhase === "confirming" ? (
            <>
              <View style={styles.header}>
                <ThemedText style={styles.title}>Confirm Your Dose</ThemedText>
              </View>

              <View style={[styles.doseInfo, { borderColor }]}>
                <View style={styles.doseRow}>
                  <ThemedText style={styles.doseLabel}>
                    {mode === "meal" ? "Adjusted Dose" : "Net Dose"}
                  </ThemedText>
                  <ThemedText style={[styles.doseValue, { color: accent }]}>
                    {dose.toFixed(1)}u
                  </ThemedText>
                </View>

                <View style={styles.divider} />

                {mode === "meal" ? (
                  <>
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>Carbs:</ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {carbs}g
                      </ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>
                        Carb Ratio:
                      </ThemedText>
                      <ThemedText style={styles.detailValue}>
                        1:{carbRatio}
                      </ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>
                        Correction ({correctionFactor}):
                      </ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {correctionDose !== undefined && correctionDose !== 0
                          ? `${correctionDose > 0 ? "+" : ""}${correctionDose.toFixed(1)}u`
                          : "0.0u"}
                      </ThemedText>
                    </View>
                  </>
                ) : (
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>
                      Correction Insulin:
                    </ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {correctionInsulin?.toFixed(1)}u
                    </ThemedText>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>
                    Insulin on Board:
                  </ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {insulinOnBoard.toFixed(1)}u
                  </ThemedText>
                </View>

                <View style={styles.divider} />

                <View style={styles.mathRow}>
                  <ThemedText style={styles.mathText}>
                    {mode === "meal"
                      ? correctionDose !== undefined && correctionDose !== 0
                        ? `${(carbs! / carbRatio!).toFixed(1)}u ${correctionDose > 0 ? "+" : ""}${correctionDose.toFixed(1)}u - ${insulinOnBoard.toFixed(1)}u = ${dose.toFixed(1)}u`
                        : `${(carbs! / carbRatio!).toFixed(1)}u - ${insulinOnBoard.toFixed(1)}u = ${dose.toFixed(1)}u`
                      : `${correctionInsulin?.toFixed(1)}u - ${insulinOnBoard.toFixed(1)}u = ${dose.toFixed(1)}u`}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.sliderContainer}>
                {warningAcknowledged && (
                  <ThemedText style={styles.sliderLabel}>
                    Slide to Confirm
                  </ThemedText>
                )}

                {!warningAcknowledged ? (
                  <View
                    style={[
                      styles.warningOverlay,
                      { backgroundColor: warningBgColor },
                    ]}
                  >
                    <ThemedText
                      style={[styles.warningText, { color: warningTextColor }]}
                    >
                      ⚠️ Always verify dose before delivery. Consult your
                      healthcare provider for proper dosing.
                    </ThemedText>
                    {showConfirmButton && (
                      <Pressable
                        style={[
                          styles.warningButton,
                          { backgroundColor: accent },
                        ]}
                        onPress={() => setWarningAcknowledged(true)}
                      >
                        <ThemedText style={styles.warningButtonText}>
                          I Understand
                        </ThemedText>
                      </Pressable>
                    )}
                  </View>
                ) : (
                  <View
                    style={[
                      styles.sliderTrack,
                      { backgroundColor: accent + "20" },
                    ]}
                    onLayout={(e) => {
                      sliderWidthRef.current = e.nativeEvent.layout.width;
                    }}
                  >
                    <Animated.View
                      style={[
                        styles.sliderTrail,
                        {
                          backgroundColor: accent + "60",
                          width: slideAnim.interpolate({
                            inputRange: [0, 1000],
                            outputRange: [60, 1060],
                            extrapolate: "clamp",
                          }),
                        },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.sliderThumb,
                        {
                          backgroundColor: accent,
                          transform: [{ translateX: slideAnim }],
                        },
                      ]}
                      {...panResponder.panHandlers}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={24}
                        color="#FFFFFF"
                      />
                    </Animated.View>
                  </View>
                )}
              </View>

              <Pressable style={styles.cancelButton} onPress={onCancel}>
                <ThemedText style={styles.cancelText}>Cancel</ThemedText>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.dosingHeader}>
                <ThemedText style={styles.dosingTitle}>
                  {dosingPhase === "dosing"
                    ? "Dosing"
                    : dosingPhase === "complete"
                      ? "Complete"
                      : "Cancelled"}
                </ThemedText>
              </View>

              <View style={styles.statusContainer}>
                {dosingPhase === "dosing" ? (
                  <ActivityIndicator size="large" color={accent} />
                ) : (
                  <Animated.View
                    style={[
                      styles.checkmarkCircle,
                      {
                        borderColor:
                          dosingPhase === "complete" ? accent : "#FF3B30",
                      },
                      {
                        opacity: checkmarkOpacity,
                        transform: [{ scale: checkmarkScale }],
                      },
                    ]}
                  >
                    {dosingPhase === "complete" ? (
                      <Ionicons name="checkmark" size={48} color={accent} />
                    ) : (
                      <Ionicons name="close" size={48} color="#FF3B30" />
                    )}
                  </Animated.View>
                )}
              </View>

              {dosingPhase === "dosing" ? (
                <Pressable
                  style={[
                    styles.cancelDosingButton,
                    { borderColor: "#FF3B30" },
                  ]}
                  onPress={handleCancelDosing}
                >
                  <ThemedText
                    style={[styles.cancelDosingText, { color: "#FF3B30" }]}
                  >
                    Cancel
                  </ThemedText>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.closeButton, { backgroundColor: accent }]}
                  onPress={onCancel}
                >
                  <ThemedText style={styles.closeButtonText}>Close</ThemedText>
                </Pressable>
              )}
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  dosingSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    minHeight: 280,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D1D6",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 12,
  },
  dosingHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  dosingTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 22,
  },
  statusContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 32,
  },
  checkmarkCircle: {
    width: 125,
    height: 125,
    borderRadius: 100,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  doseInfo: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  doseRow: {
    alignItems: "center",
    marginBottom: 8,
  },
  doseLabel: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 4,
  },
  doseValue: {
    fontSize: 48,
    fontWeight: "700",
    lineHeight: 60,
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 10,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 15,
    opacity: 0.7,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  mathRow: {
    alignItems: "center",
    paddingVertical: 4,
  },
  mathText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "monospace",
    opacity: 0.8,
  },
  sliderContainer: {
    marginBottom: 24,
    position: "relative",
  },
  sliderLabel: {
    textAlign: "center",
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 12,
  },
  sliderTrack: {
    height: 60,
    borderRadius: 30,
    position: "relative",
    justifyContent: "center",
    overflow: "hidden",
  },
  sliderTrail: {
    position: "absolute",
    left: 0,
    top: 0,
    height: 60,
    borderRadius: 30,
  },
  sliderThumb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    left: 0,
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.6,
  },
  cancelDosingButton: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    marginTop: 24,
  },
  cancelDosingText: {
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  warningOverlay: {
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: "#DAA520",
  },
  warningText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },
  warningButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  warningButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
