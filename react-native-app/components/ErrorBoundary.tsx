import { Colors } from "@/constants/theme";
import { router } from "expo-router";
import React from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error:    Error | null;
}

// ---------------------------------------------------------------------------
// ErrorBoundary — class component (React requires class for error boundaries)
// ---------------------------------------------------------------------------
export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    // Catch any unhandled JS error in the tree below
    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    // Log the error + stack trace for debugging
    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error("=== ErrorBoundary caught an error ===");
        console.error("Error:", error.message);
        console.error("Stack:", error.stack);
        console.error("Component stack:", info.componentStack);

        // TODO (time permits): log to Firestore
        // logErrorToFirestore({ message: error.message, stack: error.stack });
    }

    // Reset the boundary and navigate home
    handleTryAgain = () => {
        this.setState({ hasError: false, error: null });
        router.replace("/");
    };

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        // Use light theme colours — error screen is always light per ticket spec
        const theme = Colors.light;

        return (
            <SafeAreaView
                style={[styles.safe, { backgroundColor: theme.background }]}
                edges={["top", "bottom"]}
            >
                <View style={styles.container}>
                    {/* Icon */}
                    <View style={[styles.iconWrap, { backgroundColor: "#FFF0F0" }]}>
                        <Text style={styles.iconText}>⚠️</Text>
                    </View>

                    {/* Heading */}
                    <Text style={[styles.title, { color: theme.text }]}>
                        Something went wrong
                    </Text>

                    {/* Friendly message */}
                    <Text style={[styles.message, { color: theme.icon }]}>
                        An unexpected error occurred. Your data is safe — please
                        try again or report the issue if it keeps happening.
                    </Text>

                    {/* Error detail (dev-friendly, subtle) */}
                    {this.state.error?.message ? (
                        <View style={[styles.errorBox, { backgroundColor: "#F2F2F7" }]}>
                            <Text style={[styles.errorDetail, { color: theme.icon }]} numberOfLines={3}>
                                {this.state.error.message}
                            </Text>
                        </View>
                    ) : null}

                    {/* Try Again — primary action */}
                    <Pressable
                        style={[styles.primaryButton, { backgroundColor: theme.tint }]}
                        onPress={this.handleTryAgain}
                    >
                        <Text style={styles.primaryButtonText}>Try Again</Text>
                    </Pressable>

                    {/* Report Issue — secondary action */}
                    <Pressable
                        style={styles.secondaryButton}
                        onPress={() =>
                            console.warn(
                                "Report Issue tapped — wire up feedback link here",
                            )
                        }
                    >
                        <Text style={[styles.secondaryButtonText, { color: theme.tint }]}>
                            Report Issue
                        </Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
    safe: { flex: 1 },
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        gap: 16,
    },

    iconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    iconText: { fontSize: 36 },

    title: {
        fontSize: 22,
        fontWeight: "700",
        textAlign: "center",
    },
    message: {
        fontSize: 15,
        textAlign: "center",
        lineHeight: 22,
    },

    // Subtle error detail box
    errorBox: {
        width: "100%",
        borderRadius: 10,
        padding: 12,
        marginTop: 4,
    },
    errorDetail: {
        fontSize: 12,
        fontFamily: "monospace",
        lineHeight: 18,
    },

    // Primary button — HIG filled rounded
    primaryButton: {
        width: "100%",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 8,
    },
    primaryButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        letterSpacing: 0.2,
    },

    // Secondary button — text only
    secondaryButton: {
        paddingVertical: 12,
        alignItems: "center",
    },
    secondaryButtonText: {
        fontSize: 15,
        fontWeight: "500",
    },
});