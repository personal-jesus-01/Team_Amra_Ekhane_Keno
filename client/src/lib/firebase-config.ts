// Firebase configuration for deployment
export const firebaseConfig = {
  // Use environment variables if available, otherwise use test credentials for development
  apiKey: "AIzaSyBBqNA6aQxVL3zzFFBlq5FepgAs_lFKHiE", // Direct hardcoded value for testing
  authDomain: "slidebanai-d4210.firebaseapp.com",
  projectId: "slidebanai-d4210",
  storageBucket: "slidebanai-d4210.appspot.com",
  messagingSenderId: "909876543210", // Not critical for auth
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:909876543210:web:abc123def456ghi789jkl",
};

// Backend API URL configuration - empty for frontend-only deployment
export const apiBaseUrl = import.meta.env.DEV 
  ? '' // Empty string means same origin in development
  : ''; // Disabled in production for frontend-only mode

// Development mode flag
export const isDevelopment = import.meta.env.DEV || !import.meta.env.VITE_FIREBASE_API_KEY;