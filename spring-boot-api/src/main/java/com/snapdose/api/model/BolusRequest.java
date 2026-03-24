package com.snapdose.api.model;

import com.snapdose.api.model.enums.BolusType;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public class BolusRequest {

    @NotBlank(message = "userId is required")
    private String userId;

    @NotNull(message = "units is required")
    @DecimalMin(value = "0.05", message = "Minimum bolus is 0.05 units")
    @DecimalMax(value = "30.0", message = "Maximum bolus is 30 units")
    private Double units;

    @PositiveOrZero(message = "carbsGrams must be >= 0")
    private double carbsGrams;

    @DecimalMin(value = "20.0", message = "glucoseLevel must be >= 20 mg/dL")
    @DecimalMax(value = "600.0", message = "glucoseLevel must be <= 600 mg/dL")
    private double glucoseLevel;

    @NotNull(message = "bolusType is required")
    private BolusType bolusType;

    private double correctionUnits;

    private double carbUnits;

    private double insulinOnBoard;

    private String deviceId;

    private String notes;

    public BolusRequest() {}

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Double getUnits() { return units; }
    public void setUnits(Double units) { this.units = units; }

    public double getCarbsGrams() { return carbsGrams; }
    public void setCarbsGrams(double carbsGrams) { this.carbsGrams = carbsGrams; }

    public double getGlucoseLevel() { return glucoseLevel; }
    public void setGlucoseLevel(double glucoseLevel) { this.glucoseLevel = glucoseLevel; }

    public BolusType getBolusType() { return bolusType; }
    public void setBolusType(BolusType bolusType) { this.bolusType = bolusType; }

    public double getCorrectionUnits() { return correctionUnits; }
    public void setCorrectionUnits(double correctionUnits) { this.correctionUnits = correctionUnits; }

    public double getCarbUnits() { return carbUnits; }
    public void setCarbUnits(double carbUnits) { this.carbUnits = carbUnits; }

    public double getInsulinOnBoard() { return insulinOnBoard; }
    public void setInsulinOnBoard(double insulinOnBoard) { this.insulinOnBoard = insulinOnBoard; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}