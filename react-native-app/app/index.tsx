import { useAuthState } from '@/hooks/use-auth-state';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
 
const { width } = Dimensions.get('window');
 
export default function SplashScreen() {
    const router = useRouter();
    const authStatus = useAuthState();
 
    // Animation values
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.8)).current;
    const taglineOpacity = useRef(new Animated.Value(0)).current;
    const taglineY = useRef(new Animated.Value(12)).current;
    const dotScale1 = useRef(new Animated.Value(0.4)).current;
    const dotScale2 = useRef(new Animated.Value(0.4)).current;
    const dotScale3 = useRef(new Animated.Value(0.4)).current;
    const exitOpacity = useRef(new Animated.Value(1)).current;
 
    const backgroundColor = useThemeColor(
        { light: '#FFFFFF', dark: '#0A0A0F' },
        'background'
    );
    const isDark = backgroundColor === '#0A0A0F';
 
    // Pulsing dots loader animation
    useEffect(() => {
        const pulseDot = (dot: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, {
                        toValue: 1,
                        duration: 380,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot, {
                        toValue: 0.4,
                        duration: 380,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.delay(380),
                ])
            );
 
        // Entrance animation sequence
        Animated.sequence([
            // Logo fades + scales in
            Animated.parallel([
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 600,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(logoScale, {
                    toValue: 1,
                    duration: 600,
                    easing: Easing.out(Easing.back(1.4)),
                    useNativeDriver: true,
                }),
            ]),
            // Tagline slides up
            Animated.parallel([
                Animated.timing(taglineOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(taglineY, {
                    toValue: 0,
                    duration: 400,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
 
        // Start pulsing dots (staggered)
        const d1 = pulseDot(dotScale1, 0);
        const d2 = pulseDot(dotScale2, 180);
        const d3 = pulseDot(dotScale3, 360);
        d1.start();
        d2.start();
        d3.start();
 
        return () => {
            d1.stop();
            d2.stop();
            d3.stop();
        };
    }, []);
 
    // Navigate once auth resolves
    useEffect(() => {
        if (authStatus === 'loading') return;
 
        // Small delay so the splash is never jarring on fast connections
        const timer = setTimeout(() => {
            Animated.timing(exitOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                if (authStatus === 'authenticated') {
                    router.replace('/(drawer)/(tabs)');
                } else if (authStatus === 'needs-onboarding') {
                    router.replace('/onboarding/step1');
                } else {
                    router.replace('/auth/login');
                }
            });
        }, 800);
 
        return () => clearTimeout(timer);
    }, [authStatus]);
 
    const accentBlue = '#007AFF';
    const textPrimary = isDark ? '#FFFFFF' : '#0A0A0F';
    const textMuted = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(10,10,15,0.4)';
    const dotColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(10,10,15,0.2)';
    const dotActiveColor = accentBlue;
 
    return (
        <Animated.View style={[styles.container, { backgroundColor, opacity: exitOpacity }]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />
 
            {/* Subtle ambient glow behind logo */}
            <View
                style={[
                    styles.glow,
                    {
                        backgroundColor: isDark
                            ? 'rgba(0, 122, 255, 0.08)'
                            : 'rgba(0, 122, 255, 0.06)',
                    },
                ]}
            />
 
            <View style={styles.centerContent}>
                {/* Logo mark + wordmark */}
                <Animated.View
                    style={[
                        styles.logoContainer,
                        { opacity: logoOpacity, transform: [{ scale: logoScale }] },
                    ]}
                >
                    {/* Icon mark */}
                    <View style={[styles.iconMark, { borderColor: accentBlue }]}>
                        <Text style={[styles.iconGlyph, { color: accentBlue }]}>S</Text>
                        {/* Subtle inner ring */}
                        <View
                            style={[
                                styles.innerRing,
                                { borderColor: isDark ? 'rgba(0,122,255,0.2)' : 'rgba(0,122,255,0.15)' },
                            ]}
                        />
                    </View>
 
                    {/* Wordmark */}
                    <Text style={[styles.wordmark, { color: textPrimary }]}>
                        Snap<Text style={{ color: accentBlue }}>Dose</Text>
                    </Text>
                </Animated.View>
 
                {/* Tagline */}
                <Animated.Text
                    style={[
                        styles.tagline,
                        {
                            color: textMuted,
                            opacity: taglineOpacity,
                            transform: [{ translateY: taglineY }],
                        },
                    ]}
                >
                    Glucose, simplified.
                </Animated.Text>
            </View>
 
            {/* Pulsing dots loader at bottom */}
            <View style={styles.loaderRow}>
                {[
                    { scale: dotScale1 },
                    { scale: dotScale2 },
                    { scale: dotScale3 },
                ].map((dot, i) => (
                    <Animated.View
                        key={i}
                        style={[
                            styles.dot,
                            {
                                backgroundColor: dotActiveColor,
                                transform: [{ scale: dot.scale }],
                                opacity: dot.scale,
                            },
                        ]}
                    />
                ))}
            </View>
        </Animated.View>
    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glow: {
        position: 'absolute',
        width: width * 1.2,
        height: width * 1.2,
        borderRadius: width * 0.6,
        top: '50%',
        left: '50%',
        marginTop: -(width * 0.7),
        marginLeft: -(width * 0.6),
    },
    centerContent: {
        alignItems: 'center',
        gap: 16,
    },
    logoContainer: {
        alignItems: 'center',
        gap: 20,
    },
    iconMark: {
        width: 80,
        height: 80,
        borderRadius: 24,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    iconGlyph: {
        fontSize: 40,
        fontWeight: '700',
        letterSpacing: -1,
    },
    innerRing: {
        position: 'absolute',
        inset: 5,
        borderRadius: 18,
        borderWidth: 1,
    },
    wordmark: {
        fontSize: 42,
        fontWeight: '700',
        letterSpacing: -1.5,
    },
    tagline: {
        fontSize: 15,
        fontWeight: '400',
        letterSpacing: 0.3,
    },
    loaderRow: {
        position: 'absolute',
        bottom: 60,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
});