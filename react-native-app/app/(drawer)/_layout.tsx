import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { router, usePathname } from "expo-router";

const DRAWER_ITEMS = [
    { label: "Home", icon: "house.fill", path: "/", match: ["/"] },
    {
        label: "Edit Profile",
        icon: "person.fill",
        path: "/edit-profile",
        match: ["/edit-profile"],
    },
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

    return (
        <ThemedView style={{ flex: 1 }}>
            <DrawerContentScrollView {...props} scrollEnabled={false}>
                {DRAWER_ITEMS.map((item) => {
                    const isActive = item.match.includes(pathname as any);
                    return (
                        <TouchableOpacity
                            key={item.path}
                            onPress={() => {
                                props.navigation.closeDrawer();
                                router.navigate(item.path);
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
            </Drawer>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
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
});
