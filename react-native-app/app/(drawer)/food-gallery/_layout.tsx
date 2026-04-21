import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { DrawerActions } from "@react-navigation/native";
import { Stack, useNavigation } from "expo-router";
import { TouchableOpacity } from "react-native";

export default function FoodGalleryLayout() {
  const c = useThemeColors();
  const navigation = useNavigation();

  return (
    <Stack
      screenOptions={{
        animation: "slide_from_right",
        animationDuration: 300,
        headerStyle: { backgroundColor: c.background },
        headerTitleStyle: { color: c.textPrimary },
        headerTintColor: c.textPrimary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: c.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Food Gallery",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.dispatch(DrawerActions.toggleDrawer())
              }
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ paddingHorizontal: 4 }}
            >
              <IconSymbol
                name="line.horizontal.3"
                size={22}
                color={c.textPrimary}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="meal-detail"
        options={{
          title: "Meal",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}
