import { Tabs } from "expo-router";
import React from "react";
import { Pressable, TouchableOpacity, View, Alert } from "react-native";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../../../services/logout-service';

function LogoutButton() {
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => await logout(),
      },
    ]);
  };

  return (
    <View style={{ marginRight: 12 }}>
      <TouchableOpacity
        onPress={handleLogout}
        style={{ backgroundColor: '#FF3B30', borderRadius: 8, padding: 6 }}
      >
        <Ionicons name="log-out-outline" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
export default function TabLayout() {
    const colorScheme = useColorScheme();
    const navigation = useNavigation();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
                headerShown: true,
headerRight: () => <LogoutButton />,
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
    <Tabs.Screen
    name="settings"
    options={{
        title: "Settings",
        tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gearshape.fill" color={color} />
        ),
    }}
/>
        </Tabs>
    );
}
