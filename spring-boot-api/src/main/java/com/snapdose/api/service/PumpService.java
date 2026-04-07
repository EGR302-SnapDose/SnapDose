package com.snapdose.api.service;

import com.snapdose.api.model.BolusRecord;
import com.snapdose.api.model.BolusRequest;
import com.snapdose.api.model.BolusResponse;
import com.snapdose.api.model.PumpStatusResponse;
import com.snapdose.api.repository.BolusRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class PumpService {

    private final BolusService bolusService;
    private final BolusRepository bolusRepository;

    public PumpService(
        BolusService bolusService,
        BolusRepository bolusRepository
    ) {
        this.bolusService = bolusService;
        this.bolusRepository = bolusRepository;
    }

    public BolusResponse sendBolus(BolusRequest request) throws Exception {
        return bolusService.createBolus(request);
    }

    public PumpStatusResponse getPumpStatus(String deviceId) throws Exception {
        PumpStatusResponse response = new PumpStatusResponse();
        response.setDeviceId(deviceId);

        Optional<BolusRecord> active = bolusRepository.findActiveByDeviceId(
            deviceId
        );
        if (active.isPresent()) {
            BolusRecord record = active.get();
            response.setConnected(true);
            response.setStatus("busy");
            response.setActiveBolusId(record.getBolusId());
            response.setActiveBolusStatus(record.getStatus());
            response.setLastHeartbeat(record.getUpdatedAt());
        } else {
            response.setConnected(true);
            response.setStatus("idle");
            response.setLastHeartbeat(System.currentTimeMillis());
        }

        return response;
    }
}
