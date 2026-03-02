import { useState, useCallback } from 'react';
import {
    savePhotoLocally,
    getSavedPhotos,
    deletePhoto,
    clearAllPhotos,
    StoredPhoto,
}   from '@/services/photo-storage';

interface UsePhotoStorageReturn {
    savedPhotos: StoredPhoto[];
    isSaving: boolean;
    savePhoto: (uri: string, base64?: string, width?: number, height?: number) => Promise<StoredPhoto | null>;
    loadPhotos: () => Promise<void>;
    removePhoto: (fileName: string) => Promise<void>;
    clearPhotos: () => Promise<void>;
}

export function usePhotoStorage(): UsePhotoStorageReturn {
    const [savedPhotos, setSavedPhotos] = useState<StoredPhoto[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const savePhoto = useCallback(async (
        uri: string,
        base64?: string,
        width?: number,
        height?: number

    ): Promise<StoredPhoto | null> => {
        setIsSaving(true);
        try {
            const stored = await savePhotoLocally(uri, base64, width, height);
            setSavedPhotos((prev) => [stored, ...prev]);
            return stored;
        } catch (error) {
            console.error('Failed to save photo:', error);
            return null;
        } finally {
            setIsSaving(false);
        }
    }, []);

    const loadPhotos = useCallback(async (): Promise<void> => {
        try {
            const photos = await getSavedPhotos();
            setSavedPhotos(photos);
        } catch (error) {
            console.error('Failed to load photos:', error);
        }
    }, []);

    const removePhoto = useCallback(async (fileName: string): Promise<void> => {
        try {
            await deletePhoto(fileName);
            setSavedPhotos((prev) => prev.filter((p) => p.fileName !== fileName));
        } catch (error) {
            console.error('Failed to delete photo:', error);
        }
    }, []);

    const clearPhotos = useCallback(async (): Promise<void> => {
        try {
            await clearAllPhotos();
            setSavedPhotos([]);
        } catch (error) {
            console.error('Failed to clear photos:', error);
        }
    }, []);

    return {
        savedPhotos,
        isSaving,
        savePhoto,
        loadPhotos,
        removePhoto,
        clearPhotos,
    };

}