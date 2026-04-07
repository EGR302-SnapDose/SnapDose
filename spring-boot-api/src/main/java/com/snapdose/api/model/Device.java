package com.snapdose.api.model;

import com.snapdose.api.model.enums.DeviceStatus;

public class Device {

    private String serialNumber;
    private String model;
    private String firmwareVersion;
    private Long registeredAt;
    private Long lastHeartbeat;
    private boolean online;

    private DeviceStatus status;
    private String boundToUid;
    private Long pairedAt;

    private String pairingToken;
    private String pairingCode;
    private Long tokenExpiresAt;

    public Device() {}

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

    public Long getRegisteredAt() {
        return registeredAt;
    }

    public void setRegisteredAt(Long registeredAt) {
        this.registeredAt = registeredAt;
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

    public DeviceStatus getStatus() {
        return status;
    }

    public void setStatus(DeviceStatus status) {
        this.status = status;
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

    public String getPairingToken() {
        return pairingToken;
    }

    public void setPairingToken(String pairingToken) {
        this.pairingToken = pairingToken;
    }

    public String getPairingCode() {
        return pairingCode;
    }

    public void setPairingCode(String pairingCode) {
        this.pairingCode = pairingCode;
    }

    public Long getTokenExpiresAt() {
        return tokenExpiresAt;
    }

    public void setTokenExpiresAt(Long tokenExpiresAt) {
        this.tokenExpiresAt = tokenExpiresAt;
    }
}
