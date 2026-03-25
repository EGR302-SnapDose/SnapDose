package com.snapdose.api.model;

public class DeviceRegisterRequest {
    private String deviceId;
    private String firmwareVersion;
    private Integer wifiSignalStrength;
    private String batteryLevel;

    public DeviceRegisterRequest() {}

    public DeviceRegisterRequest(String deviceId, String firmwareVersion, Integer wifiSignalStrength, String batteryLevel) {
        this.deviceId = deviceId;
        this.firmwareVersion = firmwareVersion;
        this.wifiSignalStrength = wifiSignalStrength;
        this.batteryLevel = batteryLevel;
    }

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
}
