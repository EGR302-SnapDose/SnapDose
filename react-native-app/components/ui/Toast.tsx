import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';

interface ToastProps {
    visible: boolean;
    message: string;
}

export function Toast({ visible, message }: ToastProps) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;
    const toastBg = useThemeColor({ light: '#222222', dark: '#f0f0f0' }, 'background');
    const textColor = useThemeColor({ light: '#fff', dark: '#111' }, 'background');
    const iconColor = useThemeColor({ light: '#4CD964', dark: '#34C759' }, 'background');

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0, 
                    useNativeDriver: true,
                    damping: 15,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: 20,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    return (
        <Animated.View 
        style={[
            styles.toast,
            { backgroundColor: toastBg, opacity, transform: [{ translateY }] },
        ]}
        >
            <Ionicons name="checkmark-circle" size={18} color={iconColor} />
            <ThemedText style={[styles.message, { color: textColor }]}>{message}</ThemedText>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
  },
});