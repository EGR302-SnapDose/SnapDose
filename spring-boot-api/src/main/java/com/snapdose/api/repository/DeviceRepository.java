package com.snapdose.api.repository;

import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Repository;

import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import com.snapdose.api.model.Device;

@Repository
public class DeviceRepository {

    private Firestore getFirestore() {
        return FirestoreClient.getFirestore();
    }

    public void save(Device device) throws ExecutionException, InterruptedException {
        getFirestore().collection("devices").document(device.getDeviceId()).set(device).get();
    }

    public Device findById(String deviceId) throws ExecutionException, InterruptedException {
        return getFirestore().collection("devices").document(deviceId).get().get().toObject(Device.class);
    }

    public boolean exists(String deviceId) throws ExecutionException, InterruptedException {
        return getFirestore().collection("devices").document(deviceId).get().get().exists();
    }

    public void updateLastHeartbeat(String deviceId) throws ExecutionException, InterruptedException {
        getFirestore().collection("devices").document(deviceId)
                .update("lastHeartbeat", System.currentTimeMillis(), "online", true).get();
    }
}
