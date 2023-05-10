import { chunk } from 'lodash';
import { getClient } from '@learncard/learn-cloud-client';
import { LearnCard } from '@learncard/core';
import { isEncrypted } from '@learncard/helpers';
import { CredentialRecord, PaginatedEncryptedCredentialRecordsType } from '@learncard/types';

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
    let dids = await client.user.getDids.query();

    const learnCloudDid = await client.utilities.getDid.query();

    const updateLearnCard = async (
        _learnCard: LearnCard<any, 'id', LearnCloudPluginDependentMethods>
    ) => {
        const oldDid = learnCard.id.did();
        const newDid = _learnCard.id.did();

        if (oldDid !== newDid) {
            if (!dids.includes(newDid)) {
                const presentation = await _learnCard.invoke.getDidAuthVp();

                await client.user.addDid.mutate({ presentation });

                if (newDid.split(':')[1] === 'web') {
                    await client.user.setPrimaryDid.mutate({ presentation });
                }

                dids = await client.user.getDids.query();
            }

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

                const records: CredentialRecord[] = [];

                let result: PaginatedEncryptedCredentialRecordsType = await (
                    _learnCard.index as any
                ).LearnCloud.getPage(query);

                records.push(...(result.records as any));

                while (result.hasMore) {
                    result = await (_learnCard.index as any).LearnCloud.getPage(query, {
                        cursor: result.cursor,
                    });

                    records.push(...(result.records as any));
                }

                return records;
            },
            getPage: async (_learnCard, query, paginationOptions) => {
                await updateLearnCard(_learnCard);

                _learnCard.debug?.('LearnCloud index.getPaginated', query, paginationOptions);

                if (!query) {
                    _learnCard.debug?.('LearnCloud index.get (no query)');
                    const jwe = await client.index.get.query(paginationOptions);

                    _learnCard.debug?.('LearnCloud index.get (no query response)', jwe);

                    const encryptedRecords = isEncrypted(jwe)
                        ? await decryptJWE<PaginatedEncryptedCredentialRecordsType>(_learnCard, jwe)
                        : (jwe as PaginatedEncryptedCredentialRecordsType);

                    _learnCard.debug?.(
                        'LearnCloud index.get (no query encryptedRecords)',
                        encryptedRecords
                    );

                    return {
                        ...encryptedRecords,
                        records: await Promise.all(
                            encryptedRecords.records.map(async record =>
                                decryptJWE<CredentialRecord>(_learnCard, record.encryptedRecord)
                            )
                        ),
                    };
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
                    ...paginationOptions,
                });

                _learnCard.debug?.('LearnCloud index.get (query jwe)', jwe);

                const encryptedRecords = isEncrypted(jwe)
                    ? await decryptJWE<PaginatedEncryptedCredentialRecordsType>(_learnCard, jwe)
                    : (jwe as PaginatedEncryptedCredentialRecordsType);

                _learnCard.debug?.(
                    'LearnCloud index.get (query encryptedRecords)',
                    encryptedRecords
                );

                return {
                    ...encryptedRecords,
                    records: await Promise.all(
                        encryptedRecords.records.map(async record =>
                            decryptJWE<CredentialRecord>(_learnCard, record.encryptedRecord)
                        )
                    ),
                };
            },
            add: async (_learnCard, record) => {
                await updateLearnCard(_learnCard);

                const id = record.id || _learnCard.invoke.crypto().randomUUID();

                return client.index.add.mutate({
                    record: await generateJWE(_learnCard, learnCloudDid, {
                        ...(await generateEncryptedRecord(
                            _learnCard,
                            { ...record, id },
                            unencryptedFields
                        )),
                        id: await hash(_learnCard, id),
                    }),
                });
            },
            addMany: async (_learnCard, _records) => {
                await updateLearnCard(_learnCard);

                const results = await Promise.all(
                    chunk(_records, 25).map(async batch => {
                        const records = await Promise.all(
                            batch.map(async record => {
                                const id = record.id || _learnCard.invoke.crypto().randomUUID();

                                return {
                                    ...(await generateEncryptedRecord(
                                        _learnCard,
                                        { ...record, id },
                                        unencryptedFields
                                    )),
                                    id: await hash(_learnCard, id),
                                };
                            })
                        );

                        return client.index.addMany.mutate({
                            records: await generateJWE(_learnCard, learnCloudDid, records),
                        });
                    })
                );

                return results.every(Boolean);
            },
            update: async (_learnCard, id, updates) => {
                await updateLearnCard(_learnCard);

                const records = await _learnCard.index.LearnCloud.get({ id });

                if (records.length !== 1) return false;

                const record = records[0];

                const newRecord = { ...record, ...updates };

                return client.index.update.mutate({
                    id: await hash(_learnCard, id),
                    updates: await generateJWE(
                        _learnCard,
                        learnCloudDid,
                        await generateEncryptedRecord(_learnCard, newRecord, unencryptedFields)
                    ),
                });
            },
            remove: async (_learnCard, id) => {
                await updateLearnCard(_learnCard);

                return client.index.remove.mutate({ id: await hash(_learnCard, id) });
            },
            removeAll: async _learnCard => {
                await updateLearnCard(_learnCard);

                return client.index.removeAll.mutate();
            },
        },
    };
};
