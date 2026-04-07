package com.snapdose.api.model;

public class BasalStatusResponse {

    private String deviceId;
    private double rateUnitsPerHour;
    private boolean active;
    private double runningTotalUnits;
    private double lastMicrobolusUnits;
    private long lastDeliveryAt;
    private long configUpdatedAt;

    public BasalStatusResponse() {}

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public double getRateUnitsPerHour() {
        return rateUnitsPerHour;
    }

    public void setRateUnitsPerHour(double rateUnitsPerHour) {
        this.rateUnitsPerHour = rateUnitsPerHour;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public double getRunningTotalUnits() {
        return runningTotalUnits;
    }

    public void setRunningTotalUnits(double runningTotalUnits) {
        this.runningTotalUnits = runningTotalUnits;
    }

    public double getLastMicrobolusUnits() {
        return lastMicrobolusUnits;
    }

    public void setLastMicrobolusUnits(double lastMicrobolusUnits) {
        this.lastMicrobolusUnits = lastMicrobolusUnits;
    }

    public long getLastDeliveryAt() {
        return lastDeliveryAt;
    }

    public void setLastDeliveryAt(long lastDeliveryAt) {
        this.lastDeliveryAt = lastDeliveryAt;
    }

    public long getConfigUpdatedAt() {
        return configUpdatedAt;
    }

    public void setConfigUpdatedAt(long configUpdatedAt) {
        this.configUpdatedAt = configUpdatedAt;
    }
}
