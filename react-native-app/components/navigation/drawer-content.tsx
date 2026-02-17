import {
    DrawerContentComponentProps,
    DrawerContentScrollView,
    DrawerItemList,
} from "@react-navigation/drawer";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";

export function DrawerContent(props: DrawerContentComponentProps) {
    const borderColor = useThemeColor(
        { light: "#E0E0E0", dark: "#333333" },
        "icon",
    );

    return (
        <DrawerContentScrollView {...props}>
            <View style={[styles.header, { borderBottomColor: borderColor }]}>
                <ThemedText type="title" style={styles.appName}>
                    SnapDose
                </ThemedText>
            </View>
            <DrawerItemList {...props} />
        </DrawerContentScrollView>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 20,
        borderBottomWidth: 1,
        marginBottom: 8,
    },
    appName: {
        fontSize: 28,
    },
});
