import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { signInWithGoogle as firebaseSignInWithGoogle, signOutUser as firebaseSignOut, signInWithEmailPassword, registerWithEmailPassword } from "@/services/auth.service";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, InsertUser>;
  googleSignInMutation: UseMutationResult<User, Error, void>;
};

type LoginData = {
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  otp?: string;
  otp_token?: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // State to track Firebase authentication status
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  
  // Watch for Firebase authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        const userData: User = {
          id: 1,
          username: user.displayName?.replace(/\s+/g, '').toLowerCase() || user.email?.split('@')[0] || 'user',
          email: user.email || 'test@test.com',
          name: user.displayName || user.email?.split('@')[0] || 'User',
          password: '', // Never store passwords in state
          avatar_url: user.photoURL,
          firebase_uid: user.uid,
          subscription_type: 'free',
          credits: 100,
          subscription_expiry: null,
          created_at: new Date()
        };
        setFirebaseUser(userData);
      } else {
        // User is signed out
        setFirebaseUser(null);
      }
      setAuthChecked(true);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);
  
  // Try to authenticate with the backend using Firebase credentials
  useEffect(() => {
    // If we have Firebase user, sync with backend
    if (firebaseUser && authChecked) {
      // Use a flag to prevent multiple sync attempts
      let isMounted = true;
      const lastSyncTime = sessionStorage.getItem('lastAuthSync');
      const currentTime = Date.now();
      
      // Only sync if we haven't done it in the last minute
      if (!lastSyncTime || (currentTime - parseInt(lastSyncTime)) > 60000) {
        (async () => {
          try {
            if (!isMounted) return;
            
            // In development environment, use Firebase user to authenticate with backend
            const idToken = "mock-development-token-for-testing"; // This matches our server-side mock value
            
            await apiRequest("POST", "/api/auth/google", {
              idToken,
              email: firebaseUser.email,
              name: firebaseUser.name,
              photoURL: firebaseUser.avatar_url,
              uid: firebaseUser.firebase_uid
            });
            
            if (isMounted) {
              // Store sync time
              sessionStorage.setItem('lastAuthSync', currentTime.toString());
              console.log("Successfully synced Firebase authentication with backend");
            }
          } catch (error) {
            if (isMounted) {
              console.error("Failed to sync authentication with backend:", error);
            }
          }
        })();
      }
      
      return () => {
        isMounted = false;
      };
    }
  }, [firebaseUser, authChecked]);
  
  // In development, check API backend status as well
  const {
    data: apiUser,
    error,
    isLoading: isApiLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: authChecked, // Only try API auth after Firebase auth is checked
  });
  
  // Use Firebase auth primarily, but check API auth too
  const user = firebaseUser || apiUser;
  const isLoading = !authChecked || isApiLoading;

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      // For frontend-only deployment, use Firebase directly
      if (credentials.email && credentials.password) {
        // If we have email/password, use Firebase Authentication directly
        const user = await signInWithEmailPassword(credentials.email, credentials.password);
        return user;
      } else {
        // Without email/password, can't authenticate
        throw new Error("Email and password are required for authentication");
      }
    },
    onSuccess: async (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      
      // Also sync with backend in development
      try {
        const idToken = "mock-development-token-for-testing";
        await apiRequest("POST", "/api/auth/google", {
          idToken,
          email: user.email,
          name: user.name,
          photoURL: user.avatar_url,
          uid: user.firebase_uid
        });
      } catch (error) {
        console.warn("Backend auth sync failed:", error);
      }
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name || user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      // For frontend-only deployment, use Firebase directly
      if (userData.email && userData.password) {
        return await registerWithEmailPassword(
          userData.email,
          userData.password,
          userData.username,
          userData.name || userData.username
        );
      } else {
        // Without email/password, can't register
        throw new Error("Email and password are required for registration");
      }
    },
    onSuccess: async (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      
      // Also sync with backend in development
      try {
        const idToken = "mock-development-token-for-testing";
        await apiRequest("POST", "/api/auth/google", {
          idToken,
          email: user.email,
          name: user.name,
          photoURL: user.avatar_url,
          uid: user.firebase_uid
        });
      } catch (error) {
        console.warn("Backend auth sync failed:", error);
      }
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.name || user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await firebaseSignOut();
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
      // Even if Firebase logout fails, clear the local session
      queryClient.setQueryData(["/api/user"], null);
    },
  });

  const googleSignInMutation = useMutation({
    mutationFn: async () => {
      return await firebaseSignInWithGoogle();
    },
    onSuccess: async (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      
      // Also sync with backend in development
      try {
        const idToken = "mock-development-token-for-testing";
        await apiRequest("POST", "/api/auth/google", {
          idToken,
          email: user.email,
          name: user.name,
          photoURL: user.avatar_url,
          uid: user.firebase_uid
        });
      } catch (error) {
        console.warn("Backend auth sync failed:", error);
      }
      
      toast({
        title: "Google sign-in successful",
        description: `Welcome, ${user.name || user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Google sign-in failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        googleSignInMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}