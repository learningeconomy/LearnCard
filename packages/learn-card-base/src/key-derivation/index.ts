/**
 * Key Derivation Strategies
 *
 * Factory functions for creating KeyDerivationStrategy implementations.
 * Each factory encapsulates provider-specific logic (Web3Auth, SSS, etc.)
 * and returns a generic KeyDerivationStrategy interface.
 *
 * SSS strategy lives in @learncard/sss-key-manager due to its heavier
 * dependency footprint (crypto, IndexedDB, etc.).
 */

export { createWeb3AuthStrategy } from './createWeb3AuthStrategy';

export type { Web3AuthStrategyConfig } from './createWeb3AuthStrategy';
