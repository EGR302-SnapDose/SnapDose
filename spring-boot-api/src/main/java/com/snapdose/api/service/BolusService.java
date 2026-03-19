package com.snapdose.api.service;

import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.snapdose.api.model.BolusRecord;
import com.snapdose.api.model.BolusRequest;
import com.snapdose.api.model.BolusResponse;
import com.snapdose.api.model.enums.BolusStatus;
import com.snapdose.api.repository.BolusRepository;

@Service
public class BolusService {

    private static final Map<BolusStatus, Set<BolusStatus>> VALID_TRANSITIONS = Map.of(
        BolusStatus.PENDING, Set.of(BolusStatus.ACKNOWLEDGED, BolusStatus.CANCELLED, BolusStatus.FAILED),
        BolusStatus.ACKNOWLEDGED, Set.of(BolusStatus.DELIVERING, BolusStatus.CANCELLED, BolusStatus.FAILED),
        BolusStatus.DELIVERING, Set.of(BolusStatus.COMPLETED, BolusStatus.FAILED),
        BolusStatus.COMPLETED, Set.of(),
        BolusStatus.FAILED, Set.of(),
        BolusStatus.CANCELLED, Set.of()
    );

    private final BolusRepository repository;

    public BolusService(BolusRepository repository) {
        this.repository = repository;
    }

    public BolusResponse createBolus(BolusRequest request) throws Exception {
        String bolusId = UUID.randomUUID().toString();
        BolusRecord record = BolusRecord.fromRequest(bolusId, request);
        repository.save(record);
        return BolusResponse.pending(bolusId, request.getUnits(), request.getBolusType());
    }

    public BolusResponse transitionStatus(String bolusId, BolusStatus newStatus, double unitsDelivered) throws Exception {
        BolusRecord record = repository.findById(bolusId)
            .orElseThrow(() -> new IllegalArgumentException("Bolus not found: " + bolusId));

        Set<BolusStatus> allowed = VALID_TRANSITIONS.getOrDefault(record.getStatus(), Set.of());
        if (!allowed.contains(newStatus)) {
            throw new IllegalStateException(
                "Cannot transition from " + record.getStatus() + " to " + newStatus
            );
        }

        repository.updateStatus(bolusId, newStatus, unitsDelivered);

        BolusResponse response = new BolusResponse();
        response.setBolusId(bolusId);
        response.setStatus(newStatus);
        response.setUnitsRequested(record.getUnitsRequested());
        response.setUnitsDelivered(unitsDelivered);
        response.setBolusType(record.getBolusType());
        response.setMessage("Status updated to " + newStatus);
        response.setCreatedAt(record.getCreatedAt());
        response.setUpdatedAt(System.currentTimeMillis());
        return response;
    }

    public Optional<BolusResponse> getBolusStatus(String bolusId) throws Exception {
        return repository.findById(bolusId).map(record -> {
            BolusResponse response = new BolusResponse();
            response.setBolusId(record.getBolusId());
            response.setStatus(record.getStatus());
            response.setUnitsRequested(record.getUnitsRequested());
            response.setUnitsDelivered(record.getUnitsDelivered());
            response.setBolusType(record.getBolusType());
            response.setMessage("Current status: " + record.getStatus());
            response.setCreatedAt(record.getCreatedAt());
            response.setUpdatedAt(record.getUpdatedAt());
            return response;
        });
    }

    public Optional<BolusRecord> getPendingBolus(String deviceId) throws Exception {
        return repository.findPendingByDeviceId(deviceId);
    }
}