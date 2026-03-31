import { colors, layout, radius, spacing, textStyles } from "@/constants/theme";
import { router } from "expo-router";
import { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start();

  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();

  return (
    <Animated.View style={[styles.primaryWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.primaryButton}
      >
        <View style={styles.primaryInner}>
          <Text style={styles.primaryText}>{label}</Text>
          <View style={styles.primaryArrow}>
            <Text style={styles.primaryArrowText}>→</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start();

  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();

  return (
    <Animated.View style={[styles.secondaryWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function QuickActions() {
  return (
    <View style={styles.container}>
      <PrimaryButton
        label="Snap a Meal"
        onPress={() => router.push("/(drawer)/(tabs)/camera" as any)}
      />
      <SecondaryButton
        label="Dose Insulin"
        onPress={() => router.push("/(drawer)/(tabs)/dose" as any)}
      />
    </View>
  );
}

const BUTTON_HEIGHT = 54;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: spacing[3],
    marginHorizontal: layout.screenHorizontalPadding,
  },

  // Primary — filled blue, arrow badge
  primaryWrap: {
    flex: 1.1,
  },
  primaryButton: {
    height: BUTTON_HEIGHT,
    borderRadius: radius.xl,
    backgroundColor: colors.buttonPrimary,
    justifyContent: "center",
    paddingHorizontal: spacing[4],
    shadowColor: colors.buttonPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  primaryText: {
    ...textStyles.calloutSemibold,
    color: colors.textInverse,
  },
  primaryArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryArrowText: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
  },

  // Secondary — surface with border
  secondaryWrap: {
    flex: 1,
  },
  secondaryButton: {
    height: BUTTON_HEIGHT,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[3],
  },
  secondaryText: {
    ...textStyles.calloutSemibold,
    color: colors.textPrimary,
  },
});
