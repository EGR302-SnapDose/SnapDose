import { colors, Colors, radius, spacing, typography } from "@/constants/theme";
import { useAccentColor } from "@/context/accent-color";
import { useThemeColor } from "@/hooks/use-theme-color";
import { router } from "expo-router";
import { useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";

function AnimatedButton({ onPress, accent, buttonBg, children }: {
    onPress: () => void;
    accent: string;
    buttonBg: string;
    children: React.ReactNode;
}) {
    const scale = useRef(new Animated.Value(1)).current;
    const colorProgress = useRef(new Animated.Value(0)).current;

    const handlePressIn = () => {
        Animated.parallel([
            Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 50, bounciness: 4 }),
            Animated.timing(colorProgress, { toValue: 1, duration: 100, useNativeDriver: false }),
        ]).start();
    };

    const handlePressOut = () => {
        Animated.parallel([
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }),
            Animated.timing(colorProgress, { toValue: 0, duration: 150, useNativeDriver: false }),
        ]).start();
    };

    const backgroundColor = colorProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [buttonBg, accent],
    });

    return (
        <Animated.View style={{ transform: [{ scale }], flex: 1 }}>
            <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
                <Animated.View style={[styles.button, { backgroundColor, borderColor: accent, borderWidth: 1 }]}>
                    {children}
                </Animated.View>
            </Pressable>
        </Animated.View>
    );
}

export function QuickActions() {
    const pageBg = useThemeColor({ light: colors.surface, dark: Colors.dark.surface }, "surface");
    const accent = useAccentColor();

    return (
        <View style={styles.container}>
            <AnimatedButton
                onPress={() => router.push("/(drawer)/(tabs)/camera" as any)}
                accent={accent}
                buttonBg={pageBg}
            >
                <ThemedText style={[styles.buttonText, { color: accent }]}>
                    Log Meal
                </ThemedText>
            </AnimatedButton>

            <AnimatedButton
                onPress={() => router.push("/(drawer)/(tabs)/dose" as any)}
                accent={accent}
                buttonBg={pageBg}
            >
                <ThemedText style={[styles.buttonText, { color: accent }]}>
                    Dose
                </ThemedText>
            </AnimatedButton>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        gap: spacing[3],
        marginBottom: spacing[4],
    },
    button: {
        flex: 1,
        paddingVertical: spacing[3] + spacing[1],
        borderRadius: radius.lg,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonText: {
        fontSize: typography.sizes.callout,
        fontWeight: "600",
    },
});