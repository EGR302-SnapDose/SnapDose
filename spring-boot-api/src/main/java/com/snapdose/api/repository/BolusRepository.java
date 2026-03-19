package com.snapdose.api.repository;

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

    private static final String COLLECTION = "boluses";

    public void save(BolusRecord record) throws Exception {
        getCollection()
            .document(record.getBolusId())
            .set(record)
            .get();
    }

    public Optional<BolusRecord> findById(String bolusId) throws Exception {
        DocumentSnapshot snapshot = getCollection()
            .document(bolusId)
            .get()
            .get();

        if (!snapshot.exists()) {
            return Optional.empty();
        }
        return Optional.ofNullable(snapshot.toObject(BolusRecord.class));
    }

    public void updateStatus(String bolusId, BolusStatus newStatus, double unitsDelivered) throws Exception {
        getCollection()
            .document(bolusId)
            .update(Map.of(
                "status", newStatus.name(),
                "unitsDelivered", unitsDelivered,
                "updatedAt", System.currentTimeMillis()
            ))
            .get();
    }

    public Optional<BolusRecord> findPendingByDeviceId(String deviceId) throws Exception {
        QuerySnapshot query = getCollection()
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

    private CollectionReference getCollection() {
        Firestore db = FirestoreClient.getFirestore();
        return db.collection(COLLECTION);
    }
}