import { DID } from 'dids';
import { toUint8Array } from 'hex-lite';
import KeyDidResolver from 'key-did-resolver';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { DIDDataStore } from '@glazed/did-datastore';
import { TileLoader } from '@glazed/tile-loader';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { CreateOpts } from '@ceramicnetwork/common';
import { TileDocument, TileMetadataArgs } from '@ceramicnetwork/stream-tile';

import { IDXCredential, CredentialsList, IDXPluginMethods, StorageType } from './types';
import { Plugin, Wallet } from 'types/wallet';
import { CeramicIDXArgs } from 'types/LearnCard';

const getCeramicClientFromWalletSuite = async (
    wallet: Wallet<any, { getKey: () => string }>,
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

export const getIDXPlugin = async (
    wallet: Wallet<any, { getKey: () => string }>,
    { modelData, credentialAlias, ceramicEndpoint, defaultContentFamily }: CeramicIDXArgs
): Promise<Plugin<'IDX', IDXPluginMethods>> => {
    const ceramic = await getCeramicClientFromWalletSuite(wallet, ceramicEndpoint);

    const loader = new TileLoader({ ceramic });

    const dataStore = new DIDDataStore({ ceramic, model: modelData });

    const getCredentialsListFromIndex = async (
        alias = credentialAlias
    ): Promise<CredentialsList> => {
        return (await dataStore.get(alias)) || { credentials: [] };
    };

    const addCredentialStreamIdToIndex = async (record: IDXCredential, alias?: string) => {
        if (!record) throw new Error('record is required');

        if (!record.id) throw Error('No streamId provided');

        // check streamId format
        if (record.id.indexOf('ceramic://') === -1) record.id = 'ceramic://' + record.id;

        if (!alias) alias = credentialAlias;

        const existing = await getCredentialsListFromIndex(alias);

        const indexOfExistingCredential = existing.credentials.findIndex(credential => {
            return credential.title === record.title;
        });

        if (indexOfExistingCredential > -1) {
            existing.credentials[indexOfExistingCredential] = {
                storageType: StorageType.ceramic,
                ...record,
            };
        } else existing.credentials.push({ storageType: StorageType.ceramic, ...record });

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
            getCredentialsListFromIndex: async (_wallet, alias = credentialAlias) =>
                getCredentialsListFromIndex(alias),
            publishContentToCeramic: async (_wallet, cred) => publishContentToCeramic(cred),
            readContentFromCeramic: async (_wallet, streamId: string) =>
                readContentFromCeramic(streamId),
            getVerifiableCredentialFromIndex: async (_wallet, title: string) => {
                const credentialList = await getCredentialsListFromIndex();
                const credential = credentialList?.credentials?.find(cred => cred?.title === title);

                return credential && (await readContentFromCeramic(credential.id));
            },
            getVerifiableCredentialsFromIndex: async () => {
                const credentialList = await getCredentialsListFromIndex();
                const streamIds =
                    credentialList?.credentials?.map(credential => credential?.id) ?? [];

                return Promise.all(
                    streamIds.map(async streamId => readContentFromCeramic(streamId))
                );
            },
            addVerifiableCredentialInIdx: async (_wallet, { title, id }) => {
                return addCredentialStreamIdToIndex({ title, id });
            },
        },
    };
};
