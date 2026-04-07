package com.snapdose.api.repository;

import com.google.cloud.firestore.*;
import com.snapdose.api.model.Device;
import com.snapdose.api.model.enums.DeviceStatus;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;
import org.springframework.stereotype.Repository;

@Repository
public class DeviceRepository {

    private final Firestore firestore;

    public DeviceRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    private CollectionReference devices() {
        return firestore.collection("devices");
    }

    public void save(Device device) {
        try {
            devices()
                .document(device.getSerialNumber())
                .set(device, SetOptions.merge())
                .get();
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to save device", e);
        }
    }

    public Optional<Device> findBySerialNumber(String serialNumber) {
        try {
            DocumentSnapshot snap = devices()
                .document(serialNumber)
                .get()
                .get();
            if (!snap.exists()) return Optional.empty();
            return Optional.ofNullable(snap.toObject(Device.class));
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to find device", e);
        }
    }

    public void setPairingData(
        String serialNumber,
        String token,
        String code,
        long expiresAt
    ) {
        try {
            Map<String, Object> updates = new HashMap<>();
            updates.put("pairingToken", token);
            updates.put("pairingCode", code);
            updates.put("tokenExpiresAt", expiresAt);
            updates.put("status", DeviceStatus.AWAITING_PAIR.name());
            devices().document(serialNumber).update(updates).get();
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to set pairing data", e);
        }
    }

    public void bindDevice(String serialNumber, String uid) {
        try {
            long now = System.currentTimeMillis();

            // Update device document
            Map<String, Object> deviceUpdates = new HashMap<>();
            deviceUpdates.put("boundToUid", uid);
            deviceUpdates.put("pairedAt", now);
            deviceUpdates.put("status", DeviceStatus.PAIRED.name());
            deviceUpdates.put("pairingToken", null);
            deviceUpdates.put("pairingCode", null);
            deviceUpdates.put("tokenExpiresAt", null);

            // Update user document
            Map<String, Object> userUpdates = new HashMap<>();
            userUpdates.put("devices.insulinPump.serialNumber", serialNumber);
            userUpdates.put("devices.insulinPump.deviceId", serialNumber);
            userUpdates.put("devices.insulinPump.model", "OmniPod 5 Simulator");
            userUpdates.put("devices.insulinPump.pairedAt", now);
            userUpdates.put("devices.insulinPump.paired", true);
            userUpdates.put("devices.insulinPump.online", true);

            WriteBatch batch = firestore.batch();
            batch.update(devices().document(serialNumber), deviceUpdates);
            batch.update(
                firestore.collection("users").document(uid),
                userUpdates
            );
            batch.commit().get();
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to bind device", e);
        }
    }

    public void unbindDevice(String serialNumber, String uid) {
        try {
            Map<String, Object> deviceUpdates = new HashMap<>();
            deviceUpdates.put("boundToUid", null);
            deviceUpdates.put("pairedAt", null);
            deviceUpdates.put("status", DeviceStatus.UNPAIRED.name());

            Map<String, Object> userUpdates = new HashMap<>();
            userUpdates.put("devices.insulinPump.serialNumber", null);
            userUpdates.put("devices.insulinPump.deviceId", null);
            userUpdates.put("devices.insulinPump.model", null);
            userUpdates.put("devices.insulinPump.pairedAt", null);
            userUpdates.put("devices.insulinPump.paired", false);
            userUpdates.put("devices.insulinPump.online", false);

            WriteBatch batch = firestore.batch();
            batch.update(devices().document(serialNumber), deviceUpdates);
            batch.update(
                firestore.collection("users").document(uid),
                userUpdates
            );
            batch.commit().get();
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to unbind device", e);
        }
    }

    public void updateHeartbeat(String serialNumber) {
        try {
            Map<String, Object> updates = new HashMap<>();
            updates.put("lastHeartbeat", System.currentTimeMillis());
            updates.put("online", true);
            devices().document(serialNumber).update(updates).get();
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to update heartbeat", e);
        }
    }
}
