import { colors, Colors, spacing } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
    DrawerContentComponentProps,
    DrawerContentScrollView,
    DrawerItemList,
} from "@react-navigation/drawer";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";

export function DrawerContent(props: DrawerContentComponentProps) {
    const borderColor = useThemeColor(
        { light: colors.border, dark: Colors.dark.border },
        "border",
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
        paddingHorizontal: spacing[4],
        paddingTop: spacing[2],
        paddingBottom: spacing[5],
        borderBottomWidth: 1,
        marginBottom: spacing[2],
    },
    appName: {
        fontSize: 28,
    },
});
