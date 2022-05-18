import { DID } from 'dids';
import { toUint8Array } from 'hex-lite';
import KeyDidResolver from 'key-did-resolver';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { DIDDataStore } from '@glazed/did-datastore';
import { ModelAliases } from '@glazed/types';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { CreateOpts } from '@ceramicnetwork/common';
import { TileDocument, TileMetadataArgs } from '@ceramicnetwork/stream-tile';

import { CredentialStreamId, CredentialsList, IDXPluginMethods } from './types';
import { Plugin, UnlockedWallet } from 'types/wallet';

const getCeramicClientFromWalletSuite = async (
    wallet: UnlockedWallet<any, any>,
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
    const contents = JSON.parse(JSON.stringify(wallet.contents));
    const key = contents?.find((c: { name: string }) => c?.name === 'DID Key Secret')?.value ?? '';

    const ceramicProvider = new Ed25519Provider(toUint8Array(key));
    client.did!.setProvider(ceramicProvider);

    await client.did!.authenticate();

    return client;
};

export const getIDXPlugin = async (
    wallet: UnlockedWallet<any, any, any>,
    modelData: ModelAliases,
    credentialAlias: string,
    ceramicEndpoint: string,
    defaultContentFamily: string
): Promise<Plugin<'IDX', IDXPluginMethods>> => {
    const ceramic = await getCeramicClientFromWalletSuite(wallet, ceramicEndpoint);

    const dataStore = new DIDDataStore({ ceramic, model: modelData });

    const getCredentialsListFromIndex = async (
        alias = credentialAlias
    ): Promise<CredentialsList> => {
        return (await dataStore.get(alias)) || { credentials: [] };
    };

    const addCredentialStreamIdToIndex = async (record: CredentialStreamId, alias?: string) => {
        if (!record) throw new Error('record is required');

        if (!record.id) throw Error('No streamId provided');

        // check streamId format
        if (record.id.indexOf('ceramic://') === -1) record.id = 'ceramic://' + record.id;

        if (!alias) alias = credentialAlias;

        const existing = await getCredentialsListFromIndex(alias);

        existing.credentials.push(record);

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
        return (await TileDocument.load(ceramic, streamId))?.content;
    };

    return {
        pluginMethods: {
            getCredentialsListFromIndex: async (_wallet, alias = credentialAlias) =>
                getCredentialsListFromIndex(alias),
            readContentFromCeramic: async (_wallet, streamId: string) =>
                readContentFromCeramic(streamId),
            getVerifiableCredential: async (_wallet, title: string) => {
                const credentialList = await getCredentialsListFromIndex();
                const credential = credentialList?.credentials?.find(cred => cred?.title === title);

                return credential && (await readContentFromCeramic(credential.id));
            },
            getVerifiableCredentials: async _wallet => {
                const credentialList = await getCredentialsListFromIndex();
                const streamId = credentialList?.credentials?.[0]?.id;

                if (streamId) return readContentFromCeramic(streamId);
            },
            persistVerifiableCredential: async (_wallet, { title, id }) => {
                return addCredentialStreamIdToIndex({ title, id });
            },
            publishVerifiableCredential: async (_wallet, cred) => publishContentToCeramic(cred),
        },
        pluginConstants: {},
    };
};
