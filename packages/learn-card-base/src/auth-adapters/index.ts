/**
 * Auth Adapters
 *
 * Sign-in adapter implementations for different auth providers.
 * Each adapter implements the generic SignInAdapter interface and
 * encapsulates all provider-specific sign-in logic.
 */

export { createFirebaseSignInAdapter } from './createFirebaseSignInAdapter';
export { createKeycloakSignInAdapter } from './createKeycloakSignInAdapter';
export type {
    KeycloakSignInAdapter,
    KeycloakSignInAdapterConfig,
} from './createKeycloakSignInAdapter';

export type {
    FirebaseSignInAdapterConfig,
    FirebaseAuthLike,
    NativeFirebaseAuthLike,
} from './createFirebaseSignInAdapter';

export type {
    SignInAdapter,
    SignInCapabilities,
    SocialSignInOptions,
    PhoneVerificationHandle,
} from '@learncard/types';
export type { FirebaseEmailLinkSettings, FirebaseSignInOperation } from './types';
