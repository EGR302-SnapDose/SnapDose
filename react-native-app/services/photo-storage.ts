import * as FileSystem from 'expo-file-system/legacy';

export type StoredPhoto = {
  uri: string;
  fileName: string;
  capturedAt: string;
  base64?: string;
  width: number;
  height: number;
};

const PHOTO_DIR = `${FileSystem.documentDirectory}captured-photos/`;

// Make sure the directory exists
const ensureDirectoryExists = async (): Promise<void> => {
  const dirInfo = await FileSystem.getInfoAsync(PHOTO_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  }
};

// Save a photo to local storage
export const savePhotoLocally = async (
  uri: string,
  base64?: string,
  width?: number,
  height?: number
): Promise<StoredPhoto> => {
  await ensureDirectoryExists();

  const fileName = `photo_${Date.now()}.jpg`;
  const destUri = `${PHOTO_DIR}${fileName}`;

  await FileSystem.copyAsync({ from: uri, to: destUri });

  const storedPhoto: StoredPhoto = {
    uri: destUri,
    fileName,
    capturedAt: new Date().toISOString(),
    base64,
    width: width ?? 0,
    height: height ?? 0,
  };

  return storedPhoto;
};

// Get all locally saved photos
export const getSavedPhotos = async (): Promise<StoredPhoto[]> => {
  await ensureDirectoryExists();

  const files = await FileSystem.readDirectoryAsync(PHOTO_DIR);
  const photoFiles = files.filter((f) => f.endsWith('.jpg'));

  const photos: StoredPhoto[] = photoFiles.map((fileName) => ({
    uri: `${PHOTO_DIR}${fileName}`,
    fileName,
    capturedAt: new Date().toISOString(), // actual timestamp would come from metadata
    width: 0,
    height: 0,
  }));

  // Sort newest first based on filename timestamp
  return photos.sort((a, b) => b.fileName.localeCompare(a.fileName));
};

// Delete a single photo
export const deletePhoto = async (fileName: string): Promise<void> => {
  const uri = `${PHOTO_DIR}${fileName}`;
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) {
    await FileSystem.deleteAsync(uri);
  }
};

// Delete all saved photos (e.g. after successful upload)
export const clearAllPhotos = async (): Promise<void> => {
  const info = await FileSystem.getInfoAsync(PHOTO_DIR);
  if (info.exists) {
    await FileSystem.deleteAsync(PHOTO_DIR, { idempotent: true });
  }
};

// Get total storage used by saved photos
export const getStorageUsed = async (): Promise<number> => {
  await ensureDirectoryExists();
  const info = await FileSystem.getInfoAsync(PHOTO_DIR);
  return info.exists && 'size' in info ? info.size : 0;
};