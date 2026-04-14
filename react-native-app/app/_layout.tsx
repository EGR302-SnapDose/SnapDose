import { AccentColorProvider } from "@/context/accent-color";
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
    <AccentColorProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            animationDuration: 300,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/register" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(drawer)" />
          <Stack.Screen
            name="modal"
            options={{
              presentation: "modal",
              animation: "slide_from_bottom",
              headerShown: true,
              title: "Modal",
            }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AccentColorProvider>
  );
}