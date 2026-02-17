import { Tabs } from "expo-router";
import React from "react";
import { Pressable } from "react-native";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const navigation = useNavigation();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
                headerShown: false,
                tabBarButton: HapticTab,
                headerLeft: () => (
                    <Pressable
                        onPress={() =>
                            navigation.dispatch(DrawerActions.toggleDrawer())
                        }
                        style={{ marginLeft: 16 }}
                    >
                        <IconSymbol
                            name="chevron.right"
                            size={24}
                            color={Colors[colorScheme ?? "light"].icon}
                        />
                    </Pressable>
                ),
            }}
        >
            <Tabs.Screen
                name="camera"
                options={{
                    title: "Snap",
                    tabBarIcon: ({ color }) => (
                        <IconSymbol size={28} name="camera.fill" color={color} />
                    )
                }}
            />
            <Tabs.Screen
                name="index"
                options={{
                    title: "SnapDose",
                    tabBarIcon: ({ color }) => (
                        <IconSymbol size={28} name="house.fill" color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="dose"
                options={{
                    title: "Dose Insulin",
                    tabBarIcon: ({ color }) => (
                        <IconSymbol
                            size={28}
                            name="paperplane.fill"
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
