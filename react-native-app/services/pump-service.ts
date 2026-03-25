// services/pump-service.ts
import { getAuth } from 'firebase/auth';

const API_BASE = 'https://us-central1-egr302-snapdose.cloudfunctions.net/dexcom-auth';

export type PumpDevice = {
    deviceName: string;
    deviceId: string;
    status: 'online' | 'offline' | 'unknown';
    lastSeen?: string;
};

export type PumpConnectionResult = {
    success: boolean;
    message: string;
};

// Get current user's pump device status
export const getPumpStatus = async (userId: string): Promise<PumpDevice> => {
    try {
        const auth = getAuth();
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`${API_BASE}/pump-status?userId=${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!res.ok) throw new Error('Failed to fetch pump status');
        const data = await res.json();
        return {
            deviceName: data.deviceName ?? 'SnapDose Pump',
            deviceId: data.deviceId ?? 'Unknown',
            status: data.connected ? 'online' : 'offline',
            lastSeen: data.lastSeen,
        };
    } catch (error) {
        return {
            deviceName: 'SnapDose Pump',
            deviceId: 'Unknown',
            status: 'unknown',
        };
    }
};

// Test the pump connection
export const testPumpConnection = async (userId: string): Promise<PumpConnectionResult> => {
    try {
        const auth = getAuth();
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch(`${API_BASE}/pump-test?userId=${userId}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!res.ok) throw new Error('Connection test failed');
        const data = await res.json();
        return {
            success: true,
            message: data.message ?? 'Connection successful!',
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message ?? 'Connection failed. Please try again.',
        };
    }
};