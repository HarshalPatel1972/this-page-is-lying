import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, signInAnonymously, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFunctions, type Functions } from "firebase/functions";

// Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let functions: Functions | null = null;

function isConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

export function initFirebase(): FirebaseApp | null {
  if (app) return app;
  if (!isConfigured()) {
    console.warn("[Firebase] Not configured. Running in offline mode.");
    return null;
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);

  return app;
}

export function getFirebaseAuth(): Auth | null {
  return auth;
}

export function getFirebaseDb(): Firestore | null {
  return db;
}

export function getFirebaseFunctions(): Functions | null {
  return functions;
}

/** Sign in anonymously. Returns the user UID or null. */
export async function signInAnon(): Promise<string | null> {
  if (!auth) return null;

  try {
    const credential = await signInAnonymously(auth);
    return credential.user.uid;
  } catch (error) {
    console.error("[Firebase] Anonymous sign-in failed:", error);
    return null;
  }
}

/** Check if Firebase is available and configured */
export function isFirebaseAvailable(): boolean {
  return isConfigured() && app !== null;
}
