/**
 * Pure utility function to calculate insulin dose based on carbs, current glucose,
 * target glucose range, correction factor, insulin-to-carb ratio, and insulin on board.
 *
 * Formula: dose = (carbs / ICR) + correctionDose - IOB
 *
 * Where correctionDose is:
 * - (currentGlucose - targetHigh) / correctionFactor if current BG is above targetHigh
 * - (currentGlucose - targetLow) / correctionFactor if current BG is below targetLow
 * - 0 if current BG is within the target window
 */

export interface DoseCalculationParams {
  /** Carbohydrates in grams */
  carbs: number;
  /** Current blood glucose reading (mg/dL) */
  currentGlucose: number;
  /** Target glucose minimum (mg/dL) */
  targetLow: number;
  /** Target glucose maximum (mg/dL) */
  targetHigh: number;
  /** Correction factor (mg/dL drop per unit of insulin) */
  correctionFactor: number;
  /** Insulin-to-carb ratio (grams of carbs per unit of insulin) */
  icr: number;
  /** Insulin on board (active insulin in units) */
  iob: number;
}

/**
 * Calculate the recommended insulin dose
 * @returns The recommended dose in units, minimum of 0
 */
export function calculateDose(params: DoseCalculationParams): number {
  const {
    carbs,
    currentGlucose,
    targetLow,
    targetHigh,
    correctionFactor,
    icr,
    iob,
  } = params;

  // Calculate carb-based dose
  const carbDose = carbs / icr;

  // Calculate correction dose based on current glucose vs target range
  let correctionDose = 0;
  if (currentGlucose > targetHigh) {
    // Current BG is above target high - need correction insulin
    correctionDose = (currentGlucose - targetHigh) / correctionFactor;
  } else if (currentGlucose < targetLow) {
    // Current BG is below target low - negative correction (reduce insulin)
    correctionDose = (currentGlucose - targetLow) / correctionFactor;
  }
  // If within window, correctionDose remains 0

  // Calculate final dose: carbs + correction - active insulin
  const totalDose = carbDose + correctionDose - iob;

  // Return dose, ensuring it's not negative
  return Math.max(0, totalDose);
}
