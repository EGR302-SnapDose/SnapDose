package com.snapdose.api.model;

import com.snapdose.api.model.enums.BolusStatus;

public class PumpStatusResponse {

    private boolean connected;
    private String deviceId;
    private String status;
    private BolusStatus activeBolusStatus;
    private String activeBolusId;
    private long lastHeartbeat;

    public PumpStatusResponse() {}

    public boolean isConnected() { return connected; }
    public void setConnected(boolean connected) { this.connected = connected; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public BolusStatus getActiveBolusStatus() { return activeBolusStatus; }
    public void setActiveBolusStatus(BolusStatus activeBolusStatus) { this.activeBolusStatus = activeBolusStatus; }

    public String getActiveBolusId() { return activeBolusId; }
    public void setActiveBolusId(String activeBolusId) { this.activeBolusId = activeBolusId; }

    public long getLastHeartbeat() { return lastHeartbeat; }
    public void setLastHeartbeat(long lastHeartbeat) { this.lastHeartbeat = lastHeartbeat; }
}