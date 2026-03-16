export type MealConfidence = 'high' | 'medium' | 'low';
export type MealStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface MealCarbEstimate {
    id: string;
    confidence: MealConfidence;
    created_at: Date;
    estimated_carbs_grams: number;
    foods_detected: string[];
    image_bucket: string;
    image_gs_uri: string;
    image_path: string;
    notes: string;
    raw_gemini_response: string;
    status: MealStatus;
}