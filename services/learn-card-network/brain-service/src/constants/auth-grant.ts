/**
 * Auth Grant Scope System
 *
 * Scopes define the permissions granted to a client via an auth grant.
 * Each scope follows the pattern: `{resource}:{action}`
 *
 * Resources correspond to our router structure:
 * - boosts
 * - claimHook
 * - profile
 * - profileManager
 * - credential
 * - presentation
 * - storage
 * - signingAuthorities
 * - connections
 * - utilities
 * - contracts
 * - contracts-data
 * - didMetadata
 * - authGrants
 * - inbox
 *
 * Actions include:
 * - read: Permission to view resources
 * - write: Permission to create or update resources
 * - delete: Permission to remove resources
 *
 * Special Patterns:
 * - All access: "*:*"
 * - Read all: "*:read"
 * - Resource-wide: "authGrants:*"
 * - Multiple scopes: Space-separated list of scopes
 *   e.g., "authGrants:read contracts:write didMetadata:read"
 * - No access: "".
 */

// Common scope bundles
export const AUTH_GRANT_READ_ONLY_SCOPE = '*:read';
export const AUTH_GRANT_FULL_ACCESS_SCOPE = '*:*';
export const AUTH_GRANT_NO_ACCESS_SCOPE = '';
export const AUTH_GRANT_PROFILE_MANAGEMENT_SCOPE = 'profile:* profileManager:*';
export const AUTH_GRANT_CREDENTIAL_MANAGEMENT_SCOPE = 'credential:* presentation:* boosts:*';
export const AUTH_GRANT_CONTRACTS_SCOPE = 'contracts:*';
export const AUTH_GRANT_DID_METADATA_SCOPE = 'didMetadata:*';
export const AUTH_GRANT_AUTH_GRANTS_SCOPE = 'authGrants:*';
