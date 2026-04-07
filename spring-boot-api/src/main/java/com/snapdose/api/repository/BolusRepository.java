package com.snapdose.api.repository;

import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.cloud.FirestoreClient;
import com.snapdose.api.model.BolusRecord;
import com.snapdose.api.model.enums.BolusStatus;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class BolusRepository {

    public void save(BolusRecord record) throws Exception {
        getUserBoluses(record.getUserId())
            .document(Objects.requireNonNull(record.getBolusId()))
            .set(record)
            .get();
    }

    public Optional<BolusRecord> findById(String userId, String bolusId)
        throws Exception {
        DocumentSnapshot snapshot = getUserBoluses(userId)
            .document(Objects.requireNonNull(bolusId))
            .get()
            .get();
        return snapshot.exists()
            ? Optional.ofNullable(snapshot.toObject(BolusRecord.class))
            : Optional.empty();
    }

    public void updateStatus(
        String userId,
        String bolusId,
        BolusStatus newStatus,
        double unitsDelivered
    ) throws Exception {
        getUserBoluses(userId)
            .document(Objects.requireNonNull(bolusId))
            .update(
                "status",
                newStatus.name(),
                "unitsDelivered",
                unitsDelivered,
                "updatedAt",
                System.currentTimeMillis()
            )
            .get();
    }

    public Optional<BolusRecord> findPendingByDeviceId(String deviceId)
        throws Exception {
        return findFirstByDeviceIdAndStatus(deviceId, BolusStatus.PENDING);
    }

    public Optional<BolusRecord> findAcknowledgedByDeviceId(String deviceId)
        throws Exception {
        return findFirstByDeviceIdAndStatus(deviceId, BolusStatus.ACKNOWLEDGED);
    }

    public Optional<BolusRecord> findActiveByDeviceId(String deviceId)
        throws Exception {
        List<String> activeStatuses = List.of(
            BolusStatus.PENDING.name(),
            BolusStatus.ACKNOWLEDGED.name()
        );

        QuerySnapshot query = db()
            .collectionGroup("boluses")
            .whereEqualTo("deviceId", Objects.requireNonNull(deviceId))
            .limit(10)
            .get()
            .get();

        for (DocumentSnapshot doc : query.getDocuments()) {
            BolusRecord record = doc.toObject(BolusRecord.class);
            if (
                record != null &&
                activeStatuses.contains(record.getStatus().name())
            ) {
                return Optional.of(record);
            }
        }
        return Optional.empty();
    }

    private Optional<BolusRecord> findFirstByDeviceIdAndStatus(
        String deviceId,
        BolusStatus status
    ) throws Exception {
        QuerySnapshot query = db()
            .collectionGroup("boluses")
            .whereEqualTo("deviceId", Objects.requireNonNull(deviceId))
            .limit(10)
            .get()
            .get();

        for (DocumentSnapshot doc : query.getDocuments()) {
            BolusRecord record = doc.toObject(BolusRecord.class);
            if (record != null && record.getStatus() == status) {
                return Optional.of(record);
            }
        }
        return Optional.empty();
    }

    private Firestore db() {
        return FirestoreClient.getFirestore();
    }

    private CollectionReference getUserBoluses(String userId) {
        return db()
            .collection("users")
            .document(Objects.requireNonNull(userId))
            .collection("boluses");
    }
}
