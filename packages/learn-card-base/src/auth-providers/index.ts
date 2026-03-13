/**
 * Auth Providers
 * 
 * Factory functions for creating AuthProvider implementations.
 * Each factory encapsulates provider-specific logic (Firebase, Supertokens, etc.)
 * and returns a generic AuthProvider interface.
 */

export { createFirebaseAuthProvider } from './createFirebaseAuthProvider';

export type { FirebaseAuthConfig } from './createFirebaseAuthProvider';
