package com.snapdose.api.model;

public class BolusResponse {

    private String status;
    private String message;
    private double unitsDelivered;

    public BolusResponse() {}

    public BolusResponse(String status, String message, double unitsDelivered) {
        this.status = status;
        this.message = message;
        this.unitsDelivered = unitsDelivered;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public double getUnitsDelivered() { return unitsDelivered; }
    public void setUnitsDelivered(double unitsDelivered) { this.unitsDelivered = unitsDelivered; }
}
