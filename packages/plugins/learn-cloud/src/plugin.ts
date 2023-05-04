import { getClient } from '@learncard/learn-cloud-client';
import { LearnCard } from '@learncard/core';
import { isEncrypted } from '@learncard/helpers';
import {
    EncryptedCredentialRecord,
    PaginatedEncryptedCredentialRecordsType,
} from '@learncard/types';

import { LearnCloudPluginDependentMethods, LearnCloudPlugin } from './types';
import {
    generateEncryptedRecord,
    generateEncryptedFieldsArray,
    generateJWE,
    decryptJWE,
    hash,
} from './helpers';

export * from './types';

const getLearnCloudClient = async (
    url: string,
    learnCard: LearnCard<any, 'id', LearnCloudPluginDependentMethods>
) => {
    return getClient(url, async challenge => {
        const jwt = await learnCard.invoke.getDidAuthVp({ proofFormat: 'jwt', challenge });

        if (typeof jwt !== 'string') throw new Error('Error getting DID-Auth-JWT!');

        return jwt;
    });
};

/**
 * @group Plugins
 */
export const getLearnCloudPlugin = async (
    initialLearnCard: LearnCard<any, 'id', LearnCloudPluginDependentMethods>,
    url: string,
    unencryptedFields: string[] = []
): Promise<LearnCloudPlugin> => {
    let learnCard = initialLearnCard;

    learnCard.debug?.('Adding LearnCloud Plugin');

    let client = await getLearnCloudClient(url, learnCard);

    const learnCloudDid = await client.utilities.getDid.query();

    const updateLearnCard = async (
        _learnCard: LearnCard<any, 'id', LearnCloudPluginDependentMethods>
    ) => {
        if (_learnCard.id.did() !== learnCard.id.did()) {
            client = await getLearnCloudClient(url, _learnCard);
        }

        learnCard = _learnCard;
    };

    return {
        name: 'LearnCloud',
        displayName: 'LearnCloud',
        description: 'LearnCloud Integration',
        methods: {},
        index: {
            get: async (_learnCard, query) => {
                await updateLearnCard(_learnCard);

                _learnCard.debug?.('LearnCloud index.get', query);

                if (!query) {
                    _learnCard.debug?.('LearnCloud index.get (no query)');
                    const jwe = await client.index.get.query();

                    _learnCard.debug?.('LearnCloud index.get (no query response)', jwe);

                    const encryptedRecords = isEncrypted(jwe)
                        ? await decryptJWE<PaginatedEncryptedCredentialRecordsType>(_learnCard, jwe)
                        : (jwe as PaginatedEncryptedCredentialRecordsType);

                    _learnCard.debug?.(
                        'LearnCloud index.get (no query encryptedRecords)',
                        encryptedRecords
                    );

                    return Promise.all(
                        encryptedRecords.records.map(async record => ({
                            ...(await decryptJWE(_learnCard, record.encryptedRecord)),
                            id: record.id,
                        }))
                    );
                }

                _learnCard.debug?.('LearnCloud index.get (query)');

                const fields = await generateEncryptedFieldsArray(
                    _learnCard,
                    query as any,
                    unencryptedFields
                );

                _learnCard.debug?.('LearnCloud index.get (query fields)', fields);

                const unencryptedEntries = Object.fromEntries(
                    Object.entries(query).filter(([key]) => unencryptedFields.includes(key))
                );

                _learnCard.debug?.(
                    'LearnCloud index.get (query unencryptedEntries)',
                    unencryptedEntries
                );

                const jwe = await client.index.get.query({
                    query: await generateJWE(_learnCard, learnCloudDid, {
                        ...unencryptedEntries,
                        fields: { $in: fields },
                    }),
                });

                _learnCard.debug?.('LearnCloud index.get (query jwe)', jwe);

                const encryptedRecords = isEncrypted(jwe)
                    ? await decryptJWE<PaginatedEncryptedCredentialRecordsType>(_learnCard, jwe)
                    : (jwe as PaginatedEncryptedCredentialRecordsType);

                _learnCard.debug?.(
                    'LearnCloud index.get (query encryptedRecords)',
                    encryptedRecords
                );

                return Promise.all(
                    encryptedRecords.records.map(async record => ({
                        ...(await decryptJWE(_learnCard, record.encryptedRecord)),
                        id: record.id,
                    }))
                );
            },
            add: async (_learnCard, record) => {
                await updateLearnCard(_learnCard);

                return client.index.add.mutate({
                    record: await generateJWE(_learnCard, learnCloudDid, {
                        ...(await generateEncryptedRecord(
                            _learnCard,
                            learnCloudDid,
                            record,
                            unencryptedFields
                        )),
                        ...(record.id ? { id: record.id } : {}),
                    }),
                });
            },
            addMany: async (_learnCard, _records) => {
                await updateLearnCard(_learnCard);

                const records = await Promise.all(
                    _records.map(async record => {
                        return generateJWE(_learnCard, learnCloudDid, {
                            ...(await generateEncryptedRecord(
                                _learnCard,
                                learnCloudDid,
                                record,
                                unencryptedFields
                            )),
                            ...(record.id ? { id: hash(_learnCard, record.id) } : {}),
                        });
                    })
                );

                return client.index.addMany.mutate({ records });
            },
            update: async (_learnCard, id, updates) => {
                await updateLearnCard(_learnCard);

                const records = await _learnCard.index.LearnCloud.get({ id });

                if (records.length !== 1) return false;

                const record = records[0];

                const newRecord = { ...record, ...updates };

                return client.index.update.mutate({
                    id,
                    updates: await generateJWE(
                        _learnCard,
                        learnCloudDid,
                        await generateEncryptedRecord(
                            _learnCard,
                            learnCloudDid,
                            newRecord,
                            unencryptedFields
                        )
                    ),
                });
            },
            remove: async (_learnCard, id) => {
                await updateLearnCard(_learnCard);

                return client.index.remove.mutate({ id });
            },
            removeAll: async _learnCard => {
                await updateLearnCard(_learnCard);

                return client.index.removeAll.mutate();
            },
        },
    };
};
