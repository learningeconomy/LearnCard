import type React from 'react';

import type { VC } from '@learncard/types';
import {
    boostCategoryMetadata,
    BoostCategoryOptionsEnum,
    type CredentialCategoryEnum,
    getBoostMetadata,
} from 'learn-card-base/types/boostAndCredentialMetadata';
import {
    getCredentialName,
    getDefaultCategoryForCredential,
    getImageUrlFromCredential,
    unwrapBoostCredential,
} from 'learn-card-base/helpers/credentialHelpers';

/**
 * Keeps the owner's stored `highlightedCredentials` order while dropping blank and repeated
 * entries, so every bubble maps to exactly one boost URI.
 */
export const selectFeaturedCredentialUris = (
    uris: readonly (string | undefined)[] | undefined
): string[] => {
    const selected: string[] = [];

    for (const uri of uris ?? []) {
        if (!uri || selected.includes(uri)) continue;

        selected.push(uri);
    }

    return selected;
};

export type FeaturedCredentialDisplay = {
    title: string;
    imageUrl?: string;
    categoryType: BoostCategoryOptionsEnum;
    FallbackIcon: React.FC<{ className?: string }>;
};

/** Display-only facts for a bubble; never mutates the resolved credential. */
export const getFeaturedCredentialDisplay = (credential: VC): FeaturedCredentialDisplay => {
    const unwrapped = unwrapBoostCredential(credential) as VC;
    const category = getDefaultCategoryForCredential(credential);
    const metadata =
        getBoostMetadata(category as CredentialCategoryEnum) ??
        boostCategoryMetadata[BoostCategoryOptionsEnum.achievement];

    return {
        title: getCredentialName(unwrapped),
        imageUrl: getImageUrlFromCredential(unwrapped) || undefined,
        categoryType:
            (category as BoostCategoryOptionsEnum) || BoostCategoryOptionsEnum.achievement,
        FallbackIcon: metadata.IconWithShape ?? metadata.IconComponent,
    };
};
