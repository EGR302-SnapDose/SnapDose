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
    const pageBg = useThemeColor({ light: "#FFFFFF", dark: "#121212" }, "background");
    const accent = useAccentColor();

    return (
        <View style={styles.container}>
            <AnimatedButton
                onPress={() => router.push("/(drawer)/(tabs)/camera" as any)}
                accent={accent}
                buttonBg={pageBg}
            >
                <ThemedText style={[styles.buttonText, { color: accent }]}>
                    Snap a Meal
                </ThemedText>
            </AnimatedButton>

            <AnimatedButton
                onPress={() => router.push("/(drawer)/(tabs)/dose" as any)}
                accent={accent}
                buttonBg={pageBg}
            >
                <ThemedText style={[styles.buttonText, { color: accent }]}>
                    Dose Insulin
                </ThemedText>
            </AnimatedButton>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 16,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "600",
    },
});