package com.snapdose.api.repository;

import java.util.List;
import java.util.Objects;
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
            .document(Objects.requireNonNull(record.getBolusId()))
            .set(record)
            .get();
    }

    public Optional<BolusRecord> findById(String userId, String bolusId) throws Exception {
        DocumentSnapshot snapshot = getUserBoluses(userId)
            .document(Objects.requireNonNull(bolusId))
            .get()
            .get();

        if (!snapshot.exists()) {
            return Optional.empty();
        }
        return Optional.ofNullable(snapshot.toObject(BolusRecord.class));
    }

    public void updateStatus(String userId, String bolusId, BolusStatus newStatus, double unitsDelivered) throws Exception {
        getUserBoluses(userId)
            .document(Objects.requireNonNull(bolusId))
            .update(
                "status", newStatus.name(),
                "unitsDelivered", unitsDelivered,
                "updatedAt", System.currentTimeMillis()
            )
            .get();
    }

    public Optional<BolusRecord> findPendingByDeviceId(String deviceId) throws Exception {
        try {
            QuerySnapshot query = getDb().collectionGroup("boluses")
                .whereEqualTo("deviceId", Objects.requireNonNull(deviceId))
                .limit(10)
                .get()
                .get();

            if (query.isEmpty()) {
                return Optional.empty();
            }

            for (DocumentSnapshot doc : query.getDocuments()) {
                BolusRecord record = doc.toObject(BolusRecord.class);
                if (record != null && record.getStatus() == BolusStatus.PENDING) {
                    return Optional.of(record);
                }
            }
            return Optional.empty();
        } catch (Exception e) {
            System.err.println("ERROR in findPendingByDeviceId: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public Optional<BolusRecord> findActiveByDeviceId(String deviceId) throws Exception {
        try {
            List<String> activeStatuses = List.of(
                BolusStatus.PENDING.name(),
                BolusStatus.ACKNOWLEDGED.name(),
                BolusStatus.DELIVERING.name()
            );

            QuerySnapshot query = getDb().collectionGroup("boluses")
                .whereEqualTo("deviceId", Objects.requireNonNull(deviceId))
                .limit(10)
                .get()
                .get();

            if (query.isEmpty()) {
                return Optional.empty();
            }

            for (DocumentSnapshot doc : query.getDocuments()) {
                BolusRecord record = doc.toObject(BolusRecord.class);
                if (record != null && activeStatuses.contains(record.getStatus().name())) {
                    return Optional.of(record);
                }
            }
            return Optional.empty();
        } catch (Exception e) {
            System.err.println("ERROR in findActiveByDeviceId: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    private Firestore getDb() {
        return FirestoreClient.getFirestore();
    }

    private CollectionReference getUserBoluses(String userId) {
        return getDb().collection("users").document(Objects.requireNonNull(userId)).collection("boluses");
    }
}