import { DID } from 'dids';
import { toUint8Array } from 'hex-lite';
import KeyDidResolver from 'key-did-resolver';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { DIDDataStore } from '@glazed/did-datastore';
import { TileLoader } from '@glazed/tile-loader';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { CreateOpts } from '@ceramicnetwork/common';
import { TileDocument, TileMetadataArgs } from '@ceramicnetwork/stream-tile';
import {
    IDXCredential,
    IDXCredentialValidator,
    StorageTypeEnum,
    VCValidator,
} from '@learncard/types';

import {
    CredentialsList,
    CredentialsListValidator,
    IDXPluginMethods,
    IDXPluginDependentMethods,
    CeramicIDXArgs,
    CeramicURIValidator,
} from './types';
import { Plugin, Wallet } from 'types/wallet';
import { LC_URI } from '../vc-resolution';

const getCeramicClientFromWalletSuite = async <URI extends string = ''>(
    wallet: Wallet<any, IDXPluginDependentMethods<URI>>,
    ceramicEndpoint: string
): Promise<CeramicClient> => {
    const client = new CeramicClient(ceramicEndpoint);
    // only supporting did-key atm. this should be stripped into a config param
    const resolver = { ...KeyDidResolver.getResolver() };
    const did = new DID({ resolver });
    client.did = did;

    // use wallet secret key
    // TODO: this is repeating work already done in the wallet. understand what the Ed25519Provider is doing to determine
    // if we can just pass wallet signing key here instead of creating a duplicate from same seed.
    const key = wallet.pluginMethods.getKey();

    const ceramicProvider = new Ed25519Provider(toUint8Array(key));
    client.did!.setProvider(ceramicProvider);

    await client.did!.authenticate();

    return client;
};

/**
 * @group Plugins
 */
export const getIDXPlugin = async <URI extends string = ''>(
    wallet: Wallet<any, IDXPluginDependentMethods<URI>>,
    { modelData, credentialAlias, ceramicEndpoint, defaultContentFamily }: CeramicIDXArgs
): Promise<Plugin<'IDX', IDXPluginMethods<URI>>> => {
    const ceramic = await getCeramicClientFromWalletSuite(wallet, ceramicEndpoint);

    const loader = new TileLoader({ ceramic });

    const dataStore = new DIDDataStore({ ceramic, model: modelData });

    const getCredentialsListFromIdx = async (alias = credentialAlias): Promise<CredentialsList> => {
        const list = await dataStore.get(alias);

        if (!list) return { credentials: [] };

        const validationResult = await CredentialsListValidator.spa(list);

        if (validationResult.success) return validationResult.data;

        console.error(validationResult.error);

        throw new Error('Invalid credentials list stored in IDX');
    };

    const addCredentialStreamIdToIdx = async (_record: IDXCredential, alias?: string) => {
        const record = IDXCredentialValidator.parse(_record);

        if (!record) throw new Error('record is required');

        if (!record.id) throw Error('No streamId provided');

        // check streamId format
        if (record.id.indexOf('ceramic://') === -1) record.id = 'ceramic://' + record.id;

        if (!alias) alias = credentialAlias;

        const existing = await getCredentialsListFromIdx(alias);

        const indexOfExistingCredential = existing.credentials.findIndex(credential => {
            return credential.title === record.title;
        });

        if (indexOfExistingCredential > -1) {
            existing.credentials[indexOfExistingCredential] = {
                storageType: StorageTypeEnum.ceramic,
                ...record,
            };
        } else existing.credentials.push({ storageType: StorageTypeEnum.ceramic, ...record });

        return dataStore.set(alias, existing);
    };

    const removeCredentialFromIdx = async (title: string, alias?: string) => {
        if (!title) throw new Error('record is required');

        if (!alias) alias = credentialAlias;

        const existing = await getCredentialsListFromIdx(alias);

        existing.credentials = existing.credentials.filter(
            credential => credential.title !== title
        );

        return dataStore.set(alias, existing);
    };

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

    return {
        pluginMethods: {
            getCredentialsListFromIdx: async (_wallet, alias = credentialAlias) =>
                getCredentialsListFromIdx(alias),
            publishContentToCeramic: async (_wallet, cred) => publishContentToCeramic(cred),
            readContentFromCeramic: async (_wallet, streamId: string) =>
                readContentFromCeramic(streamId),
            getVerifiableCredentialFromIdx: async (_wallet, title: string) => {
                const credentialList = await getCredentialsListFromIdx();
                const credential = credentialList?.credentials?.find(cred => cred?.title === title);

                return credential && (await readContentFromCeramic(credential.id));
            },
            getVerifiableCredentialsFromIdx: async () => {
                const credentialList = await getCredentialsListFromIdx();
                const streamIds =
                    credentialList?.credentials?.map(credential => credential?.id) ?? [];

                return Promise.all(
                    streamIds.map(async streamId => readContentFromCeramic(streamId))
                );
            },
            addVerifiableCredentialInIdx: async (_wallet, idxCredential) => {
                return addCredentialStreamIdToIdx(idxCredential);
            },
            removeVerifiableCredentialInIdx: async (_wallet, title) => {
                return removeCredentialFromIdx(title);
            },
            resolveCredential: async (_wallet, uri) => {
                if (uri.startsWith('ceramic://')) {
                    return VCValidator.parseAsync(await readContentFromCeramic(uri));
                }

                const verificationResult = await CeramicURIValidator.spa(uri);

                if (!verificationResult.success) {
                    return wallet.pluginMethods.resolveCredential(uri as LC_URI<URI>);
                }

                const streamId = verificationResult.data.split(':')[2];

                return VCValidator.parseAsync(await readContentFromCeramic(streamId));
            },
        },
    };
};
