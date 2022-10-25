import { z } from 'zod';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { Plugin } from 'types/wallet';
import { ResolutionExtension } from '../vc-resolution';

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

/** @group CeramicPlugin */
export type CeramicPluginMethods<URI extends string = ''> = {
    publishContentToCeramic: (cred: any) => Promise<CeramicURI>;
    readContentFromCeramic: (streamId: string) => Promise<any>;
    getCeramicClient: () => CeramicClient;
} & ResolutionExtension<URI | CeramicURI>;

/** @group CeramicPlugin */
export type CeramicPluginDependentMethods<URI extends string = ''> = {
    getKey: () => string;
} & ResolutionExtension<URI>;

/** @group CeramicPlugin */
export type CeramicPlugin = Plugin<'Ceramic', 'read' | 'store', CeramicPluginMethods>;
