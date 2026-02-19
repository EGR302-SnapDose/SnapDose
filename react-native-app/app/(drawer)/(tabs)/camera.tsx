import { StyleSheet, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CameraScreen() {
    const insets = useSafeAreaInsets();
    const viewfinderBg = useThemeColor(
        { light: "#f0f0f0", dark: "#0a0a0a" },
        "background",
    );
    const iconColor = useThemeColor(
        { light: "#999999", dark: "#555555" },
        "icon",
    );
    const mutedColor = useThemeColor(
        { light: "#666666", dark: "#888888" },
        "icon",
    );
    const shutterBorderColor = useThemeColor(
        { light: "#BBBBBB", dark: "#555555" },
        "icon",
    );
    const shutterInnerColor = useThemeColor(
        { light: "#CCCCCC", dark: "#333333" },
        "icon",
    );

    return (
        <ThemedView style={styles.container}>
            <View
                style={[styles.viewfinder, { backgroundColor: viewfinderBg }]}
            >
                <View style={styles.promptContainer}>
                    <IconSymbol
                        name="camera"
                        size={72}
                        color={iconColor}
                        style={styles.cameraIcon}
                    />
                    <ThemedText
                        type="defaultSemiBold"
                        style={styles.promptTitle}
                    >
                        Point at your food
                    </ThemedText>
                    <ThemedText
                        style={[styles.promptSubtitle, { color: mutedColor }]}
                    >
                        AI will analyze nutrition
                    </ThemedText>
                </View>
                <View
                    style={[
                        styles.shutterWrapper,
                        { paddingBottom: insets.bottom + 16 },
                    ]}
                >
                    <View
                        style={[
                            styles.shutterOuter,
                            { borderColor: shutterBorderColor },
                        ]}
                    >
                        <View
                            style={[
                                styles.shutterInner,
                                { backgroundColor: shutterInnerColor },
                            ]}
                        />
                    </View>
                </View>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    viewfinder: {
        flex: 1,
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 40,
    },
    promptContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    cameraIcon: {
        marginBottom: 8,
        opacity: 0.5,
    },
    promptTitle: {
        fontSize: 22,
        fontWeight: "600",
    },
    promptSubtitle: {
        fontSize: 14,
    },
    shutterWrapper: {
        alignItems: "center",
        paddingBottom: 24,
    },
    shutterOuter: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 3,
        alignItems: "center",
        justifyContent: "center",
    },
    shutterInner: {
        width: 54,
        height: 54,
        borderRadius: 27,
    },
});
