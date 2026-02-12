import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { db } from "../../config/firebase";

export default function FirebaseTest() {
  const [status, setStatus] = useState("Testing connection...");

  useEffect(() => {
    async function test() {
      try {
        await setDoc(doc(db, "test", "ping"), {
          message: "Firebase is connected",
          timestamp: serverTimestamp(),
        });

        const snap = await getDoc(doc(db, "test", "ping"));
        if (snap.exists()) {
          setStatus("Connected - " + snap.data().message);
        } else {
          setStatus("Write succeeded but read failed");
        }
      } catch (error) {
        setStatus(
          "Error: " + (error instanceof Error ? error.message : String(error)),
        );
      }
    }
    test();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 18 }}>{status}</Text>
    </View>
  );
}
