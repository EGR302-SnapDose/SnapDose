package com.snapdose.api.service;

import com.snapdose.api.model.BolusRequest;
import com.snapdose.api.model.BolusResponse;
import org.springframework.stereotype.Service;

@Service
public class PumpService {

    // TODO: Replace with actual M5Stack Tab5 HTTP endpoint
    private static final String PUMP_BASE_URL = "http://localhost:8081";

    public BolusResponse sendBolus(BolusRequest request) {
        // TODO: Send HTTP request to M5Stack Tab5 microcontroller
        // The microcontroller runs an HTTP server that accepts bolus commands
        // For now, return a simulated success response
        return new BolusResponse(
            "confirmed",
            "Bolus of " + request.getUnits() + " units delivered",
            request.getUnits()
        );
    }

    public boolean checkPumpConnection() {
        // TODO: Ping the microcontroller health endpoint
        return true;
    }
}
