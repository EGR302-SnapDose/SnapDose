package com.snapdose.api.repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.cloud.FirestoreClient;
import com.snapdose.api.model.BolusRecord;
import com.snapdose.api.model.enums.BolusStatus;

@Repository
public class BolusRepository {

    public void save(BolusRecord record) throws Exception {
        getUserBoluses(record.getUserId())
            .document(record.getBolusId())
            .set(record)
            .get();
    }

    public Optional<BolusRecord> findById(String userId, String bolusId) throws Exception {
        DocumentSnapshot snapshot = getUserBoluses(userId)
            .document(bolusId)
            .get()
            .get();

        if (!snapshot.exists()) {
            return Optional.empty();
        }
        return Optional.ofNullable(snapshot.toObject(BolusRecord.class));
    }

    public void updateStatus(String userId, String bolusId, BolusStatus newStatus, double unitsDelivered) throws Exception {
        getUserBoluses(userId)
            .document(bolusId)
            .update(Map.of(
                "status", newStatus.name(),
                "unitsDelivered", unitsDelivered,
                "updatedAt", System.currentTimeMillis()
            ))
            .get();
    }

    public Optional<BolusRecord> findPendingByDeviceId(String deviceId) throws Exception {
        QuerySnapshot query = getDb().collectionGroup("boluses")
            .whereEqualTo("deviceId", deviceId)
            .whereEqualTo("status", BolusStatus.PENDING.name())
            .limit(1)
            .get()
            .get();

        if (query.isEmpty()) {
            return Optional.empty();
        }
        return Optional.ofNullable(query.getDocuments().get(0).toObject(BolusRecord.class));
    }

    public Optional<BolusRecord> findActiveByDeviceId(String deviceId) throws Exception {
        List<String> activeStatuses = List.of(
            BolusStatus.PENDING.name(),
            BolusStatus.ACKNOWLEDGED.name(),
            BolusStatus.DELIVERING.name()
        );

        QuerySnapshot query = getDb().collectionGroup("boluses")
            .whereEqualTo("deviceId", deviceId)
            .whereIn("status", activeStatuses)
            .limit(1)
            .get()
            .get();

        if (query.isEmpty()) {
            return Optional.empty();
        }
        return Optional.ofNullable(query.getDocuments().get(0).toObject(BolusRecord.class));
    }

    private Firestore getDb() {
        return FirestoreClient.getFirestore();
    }

    private CollectionReference getUserBoluses(String userId) {
        return getDb().collection("users").document(userId).collection("boluses");
    }
}