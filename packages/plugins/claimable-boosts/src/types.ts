import { Plugin } from '@learncard/core';
import { LCNSigningAuthorityType } from '@learncard/types';

/** @group Claimable Boosts Plugin */
export type ClaimableBoostsPluginMethods = {
    generateBoostClaimLink: (boostURI: string) => Promise<string>;
};

/** @group Claimable Boosts Plugin */
export type ClaimableBoostsPluginDependentMethods = {
    getRegisteredSigningAuthorities: () => Promise<
        Array<{
            relationship?: { name: string };
            signingAuthority?: { endpoint: string };
        }>
    >;
    createSigningAuthority: (name: string) => Promise<LCNSigningAuthorityType | false>;
    registerSigningAuthority: (endpoint: string, name: string, did: string) => Promise<boolean>;
    generateClaimLink: (
        boostUri: string,
        options: {
            name: string;
            endpoint: string;
        }
    ) => Promise<{
        boostUri: string;
        challenge: string;
    }>;
};

export type ClaimableBoostsPlugin = Plugin<
    'ClaimableBoosts',
    any,
    ClaimableBoostsPluginMethods,
    any,
    ClaimableBoostsPluginDependentMethods
>;
