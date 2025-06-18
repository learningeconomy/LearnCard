import _ from 'lodash';
import { DID, type DIDResolutionResult } from 'dids';
import type { JWE } from 'did-jwt';
import { toUint8Array } from 'hex-lite';
import KeyDidResolver from 'key-did-resolver';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { TileLoader } from '@glazed/tile-loader';
import { CeramicClient } from '@ceramicnetwork/http-client';
import type { CreateOpts } from '@ceramicnetwork/common';
import { TileDocument, type TileMetadataArgs } from '@ceramicnetwork/stream-tile';
import type { LearnCard } from '@learncard/core';
import type { InputMetadata } from '@learncard/didkit-plugin';
import { VCValidator, VPValidator, type VC, type VP } from '@learncard/types';

import { streamIdToCeramicURI } from './helpers';
import {
    CeramicURIValidator,
    type CeramicEncryptionParams,
    type CeramicPlugin,
    type CeramicPluginDependentMethods,
    type CeramicArgs,
} from './types';
import { DEFAULT_CERAMIC_ARGS } from './defaults';

/**
 * @group Plugins
 */
export const getCeramicPlugin = async (
    learnCard: LearnCard<any, any, CeramicPluginDependentMethods>,
    { ceramicEndpoint, defaultContentFamily }: CeramicArgs = DEFAULT_CERAMIC_ARGS
): Promise<CeramicPlugin> => {
    const ceramic = new CeramicClient(ceramicEndpoint);

    const learnCardResolver = async (
        did: string,
        _parsedDid: any,
        _resolver: any,
        options: InputMetadata
    ): Promise<DIDResolutionResult> => learnCard.invoke.didResolver(did, options);

    const resolver = { ...KeyDidResolver.getResolver(), web: learnCardResolver };

    const did = new DID({ resolver });

    ceramic.did = did;

    // use wallet secret key
    // TODO: this is repeating work already done in the wallet. understand what the Ed25519Provider is doing to determine
    // if we can just pass wallet signing key here instead of creating a duplicate from same seed.
    const key = learnCard.invoke.getKey();

    const ceramicProvider = new Ed25519Provider(toUint8Array(key));
    ceramic.did!.setProvider(ceramicProvider);

    await ceramic.did!.authenticate();

    const loader = new TileLoader({ ceramic });

    const publishContentToCeramic = async (
        content: any,
        metadata: TileMetadataArgs = {},
        options: CreateOpts = {},
        encryption?: CeramicEncryptionParams
    ) => {
        if (!content) throw new Error('content is required');

        // default to current authorized
        if (!metadata.controllers) metadata.controllers = [ceramic.did!.id];

        // use default
        if (!metadata.family) metadata.family = defaultContentFamily;

        // default to pinning
        // TODO: expose
        if (!('pin' in options)) options.pin = true;

        if (encryption?.encrypt) {
            learnCard.debug?.(
                'learnCard.store.Ceramic.upload.publishContentToCeramic - encrypt enabled',
                encryption
            );

            let recipients = encryption?.recipients || [];
            if (encryption?.controllersCanDecrypt) {
                recipients = [...recipients, ...metadata.controllers];
            }
            content = await ceramic?.did?.createDagJWE(content, _.uniq(recipients));
        }

        learnCard.debug?.(
            'learnCard.store.Ceramic.upload.publishContentToCeramic - content to upload',
            content,
            metadata,
            options
        );

        // assuming TileDocument for now
        const doc = await TileDocument.create(ceramic, content, metadata, options);

        return doc.id.toString();
    };

    const readContentFromCeramic = async (streamId: string): Promise<any> => {
        const content = (await loader.load(streamId))?.content;
        learnCard.debug?.('learnCard.read.get.readContentFromCeramic', content);
        if (content?.ciphertext) {
            try {
                return await did.decryptDagJWE(content as JWE);
            } catch (error) {
                learnCard.debug?.(
                    'learnCard.read.get.readContentFromCeramic - Could not decrypt credential - DID not authorized.',
                    error
                );
                throw new Error('Could not decrypt credential - DID not authorized.');
            }
        }
        return content;
    };

    const uploadCredential = async (
        vc: VC | VP,
        encryption?: CeramicEncryptionParams | undefined
    ) => {
        await VCValidator.or(VPValidator).parseAsync(vc);

        return streamIdToCeramicURI(await publishContentToCeramic(vc, {}, {}, encryption));
    };

    return {
        name: 'Ceramic',
        displayName: 'Ceramic',
        description:
            'Uploads/resolves credentials using the Ceramic Network (https://ceramic.network/)',
        store: {
            upload: async (_learnCard, vc) => {
                _learnCard.debug?.('learnCard.store.Ceramic.upload');
                return uploadCredential(vc);
            },
            uploadEncrypted: async (_learnCard, vc, params) => {
                _learnCard.debug?.('learnCard.store.Ceramic.uploadEncrypted');
                return uploadCredential(vc, {
                    encrypt: true,
                    controllersCanDecrypt: true,
                    ...(params ? { recipients: params.recipients } : {}),
                });
            },
        },
        read: {
            get: async (_learnCard, uri) => {
                _learnCard.debug?.('learnCard.read.Ceramic.get');

                if (!uri) return undefined;

                const verificationResult = await CeramicURIValidator.spa(uri);

                if (!verificationResult.success) return undefined;

                const streamId = verificationResult.data.split(':')[2];
                try {
                    return await VCValidator.or(VPValidator).parseAsync(
                        await readContentFromCeramic(streamId)
                    );
                } catch (error) {
                    _learnCard.debug?.(error);
                    return undefined;
                }
            },
        },
        methods: {
            publishContentToCeramic: async (
                _learnCard,
                cred,
                encryption: CeramicEncryptionParams | undefined
            ) => streamIdToCeramicURI(await publishContentToCeramic(cred, {}, {}, encryption)),
            readContentFromCeramic: async (_learnCard, streamId: string) =>
                readContentFromCeramic(streamId),
            getCeramicClient: () => ceramic,
            getDIDObject: () => ceramic.did!,
        },
    };
};
