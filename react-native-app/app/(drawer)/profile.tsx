import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

export default function ProfileScreen() {
    const colorScheme = useColorScheme();
    const tint = Colors[colorScheme ?? "light"].tint;
    const [displayName, setDisplayName] = useState<string>("");

    useEffect(() => {
        AsyncStorage.getItem("onboarding_displayName").then((name) => {
            if (name) setDisplayName(name);
        });
    }, []);

    const initials = displayName
        ? displayName
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
        : "?";

    return (
        <ThemedView style={styles.container}>
            <View style={[styles.avatar, { backgroundColor: tint }]}>
                <ThemedText style={styles.initials}>{initials}</ThemedText>
            </View>
            <ThemedText style={styles.name}>
                {displayName || "Unknown User"}
            </ThemedText>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        paddingTop: 60,
        gap: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: "center",
        justifyContent: "center",
    },
    initials: {
        fontSize: 36,
        fontWeight: "700",
        color: "#fff",
    },
    name: {
        fontSize: 22,
        fontWeight: "600",
    },
});
