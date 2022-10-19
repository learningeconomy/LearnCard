import { DID } from 'dids';
import { toUint8Array } from 'hex-lite';
import KeyDidResolver from 'key-did-resolver';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { DIDDataStore } from '@glazed/did-datastore';
import { TileLoader } from '@glazed/tile-loader';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { CreateOpts } from '@ceramicnetwork/common';
import { TileDocument, TileMetadataArgs } from '@ceramicnetwork/stream-tile';
import { IDXCredentialValidator, VCValidator, VC, IDXCredential } from '@learncard/types';

import { streamIdToCeramicURI } from './helpers';

import {
    IDXPlugin,
    CredentialsList,
    CredentialsListValidator,
    IDXPluginDependentMethods,
    CeramicIDXArgs,
    CeramicURIValidator,
    BackwardsCompatCredentialsListValidator,
} from './types';
import { Wallet } from 'types/wallet';

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
): Promise<IDXPlugin> => {
    const ceramic = await getCeramicClientFromWalletSuite(wallet, ceramicEndpoint);

    const loader = new TileLoader({ ceramic });

    const dataStore = new DIDDataStore({ ceramic, model: modelData });

    const getCredentialsListFromIdx = async (alias = credentialAlias): Promise<CredentialsList> => {
        const list = await dataStore.get(alias);

        if (!list) return { credentials: [] };

        const validationResult = await CredentialsListValidator.spa(list);

        if (validationResult.success) return validationResult.data;

        const backwardsCompatValidationResult = await BackwardsCompatCredentialsListValidator.spa(
            list
        );

        if (backwardsCompatValidationResult.success) {
            const oldCreds = backwardsCompatValidationResult.data.credentials;

            const newCreds = oldCreds.map(cred => {
                if ('uri' in cred) return cred as IDXCredential;

                const { title, id, storageType, ...rest } = cred;

                return {
                    ...rest,
                    id: title,
                    uri: `lc:ceramic:${id.replace('ceramic://', '')}`,
                } as IDXCredential;
            });

            const credentialsList = { credentials: newCreds };

            await dataStore.set(credentialAlias, credentialsList);

            return credentialsList;
        }

        console.error(validationResult.error);

        throw new Error('Invalid credentials list stored in IDX');
    };

    const removeCredentialFromIdx = async (id: string, alias?: string) => {
        if (!id) throw new Error('Must provide id to remove');

        if (!alias) alias = credentialAlias;

        const existing = await getCredentialsListFromIdx(alias);

        existing.credentials = existing.credentials.filter(credential => credential.id !== id);

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

        if (!verificationResult.success) return wallet.pluginMethods.resolveCredential(uri);

        const streamId = verificationResult.data.split(':')[2];

        return VCValidator.parseAsync(await readContentFromCeramic(streamId));
    };

    const addCredentialInIdx = async <T extends Record<string, any>>(
        idxCredential: IDXCredential<T>
    ) => {
        const record = IDXCredentialValidator.parse(idxCredential);

        if (!record) throw new Error('record is required');

        if (!record.uri) throw Error('No URI provided');

        // Make sure URI can be resolved
        await resolveCredential(record.uri);

        const existing = await getCredentialsListFromIdx(credentialAlias);

        const indexOfExistingCredential = existing.credentials.findIndex(credential => {
            return credential.id === record.id;
        });

        if (indexOfExistingCredential > -1) {
            existing.credentials[indexOfExistingCredential] = record;
        } else existing.credentials.push(record);

        return streamIdToCeramicURI(await dataStore.set(credentialAlias, existing));
    };

    return {
        name: 'IDX',
        store: {
            upload: async vc => {
                wallet.debug?.('wallet.store.IDX.upload');
                return uploadCredential(vc);
            },
        },
        read: {
            get: async uri => {
                wallet.debug?.('wallet.read.IDX.get');

                return resolveCredential(uri);
            },
        },
        index: {
            get: async () => {
                wallet.debug?.('wallet.index.IDX.get');

                const list = await getCredentialsListFromIdx();

                return list.credentials;
            },
            add: async record => {
                wallet.debug?.('wallet.index.IDX.add');

                try {
                    await addCredentialInIdx(record);

                    return true;
                } catch (error) {
                    console.error('Error adding credential with IDX:', error);

                    return false;
                }
            },
            update: async () => {
                wallet.debug?.('wallet.index.IDX.update');

                // TODO: Implement update
                return false;
            },
            remove: async id => {
                wallet.debug?.('wallet.index.IDX.remove');

                try {
                    await removeCredentialFromIdx(id);

                    return true;
                } catch (error) {
                    console.error('Error removing credential from IDX:', error);

                    return false;
                }
            },
        },
        pluginMethods: {
            getCredentialsListFromIdx: async (_wallet, alias = credentialAlias) =>
                getCredentialsListFromIdx(alias),
            publishContentToCeramic: async (_wallet, cred) =>
                streamIdToCeramicURI(await publishContentToCeramic(cred)),
            readContentFromCeramic: async (_wallet, streamId: string) =>
                readContentFromCeramic(streamId),
            getVerifiableCredentialFromIdx: async (_wallet, id) => {
                const credentialList = await getCredentialsListFromIdx();
                const credential = credentialList?.credentials?.find(cred => cred?.id === id);

                return credential?.uri
                    ? _wallet.pluginMethods.resolveCredential(credential.uri)
                    : undefined;
            },
            getVerifiableCredentialsFromIdx: async _wallet => {
                const credentialList = await getCredentialsListFromIdx();
                const uris = credentialList?.credentials?.map(credential => credential?.uri) ?? [];

                return (
                    await Promise.all(
                        uris.map(async uri => _wallet.pluginMethods.resolveCredential(uri))
                    )
                ).filter((vc): vc is VC => !!vc);
            },
            addVerifiableCredentialInIdx: async (_wallet, idxCredential) => {
                const record = IDXCredentialValidator.parse(idxCredential);

                if (!record) throw new Error('record is required');

                if (!record.uri) throw Error('No URI provided');

                // Make sure URI can be resolved
                await _wallet.pluginMethods.resolveCredential(record.uri);

                const existing = await getCredentialsListFromIdx(credentialAlias);

                const indexOfExistingCredential = existing.credentials.findIndex(credential => {
                    return credential.id === record.id;
                });

                if (indexOfExistingCredential > -1) {
                    existing.credentials[indexOfExistingCredential] = record;
                } else existing.credentials.push(record);

                return streamIdToCeramicURI(await dataStore.set(credentialAlias, existing));
            },
            removeVerifiableCredentialInIdx: async (_wallet, id) => {
                return removeCredentialFromIdx(id);
            },
            resolveCredential: async (_wallet, uri) => resolveCredential(uri),
        },
    };
};
