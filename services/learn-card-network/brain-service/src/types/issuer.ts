import { ProfileType } from './profile';
import { AppStoreListingType } from './app-store-listing';
import { IntegrationType } from './integration';
import { getAppDidWeb } from '@helpers/did.helpers';

/**
 * CredentialIssuer discriminated union type
 * Represents the different types of entities that can issue credentials
 */
export type CredentialIssuer =
    | { type: 'profile'; profile: ProfileType }
    | { type: 'appStoreListing'; listing: AppStoreListingType; ownerProfile: ProfileType }
    | { type: 'integration'; integration: IntegrationType; ownerProfile: ProfileType };

/**
 * Type guard for profile issuer
 */
export const isProfileIssuer = (
    issuer: CredentialIssuer
): issuer is { type: 'profile'; profile: ProfileType } => {
    return issuer.type === 'profile';
};

/**
 * Type guard for app store listing issuer
 */
export const isAppStoreListingIssuer = (
    issuer: CredentialIssuer
): issuer is {
    type: 'appStoreListing';
    listing: AppStoreListingType;
    ownerProfile: ProfileType;
} => {
    return issuer.type === 'appStoreListing';
};

/**
 * Type guard for integration issuer
 */
export const isIntegrationIssuer = (
    issuer: CredentialIssuer
): issuer is { type: 'integration'; integration: IntegrationType; ownerProfile: ProfileType } => {
    return issuer.type === 'integration';
};

/**
 * Returns the effective DID for the credential.issuer field
 * - Profile: uses the profile's DID
 * - AppStoreListing: uses app DID if slug exists, otherwise owner DID
 * - Integration: uses the owner profile's DID
 */
export const getIssuerDid = (issuer: CredentialIssuer, domain: string): string => {
    if (isProfileIssuer(issuer)) {
        return issuer.profile.did;
    }

    if (isAppStoreListingIssuer(issuer)) {
        // If the listing has a slug, use the app DID; otherwise use owner DID
        if (issuer.listing.slug) {
            return getAppDidWeb(domain, issuer.listing.slug);
        }
        return issuer.ownerProfile.did;
    }

    if (isIntegrationIssuer(issuer)) {
        return issuer.ownerProfile.did;
    }

    // Exhaustive check - should never reach here
    throw new Error('Unknown issuer type');
};

/**
 * Returns display name for notifications/UI
 */
export const getIssuerDisplayName = (issuer: CredentialIssuer): string => {
    if (isProfileIssuer(issuer)) {
        return issuer.profile.displayName ?? issuer.profile.profileId;
    }

    if (isAppStoreListingIssuer(issuer)) {
        return issuer.listing.display_name;
    }

    if (isIntegrationIssuer(issuer)) {
        return issuer.integration.name;
    }

    // Exhaustive check - should never reach here
    throw new Error('Unknown issuer type');
};

/**
 * Always returns a Profile (needed for permissions)
 * - Profile: returns the profile
 * - AppStoreListing: returns the owner profile
 * - Integration: returns the owner profile
 */
export const getIssuerOwnerProfile = (issuer: CredentialIssuer): ProfileType => {
    if (isProfileIssuer(issuer)) {
        return issuer.profile;
    }

    if (isAppStoreListingIssuer(issuer)) {
        return issuer.ownerProfile;
    }

    if (isIntegrationIssuer(issuer)) {
        return issuer.ownerProfile;
    }

    // Exhaustive check - should never reach here
    throw new Error('Unknown issuer type');
};

/**
 * Returns profileId for activity logging
 */
export const getIssuerProfileId = (issuer: CredentialIssuer): string => {
    return getIssuerOwnerProfile(issuer).profileId;
};
