package com.snapdose.api.controller;

import com.snapdose.api.model.BasalConfig;
import com.snapdose.api.model.BasalConfigRequest;
import com.snapdose.api.model.BasalDeliveryRecord;
import com.snapdose.api.model.BasalStatusResponse;
import com.snapdose.api.service.BasalService;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/basal")
public class BasalController {

    private final BasalService basalService;

    public BasalController(BasalService basalService) {
        this.basalService = basalService;
    }

    @PostMapping("/config")
    public ResponseEntity<BasalConfig> updateConfig(
        @Valid @RequestBody BasalConfigRequest request
    ) throws Exception {
        BasalConfig config = basalService.updateConfig(request);
        return ResponseEntity.ok(config);
    }

    @GetMapping("/{deviceId}/config")
    public ResponseEntity<BasalConfig> getConfig(@PathVariable String deviceId)
        throws Exception {
        Optional<BasalConfig> config = basalService.getConfig(deviceId);
        return config
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping("/{deviceId}/deliver")
    public ResponseEntity<?> recordDelivery(
        @PathVariable String deviceId,
        @RequestBody Map<String, Object> body
    ) throws Exception {
        double unitsDelivered = (
            (Number) body.get("unitsDelivered")
        ).doubleValue();
        double rateUnitsPerHour = (
            (Number) body.get("rateUnitsPerHour")
        ).doubleValue();

        try {
            BasalDeliveryRecord record = basalService.recordDelivery(
                deviceId,
                unitsDelivered,
                rateUnitsPerHour
            );
            return ResponseEntity.ok(record);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(
                Map.of("error", "BOLUS_ACTIVE", "message", e.getMessage())
            );
        }
    }

    @GetMapping("/{deviceId}/status")
    public ResponseEntity<BasalStatusResponse> getStatus(
        @PathVariable String deviceId
    ) throws Exception {
        BasalStatusResponse status = basalService.getStatus(deviceId);
        return ResponseEntity.ok(status);
    }
}
