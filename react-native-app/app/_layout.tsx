import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        // ErrorBoundary wraps the entire app — catches any unhandled JS error
        // and renders a friendly fallback screen instead of a white crash
        <ErrorBoundary>
            <ThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            >
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index"           options={{ headerShown: false }} />
                    <Stack.Screen name="auth/login"      options={{ headerShown: false }} />
                    <Stack.Screen name="auth/register"   options={{ headerShown: false }} />
                    <Stack.Screen name="onboarding" />
                    <Stack.Screen name="(drawer)" />
                    <Stack.Screen
                        name="modal"
                        options={{
                            presentation:  "modal",
                            headerShown:   true,
                            title:         "Modal",
                        }}
                    />
                </Stack>
                <StatusBar style="auto" />
            </ThemeProvider>
        </ErrorBoundary>
    );
}