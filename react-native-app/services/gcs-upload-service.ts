// services/gcs-upload-service.ts
import "@/config/firebase";
import { getAuth } from "firebase/auth";
import {
    getDownloadURL,
    getStorage,
    ref,
    uploadBytesResumable,
} from "firebase/storage";

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

// Upload a single image to Firebase Storage
export const uploadImageToGCS = async (
  localUri: string,
  fileName: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<UploadResult> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return { success: false, error: "User not authenticated" };

    // Convert file:// URI to blob for upload
    const response = await fetch(localUri);
    const blob = await response.blob();

    // Drop straight into bucket root
    const uploadFileName = `${Date.now()}_${fileName}`;
    const storage = getStorage();
    const storageRef = ref(storage, uploadFileName);

    return new Promise((resolve) => {
      const uploadTask = uploadBytesResumable(storageRef, blob);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Real progress tracking
          const percentage =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.({
            totalBytes: snapshot.totalBytes,
            uploadedBytes: snapshot.bytesTransferred,
            percentage,
          });
        },
        (error) => {
          console.error("Upload error:", error);
          resolve({ success: false, error: error.message });
        },
        async () => {
          // Get the download URL from the SDK
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            success: true,
            url,
            fileName: uploadFileName,
          });
        },
      );
    });
  } catch (error: any) {
    console.error("GCS Upload error:", error);
    return { success: false, error: error.message ?? "Unknown upload error" };
  }
};

// Upload multiple images
export const uploadMultipleImages = async (
  images: { uri: string; fileName: string }[],
  onProgress?: (current: number, total: number) => void,
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
