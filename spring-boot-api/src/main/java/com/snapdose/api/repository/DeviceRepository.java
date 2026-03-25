package com.snapdose.api.repository;

import java.util.concurrent.ExecutionException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.google.cloud.firestore.Firestore;
import com.snapdose.api.model.Device;

@Repository
public class DeviceRepository {

    @Autowired
    private Firestore firestore;

    public void save(Device device) throws ExecutionException, InterruptedException {
        firestore.collection("devices").document(device.getDeviceId()).set(device).get();
    }

    public Device findById(String deviceId) throws ExecutionException, InterruptedException {
        return firestore.collection("devices").document(deviceId).get().get().toObject(Device.class);
    }

    public boolean exists(String deviceId) throws ExecutionException, InterruptedException {
        return firestore.collection("devices").document(deviceId).get().get().exists();
    }

    public void updateLastHeartbeat(String deviceId) throws ExecutionException, InterruptedException {
        firestore.collection("devices").document(deviceId)
                .update("lastHeartbeat", System.currentTimeMillis(), "online", true).get();
    }
}
