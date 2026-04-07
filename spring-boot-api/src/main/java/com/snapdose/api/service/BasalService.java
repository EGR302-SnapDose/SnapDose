package com.snapdose.api.service;

import com.snapdose.api.model.BasalConfig;
import com.snapdose.api.model.BasalConfigRequest;
import com.snapdose.api.model.BasalDeliveryRecord;
import com.snapdose.api.model.BasalStatusResponse;
import com.snapdose.api.model.BolusRecord;
import com.snapdose.api.repository.BasalRepository;
import com.snapdose.api.repository.BolusRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class BasalService {

    private static final int MICROBOLUSES_PER_HOUR = 12;

    private final BasalRepository basalRepository;
    private final BolusRepository bolusRepository;

    public BasalService(
        BasalRepository basalRepository,
        BolusRepository bolusRepository
    ) {
        this.basalRepository = basalRepository;
        this.bolusRepository = bolusRepository;
    }

    public BasalConfig updateConfig(BasalConfigRequest request)
        throws Exception {
        BasalConfig config = new BasalConfig(
            request.getDeviceId(),
            request.getRateUnitsPerHour(),
            request.getActive()
        );
        basalRepository.saveConfig(config);
        return config;
    }

    public Optional<BasalConfig> getConfig(String deviceId) throws Exception {
        return basalRepository.getConfig(deviceId);
    }

    public BasalDeliveryRecord recordDelivery(
        String deviceId,
        double unitsDelivered,
        double rateUnitsPerHour
    ) throws Exception {
        Optional<BolusRecord> activeBolus =
            bolusRepository.findActiveByDeviceId(deviceId);
        if (activeBolus.isPresent()) {
            throw new IllegalStateException(
                "Basal delivery skipped: active bolus " +
                    activeBolus.get().getBolusId() +
                    " in progress"
            );
        }

        double currentTotal = basalRepository.getRunningTotal(deviceId);
        double newTotal = currentTotal + unitsDelivered;

        BasalDeliveryRecord record = new BasalDeliveryRecord(
            UUID.randomUUID().toString(),
            deviceId,
            unitsDelivered,
            rateUnitsPerHour,
            newTotal
        );

        basalRepository.saveDelivery(deviceId, record);
        return record;
    }

    public BasalStatusResponse getStatus(String deviceId) throws Exception {
        BasalStatusResponse response = new BasalStatusResponse();
        response.setDeviceId(deviceId);

        Optional<BasalConfig> config = basalRepository.getConfig(deviceId);
        if (config.isPresent()) {
            response.setRateUnitsPerHour(config.get().getRateUnitsPerHour());
            response.setActive(config.get().isActive());
            response.setConfigUpdatedAt(config.get().getUpdatedAt());
        }

        Optional<BasalDeliveryRecord> latest =
            basalRepository.getLatestDelivery(deviceId);
        if (latest.isPresent()) {
            response.setRunningTotalUnits(latest.get().getRunningTotalUnits());
            response.setLastMicrobolusUnits(latest.get().getUnitsDelivered());
            response.setLastDeliveryAt(latest.get().getDeliveredAt());
        }

        return response;
    }

    public double calculateMicrobolus(double rateUnitsPerHour) {
        return (
            Math.round((rateUnitsPerHour / MICROBOLUSES_PER_HOUR) * 100.0) /
            100.0
        );
    }
}
