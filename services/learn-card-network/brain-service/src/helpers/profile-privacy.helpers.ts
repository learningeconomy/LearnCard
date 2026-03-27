import {
    LCNAuthedProfileValidator,
    LCNConnectionProfileValidator,
    LCNProfile,
    LCNProfileValidator,
    LCNPublicProfileValidator,
    ProfileVisibilityEnum,
    ProfileVisibility,
} from '@learncard/types';
import { ProfileType } from 'types/profile';

import { areProfilesConnected } from './connection.helpers';

/**
 * Access tiers used by profile privacy sanitization.
 *
 * - `self`: requester is the profile owner
 * - `connection`: requester is connected to the target profile
 * - `authenticated`: requester is authenticated but not connected / restricted by visibility
 * - `unauthenticated`: requester has no auth context
 */
export const ProfileAccessTierEnum = {
    self: 'self',
    connection: 'connection',
    authenticated: 'authenticated',
    unauthenticated: 'unauthenticated',
} as const;

export type ProfileAccessTier = (typeof ProfileAccessTierEnum)[keyof typeof ProfileAccessTierEnum];
export type AuthenticatedProfileAccessTier = Exclude<
    ProfileAccessTier,
    typeof ProfileAccessTierEnum.unauthenticated
>;

/**
 * Resolves effective visibility for a profile with legacy compatibility.
 *
 * Backward-compat behavior:
 * - Prefer `profileVisibility` when present
 * - Fall back to legacy `isPrivate` (true => private, false/undefined => public)
 */
const resolveProfileVisibility = (target: ProfileType): ProfileVisibility => {
    if (target.profileVisibility) return target.profileVisibility;
    if (target.isPrivate === true) return ProfileVisibilityEnum.enum.private;
    return ProfileVisibilityEnum.enum.public;
};

/**
 * Determines the requester's access tier for a target profile.
 *
 * Notes:
 * - `private` currently maps non-self users to `authenticated` (not `connection`).
 * - `connections_only` maps connected users to `connection`, everyone else to `authenticated`.
 * - `public` still distinguishes connected vs authenticated to support connection-tier fields.
 */
export const resolveProfileTier = async (
    viewer: ProfileType | null,
    target: ProfileType
): Promise<ProfileAccessTier> => {
    if (!viewer) return ProfileAccessTierEnum.unauthenticated;
    if (viewer.profileId === target.profileId) return ProfileAccessTierEnum.self;

    const connected = await areProfilesConnected(viewer, target);
    const visibility = resolveProfileVisibility(target);

    if (visibility === ProfileVisibilityEnum.enum.private) {
        return ProfileAccessTierEnum.authenticated;
    }
    if (visibility === ProfileVisibilityEnum.enum.connections_only) {
        return connected ? ProfileAccessTierEnum.connection : ProfileAccessTierEnum.authenticated;
    }

    return connected ? ProfileAccessTierEnum.connection : ProfileAccessTierEnum.authenticated;
};

/**
 * Variant of `resolveProfileTier` for authenticated-only routes.
 *
 * Defensive normalization ensures the result never returns `unauthenticated`.
 */
export const resolveAuthenticatedProfileTier = async (
    viewer: ProfileType,
    target: ProfileType
): Promise<AuthenticatedProfileAccessTier> => {
    const tier = await resolveProfileTier(viewer, target);
    return tier === ProfileAccessTierEnum.unauthenticated
        ? ProfileAccessTierEnum.authenticated
        : tier;
};

const TIER_VALIDATORS = {
    self: LCNProfileValidator,
    connection: LCNConnectionProfileValidator,
    authenticated: LCNAuthedProfileValidator,
    unauthenticated: LCNPublicProfileValidator,
} as const;

type PublicProfileType = ReturnType<typeof LCNPublicProfileValidator.parse>;
type AuthedProfileType = ReturnType<typeof LCNAuthedProfileValidator.parse>;
type ConnectionProfileType = ReturnType<typeof LCNConnectionProfileValidator.parse>;

/**
 * Sanitizes a profile to the requested access tier using tier-specific Zod validators.
 *
 * Security properties:
 * - Fields not included in the tier validator are stripped.
 * - Connection-tier email is additionally gated by `showEmail`.
 */
export function sanitizeProfileForTier(
    profile: ProfileType,
    tier: typeof ProfileAccessTierEnum.self
): LCNProfile;
export function sanitizeProfileForTier(
    profile: ProfileType,
    tier: typeof ProfileAccessTierEnum.connection
): ConnectionProfileType;
export function sanitizeProfileForTier(
    profile: ProfileType,
    tier: typeof ProfileAccessTierEnum.authenticated
): AuthedProfileType;
export function sanitizeProfileForTier(
    profile: ProfileType,
    tier: typeof ProfileAccessTierEnum.unauthenticated
): PublicProfileType;
export function sanitizeProfileForTier(
    profile: ProfileType,
    tier: ProfileAccessTier
): LCNProfile | ConnectionProfileType | AuthedProfileType | PublicProfileType;
export function sanitizeProfileForTier(profile: ProfileType, tier: ProfileAccessTier) {
    const validator = TIER_VALIDATORS[tier];
    const parsed = validator.parse(profile);

    if (tier === ProfileAccessTierEnum.connection && !profile.showEmail) {
        delete (parsed as Record<string, unknown>).email;
    }

    return parsed;
};

/**
 * Convenience helper for viewer-based sanitization.
 */
export const sanitizeProfileForViewer = async (
    viewer: ProfileType | null,
    target: ProfileType
): Promise<ReturnType<typeof sanitizeProfileForTier>> => {
    const tier = await resolveProfileTier(viewer, target);
    return sanitizeProfileForTier(target, tier);
};

/**
 * Defense-in-depth sanitizer used for list-style endpoints where these fields
 * should never be returned.
 */
export const stripSensitiveProfileListFields = <T extends Record<string, unknown>>(profile: T): T => {
    const clone = { ...profile };
    delete clone.email;
    delete clone.dob;
    delete clone.notificationsWebhook;
    return clone;
};

/**
 * Whether an unauthenticated caller should be denied profile-by-id access.
 */
export const isPrivateToUnauthenticated = (target: ProfileType): boolean => {
    const visibility = resolveProfileVisibility(target);
    return visibility === ProfileVisibilityEnum.enum.private;
};
