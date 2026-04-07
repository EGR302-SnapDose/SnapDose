import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Alert, TouchableOpacity, View } from "react-native";
import { logout } from "../../../services/logout-service";

function LogoutButton() {
    const handleLogout = () => { 
        Alert.alert("Logout", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: async () => await logout(),
            },
        ]);
    };

    return (
        <View style={{ marginRight: 12 }}>
            <TouchableOpacity
                onPress={handleLogout}
                style={{
                    backgroundColor: "#FF3B30",
                    borderRadius: 8,
                    padding: 6,
                }}
            >
                <Ionicons name="log-out-outline" size={22} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: colors.tabActive,
                headerShown: false,
                tabBarButton: HapticTab,
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
            <Tabs.Screen
                name="food-gallery"
                options={{
                    title: "Food Gallery",
                    href: null, // hides from tab bar, keeps bottom nav when on this screen
                }}
            />
        </Tabs>
    );
}
