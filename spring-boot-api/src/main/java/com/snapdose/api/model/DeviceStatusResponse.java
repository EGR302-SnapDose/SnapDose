package com.snapdose.api.model;

import com.snapdose.api.model.enums.DeviceStatus;

public class DeviceStatusResponse {

    private String serialNumber;
    private String model;
    private String firmwareVersion;
    private DeviceStatus status;
    private boolean online;
    private Long lastHeartbeat;
    private String boundToUid;
    private Long pairedAt;

    public DeviceStatusResponse() {}

    public String getSerialNumber() {
        return serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getFirmwareVersion() {
        return firmwareVersion;
    }

    public void setFirmwareVersion(String firmwareVersion) {
        this.firmwareVersion = firmwareVersion;
    }

    public DeviceStatus getStatus() {
        return status;
    }

    public void setStatus(DeviceStatus status) {
        this.status = status;
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

    public String getBoundToUid() {
        return boundToUid;
    }

    public void setBoundToUid(String boundToUid) {
        this.boundToUid = boundToUid;
    }

    public Long getPairedAt() {
        return pairedAt;
    }

    public void setPairedAt(Long pairedAt) {
        this.pairedAt = pairedAt;
    }
}
