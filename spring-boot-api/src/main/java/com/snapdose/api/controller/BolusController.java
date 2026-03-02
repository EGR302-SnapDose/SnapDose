package com.snapdose.api.controller;

import com.snapdose.api.model.BolusRequest;
import com.snapdose.api.model.BolusResponse;
import com.snapdose.api.service.PumpService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class BolusController {

    private final PumpService pumpService;

    public BolusController(PumpService pumpService) {
        this.pumpService = pumpService;
    }

    @PostMapping("/bolus")
    public ResponseEntity<BolusResponse> deliverBolus(@RequestBody BolusRequest request) {
        if (request.getUnits() <= 0) {
            return ResponseEntity.badRequest().body(
                new BolusResponse("error", "Units must be greater than 0", 0)
            );
        }

        BolusResponse response = pumpService.sendBolus(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/pump/status")
    public ResponseEntity<Map<String, Object>> pumpStatus() {
        boolean connected = pumpService.checkPumpConnection();
        return ResponseEntity.ok(Map.of(
            "connected", connected,
            "status", connected ? "online" : "offline"
        ));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
