// services/gcs-upload-service.ts
import * as FileSystem from 'expo-file-system/legacy';
import { getAuth } from 'firebase/auth';

const GCS_BUCKET = 'snapdose-uploads';
const GCS_UPLOAD_URL = `https://storage.googleapis.com/upload/storage/v1/b/${GCS_BUCKET}/o`;

export type UploadProgress = {
    totalBytes: number;
    uploadedBytes: number;
    percentage: number;
};

export type UploadResult = {
    success: boolean;
    url?: string;
    fileName?: string;
    error?: string;
};

// Get Firebase auth token for authenticated uploads
const getAuthToken = async (): Promise<string> => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    return await user.getIdToken();
};

// Upload a single image to GCS
export const uploadImageToGCS = async (
    localUri: string,
    fileName: string,
    onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
    try {
        const token = await getAuthToken();

        // Read file info to get size
        const fileInfo = await FileSystem.getInfoAsync(localUri);
        if (!fileInfo.exists) {
            return { success: false, error: 'File does not exist' };
        }

        const uploadFileName = `photos/${Date.now()}_${fileName}`;
        const uploadUrl = `${GCS_UPLOAD_URL}?uploadType=media&name=${encodeURIComponent(uploadFileName)}`;

        // Upload with progress tracking
        const uploadResult = await FileSystem.uploadAsync(uploadUrl, localUri, {
            httpMethod: 'POST',
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'image/jpeg',
            },
        });

        if (uploadResult.status === 200 || uploadResult.status === 201) {
            const publicUrl = `https://storage.googleapis.com/${GCS_BUCKET}/${uploadFileName}`;
            return {
                success: true,
                url: publicUrl,
                fileName: uploadFileName,
            };
        } else {
            return {
                success: false,
                error: `Upload failed with status ${uploadResult.status}`,
            };
        }
    } catch (error: any) {
        console.error('GCS Upload error:', error);
        return {
            success: false,
            error: error.message ?? 'Unknown upload error',
        };
    }
};

// Upload multiple images to GCS
export const uploadMultipleImages = async (
    images: { uri: string; fileName: string }[],
    onProgress?: (current: number, total: number) => void
): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];

    for (let i = 0; i < images.length; i++) {
        const { uri, fileName } = images[i];
        onProgress?.(i + 1, images.length);
        const result = await uploadImageToGCS(uri, fileName);
        results.push(result);
    }

    return results;
};