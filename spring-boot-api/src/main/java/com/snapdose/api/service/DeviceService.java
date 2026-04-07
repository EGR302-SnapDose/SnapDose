package com.snapdose.api.service;

import com.snapdose.api.model.Device;
import com.snapdose.api.model.DeviceStatusResponse;
import com.snapdose.api.model.PairRequest;
import com.snapdose.api.model.PairStatusResponse;
import com.snapdose.api.model.enums.DeviceStatus;
import com.snapdose.api.repository.DeviceRepository;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.Optional;
import java.util.Random;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class DeviceService {

    private static final Logger log = LoggerFactory.getLogger(
        DeviceService.class
    );
    private static final long PAIRING_TTL_MS = 10L * 60 * 1000;

    private final DeviceRepository deviceRepository;

    public DeviceService(DeviceRepository deviceRepository) {
        this.deviceRepository = deviceRepository;
    }

    public void registerDevice(
        String serialNumber,
        String model,
        String firmwareVersion
    ) {
        Device device = deviceRepository
            .findBySerialNumber(serialNumber)
            .orElse(new Device());
        device.setSerialNumber(serialNumber);
        if (model != null) device.setModel(model);
        if (firmwareVersion != null) device.setFirmwareVersion(firmwareVersion);
        if (device.getStatus() == null) device.setStatus(DeviceStatus.UNPAIRED);
        if (device.getRegisteredAt() == 0) device.setRegisteredAt(
            System.currentTimeMillis()
        );
        device.setLastHeartbeat(System.currentTimeMillis());
        device.setOnline(true);
        deviceRepository.save(device);
        log.info("Device registered: {}", serialNumber);
    }

    public PairStatusResponse startPairing(String serialNumber) {
        deviceRepository
            .findBySerialNumber(serialNumber)
            .orElseThrow(() ->
                new RuntimeException("Device not found: " + serialNumber)
            );

        byte[] tokenBytes = new byte[32];
        new SecureRandom().nextBytes(tokenBytes);
        String token = HexFormat.of().formatHex(tokenBytes);

        String code = String.format("%06d", new Random().nextInt(1_000_000));
        long expiresAt = System.currentTimeMillis() + PAIRING_TTL_MS;

        deviceRepository.setPairingData(serialNumber, token, code, expiresAt);

        PairStatusResponse resp = new PairStatusResponse();
        resp.setSerialNumber(serialNumber);
        resp.setStatus(DeviceStatus.AWAITING_PAIR);
        resp.setPairingToken(token);
        resp.setPairingCode(code);
        resp.setTokenExpiresAt(expiresAt);
        return resp;
    }

    public PairStatusResponse pair(PairRequest request, String uid) {
        String serialNumber = request.getSerialNumber();
        Device device = deviceRepository
            .findBySerialNumber(serialNumber)
            .orElseThrow(() ->
                new RuntimeException("Device not found: " + serialNumber)
            );

        long now = System.currentTimeMillis();
        if (device.getTokenExpiresAt() < now) {
            throw new RuntimeException("Pairing code has expired");
        }

        boolean tokenMatch =
            request.getPairingToken() != null &&
            request.getPairingToken().equals(device.getPairingToken());
        boolean codeMatch =
            request.getPairingCode() != null &&
            request.getPairingCode().equals(device.getPairingCode());

        if (!tokenMatch && !codeMatch) {
            throw new RuntimeException("Invalid pairing credentials");
        }

        deviceRepository.bindDevice(serialNumber, uid);

        PairStatusResponse resp = new PairStatusResponse();
        resp.setSerialNumber(serialNumber);
        resp.setStatus(DeviceStatus.PAIRED);
        resp.setBoundToUid(uid);
        return resp;
    }

    public PairStatusResponse getPairStatus(String serialNumber) {
        Device device = deviceRepository
            .findBySerialNumber(serialNumber)
            .orElseThrow(() ->
                new RuntimeException("Device not found: " + serialNumber)
            );

        PairStatusResponse resp = new PairStatusResponse();
        resp.setSerialNumber(serialNumber);
        resp.setStatus(
            device.getStatus() != null
                ? device.getStatus()
                : DeviceStatus.UNPAIRED
        );
        resp.setBoundToUid(device.getBoundToUid());
        resp.setPairingCode(device.getPairingCode());
        resp.setTokenExpiresAt(device.getTokenExpiresAt());
        return resp;
    }

    public void deactivate(String serialNumber) {
        Optional<Device> deviceOpt = deviceRepository.findBySerialNumber(
            serialNumber
        );
        if (deviceOpt.isEmpty()) {
            log.warn("Deactivate called for unknown device: {}", serialNumber);
            return;
        }
        Device device = deviceOpt.get();
        String uid = device.getBoundToUid();

        if (uid != null && !uid.isEmpty()) {
            deviceRepository.unbindDevice(serialNumber, uid);
            log.info("Device {} unbound from uid={}", serialNumber, uid);
        } else {
            device.setStatus(DeviceStatus.UNPAIRED);
            device.setBoundToUid(null);
            device.setPairedAt(0L);
            deviceRepository.save(device);
            log.info("Device {} deactivated (no bound user)", serialNumber);
        }
    }

    public DeviceStatusResponse getDeviceStatus(String serialNumber) {
        Device device = deviceRepository
            .findBySerialNumber(serialNumber)
            .orElseThrow(() ->
                new RuntimeException("Device not found: " + serialNumber)
            );

        DeviceStatusResponse resp = new DeviceStatusResponse();
        resp.setSerialNumber(device.getSerialNumber());
        resp.setModel(device.getModel());
        resp.setFirmwareVersion(device.getFirmwareVersion());
        resp.setStatus(
            device.getStatus() != null
                ? device.getStatus()
                : DeviceStatus.UNPAIRED
        );
        resp.setOnline(device.isOnline());
        resp.setLastHeartbeat(device.getLastHeartbeat());
        resp.setBoundToUid(device.getBoundToUid());
        return resp;
    }

    public void updateHeartbeat(String serialNumber) {
        deviceRepository.updateHeartbeat(serialNumber);
    }
}
