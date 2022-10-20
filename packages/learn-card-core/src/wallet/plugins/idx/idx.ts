import { DIDDataStore } from '@glazed/did-datastore';
import { IDXCredentialValidator, VC, IDXCredential } from '@learncard/types';

import { streamIdToCeramicURI } from '../ceramic/helpers';

import {
    IDXPlugin,
    CredentialsList,
    CredentialsListValidator,
    IDXPluginDependentMethods,
    IDXArgs,
    BackwardsCompatCredentialsListValidator,
} from './types';
import { Wallet } from 'types/wallet';

/**
 * @group Plugins
 */
export const getIDXPlugin = async <URI extends string = ''>(
    wallet: Wallet<any, IDXPluginDependentMethods<URI>>,
    { modelData, credentialAlias }: IDXArgs
): Promise<IDXPlugin> => {
    const ceramic = wallet.invoke.getCeramicClient();

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

    const addCredentialInIdx = async <T extends Record<string, any>>(
        idxCredential: IDXCredential<T>
    ) => {
        const record = IDXCredentialValidator.parse(idxCredential);

        if (!record) throw new Error('record is required');

        if (!record.uri) throw Error('No URI provided');

        // Make sure URI can be resolved
        await wallet.invoke.resolveCredential(record.uri);

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
        methods: {
            getCredentialsListFromIdx: async (_wallet, alias = credentialAlias) =>
                getCredentialsListFromIdx(alias),
            getVerifiableCredentialFromIdx: async (_wallet, id) => {
                const credentialList = await getCredentialsListFromIdx();
                const credential = credentialList?.credentials?.find(cred => cred?.id === id);

                return credential?.uri
                    ? _wallet.invoke.resolveCredential(credential.uri)
                    : undefined;
            },
            getVerifiableCredentialsFromIdx: async _wallet => {
                const credentialList = await getCredentialsListFromIdx();
                const uris = credentialList?.credentials?.map(credential => credential?.uri) ?? [];

                return (
                    await Promise.all(uris.map(async uri => _wallet.invoke.resolveCredential(uri)))
                ).filter((vc): vc is VC => !!vc);
            },
            addVerifiableCredentialInIdx: async (_wallet, idxCredential) => {
                const record = IDXCredentialValidator.parse(idxCredential);

                if (!record) throw new Error('record is required');

                if (!record.uri) throw Error('No URI provided');

                // Make sure URI can be resolved
                await _wallet.invoke.resolveCredential(record.uri);

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
        },
    };
};
