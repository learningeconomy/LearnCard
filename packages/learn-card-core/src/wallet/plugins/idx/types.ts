import { ModelAliases } from '@glazed/types';
import { z } from 'zod';
import { StreamID } from '@ceramicnetwork/streamid';
import { Plugin } from 'types/wallet';
import { IndexPlugin } from 'types/planes';
import { VC, IDXCredential, IDXCredentialValidator } from '@learncard/types';
import { ResolutionExtension } from '../vc-resolution';
import { CeramicClient } from '@ceramicnetwork/http-client';

/** @group IDXPlugin */
export type IDXArgs = {
    modelData: ModelAliases;
    credentialAlias: string;
};

/** @group IDXPlugin */
export type IDXPluginMethods = {
    getCredentialsListFromIdx: <Metadata extends Record<string, any> = Record<never, never>>(
        alias?: string
    ) => Promise<IDXCredential<Metadata>[]>;
    getVerifiableCredentialFromIdx: (id: string) => Promise<VC | undefined>;
    getVerifiableCredentialsFromIdx: () => Promise<VC[]>;
    addVerifiableCredentialInIdx: <Metadata extends Record<string, any> = Record<never, never>>(
        cred: IDXCredential<Metadata>
    ) => Promise<string>;
    removeVerifiableCredentialInIdx: (title: string) => Promise<StreamID>;
};

/** @group IDXPlugin */
export type IDXPluginDependentMethods<URI extends string = ''> = {
    getCeramicClient: () => CeramicClient;
} & ResolutionExtension<URI>;

/** @group IDXPlugin */
export type CredentialsList<Metadata extends Record<string, any> = Record<never, never>> = {
    credentials: Array<IDXCredential<Metadata>>;
};

/** @group IDXPlugin */
export const CredentialsListValidator: z.ZodType<CredentialsList> = z
    .object({ credentials: IDXCredentialValidator.array() })
    .strict();

/** @group IDXPlugin */
export type IDXPlugin = IndexPlugin<
    Plugin<'IDX', IDXPluginMethods, 'read', IDXPluginDependentMethods>
>;

// Below types are temporary! They will be removed in the future when we are confident that everyone
// has moved on to the new schema

/** @group IDXPlugin */
export type BackwardsCompatIDXCredential<
    Metadata extends Record<string, any> = Record<never, never>
    > = { [key: string]: any; id: string; title: string; storageType?: 'ceramic' } & Metadata;

/** @group IDXPlugin */
export const BackwardsCompatIDXCredentialValidator: z.ZodType<BackwardsCompatIDXCredential> = z
    .object({ id: z.string(), title: z.string(), storageType: z.literal('ceramic').optional() })
    .catchall(z.any());

/** @group IDXPlugin */
export type BackwardsCompatCredentialsList<
    Metadata extends Record<string, any> = Record<never, never>
    > = {
        credentials: Array<IDXCredential<Metadata> | BackwardsCompatIDXCredential<Metadata>>;
    };

/** @group IDXPlugin */
export const BackwardsCompatCredentialsListValidator: z.ZodType<BackwardsCompatCredentialsList> = z
    .object({
        credentials: IDXCredentialValidator.or(BackwardsCompatIDXCredentialValidator).array(),
    })
    .strict();
