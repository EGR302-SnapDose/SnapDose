import { auth, db } from "@/config/firebase";
import { OnboardingData } from "@/types/user";
import { doc, getDoc, setDoc, Timestamp, updateDoc } from "firebase/firestore";

export async function saveOnboardingData(data: OnboardingData) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No authenticated user");
  }

  const userRef = doc(db, "users", user.uid);

  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - data.age;
  const dateOfBirth = new Date(birthYear, 0, 1);

  // Convert height and weight for storage
  const heightInCm = (data.heightFeet * 12 + data.heightInches) * 2.54;
  const weightInKg = data.weight * 0.453592;

  const userData = {
    email: user.email || "",
    displayName: data.displayName,
    accentColor: data.accentColor,
    profile: {
      dateOfBirth: Timestamp.fromDate(dateOfBirth),
      diabetesType: "type1",
      diagnosisYear: 2024,
      glucoseUnit: "mg/dL",
      insulinUnits: "units",
      height: {
        feet: data.heightFeet,
        inches: data.heightInches,
        cm: Math.round(heightInCm),
      },
      weight: {
        lbs: data.weight,
        kg: Math.round(weightInKg * 10) / 10,
      },
      targetGlucose: {
        min: data.targetGlucoseMin,
        max: data.targetGlucoseMax,
      },
    },
    insulinSettings: {
      correctionFactor: data.correctionFactor,
      insulinToCarbRatio: data.insulinToCarbRatio,
    },
    devices: {
      dexcom: {
        paired: false,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
      },
      insulinPump: {
        paired: false,
        deviceId: null,
        lastConnected: null,
      },
    },
    onboardingComplete: true,
    updatedAt: Timestamp.now(),
  };

  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    await updateDoc(userRef, userData);
  } else {
    await setDoc(userRef, {
      ...userData,
      createdAt: Timestamp.now(),
    });
  }
}

export async function checkOnboardingStatus(): Promise<boolean> {
  const user = auth.currentUser;

  if (!user) {
    return false;
  }

  const userRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    return false;
  }

  return userDoc.data()?.onboardingComplete || false;
}

export async function getInsulinSettings() {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  const userRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    throw new Error("User document not found");
  }

  const data = userDoc.data();
  return {
    insulinToCarbRatio: data.insulinSettings?.insulinToCarbRatio || 10,
    correctionFactor: data.insulinSettings?.correctionFactor || 50,
  };
}
