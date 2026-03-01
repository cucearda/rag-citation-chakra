import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();

function getFirebaseErrorCode(err: unknown): string {
  if (typeof err === "object" && err !== null && "code" in err) {
    return (err as { code: string }).code;
  }
  return "";
}

function getErrorMessage(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed. Please try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signUpWithEmail(email: string, password: string): Promise<User | null> {
    setLoading(true);
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err: unknown) {
      setError(getErrorMessage(getFirebaseErrorCode(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function signInWithEmail(email: string, password: string): Promise<User | null> {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err: unknown) {
      setError(getErrorMessage(getFirebaseErrorCode(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle(): Promise<User | null> {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err: unknown) {
      setError(getErrorMessage(getFirebaseErrorCode(err)));
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { signUpWithEmail, signInWithEmail, signInWithGoogle, loading, error };
}
