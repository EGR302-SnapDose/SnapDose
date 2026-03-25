package com.snapdose.api.service;

import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.snapdose.api.model.Device;
import com.snapdose.api.model.DeviceRegisterRequest;
import com.snapdose.api.model.DeviceStatusResponse;
import com.snapdose.api.repository.DeviceRepository;

@Service
public class DeviceService {

    @Autowired
    private DeviceRepository deviceRepository;

    public Device registerDevice(DeviceRegisterRequest request) throws ExecutionException, InterruptedException {
        Device device = new Device(
                request.getDeviceId(),
                request.getFirmwareVersion(),
                request.getWifiSignalStrength(),
                request.getBatteryLevel()
        );
        
        deviceRepository.save(device);
        return device;
    }

    public DeviceStatusResponse getDeviceStatus(String deviceId) throws ExecutionException, InterruptedException {
        Device device = deviceRepository.findById(deviceId);
        
        if (device == null) {
            throw new IllegalArgumentException("Device not found: " + deviceId);
        }
        
        return new DeviceStatusResponse(
                device.getDeviceId(),
                device.isOnline(),
                device.getLastHeartbeat()
        );
    }

    public void updateHeartbeat(String deviceId) throws ExecutionException, InterruptedException {
        if (!deviceRepository.exists(deviceId)) {
            throw new IllegalArgumentException("Device not found: " + deviceId);
        }
        
        deviceRepository.updateLastHeartbeat(deviceId);
    }
}
