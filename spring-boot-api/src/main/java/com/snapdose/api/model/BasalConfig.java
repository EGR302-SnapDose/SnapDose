package com.snapdose.api.model;

public class BasalConfig {

    private String deviceId;
    private double rateUnitsPerHour;
    private boolean active;
    private long updatedAt;

    public BasalConfig() {}

    public BasalConfig(
        String deviceId,
        double rateUnitsPerHour,
        boolean active
    ) {
        this.deviceId = deviceId;
        this.rateUnitsPerHour = rateUnitsPerHour;
        this.active = active;
        this.updatedAt = System.currentTimeMillis();
    }

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

    public long getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(long updatedAt) {
        this.updatedAt = updatedAt;
    }
}
