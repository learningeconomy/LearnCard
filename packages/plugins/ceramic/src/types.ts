import type { DID, CreateJWEOptions, DIDResolutionResult } from 'dids';
import { z } from 'zod';
import type { CeramicClient } from '@ceramicnetwork/http-client';
import type { Plugin } from '@learncard/core';
import type { InputMetadata } from '@learncard/didkit-plugin';

/** @group CeramicPlugin */
export type CeramicArgs = {
    ceramicEndpoint: string;
    defaultContentFamily: string;
};

/** @group CeramicPlugin */
export type CeramicURI = `lc:ceramic:${string}`;

/** @group CeramicPlugin */
export const CeramicURIValidator = z
    .string()
    .refine(
        string => string.split(':').length === 3 && string.split(':')[0] === 'lc',
        // oxlint-disable-next-line no-template-curly-in-string
        'URI must be of the form lc:${storage}:${url}'
    )
    .refine(
        string => string.split(':')[1] === 'ceramic',
        // oxlint-disable-next-line no-template-curly-in-string
        'URI must use storage type ceramic (i.e. must be lc:ceramic:${streamID})'
    );

/**
 * Settings for toggling JWE Encryption before uploading to Ceramic.
 * @group CeramicPlugin
 * @param encrypt enable JWE encryption on upload.
 * @param controllersCanDecrypt helper to add Ceramic controller DIDs to recipients who can decrypt the JWE credential.
 * @param recipients DIDs who can decrypt the JWE credential.
 * @param options additional CreateJWEOptions for encryption.
 */
export type CeramicEncryptionParams = {
    encrypt: boolean;
    controllersCanDecrypt?: boolean;
    recipients?: string[] | undefined;
    options?: CreateJWEOptions | undefined;
};

/** @group CeramicPlugin */
export type CeramicPluginMethods = {
    publishContentToCeramic: (
        cred: any,
        encryption: CeramicEncryptionParams | undefined
    ) => Promise<CeramicURI>;
    readContentFromCeramic: (streamId: string) => Promise<any>;
    getCeramicClient: () => CeramicClient;
    getDIDObject: () => DID;
};

/** @group CeramicPlugin */
export type CeramicPluginDependentMethods = {
    getKey: () => string;
    didResolver: (did: string, inputMetadata?: InputMetadata) => Promise<DIDResolutionResult>;
};

/** @group CeramicPlugin */
export type CeramicPlugin = Plugin<'Ceramic', 'read' | 'store', CeramicPluginMethods>;
