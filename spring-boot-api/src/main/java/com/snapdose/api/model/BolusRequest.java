package com.snapdose.api.model;

public class BolusRequest {

    private String userId;
    private double units;
    private double carbsGrams;
    private double glucoseLevel;

    public BolusRequest() {}

    public BolusRequest(String userId, double units, double carbsGrams, double glucoseLevel) {
        this.userId = userId;
        this.units = units;
        this.carbsGrams = carbsGrams;
        this.glucoseLevel = glucoseLevel;
    }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public double getUnits() { return units; }
    public void setUnits(double units) { this.units = units; }

    public double getCarbsGrams() { return carbsGrams; }
    public void setCarbsGrams(double carbsGrams) { this.carbsGrams = carbsGrams; }

    public double getGlucoseLevel() { return glucoseLevel; }
    public void setGlucoseLevel(double glucoseLevel) { this.glucoseLevel = glucoseLevel; }
}
