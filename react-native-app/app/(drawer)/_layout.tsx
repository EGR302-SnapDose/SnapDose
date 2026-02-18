import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
    DrawerContentScrollView,
    DrawerItemList,
} from "@react-navigation/drawer";
import { Alert, TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { logout } from "@/services/logout-service";
import { SafeAreaView } from "react-native-safe-area-context";

function CustomDrawerContent(props: any) {
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
        <View style={{ flex: 1 }}>
            <DrawerContentScrollView
                {...props}
                contentContainerStyle={{ flexGrow: 1 }}
            >
                <DrawerItemList {...props} />
            </DrawerContentScrollView>
            <SafeAreaView edges={["bottom"]}>
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    footer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "#ccc",
    },
    logoutButton: {
        backgroundColor: "#FF3B30",
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: "center",
    },
    logoutText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 15,
    },
});

export default function DrawerLayout() {
    const colorScheme = useColorScheme();
    const tint = Colors[colorScheme ?? "light"].tint;
    const backgroundColor = Colors[colorScheme ?? "light"].background;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Drawer
                drawerContent={(props) => <CustomDrawerContent {...props} />}
                screenOptions={{
                    drawerActiveTintColor: tint,
                    drawerStyle: { backgroundColor },
                    headerShown: false,
                }}
            >
                <Drawer.Screen
                    name="(tabs)"
                    options={{
                        headerShown: true,
                        title: "SnapDose",
                        drawerLabel: "Home",
                        drawerIcon: ({ color }) => (
                            <IconSymbol
                                name="house.fill"
                                size={22}
                                color={color}
                            />
                        ),
                    }}
                />
                <Drawer.Screen
                    name="food-gallery"
                    options={{
                        headerShown: true,
                        title: "Food Gallery",
                        drawerLabel: "Food Gallery",
                        drawerIcon: ({ color }) => (
                            <IconSymbol
                                name="rectangle.grid.2x2"
                                size={22}
                                color={color}
                            />
                        ),
                    }}
                />
                <Drawer.Screen
                    name="settings"
                    options={{
                        headerShown: true,
                        title: "Settings",
                        drawerLabel: "Settings",
                        drawerIcon: ({ color }) => (
                            <IconSymbol
                                name="gearshape.fill"
                                size={22}
                                color={color}
                            />
                        ),
                    }}
                />
            </Drawer>
        </GestureHandlerRootView>
    );
}
