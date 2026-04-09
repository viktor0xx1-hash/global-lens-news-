import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence, browserPopupRedirectResolver, GoogleAuthProvider, signInWithRedirect, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); // Use default database to ensure rules apply correctly
export const storage = getStorage(app);
// Initialize Auth with explicit local persistence and popup resolver for better mobile reliability
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver
});

export const googleProvider = new GoogleAuthProvider();

// Test connection to Firestore
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const signIn = async () => {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error: any) {
    console.error("Sign in error:", error);
    if (error.code === 'auth/operation-not-supported-in-this-environment') {
      alert("This browser doesn't support this sign-in method. Please try the 'Trouble logging in?' link below or use a different browser.");
    } else {
      alert(`Sign in failed: ${error.message} (${error.code})`);
    }
  }
};
export const signInPopup = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    console.error("Popup sign in error:", error);
    if (error.code === 'auth/popup-blocked') {
      alert("Popup was blocked. Please allow popups in your browser settings and try again.");
    } else {
      alert(`Popup sign in failed: ${error.message} (${error.code})`);
    }
  }
};
export const logOut = () => signOut(auth);
