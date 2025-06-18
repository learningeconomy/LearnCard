import type { ModelAliases } from '@glazed/types';
import { z } from 'zod';
import type { StreamID } from '@ceramicnetwork/streamid';
import type { Plugin } from '@learncard/core';
import { CredentialRecordValidator, type VC, type CredentialRecord } from '@learncard/types';
import type { CeramicClient } from '@ceramicnetwork/http-client';

/** @group IDXPlugin */
export type IDXIndexObject<
    IDXMetadata extends Record<string, any>,
    Metadata extends Record<string, any>
> = {
    credentials: CredentialRecord<Metadata>[];
} & IDXMetadata;

/** @group IDXPlugin */
export type IDXArgs = {
    modelData: ModelAliases;
    credentialAlias: string;
};

/** @group IDXPlugin */
export type IDXPluginMethods = {
    getCredentialsListFromIdx: <Metadata extends Record<string, any> = Record<never, never>>(
        alias?: string
    ) => Promise<CredentialRecord<Metadata>[]>;
    getVerifiableCredentialFromIdx: (id: string) => Promise<VC | undefined>;
    getVerifiableCredentialsFromIdx: () => Promise<VC[]>;
    addVerifiableCredentialInIdx: <Metadata extends Record<string, any> = Record<never, never>>(
        cred: CredentialRecord<Metadata>
    ) => Promise<string>;
    removeVerifiableCredentialInIdx: (title: string) => Promise<StreamID>;
    removeAllVerifiableCredentialsInIdx: () => Promise<StreamID>;
    getIDXIndex: <
        IDXMetadata extends Record<string, any>,
        Metadata extends Record<string, any>
    >() => Promise<IDXIndexObject<IDXMetadata, Metadata> | null>;
    setIDXIndex: <IDXMetadata extends Record<string, any>, Metadata extends Record<string, any>>(
        index: IDXIndexObject<IDXMetadata, Metadata>
    ) => Promise<StreamID>;
};

/** @group IDXPlugin */
export type IDXPluginDependentMethods = {
    getCeramicClient: () => CeramicClient;
};

/** @group IDXPlugin */
export type CredentialsList<Metadata extends Record<string, any> = Record<never, never>> = {
    credentials: CredentialRecord<Metadata>[];
};

/** @group IDXPlugin */
export const CredentialsListValidator: z.ZodType<CredentialsList> = z
    .object({
        credentials: CredentialRecordValidator.array(),
    })
    .catchall(z.any());

/** @group IDXPlugin */
export type IDXPlugin = Plugin<'IDX', 'index', IDXPluginMethods, 'read', IDXPluginDependentMethods>;

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
    credentials: (CredentialRecord<Metadata> | BackwardsCompatIDXCredential<Metadata>)[];
};

/** @group IDXPlugin */
export const BackwardsCompatCredentialsListValidator: z.ZodType<BackwardsCompatCredentialsList> = z
    .object({
        credentials: CredentialRecordValidator.or(BackwardsCompatIDXCredentialValidator).array(),
    })
    .strict();
