import { useThemeColor } from "@/hooks/use-theme-color";
import { Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";

export function QuickActions() {
    const tint = useThemeColor({}, "tint");
    const buttonBg = useThemeColor(
        { light: "#F5F5F5", dark: "#1E2022" },
        "background",
    );
    const accent = useThemeColor({}, "accent");

    return (
        <View style={styles.container}>
            <Pressable
                style={[styles.button, { backgroundColor: accent }]}
                onPress={() => {}}
            >
                <ThemedText style={styles.buttonTextPrimary}>
                    Snap a Meal
                </ThemedText>
            </Pressable>

            <Pressable
                style={[
                    styles.button,
                    {
                        backgroundColor: buttonBg,
                        borderColor: accent,
                        borderWidth: 1,
                    },
                ]}
                onPress={() => {}}
            >
                <ThemedText
                    style={[styles.buttonTextSecondary, { color: accent }]}
                >
                    Dose Insulin
                </ThemedText>
            </Pressable>
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
    buttonTextPrimary: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    buttonTextSecondary: {
        fontSize: 16,
        fontWeight: "600",
    },
});
