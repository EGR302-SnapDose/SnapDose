// components/PumpPairingSection.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Pressable,
    ActivityIndicator,
    StyleSheet,
    Alert,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { getPumpStatus, testPumpConnection, PumpDevice } from '../../services/pump-service'

export default function PumpPairingSection() {
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
        Alert.alert(
            result.success ? 'Connection Successful' : 'Connection Failed',
            result.message
        );
        if (result.success) fetchPumpStatus();
    };

    const getStatusColor = () => {
        if (!device) return '#888';
        if (device.status === 'online') return '#4CAF50';
        if (device.status === 'offline') return '#F44336';
        return '#888';
    };

    const getStatusText = () => {
        if (!device) return 'Unknown';
        if (device.status === 'online') return 'Online';
        if (device.status === 'offline') return 'Offline';
        return 'Unknown';
    };

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pump Connection</Text>

            {loading ? (
                <ActivityIndicator size="small" color="#4CAF50" style={styles.loader} />
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

const styles = StyleSheet.create({
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
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
        borderBottomColor: '#f0f0f0',
    },
    rowText: {
        flex: 1,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
    },
    value: {
        fontSize: 13,
        color: '#888',
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
        backgroundColor: '#4CAF50',
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
});