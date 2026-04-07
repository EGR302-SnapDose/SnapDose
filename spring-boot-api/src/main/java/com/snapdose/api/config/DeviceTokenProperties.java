package com.snapdose.api.config;

import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class DeviceTokenProperties {

    private static final Logger log = LoggerFactory.getLogger(
        DeviceTokenProperties.class
    );

    private final Map<String, String> devices = new HashMap<>();

    public DeviceTokenProperties(
        @Value("${SNAPDOSE_DEVICES_TAB5_001:}") String tab5_001,
        @Value("${SNAPDOSE_DEVICES_TAB5_002:}") String tab5_002
    ) {
        if (!tab5_001.isBlank()) devices.put("tab5-001", tab5_001);
        if (!tab5_002.isBlank()) devices.put("tab5-002", tab5_002);

        if (devices.isEmpty()) {
            log.warn(
                "No device tokens configured. Set SNAPDOSE_DEVICES_TAB5_001 / TAB5_002 env vars."
            );
        } else {
            log.info(
                "Device token config loaded for {} device(s).",
                devices.size()
            );
        }
    }

    public Map<String, String> getDevices() {
        return devices;
    }

    public boolean isValidDeviceToken(String deviceId, String token) {
        String stored = devices.get(deviceId);
        return stored != null && stored.equals(token);
    }
}
