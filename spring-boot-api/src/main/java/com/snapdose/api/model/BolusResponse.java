package com.snapdose.api.model;

import com.snapdose.api.model.enums.BolusStatus;
import com.snapdose.api.model.enums.BolusType;

public class BolusResponse {

    public static BolusResponse pending(String bolusId, double unitsRequested, BolusType bolusType) {
        return new BolusResponse(
            bolusId,
            BolusStatus.PENDING,
            "Bolus command queued for delivery",
            unitsRequested,
            0,
            bolusType
        );
    }
    public static BolusResponse error(String message) {
        BolusResponse r = new BolusResponse();
        r.setStatus(BolusStatus.FAILED);
        r.setMessage(message);
        r.setCreatedAt(System.currentTimeMillis());
        r.setUpdatedAt(r.getCreatedAt());
        return r;
    }
    private String bolusId;
    private BolusStatus status;
    private String message;
    private double unitsRequested;
    private double unitsDelivered;
    private BolusType bolusType;

    private long createdAt;

    private long updatedAt;

    public BolusResponse() {}

    public BolusResponse(String bolusId, BolusStatus status, String message,
                         double unitsRequested, double unitsDelivered,
                         BolusType bolusType) {
        this.bolusId = bolusId;
        this.status = status;
        this.message = message;
        this.unitsRequested = unitsRequested;
        this.unitsDelivered = unitsDelivered;
        this.bolusType = bolusType;
        this.createdAt = System.currentTimeMillis();
        this.updatedAt = this.createdAt;
    }

    public String getBolusId() { return bolusId; }
    public void setBolusId(String bolusId) { this.bolusId = bolusId; }

    public BolusStatus getStatus() { return status; }
    public void setStatus(BolusStatus status) { this.status = status; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public double getUnitsRequested() { return unitsRequested; }
    public void setUnitsRequested(double unitsRequested) { this.unitsRequested = unitsRequested; }

    public double getUnitsDelivered() { return unitsDelivered; }
    public void setUnitsDelivered(double unitsDelivered) { this.unitsDelivered = unitsDelivered; }

    public BolusType getBolusType() { return bolusType; }
    public void setBolusType(BolusType bolusType) { this.bolusType = bolusType; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }

    public long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }
}