package com.snapdose.api.model;

import com.snapdose.api.model.enums.BolusStatus;
import com.snapdose.api.model.enums.BolusType;

public class BolusRecord {

    public static BolusRecord fromRequest(String bolusId, BolusRequest request) {
        BolusRecord record = new BolusRecord();
        record.setBolusId(bolusId);
        record.setUserId(request.getUserId());
        record.setDeviceId(request.getDeviceId());
        record.setStatus(BolusStatus.PENDING);
        record.setBolusType(request.getBolusType());
        record.setUnitsRequested(request.getUnits());
        record.setUnitsDelivered(0);
        record.setCarbsGrams(request.getCarbsGrams());
        record.setGlucoseLevel(request.getGlucoseLevel());
        record.setCorrectionUnits(request.getCorrectionUnits());
        record.setCarbUnits(request.getCarbUnits());
        record.setInsulinOnBoard(request.getInsulinOnBoard());
        record.setNotes(request.getNotes());
        record.setCreatedAt(System.currentTimeMillis());
        record.setUpdatedAt(record.getCreatedAt());
        return record;
    }
    private String bolusId;
    private String userId;
    private String deviceId;
    private BolusStatus status;
    private BolusType bolusType;
    private double unitsRequested;
    private double unitsDelivered;
    private double carbsGrams;
    private double glucoseLevel;
    private double correctionUnits;
    private double carbUnits;
    private double insulinOnBoard;
    private String notes;
    private long createdAt;

    private long updatedAt;

    public BolusRecord() {}

    public String getBolusId() { return bolusId; }
    public void setBolusId(String bolusId) { this.bolusId = bolusId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public BolusStatus getStatus() { return status; }
    public void setStatus(BolusStatus status) { this.status = status; }

    public BolusType getBolusType() { return bolusType; }
    public void setBolusType(BolusType bolusType) { this.bolusType = bolusType; }

    public double getUnitsRequested() { return unitsRequested; }
    public void setUnitsRequested(double unitsRequested) { this.unitsRequested = unitsRequested; }

    public double getUnitsDelivered() { return unitsDelivered; }
    public void setUnitsDelivered(double unitsDelivered) { this.unitsDelivered = unitsDelivered; }

    public double getCarbsGrams() { return carbsGrams; }
    public void setCarbsGrams(double carbsGrams) { this.carbsGrams = carbsGrams; }

    public double getGlucoseLevel() { return glucoseLevel; }
    public void setGlucoseLevel(double glucoseLevel) { this.glucoseLevel = glucoseLevel; }

    public double getCorrectionUnits() { return correctionUnits; }
    public void setCorrectionUnits(double correctionUnits) { this.correctionUnits = correctionUnits; }

    public double getCarbUnits() { return carbUnits; }
    public void setCarbUnits(double carbUnits) { this.carbUnits = carbUnits; }

    public double getInsulinOnBoard() { return insulinOnBoard; }
    public void setInsulinOnBoard(double insulinOnBoard) { this.insulinOnBoard = insulinOnBoard; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }

    public long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }
}