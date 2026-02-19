/**
 * Auth Coordinator Module
 * 
 * Exports the unified auth + key derivation orchestration layer.
 */

export { AuthCoordinator, createAuthCoordinator } from './AuthCoordinator';

// Auth provider factories (canonical location: ../auth-providers/)
// Re-exported here for convenience
export { createFirebaseAuthProvider } from '../auth-providers';
// Key derivation strategies (canonical location: ../key-derivation/)
// Re-exported here for convenience
export { createWeb3AuthStrategy } from '../key-derivation';
export type { Web3AuthStrategyConfig } from '../key-derivation';

export { AuthSessionError } from './types';

export {
    AuthCoordinatorProvider,
    useAuthCoordinator,
    useAuthCoordinatorContext,
} from './AuthCoordinatorProvider';

export { useAuthCoordinatorAutoSetup } from './useAuthCoordinatorAutoSetup';
export type { AutoSetupConfig } from './useAuthCoordinatorAutoSetup';

// Shared overlay components for coordinator states
export { Overlay, ErrorOverlay, StalledMigrationOverlay } from './components';

export type { FirebaseAuthConfig } from '../auth-providers';
export type {
    AuthCoordinatorProviderProps,
    AuthCoordinatorContextValue,
    DebugEventLevel,
} from './AuthCoordinatorProvider';

export type {
    AuthProvider,
    AuthProviderType,
    AuthUser,
    AuthCoordinatorConfig,
    KeyDerivationCapabilities,
    KeyDerivationStrategy,
    ServerKeyStatus,
    RecoveryMethodType,
    RecoveryMethodInfo,
    RecoveryInput,
    RecoveryResult,
    RecoveryReason,
    RecoverySetupInput,
    RecoverySetupResult,
    SSSKeyDerivationStrategy,
    UnifiedAuthState,
} from './types';
