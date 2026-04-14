package com.snapdose.api.controller;

import com.snapdose.api.model.BolusRecord;
import com.snapdose.api.model.BolusRequest;
import com.snapdose.api.model.BolusResponse;
import com.snapdose.api.model.Device;
import com.snapdose.api.model.PumpStatusResponse;
import com.snapdose.api.model.enums.BolusStatus;
import com.snapdose.api.model.enums.DeviceStatus;
import com.snapdose.api.repository.DeviceRepository;
import com.snapdose.api.service.BolusService;
import com.snapdose.api.service.PumpService;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class BolusController {

    private final PumpService pumpService;
    private final BolusService bolusService;
    private final DeviceRepository deviceRepository;

    public BolusController(
        PumpService pumpService,
        BolusService bolusService,
        DeviceRepository deviceRepository
    ) {
        this.pumpService = pumpService;
        this.bolusService = bolusService;
        this.deviceRepository = deviceRepository;
    }

    @PostMapping("/bolus")
    public ResponseEntity<BolusResponse> deliverBolus(
        @Valid @RequestBody BolusRequest request
    ) throws Exception {
        BolusResponse response = pumpService.sendBolus(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/bolus/{userId}/{bolusId}")
    public ResponseEntity<BolusResponse> getBolusStatus(
        @PathVariable String userId,
        @PathVariable String bolusId
    ) throws Exception {
        Optional<BolusResponse> response = bolusService.getBolusStatus(
            userId,
            bolusId
        );
        return response
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/bolus/{userId}/{bolusId}/acknowledge")
    public ResponseEntity<BolusResponse> acknowledgeBolus(
        @PathVariable String userId,
        @PathVariable String bolusId
    ) throws Exception {
        BolusResponse response = bolusService.transitionStatus(
            userId,
            bolusId,
            BolusStatus.ACKNOWLEDGED,
            0
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bolus/{userId}/{bolusId}/confirm")
    public ResponseEntity<BolusResponse> confirmDelivery(
        @PathVariable String userId,
        @PathVariable String bolusId,
        @RequestBody Map<String, Object> body
    ) throws Exception {
        double unitsDelivered = (
            (Number) body.getOrDefault("unitsDelivered", 0.0)
        ).doubleValue();
        BolusResponse response = bolusService.transitionStatus(
            userId,
            bolusId,
            BolusStatus.COMPLETED,
            unitsDelivered
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/pump/{deviceId}/fail-stale")
    public ResponseEntity<Void> failStaleBolus(@PathVariable String deviceId) {
        try {
            bolusService.failStaleAcknowledgedBolus(deviceId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(
                HttpStatus.INTERNAL_SERVER_ERROR
            ).build();
        }
    }

    @GetMapping("/pump/{deviceId}/pending")
    public ResponseEntity<BolusRecord> getPendingBolus(
        @PathVariable String deviceId
    ) throws Exception {
        Device device = deviceRepository
            .findBySerialNumber(deviceId)
            .orElse(null);
        if (
            device == null ||
            device.getStatus() != DeviceStatus.PAIRED ||
            device.getBoundToUid() == null
        ) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Optional<BolusRecord> record = bolusService.getPendingBolus(deviceId);
        if (record.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        BolusRecord bolus = record.get();
        if (!device.getBoundToUid().equals(bolus.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(bolus);
    }

    @GetMapping("/pump/{deviceId}/status")
    public ResponseEntity<PumpStatusResponse> pumpStatus(
        @PathVariable String deviceId
    ) throws Exception {
        PumpStatusResponse status = pumpService.getPumpStatus(deviceId);
        return ResponseEntity.ok(status);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(
            Map.of(
                "status",
                "ok",
                "version",
                "0.6.0",
                "timestamp",
                System.currentTimeMillis()
            )
        );
    }
}
