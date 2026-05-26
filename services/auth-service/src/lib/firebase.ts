import admin from 'firebase-admin';
import { config } from '../config.js';

let firebaseApp: admin.app.App | null = null;

export function getFirebaseApp(): admin.app.App | null {
  if (firebaseApp) return firebaseApp;
  if (!config.firebaseServiceAccount) return null;
  try {
    const serviceAccount = JSON.parse(config.firebaseServiceAccount);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    return firebaseApp;
  } catch (err) {
    console.error('Failed to initialize Firebase admin:', err);
    return null;
  }
}

/** 6-digit numeric OTP, never starts with 0. */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * In production, integrate with Firebase Auth's custom OTP flow or an SMS provider
 * like Twilio. For now, dev logs to the server console; prod attempts a real SMS via
 * Firebase Auth which the client app then enters as the OTP code.
 */
export async function sendOtpSms(phone: string, otp: string): Promise<void> {
  if (config.nodeEnv !== 'production') {
    console.warn(`[DEV-OTP] phone=${phone} otp=${otp}`);
    return;
  }

  const app = getFirebaseApp();
  if (!app) {
    throw new Error('Firebase admin not initialized — set FIREBASE_SERVICE_ACCOUNT_PATH');
  }

  // Production path: Firebase Auth doesn't expose a direct "send OTP" API to admins;
  // SMS OTP is initiated client-side. For server-initiated flows you'd hand off to
  // an SMS provider here. Wiring left for production deployment.
  throw new Error(
    'Production SMS provider not configured. Hook up Twilio / MSG91 in lib/firebase.ts.',
  );
}
