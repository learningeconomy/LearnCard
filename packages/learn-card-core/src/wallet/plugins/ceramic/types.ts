import type { DID, CreateJWEOptions, DIDResolutionResult } from 'dids';
import { z } from 'zod';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { Plugin } from 'types/wallet';
import { ResolutionExtension } from '../vc-resolution';
import { InputMetadata } from '../didkit';

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
        'URI must be of the form lc:${storage}:${url}'
    )
    .refine(
        string => string.split(':')[1] === 'ceramic',
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
export type CeramicPluginMethods<URI extends string = ''> = {
    publishContentToCeramic: (
        cred: any,
        encryption: CeramicEncryptionParams | undefined
    ) => Promise<CeramicURI>;
    readContentFromCeramic: (streamId: string) => Promise<any>;
    getCeramicClient: () => CeramicClient;
    getDIDObject: () => DID;
} & ResolutionExtension<URI | CeramicURI>;

/** @group CeramicPlugin */
export type CeramicPluginDependentMethods<URI extends string = ''> = {
    getKey: () => string;
    didResolver: (did: string, inputMetadata?: InputMetadata) => Promise<DIDResolutionResult>;
} & ResolutionExtension<URI>;

/** @group CeramicPlugin */
export type CeramicPlugin = Plugin<'Ceramic', 'read' | 'store', CeramicPluginMethods>;
