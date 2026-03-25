package com.snapdose.api.config;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class DeviceTokenProperties {
    private Map<String, String> devices = new HashMap<>();

    public DeviceTokenProperties(
            @Value("${SNAPDOSE_DEVICES_TAB5_001:}") String tab5_001,
            @Value("${SNAPDOSE_DEVICES_TAB5_002:}") String tab5_002) {
        
        if (!tab5_001.isEmpty()) devices.put("tab5-001", tab5_001);
        if (!tab5_002.isEmpty()) devices.put("tab5-002", tab5_002);
        
        System.out.println("DeviceTokenProperties initialized with devices: " + devices);
    }

    public Map<String, String> getDevices() {
        return devices;
    }

    public void setDevices(Map<String, String> devices) {
        this.devices = devices;
    }

    public String getTokenForDevice(String deviceId) {
        return devices.get(deviceId);
    }

    public boolean isValidDeviceToken(String deviceId, String token) {
        String storedToken = devices.get(deviceId);
        return storedToken != null && storedToken.equals(token);
    }
}

