import { z } from 'zod';
import { Plugin } from '@learncard/core';
import { LCNBoostClaimLinkOptionsType } from '@learncard/types';
import { LCNSigningAuthorityForUserType } from '@learncard/types';

export const SigningAuthorityValidator = z.object({
    _id: z.string().optional(),
    ownerDid: z.string(),
    name: z.string(),
    did: z.string().optional(),
    endpoint: z.string().optional(),
});

export type SigningAuthorityType = z.infer<typeof SigningAuthorityValidator>;

/** @group Claimable Boosts Plugin */
export type ClaimableBoostsPluginMethods = {
    generateBoostClaimLink: (
        boostURI: string,
        options?: LCNBoostClaimLinkOptionsType
    ) => Promise<string>;
};

/** @group Claimable Boosts Plugin */
export type ClaimableBoostsPluginDependentMethods = {
    createSigningAuthority: (name: string) => Promise<SigningAuthorityType | false>;
    getSigningAuthorities: () => Promise<SigningAuthorityType[] | false>;
    getRegisteredSigningAuthorities: () => Promise<LCNSigningAuthorityForUserType[]>;
    registerSigningAuthority: (endpoint: string, name: string, did: string) => Promise<boolean>;
    generateClaimLink: (
        boostUri: string,
        claimLinkSA: {
            name: string;
            endpoint: string;
        },
        options?: LCNBoostClaimLinkOptionsType,
        challenge?: string
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
