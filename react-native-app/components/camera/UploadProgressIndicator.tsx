// components/camera/UploadProgressIndicator.tsx
import React from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';

type Props = {
    visible: boolean;
    percentage: number;
    uploadedBytes: number;
    totalBytes: number;
};

const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export default function UploadProgressIndicator({
    visible,
    percentage,
    uploadedBytes,
    totalBytes,
}: Props) {
    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <View style={styles.container}>
                {/* Spinner */}
                <ActivityIndicator size="large" color="#4CAF50" />

                {/* Title */}
                <Text style={styles.title}>Uploading...</Text>

                {/* Progress Bar */}
                <View style={styles.progressBarBackground}>
                    <View
                        style={[
                            styles.progressBarFill,
                            { width: `${Math.min(percentage, 100)}%` },
                        ]}
                    />
                </View>

                {/* Percentage and bytes */}
                <Text style={styles.percentageText}>
                    {Math.round(percentage)}%
                </Text>
                <Text style={styles.bytesText}>
                    {formatBytes(uploadedBytes)} / {formatBytes(totalBytes)}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    container: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        width: '80%',
        gap: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    progressBarBackground: {
        width: '100%',
        height: 10,
        backgroundColor: '#E0E0E0',
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 5,
    },
    percentageText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4CAF50',
    },
    bytesText: {
        fontSize: 12,
        color: '#888',
    },
});