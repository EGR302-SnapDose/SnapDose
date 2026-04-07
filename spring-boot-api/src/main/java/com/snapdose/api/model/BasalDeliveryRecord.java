package com.snapdose.api.model;

public class BasalDeliveryRecord {

    private String deliveryId;
    private String deviceId;
    private double unitsDelivered;
    private double rateUnitsPerHour;
    private double runningTotalUnits;
    private long deliveredAt;

    public BasalDeliveryRecord() {}

    public BasalDeliveryRecord(
        String deliveryId,
        String deviceId,
        double unitsDelivered,
        double rateUnitsPerHour,
        double runningTotalUnits
    ) {
        this.deliveryId = deliveryId;
        this.deviceId = deviceId;
        this.unitsDelivered = unitsDelivered;
        this.rateUnitsPerHour = rateUnitsPerHour;
        this.runningTotalUnits = runningTotalUnits;
        this.deliveredAt = System.currentTimeMillis();
    }

    public String getDeliveryId() {
        return deliveryId;
    }

    public void setDeliveryId(String deliveryId) {
        this.deliveryId = deliveryId;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public double getUnitsDelivered() {
        return unitsDelivered;
    }

    public void setUnitsDelivered(double unitsDelivered) {
        this.unitsDelivered = unitsDelivered;
    }

    public double getRateUnitsPerHour() {
        return rateUnitsPerHour;
    }

    public void setRateUnitsPerHour(double rateUnitsPerHour) {
        this.rateUnitsPerHour = rateUnitsPerHour;
    }

    public double getRunningTotalUnits() {
        return runningTotalUnits;
    }

    public void setRunningTotalUnits(double runningTotalUnits) {
        this.runningTotalUnits = runningTotalUnits;
    }

    public long getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(long deliveredAt) {
        this.deliveredAt = deliveredAt;
    }
}
