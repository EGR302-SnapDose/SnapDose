export interface UserProfile {
  dateOfBirth: Date;
  diabetesType: 'type1' | 'type2';
  diagnosisYear: number;
  glucoseUnit: 'mg/dL' | 'mmol/L';
  insulinUnits: 'units';
}

export interface InsulinSettings {
  correctionFactor: number;
  insulinToCarbRatio: number;
}

export interface DeviceSettings {
  dexcom: {
    paired: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: Date | null;
  };
  insulinPump: {
    paired: boolean;
    deviceId: string | null;
    lastConnected: Date | null;
  };
}

export interface User {
  email: string;
  displayName: string;
  profile: UserProfile;
  insulinSettings: InsulinSettings;
  devices: DeviceSettings;
  onboardingComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingData {
  displayName: string;
  accentColor: string;
  heightFeet: number;
  heightInches: number;
  weight: number;
  age: number;
  insulinToCarbRatio: number;
  correctionFactor: number;
}