import { DIDDataStore } from '@glazed/did-datastore';
import { CredentialRecordValidator, VC, CredentialRecord, VCValidator } from '@learncard/types';
import { LearnCard } from '@learncard/core';

import { streamIdToCeramicURI } from '@learncard/ceramic-plugin';

import {
    IDXPlugin,
    CredentialsList,
    CredentialsListValidator,
    IDXPluginDependentMethods,
    IDXArgs,
    BackwardsCompatCredentialsListValidator,
} from './types';
import { DEFAULT_IDX_ARGS } from './defaults';

/**
 * @group Plugins
 */
export const getIDXPlugin = async (
    learnCard: LearnCard<any, 'read', IDXPluginDependentMethods>,
    { modelData, credentialAlias }: IDXArgs = DEFAULT_IDX_ARGS
): Promise<IDXPlugin> => {
    const ceramic = learnCard.invoke.getCeramicClient();

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
                if ('uri' in cred) return cred as CredentialRecord;

                const { title, id, storageType, ...rest } = cred;

                return {
                    ...rest,
                    id: title,
                    uri: `lc:ceramic:${id.replace('ceramic://', '')}`,
                } as CredentialRecord;
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

    const removeAllCredentialsFromIdx = async (alias?: string) => {
        if (!alias) alias = credentialAlias;

        return dataStore.set(alias, { credentials: [] });
    };

    const addCredentialInIdx = async <T extends Record<string, any>>(
        _record: CredentialRecord<T>
    ) => {
        const record = await CredentialRecordValidator.parseAsync(_record);

        if (!record) throw new Error('record is required');

        if (!record.uri) throw Error('No URI provided');

        // Make sure URI can be resolved
        await learnCard.read.get(record.uri);

        const existing = await getCredentialsListFromIdx(credentialAlias);

        const indexOfExistingCredential = existing.credentials.findIndex(credential => {
            return credential.id === record.id;
        });

        if (indexOfExistingCredential > -1) {
            existing.credentials[indexOfExistingCredential] = record;
        } else existing.credentials.push(record);

        return streamIdToCeramicURI(await dataStore.set(credentialAlias, existing));
    };

    const addCredentialsInIdx = async <T extends Record<string, any>>(
        _records: CredentialRecord<T>[]
    ) => {
        const records = CredentialRecordValidator.array().parse(_records);

        const existing = await getCredentialsListFromIdx(credentialAlias);

        await Promise.all(
            records.map(async record => {
                // Make sure URI can be resolved
                await learnCard.read.get(record.uri);

                const indexOfExistingCredential = existing.credentials.findIndex(credential => {
                    return credential.id === record.id;
                });

                if (indexOfExistingCredential > -1) {
                    existing.credentials[indexOfExistingCredential] = record;
                } else existing.credentials.push(record);
            })
        );

        return streamIdToCeramicURI(await dataStore.set(credentialAlias, existing));
    };

    return {
        name: 'IDX',
        displayName: 'IDX',
        description: 'Stores a bespoke index of credentials for an individual based on their did',
        index: {
            get: async _learnCard => {
                _learnCard.debug?.('learnCard.index.IDX.get');

                const list = await getCredentialsListFromIdx();

                return list.credentials;
            },
            add: async (_learnCard, record) => {
                _learnCard.debug?.('learnCard.index.IDX.add');

                try {
                    await addCredentialInIdx(record);

                    return true;
                } catch (error) {
                    console.error('Error adding credential with IDX:', error);

                    return false;
                }
            },
            addMany: async (_learnCard, records) => {
                _learnCard.debug?.('learnCard.index.IDX.add');

                try {
                    await addCredentialsInIdx(records);

                    return true;
                } catch (error) {
                    console.error('Error adding credential with IDX:', error);

                    return false;
                }
            },
            update: async _learnCard => {
                _learnCard.debug?.('learnCard.index.IDX.update');

                // TODO: Implement update
                return false;
            },
            remove: async (_learnCard, id) => {
                _learnCard.debug?.('learnCard.index.IDX.remove');

                try {
                    await removeCredentialFromIdx(id);

                    return true;
                } catch (error) {
                    console.error('Error removing credential from IDX:', error);

                    return false;
                }
            },
            removeAll: async _learnCard => {
                _learnCard.debug?.('learnCard.index.IDX.removeAll');

                try {
                    await removeAllCredentialsFromIdx();

                    return true;
                } catch (error) {
                    console.error('Error removing credentials from IDX:', error);

                    return false;
                }
            },
        },
        methods: {
            getCredentialsListFromIdx: async (_learnCard, alias = credentialAlias) =>
                (await getCredentialsListFromIdx(alias)).credentials,
            getVerifiableCredentialFromIdx: async (_learnCard, id) => {
                const credentialList = await getCredentialsListFromIdx();
                const credential = credentialList?.credentials?.find(cred => cred?.id === id);

                const result = _learnCard.read.get(credential?.uri);

                const validationResult = await VCValidator.safeParseAsync(result);

                return validationResult.success ? validationResult.data : undefined;
            },
            getVerifiableCredentialsFromIdx: async _learnCard => {
                const credentialList = await getCredentialsListFromIdx();
                const uris = credentialList?.credentials?.map(credential => credential?.uri) ?? [];

                return (await Promise.all(uris.map(async uri => _learnCard.read.get(uri)))).filter(
                    (vc): vc is VC => !!vc
                );
            },
            addVerifiableCredentialInIdx: async (_learnCard, idxCredential) => {
                const record = CredentialRecordValidator.parse(idxCredential);

                if (!record) throw new Error('record is required');

                if (!record.uri) throw Error('No URI provided');

                // Make sure URI can be resolved
                await _learnCard.read.get(record.uri);

                const existing = await getCredentialsListFromIdx(credentialAlias);

                const indexOfExistingCredential = existing.credentials.findIndex(credential => {
                    return credential.id === record.id;
                });

                if (indexOfExistingCredential > -1) {
                    existing.credentials[indexOfExistingCredential] = record;
                } else existing.credentials.push(record);

                return streamIdToCeramicURI(await dataStore.set(credentialAlias, existing));
            },
            removeVerifiableCredentialInIdx: async (_learnCard, id) => {
                return removeCredentialFromIdx(id);
            },
            removeAllVerifiableCredentialsInIdx: async () => {
                return removeAllCredentialsFromIdx();
            },
            getIDXIndex: async () => dataStore.get(credentialAlias),
            setIDXIndex: async (_learnCard, index) => dataStore.set(credentialAlias, index),
        },
    };
};
