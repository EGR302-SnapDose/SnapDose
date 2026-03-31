import { IconSymbol } from "@/components/ui/icon-symbol";
import { auth, db } from "@/config/firebase";
import { colors, radius, spacing, textStyles } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { logout } from "@/services/logout-service";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { router, usePathname } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState("");

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
    <View style={[styles.drawer, { paddingTop: insets.top }]}>
      {/* Profile row */}
      <Pressable
        style={styles.profileRow}
        onPress={() => {
          props.navigation.closeDrawer();
          router.navigate("/profile" as any);
        }}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
        <View style={styles.profileText}>
          <Text style={styles.profileName} numberOfLines={1}>
            {displayName || "My Profile"}
          </Text>
          <Text style={styles.profileSub}>View profile</Text>
        </View>
        <IconSymbol
          name="chevron.right"
          size={14}
          color={colors.textTertiary}
        />
      </Pressable>

      <View style={styles.divider} />

      {/* Nav items */}
      <DrawerContentScrollView
        {...props}
        scrollEnabled={false}
        contentContainerStyle={styles.navList}
      >
        {DRAWER_ITEMS.map((item) => {
          const isActive = (item.match as readonly string[]).includes(pathname);
          return (
            <TouchableOpacity
              key={item.path}
              onPress={() => {
                props.navigation.closeDrawer();
                router.navigate(item.path as any);
              }}
              style={[styles.navItem, isActive && styles.navItemActive]}
              activeOpacity={0.7}
            >
              <IconSymbol
                name={item.icon}
                size={20}
                color={isActive ? colors.tabActive : colors.tabInactive}
              />
              <Text
                style={[
                  styles.navLabel,
                  isActive ? styles.navLabelActive : styles.navLabelInactive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </DrawerContentScrollView>

      {/* Footer */}
      <View
        style={[styles.footer, { paddingBottom: insets.bottom + spacing[4] }]}
      >
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          drawerActiveTintColor: colors.tabActive,
          drawerStyle: styles.drawerPanel,
          headerShown: false,
        }}
      >
        <Drawer.Screen
          name="(tabs)"
          options={{
            headerShown: false,
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
  drawerPanel: {
    backgroundColor: colors.surface,
    width: 280,
  },
  drawer: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  // Profile row
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    paddingBottom: spacing[4],
    gap: spacing[3],
    minHeight: 44,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FDE8E8",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: "700",
    color: "#E84040",
  },
  profileText: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    ...textStyles.calloutSemibold,
    color: colors.textPrimary,
  },
  profileSub: {
    ...textStyles.caption1,
    color: colors.textTertiary,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing[4],
  },

  // Nav items
  navList: {
    paddingHorizontal: spacing[2],
    paddingTop: spacing[2],
    gap: 2,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: spacing[3],
    borderRadius: radius.md,
    gap: spacing[3],
    minHeight: 44,
  },
  navItemActive: {
    backgroundColor: colors.primarySurface,
  },
  navLabel: {
    ...textStyles.callout,
  },
  navLabelActive: {
    ...textStyles.calloutSemibold,
    color: colors.tabActive,
  },
  navLabelInactive: {
    color: colors.textSecondary,
  },

  // Footer
  footer: {
    paddingTop: spacing[2],
  },
  logoutButton: {
    marginHorizontal: spacing[4],
    marginTop: spacing[3],
    backgroundColor: colors.dangerSurface,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: "center",
    minHeight: 44,
  },
  logoutText: {
    ...textStyles.calloutSemibold,
    color: colors.danger,
  },
});
