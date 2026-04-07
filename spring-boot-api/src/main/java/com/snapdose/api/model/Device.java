package com.snapdose.api.model;

import com.google.cloud.firestore.annotation.DocumentId;

public class Device {
    @DocumentId
    private String deviceId;
    
    private String firmwareVersion;
    private Integer wifiSignalStrength;  // RSSI in dBm
    private String batteryLevel;          // "85%" or similar
    private Long lastHeartbeat;           // timestamp in milliseconds
    private boolean online;

    public Device() {}

    public Device(String deviceId, String firmwareVersion, Integer wifiSignalStrength, String batteryLevel) {
        this.deviceId = deviceId;
        this.firmwareVersion = firmwareVersion;
        this.wifiSignalStrength = wifiSignalStrength;
        this.batteryLevel = batteryLevel;
        this.lastHeartbeat = System.currentTimeMillis();
        this.online = true;
    }

    // Getters and Setters
    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public String getFirmwareVersion() {
        return firmwareVersion;
    }

    public void setFirmwareVersion(String firmwareVersion) {
        this.firmwareVersion = firmwareVersion;
    }

    public Integer getWifiSignalStrength() {
        return wifiSignalStrength;
    }

    public void setWifiSignalStrength(Integer wifiSignalStrength) {
        this.wifiSignalStrength = wifiSignalStrength;
    }

    public String getBatteryLevel() {
        return batteryLevel;
    }

    public void setBatteryLevel(String batteryLevel) {
        this.batteryLevel = batteryLevel;
    }

    public Long getLastHeartbeat() {
        return lastHeartbeat;
    }

    public void setLastHeartbeat(Long lastHeartbeat) {
        this.lastHeartbeat = lastHeartbeat;
    }

    public boolean isOnline() {
        return online;
    }

    public void setOnline(boolean online) {
        this.online = online;
    }
}
