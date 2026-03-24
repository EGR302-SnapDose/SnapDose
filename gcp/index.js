const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

initializeApp();

/**
 * deleteExpiredDoses
 *
 * Runs every hour. Scans every user's doses subcollection
 * and deletes any dose record whose `timestamp` field is
 * older than 24 hours. Deletes records individually so
 * only expired entries are removed.
 *
 * Path: users/{uid}/doses/{doseId}
 */
exports.deleteExpiredDoses = onSchedule(
  {
    schedule: "every 1 hours",
    region: "us-central1",
    timeZone: "UTC",
  },
  async (event) => {
    const db = getFirestore();

    // Cutoff: anything older than 24 hours gets deleted
    const cutoff = Timestamp.fromDate(
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    console.log(`Running dose cleanup. Cutoff: ${cutoff.toDate().toISOString()}`);

    try {
      const usersSnapshot = await db.collection("users").get();

      if (usersSnapshot.empty) {
        console.log("No users found.");
        return;
      }

      let totalDeleted = 0;

      for (const userDoc of usersSnapshot.docs) {
        const uid = userDoc.id;

        const expiredDoses = await db
          .collection("users")
          .doc(uid)
          .collection("doses")
          .where("timestamp", "<", cutoff)
          .get();

        if (expiredDoses.empty) continue;

        const deletePromises = expiredDoses.docs.map((dose) => {
          console.log(`Deleting dose ${dose.id} for user ${uid}`);
          return dose.ref.delete();
        });

        await Promise.all(deletePromises);
        totalDeleted += expiredDoses.docs.length;
      }

      console.log(`Cleanup complete. Total doses deleted: ${totalDeleted}`);
    } catch (error) {
      console.error("Error during dose cleanup:", error);
      throw error;
    }
  }
);