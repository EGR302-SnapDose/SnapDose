package com.snapdose.api.repository;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.cloud.FirestoreClient;
import com.snapdose.api.model.BasalConfig;
import com.snapdose.api.model.BasalDeliveryRecord;
import java.util.Objects;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class BasalRepository {

    public void saveConfig(BasalConfig config) throws Exception {
        getDb()
            .collection("devices")
            .document(Objects.requireNonNull(config.getDeviceId()))
            .collection("basalConfig")
            .document("current")
            .set(config)
            .get();
    }

    public Optional<BasalConfig> getConfig(String deviceId) throws Exception {
        DocumentSnapshot snapshot = getDb()
            .collection("devices")
            .document(Objects.requireNonNull(deviceId))
            .collection("basalConfig")
            .document("current")
            .get()
            .get();

        if (!snapshot.exists()) {
            return Optional.empty();
        }
        return Optional.ofNullable(snapshot.toObject(BasalConfig.class));
    }

    public void saveDelivery(String deviceId, BasalDeliveryRecord record)
        throws Exception {
        getDb()
            .collection("devices")
            .document(Objects.requireNonNull(deviceId))
            .collection("basalDeliveries")
            .document(Objects.requireNonNull(record.getDeliveryId()))
            .set(record)
            .get();
    }

    public Optional<BasalDeliveryRecord> getLatestDelivery(String deviceId)
        throws Exception {
        QuerySnapshot query = getDb()
            .collection("devices")
            .document(Objects.requireNonNull(deviceId))
            .collection("basalDeliveries")
            .orderBy("deliveredAt", Query.Direction.DESCENDING)
            .limit(1)
            .get()
            .get();

        if (query.isEmpty()) {
            return Optional.empty();
        }
        return Optional.ofNullable(
            query.getDocuments().get(0).toObject(BasalDeliveryRecord.class)
        );
    }

    public double getRunningTotal(String deviceId) throws Exception {
        Optional<BasalDeliveryRecord> latest = getLatestDelivery(deviceId);
        return latest
            .map(BasalDeliveryRecord::getRunningTotalUnits)
            .orElse(0.0);
    }

    private Firestore getDb() {
        return FirestoreClient.getFirestore();
    }
}
