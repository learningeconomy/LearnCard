/**
 * Auth Adapters
 *
 * Sign-in adapter implementations for different auth providers.
 * Each adapter implements the generic SignInAdapter interface and
 * encapsulates all provider-specific sign-in logic.
 */

export { createFirebaseSignInAdapter } from './createFirebaseSignInAdapter';

export type {
    FirebaseSignInAdapterConfig,
    FirebaseAuthLike,
    NativeFirebaseAuthLike,
} from './createFirebaseSignInAdapter';
