package com.snapdose.api.controller;

import com.snapdose.api.model.DeviceRegisterRequest;
import com.snapdose.api.model.DeviceStatusResponse;
import com.snapdose.api.model.PairRequest;
import com.snapdose.api.model.PairStatusResponse;
import com.snapdose.api.security.FirebaseAuthenticationToken;
import com.snapdose.api.service.DeviceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {

    private final DeviceService deviceService;

    public DeviceController(DeviceService deviceService) {
        this.deviceService = deviceService;
    }

    @PostMapping("/register")
    public ResponseEntity<Void> register(
        @RequestBody DeviceRegisterRequest request
    ) {
        try {
            deviceService.registerDevice(
                request.getSerialNumber(),
                request.getModel(),
                request.getFirmwareVersion()
            );
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            return ResponseEntity.status(
                HttpStatus.INTERNAL_SERVER_ERROR
            ).build();
        }
    }

    @PostMapping("/{serial}/start-pairing")
    public ResponseEntity<PairStatusResponse> startPairing(
        @PathVariable String serial
    ) {
        try {
            PairStatusResponse response = deviceService.startPairing(serial);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(
                HttpStatus.INTERNAL_SERVER_ERROR
            ).build();
        }
    }

    @PostMapping("/pair")
    public ResponseEntity<PairStatusResponse> pair(
        @RequestBody PairRequest request,
        Authentication auth
    ) {
        if (!(auth instanceof FirebaseAuthenticationToken)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        String uid = ((FirebaseAuthenticationToken) auth).getUserId();
        try {
            PairStatusResponse response = deviceService.pair(request, uid);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(
                HttpStatus.INTERNAL_SERVER_ERROR
            ).build();
        }
    }

    @GetMapping("/{serial}/pair-status")
    public ResponseEntity<PairStatusResponse> pairStatus(
        @PathVariable String serial
    ) {
        try {
            PairStatusResponse response = deviceService.getPairStatus(serial);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(
                HttpStatus.INTERNAL_SERVER_ERROR
            ).build();
        }
    }

    @PostMapping("/{serial}/deactivate")
    public ResponseEntity<Void> deactivate(@PathVariable String serial) {
        try {
            deviceService.deactivate(serial);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(
                HttpStatus.INTERNAL_SERVER_ERROR
            ).build();
        }
    }

    @GetMapping("/{serial}/status")
    public ResponseEntity<DeviceStatusResponse> status(
        @PathVariable String serial
    ) {
        try {
            return ResponseEntity.ok(deviceService.getDeviceStatus(serial));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(
                HttpStatus.INTERNAL_SERVER_ERROR
            ).build();
        }
    }

    @PostMapping("/{serial}/heartbeat")
    public ResponseEntity<Void> heartbeat(@PathVariable String serial) {
        try {
            deviceService.updateHeartbeat(serial);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(
                HttpStatus.INTERNAL_SERVER_ERROR
            ).build();
        }
    }
}
