import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { auth, db } from "@/config/firebase";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { logout } from "@/services/logout-service";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { router, usePathname } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DRAWER_ITEMS = [
    { label: "Home", icon: "house.fill", path: "/", match: ["/"] },
    {
        label: "Food Gallery",
        icon: "rectangle.grid.2x2",
        path: "/food-gallery",
        match: ["/food-gallery"],
    },
    {
        label: "Settings",
        icon: "gearshape.fill",
        path: "/settings",
        match: ["/settings"],
    },
] as const;

function CustomDrawerContent(props: any) {
    const colorScheme = useColorScheme();
    const tint = Colors[colorScheme ?? "light"].tint;
    const iconDefault = Colors[colorScheme ?? "light"].icon;
    const activeBg = colorScheme === "dark" ? "#1e1e1e" : "#f0f0f0";
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const [displayName, setDisplayName] = useState<string>("");

    useEffect(() => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        getDoc(doc(db, "users", uid)).then((snap) => {
            if (snap.exists()) {
                const name = snap.data()?.displayName;
                if (name) setDisplayName(name);
            }
        });
    }, []);

    const initials = displayName
        ? displayName
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
        : "?";

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
        <ThemedView style={{ flex: 1 }}>
            <View style={[styles.drawerHeader, { paddingTop: insets.top }]}>
                <TouchableOpacity
                    onPress={() => {
                        props.navigation.closeDrawer();
                        router.navigate("/profile" as any);
                    }}
                        style={[styles.profileButton, { backgroundColor: colorScheme === "dark" ? "#2e1a1a" : "#fde8e8" }]}

                >
                    <ThemedText style={[styles.profileInitials, { color: "#e84040" }]}>
                        {initials}
                    </ThemedText>
                </TouchableOpacity>
            </View>
            <DrawerContentScrollView
                {...props}
                scrollEnabled={false}
                contentContainerStyle={{ flexGrow: 1 }}
            >
                {DRAWER_ITEMS.map((item) => {
                    const isActive = (item.match as readonly string[]).includes(
                        pathname,
                    );
                    return (
                        <TouchableOpacity
                            key={item.path}
                            onPress={() => {
                                props.navigation.closeDrawer();
                                router.navigate(item.path as any);
                            }}
                            style={[
                                styles.item,
                                isActive && { backgroundColor: activeBg },
                            ]}
                        >
                            <IconSymbol
                                name={item.icon}
                                size={22}
                                color={isActive ? tint : iconDefault}
                            />
                            <ThemedText
                                style={[
                                    styles.label,
                                    isActive && { color: tint },
                                ]}
                            >
                                {item.label}
                            </ThemedText>
                        </TouchableOpacity>
                    );
                })}
            </DrawerContentScrollView>

            <ThemedView style={styles.footer}>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <ThemedText style={styles.logoutText}>Logout</ThemedText>
                </TouchableOpacity>
            </ThemedView>
        </ThemedView>
    );
}

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
                    }}
                />
                <Drawer.Screen
                    name="food-gallery"
                    options={{
                        headerShown: true,
                        title: "Food Gallery",
                        drawerLabel: "Food Gallery",
                    }}
                />
                <Drawer.Screen
                    name="settings"
                    options={{
                        headerShown: true,
                        title: "Settings",
                        drawerLabel: "Settings",
                    }}
                />
                <Drawer.Screen
                    name="profile"
                    options={{
                        headerShown: true,
                        title: "Profile",
                        drawerLabel: "Profile",
                        drawerItemStyle: { display: "none" },
                    }}
                />
            </Drawer>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    drawerHeader: {
        paddingLeft: 24,
    },
    profileButton: {
        marginTop: 15,
        marginBottom: 4,
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: "center",
        justifyContent: "center",
    },
    profileInitials: {
        fontSize: 20,
        fontWeight: "700",
        color: "#fff",
    },
    item: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginHorizontal: 8,
        marginVertical: 2,
        gap: 14,
    },
    label: {
        fontSize: 15,
        fontWeight: "500",
    },
    footer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 32,
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
