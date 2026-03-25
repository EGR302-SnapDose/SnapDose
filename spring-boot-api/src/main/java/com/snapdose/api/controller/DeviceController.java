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
    public ResponseEntity<Device> registerDevice(@RequestBody DeviceRegisterRequest request) {
        try {
            Device device = deviceService.registerDevice(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(device);
        } catch (Exception e) {
            System.err.println("Device registration error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{deviceId}/status")
    public ResponseEntity<DeviceStatusResponse> getDeviceStatus(@PathVariable String deviceId) {
        try {
            DeviceStatusResponse status = deviceService.getDeviceStatus(deviceId);
            return ResponseEntity.ok(status);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            System.err.println("Device status error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{deviceId}/heartbeat")
    public ResponseEntity<Void> sendHeartbeat(@PathVariable String deviceId) {
        try {
            deviceService.updateHeartbeat(deviceId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            System.err.println("Heartbeat error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
