import { User } from "@shared/schema";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged 
} from "firebase/auth"; 
import { auth } from "@/lib/firebase";

// Firebase provider for Google sign-in
const googleProvider = new GoogleAuthProvider();

// Email/password sign-in for frontend-only deployment
export async function signInWithEmailPassword(email: string, password: string): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    const firebaseUser = userCredential.user;
    
    // For frontend-only deployment, we use the Firebase user info directly
    // In a full deployment with backend, we would validate with our API
    return {
      id: 1,
      username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'user',
      email: firebaseUser.email || 'test@test.com',
      name: firebaseUser.displayName || 'Test User',
      password: '', // Never store or return actual passwords
      avatar_url: firebaseUser.photoURL,
      firebase_uid: firebaseUser.uid,
      subscription_type: 'free',
      credits: 100,
      subscription_expiry: null,
      created_at: new Date()
    };
  } catch (error: any) {
    console.error("Error signing in with email/password:", error);
    
    // Provide more user-friendly error messages
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error("Invalid email or password. Please try again.");
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error("Too many failed login attempts. Please try again later.");
    } else {
      throw new Error("Login failed. Please try again.");
    }
  }
}

// Register with email/password
export async function registerWithEmailPassword(email: string, password: string, username: string, name: string): Promise<User> {
  try {
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // For frontend-only deployment, we use the Firebase user info directly
    return {
      id: 1,
      username: username,
      email: firebaseUser.email || email,
      name: name,
      password: '', // Never store or return actual passwords
      avatar_url: null,
      firebase_uid: firebaseUser.uid,
      subscription_type: 'free',
      credits: 100,
      subscription_expiry: null,
      created_at: new Date()
    };
  } catch (error: any) {
    console.error("Error during registration:", error);
    
    // Provide more user-friendly error messages
    if (error.code === 'auth/email-already-in-use') {
      throw new Error("Email already in use. Please login or use a different email.");
    } else if (error.code === 'auth/invalid-email') {
      throw new Error("Invalid email address. Please check and try again.");
    } else if (error.code === 'auth/weak-password') {
      throw new Error("Password is too weak. Please use a stronger password.");
    } else {
      throw new Error("Registration failed. Please try again.");
    }
  }
}

// Sign in with Google popup
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // For frontend-only deployment, we use the Firebase user info directly
    return {
      id: 1,
      username: user.displayName?.replace(/\s+/g, '').toLowerCase() || user.email?.split('@')[0] || 'user',
      email: user.email || 'user@example.com',
      name: user.displayName || 'Google User',
      password: '', // Never store or return actual passwords
      avatar_url: user.photoURL,
      firebase_uid: user.uid,
      subscription_type: 'free',
      credits: 100,
      subscription_expiry: null,
      created_at: new Date()
    };
  } catch (error: any) {
    console.error("Error during Google sign in:", error);
    
    // Handle popup closed by user
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error("Sign-in popup was closed. Please try again.");
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error("Sign-in popup was blocked. Please allow popups for this site.");
    } else {
      throw new Error("Google sign in failed. Please try again.");
    }
  }
}

// Sign out
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw new Error("Failed to sign out. Please try again.");
  }
}

// Handle redirect result
export async function handleRedirectResult(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const user = result.user;
      return {
        id: 1,
        username: user.displayName?.replace(/\s+/g, '').toLowerCase() || user.email?.split('@')[0] || 'user',
        email: user.email || 'user@example.com',
        name: user.displayName || 'Google User',
        password: '', // Never store or return actual passwords
        avatar_url: user.photoURL,
        firebase_uid: user.uid,
        subscription_type: 'free',
        credits: 100,
        subscription_expiry: null,
        created_at: new Date()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error handling redirect:", error);
    return null;
  }
}