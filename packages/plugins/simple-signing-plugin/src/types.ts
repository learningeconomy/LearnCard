import { z } from 'zod';
import type { VP, LCNProfile } from '@learncard/types';
import type { Plugin } from '@learncard/core';
import type { ProofOptions } from '@learncard/didkit-plugin';

export const SigningAuthorityValidator = z.object({
    _id: z.string().optional(),
    ownerDid: z.string(),
    name: z.string(),
    did: z.string().optional(),
    endpoint: z.string().optional(),
});

export type SigningAuthorityType = z.infer<typeof SigningAuthorityValidator>;

export type SigningAuthorityAuthorization = {
    type: string;
    boostUri: string;
};

export type SimpleSigningPluginDependentMethods = {
    getDidAuthVp: (options?: ProofOptions) => Promise<VP | string>;
    getProfile: () => Promise<LCNProfile | undefined>;
};

export type SimpleSigningPluginMethods = {
    createSigningAuthority: (name: string) => Promise<SigningAuthorityType | false>;
    getSigningAuthorities: () => Promise<SigningAuthorityType[] | false>;
    authorizeSigningAuthority: (
        name: string,
        authorization: SigningAuthorityAuthorization
    ) => Promise<boolean>;
};

export type SimpleSigningPlugin = Plugin<
    'Simple Signing Authority',
    never,
    SimpleSigningPluginMethods,
    'id',
    SimpleSigningPluginDependentMethods
>;
