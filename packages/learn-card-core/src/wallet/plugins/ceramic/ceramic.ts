import { DID } from 'dids';
import { toUint8Array } from 'hex-lite';
import KeyDidResolver from 'key-did-resolver';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { TileLoader } from '@glazed/tile-loader';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { CreateOpts } from '@ceramicnetwork/common';
import { TileDocument, TileMetadataArgs } from '@ceramicnetwork/stream-tile';
import { VCValidator, VC } from '@learncard/types';

import { streamIdToCeramicURI } from './helpers';

import {
    CeramicPlugin,
    CeramicPluginDependentMethods,
    CeramicArgs,
    CeramicURIValidator,
} from './types';
import { Wallet } from 'types/wallet';

/**
 * @group Plugins
 */
export const getCeramicPlugin = async <URI extends string = ''>(
    wallet: Wallet<any, any, CeramicPluginDependentMethods<URI>>,
    { ceramicEndpoint, defaultContentFamily }: CeramicArgs
): Promise<CeramicPlugin> => {
    const ceramic = new CeramicClient(ceramicEndpoint);
    // only supporting did-key atm. this should be stripped into a config param
    const resolver = { ...KeyDidResolver.getResolver() };
    const did = new DID({ resolver });
    ceramic.did = did;

    // use wallet secret key
    // TODO: this is repeating work already done in the wallet. understand what the Ed25519Provider is doing to determine
    // if we can just pass wallet signing key here instead of creating a duplicate from same seed.
    const key = wallet.invoke.getKey();

    const ceramicProvider = new Ed25519Provider(toUint8Array(key));
    ceramic.did!.setProvider(ceramicProvider);

    await ceramic.did!.authenticate();

    const loader = new TileLoader({ ceramic });

    const publishContentToCeramic = async (
        content: any,
        metadata: TileMetadataArgs = {},
        options: CreateOpts = {}
    ) => {
        if (!content) throw new Error('content is required');

        // default to current authorized
        if (!metadata.controllers) metadata.controllers = [ceramic.did!.id];

        // use default
        if (!metadata.family) metadata.family = defaultContentFamily;

        // default to pinning
        // TODO: expose
        if (!('pin' in options)) options.pin = true;

        // assuming TileDocument for now
        const doc = await TileDocument.create(ceramic, content, metadata, options);

        return doc.id.toString();
    };

    const readContentFromCeramic = async (streamId: string): Promise<any> => {
        return (await loader.load(streamId))?.content;
    };

    const uploadCredential = async (vc: VC) => {
        await VCValidator.parseAsync(vc);

        return streamIdToCeramicURI(await publishContentToCeramic(vc));
    };

    const resolveCredential = async (uri = '') => {
        if (!uri) return undefined;

        if (uri.startsWith('ceramic://')) {
            return VCValidator.parseAsync(await readContentFromCeramic(uri));
        }

        const verificationResult = await CeramicURIValidator.spa(uri);

        if (!verificationResult.success) return wallet.invoke.resolveCredential(uri);

        const streamId = verificationResult.data.split(':')[2];

        return VCValidator.parseAsync(await readContentFromCeramic(streamId));
    };

    return {
        name: 'Ceramic',
        store: {
            upload: async vc => {
                wallet.debug?.('wallet.store.Ceramic.upload');
                return uploadCredential(vc);
            },
        },
        read: {
            get: async uri => {
                wallet.debug?.('wallet.read.Ceramic.get');

                return resolveCredential(uri);
            },
        },
        methods: {
            publishContentToCeramic: async (_wallet, cred) =>
                streamIdToCeramicURI(await publishContentToCeramic(cred)),
            readContentFromCeramic: async (_wallet, streamId: string) =>
                readContentFromCeramic(streamId),
            resolveCredential: async (_wallet, uri) => resolveCredential(uri),
            getCeramicClient: () => ceramic,
        },
    };
};
