import { IconSymbol } from "@/components/ui/icon-symbol";
import { auth, db } from "@/config/firebase";
import { colors, layout, radius, textStyles } from "@/constants/theme";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { DrawerActions } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import { Tabs, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

function AvatarButton() {
  const navigation = useNavigation();
  const [initials, setInitials] = useState("?");

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    getDoc(doc(db, "users", uid)).then((snap) => {
      if (snap.exists()) {
        const name = snap.data()?.displayName as string | undefined;
        if (name) {
          setInitials(
            name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2),
          );
        }
      }
    });
  }, []);

  return (
    <Pressable
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      style={styles.avatarButton}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarInitials}>{initials}</Text>
      </View>
    </Pressable>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitle: "SnapDose",
        headerTitleStyle: styles.headerTitle,
        headerStyle: styles.header,
        headerShadowVisible: false,
        headerLeft: () => <AvatarButton />,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        tabBarBackground: () => <View style={styles.tabBarBackground} />,
      }}
    >
      <Tabs.Screen
        name="camera"
        options={{
          title: "Snap",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 26 : 24}
              name="camera.fill"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              size={focused ? 26 : 24}
              name="house.fill"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="dose"
        options={{
          title: "Dose",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name="pill"
              size={focused ? 26 : 24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: "Settings", href: null }}
      />
      <Tabs.Screen
        name="food-gallery"
        options={{ title: "Food Gallery", href: null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background,
    borderBottomWidth: 0,
    elevation: 0,
  },
  headerTitle: {
    ...textStyles.headline,
    color: colors.textPrimary,
  },
  avatarButton: {
    marginLeft: 16,
    minWidth: layout.minTouchTarget,
    minHeight: layout.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FDE8E8",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E84040",
  },
  tabBar: {
    position: "absolute",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: "transparent",
    elevation: 0,
    height: layout.tabBarContentHeight + (Platform.OS === "ios" ? 34 : 0),
  },
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.tabBackground,
  },
  tabBarLabel: {
    ...textStyles.tabBar,
  },
  tabBarItem: {
    paddingTop: 8,
  },
});
