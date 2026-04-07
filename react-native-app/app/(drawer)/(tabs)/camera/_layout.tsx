import { Stack } from "expo-router";

export default function CameraLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animationDuration: 300 }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="results"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}