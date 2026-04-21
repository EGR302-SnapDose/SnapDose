// components/PumpPairingSection.tsx
import { useThemeColors } from '@/hooks/use-theme-colors';
import { getAuth } from 'firebase/auth';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { getPumpStatus, PumpDevice, testPumpConnection } from '../../services/pump-service';
import { hapticError, hapticSuccess } from '../../utils/haptics';

export default function PumpPairingSection() {
    const c = useThemeColors();
    const [device, setDevice] = useState<PumpDevice | null>(null);
    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState(false);

    const userId = getAuth().currentUser?.uid ?? '';

    const fetchPumpStatus = async () => {
        setLoading(true);
        const status = await getPumpStatus(userId);
        setDevice(status);
        setLoading(false);
    };

    useEffect(() => {
        if (userId) fetchPumpStatus();
    }, [userId]);

    const handleTestConnection = async () => {
        setTesting(true);
        const result = await testPumpConnection(userId);
        setTesting(false);
        if (result.success) hapticSuccess(); else hapticError();
        Alert.alert(
            result.success ? 'Connection Successful' : 'Connection Failed',
            result.message
        );
        if (result.success) fetchPumpStatus();
    };

    const getStatusColor = () => {
        if (!device) return c.textTertiary;
        if (device.status === 'online') return c.success;
        if (device.status === 'offline') return c.danger;
        return c.textTertiary;
    };

    const getStatusText = () => {
        if (!device) return 'Unknown';
        if (device.status === 'online') return 'Online';
        if (device.status === 'offline') return 'Offline';
        return 'Unknown';
    };

    const styles = useMemo(
        () =>
            StyleSheet.create({
                section: {
                    marginBottom: 24,
                },
                sectionTitle: {
                    fontSize: 16,
                    fontWeight: '600',
                    color: c.textSecondary,
                    marginBottom: 12,
                },
                loader: {
                    marginVertical: 16,
                },
                row: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: c.border,
                },
                rowText: {
                    flex: 1,
                },
                label: {
                    fontSize: 16,
                    fontWeight: '500',
                    color: c.textPrimary,
                },
                value: {
                    fontSize: 13,
                    color: c.textTertiary,
                    marginTop: 2,
                },
                statusBadge: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 2,
                },
                statusDot: {
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                },
                statusText: {
                    fontSize: 13,
                    fontWeight: '600',
                },
                testButton: {
                    backgroundColor: c.success,
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginTop: 16,
                },
                testButtonText: {
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: 14,
                },
            }),
        [c]
    );

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pump Connection</Text>

            {loading ? (
                <ActivityIndicator size="small" color={c.success} style={styles.loader} />
            ) : (
                <>
                    {/* Device Name Row */}
                    <View style={styles.row}>
                        <View style={styles.rowText}>
                            <Text style={styles.label}>Device Name</Text>
                            <Text style={styles.value}>{device?.deviceName ?? 'Unknown'}</Text>
                        </View>
                    </View>

                    {/* Device ID Row */}
                    <View style={styles.row}>
                        <View style={styles.rowText}>
                            <Text style={styles.label}>Device ID</Text>
                            <Text style={styles.value}>{device?.deviceId ?? 'Unknown'}</Text>
                        </View>
                    </View>

                    {/* Connection Status Row */}
                    <View style={styles.row}>
                        <View style={styles.rowText}>
                            <Text style={styles.label}>Connection Status</Text>
                            <View style={styles.statusBadge}>
                                <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                                    {getStatusText()}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Last Seen Row */}
                    {device?.lastSeen && (
                        <View style={styles.row}>
                            <View style={styles.rowText}>
                                <Text style={styles.label}>Last Seen</Text>
                                <Text style={styles.value}>{device.lastSeen}</Text>
                            </View>
                        </View>
                    )}

                    {/* Test Connection Button */}
                    <Pressable
                        style={styles.testButton}
                        onPress={handleTestConnection}
                        disabled={testing}
                    >
                        {testing ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.testButtonText}>Test Connection</Text>
                        )}
                    </Pressable>
                </>
            )}
        </View>
    );
}
