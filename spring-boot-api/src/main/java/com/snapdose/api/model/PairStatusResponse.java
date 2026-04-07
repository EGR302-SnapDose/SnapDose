package com.snapdose.api.model;

import com.snapdose.api.model.enums.DeviceStatus;

public class PairStatusResponse {

    private String serialNumber;
    private DeviceStatus status;
    private Long tokenExpiresAt;
    private String pairingToken;
    private String pairingCode;
    private String boundToUid;

    public PairStatusResponse() {}

    public String getSerialNumber() {
        return serialNumber;
    }

    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }

    public DeviceStatus getStatus() {
        return status;
    }

    public void setStatus(DeviceStatus status) {
        this.status = status;
    }

    public Long getTokenExpiresAt() {
        return tokenExpiresAt;
    }

    public void setTokenExpiresAt(Long tokenExpiresAt) {
        this.tokenExpiresAt = tokenExpiresAt;
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

    public String getBoundToUid() {
        return boundToUid;
    }

    public void setBoundToUid(String boundToUid) {
        this.boundToUid = boundToUid;
    }
}
