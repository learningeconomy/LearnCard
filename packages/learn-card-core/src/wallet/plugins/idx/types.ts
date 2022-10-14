import { ModelAliases } from '@glazed/types';
import { z } from 'zod';
import { StreamID } from '@ceramicnetwork/streamid';
import { Plugin } from 'types/wallet';
import { StoragePlugin, CachePlugin } from 'types/planes';
import { VC, IDXCredential, IDXCredentialValidator } from '@learncard/types';
import { ResolutionExtension } from '../vc-resolution';

/** @group IDXPlugin */
export type CeramicIDXArgs = {
    modelData: ModelAliases;
    credentialAlias: string;
    ceramicEndpoint: string;
    defaultContentFamily: string;
};

/** @group IDXPlugin */
export type CeramicURI = `lc:ceramic:${string}`;

/** @group IDXPlugin */
export const CeramicURIValidator = z
    .string()
    .refine(
        string => string.split(':').length === 3 && string.split(':')[0] === 'lc',
        'URI must be of the form lc:${storage}:${url}'
    )
    .refine(
        string => string.split(':')[1] === 'ceramic',
        'URI must use storage type ceramic (i.e. must be lc:ceramic:${streamID})'
    );

/** @group IDXPlugin */
export type IDXPluginMethods<URI extends string = ''> = {
    getCredentialsListFromIdx: <Metadata extends Record<string, any> = Record<never, never>>(
        alias?: string
    ) => Promise<CredentialsList<Metadata>>;
    publishContentToCeramic: (cred: any) => Promise<CeramicURI>;
    readContentFromCeramic: (streamId: string) => Promise<any>;
    getVerifiableCredentialFromIdx: (id: string) => Promise<VC | undefined>;
    getVerifiableCredentialsFromIdx: () => Promise<VC[]>;
    addVerifiableCredentialInIdx: <Metadata extends Record<string, any> = Record<never, never>>(
        cred: IDXCredential<Metadata>
    ) => Promise<CeramicURI>;
    removeVerifiableCredentialInIdx: (title: string) => Promise<StreamID>;
} & ResolutionExtension<URI | CeramicURI>;

/** @group IDXPlugin */
export type IDXPluginDependentMethods<URI extends string = ''> = {
    getKey: () => string;
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
export type IDXPlugin = CachePlugin<StoragePlugin<Plugin<'IDX', IDXPluginMethods>>>;

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
