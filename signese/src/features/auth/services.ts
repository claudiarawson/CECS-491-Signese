import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  signInWithCredential,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../../services/firebase/firebase.config';
import { User, SignInCredentials, SignUpCredentials, AuthResponse } from './types';

export class AuthService {
  static async signIn(credentials: SignInCredentials): Promise<AuthResponse> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
      const user = this.mapFirebaseUser(userCredential.user);
      return { success: true, user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      // Update display name if provided
      if (credentials.displayName && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: credentials.displayName,
        });
      }

      const user = this.mapFirebaseUser(userCredential.user);
      return { success: true, user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async signOutUser(): Promise<AuthResponse> {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async signInWithGoogle(idToken: string): Promise<AuthResponse> {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const user = this.mapFirebaseUser(userCredential.user);
      return { success: true, user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, (firebaseUser) => {
      const user = firebaseUser ? this.mapFirebaseUser(firebaseUser) : null;
      callback(user);
    });
  }

  private static mapFirebaseUser(firebaseUser: FirebaseUser): User {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
    };
  }
}
