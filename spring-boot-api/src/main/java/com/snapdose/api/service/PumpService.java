package com.snapdose.api.service;

import org.springframework.stereotype.Service;

import com.snapdose.api.model.BolusRequest;
import com.snapdose.api.model.BolusResponse;
import com.snapdose.api.model.PumpStatusResponse;

@Service
public class PumpService {

    private final BolusService bolusService;

    public PumpService(BolusService bolusService) {
        this.bolusService = bolusService;
    }

    public BolusResponse sendBolus(BolusRequest request) throws Exception {
        return bolusService.createBolus(request);
    }

    public PumpStatusResponse getPumpStatus() {
        // TODO (SNAP-132): query Firestore for device state
        PumpStatusResponse status = new PumpStatusResponse();
        status.setConnected(true);
        status.setStatus("idle");
        status.setLastHeartbeat(System.currentTimeMillis());
        return status;
    }
}