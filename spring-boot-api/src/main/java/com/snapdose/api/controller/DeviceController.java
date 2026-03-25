package com.snapdose.api.controller;

import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.snapdose.api.model.Device;
import com.snapdose.api.model.DeviceRegisterRequest;
import com.snapdose.api.model.DeviceStatusResponse;
import com.snapdose.api.service.DeviceService;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {

    @Autowired
    private DeviceService deviceService;

    @PostMapping("/register")
    public ResponseEntity<Device> registerDevice(@RequestBody DeviceRegisterRequest request) 
            throws ExecutionException, InterruptedException {
        Device device = deviceService.registerDevice(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(device);
    }

    @GetMapping("/{deviceId}/status")
    public ResponseEntity<DeviceStatusResponse> getDeviceStatus(@PathVariable String deviceId) 
            throws ExecutionException, InterruptedException {
        DeviceStatusResponse status = deviceService.getDeviceStatus(deviceId);
        return ResponseEntity.ok(status);
    }

    @PostMapping("/{deviceId}/heartbeat")
    public ResponseEntity<Void> sendHeartbeat(@PathVariable String deviceId) 
            throws ExecutionException, InterruptedException {
        deviceService.updateHeartbeat(deviceId);
        return ResponseEntity.ok().build();
    }
}
