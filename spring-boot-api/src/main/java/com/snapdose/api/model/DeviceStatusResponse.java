package com.snapdose.api.model;

public class DeviceStatusResponse {
    private String deviceId;
    private boolean online;
    private Long lastHeartbeat;

    public DeviceStatusResponse(String deviceId, boolean online, Long lastHeartbeat) {
        this.deviceId = deviceId;
        this.online = online;
        this.lastHeartbeat = lastHeartbeat;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public boolean isOnline() {
        return online;
    }

    public void setOnline(boolean online) {
        this.online = online;
    }

    public Long getLastHeartbeat() {
        return lastHeartbeat;
    }

    public void setLastHeartbeat(Long lastHeartbeat) {
        this.lastHeartbeat = lastHeartbeat;
    }
}
