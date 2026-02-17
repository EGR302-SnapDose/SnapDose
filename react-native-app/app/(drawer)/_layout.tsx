import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function DrawerLayout() {
    const colorScheme = useColorScheme();
    const tint = Colors[colorScheme ?? "light"].tint;
    const backgroundColor = Colors[colorScheme ?? "light"].background;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Drawer
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
                    name="edit-profile"
                    options={{
                        headerShown: true,
                        title: "Edit Profile",
                        drawerLabel: "Edit Profile",
                        drawerIcon: ({ color }) => (
                            <IconSymbol
                                name="person.fill"
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
                                name="photo.on.rectangle"
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
