import { createHash } from 'node:crypto';

import {
    canonicalConsentScopeString,
    normalizeConsentRequest,
} from '@learncard/partner-connect-core';
import type { ConsentRequest, NormalizedConsentScopes } from '@learncard/partner-connect-core';
import type { ConsentFlowContract } from '@learncard/types';

const CONSENT_CONTRACT_NAME_MAX_LENGTH = 100;

const toToggle = (): { required: false; defaultEnabled: true } => ({
    required: false,
    defaultEnabled: true,
});

export const normalizeConsentScopes = (request: ConsentRequest): NormalizedConsentScopes => {
    return normalizeConsentRequest(request);
};

export const computeConsentScopeHash = (scopes: NormalizedConsentScopes): string => {
    return createHash('sha256').update(canonicalConsentScopeString(scopes)).digest('hex');
};

export const buildConsentFlowContractFromScopes = (
    scopes: NormalizedConsentScopes
): ConsentFlowContract => {
    return {
        read: {
            credentials: {
                categories: Object.fromEntries(
                    scopes.read.credentialCategories.map(category => [category, toToggle()])
                ),
            },
            personal: Object.fromEntries(
                scopes.read.personalFields.map(field => [field, toToggle()])
            ),
        },
        write: {
            credentials: {
                categories: Object.fromEntries(
                    scopes.write.credentialCategories.map(category => [category, toToggle()])
                ),
            },
            personal: {},
        },
    };
};

export const buildScopedConsentContractName = (listingDisplayName: string): string => {
    const candidate = `${listingDisplayName} — Data Sharing`;

    if (candidate.length <= CONSENT_CONTRACT_NAME_MAX_LENGTH) {
        return candidate;
    }

    return candidate.slice(0, CONSENT_CONTRACT_NAME_MAX_LENGTH).trimEnd();
};
