import { Stack } from "expo-router";

export default function FoodGalleryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animationDuration: 300 }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="meal-detail"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}