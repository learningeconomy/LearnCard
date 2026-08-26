import { chunk } from 'lodash';
import { getClient, LearnCloudClient } from '@learncard/learn-cloud-client';
import { LearnCard } from '@learncard/core';
import { isEncrypted, resolveStorageReadResult } from '@learncard/helpers';
import {
    CredentialRecord,
    JWE,
    PaginatedEncryptedRecordsType,
    PaginatedEncryptedCredentialRecordsType,
    StoredCredentialEnvelope,
    StoredCredentialEnvelopeValidator,
    VCValidator,
    VPValidator,
    isStoredCredentialEnvelope,
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

const uint8ArrayToBase64Url = (bytes: Uint8Array): string => {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
    const base64 =
        typeof btoa === 'function'
            ? btoa(binary)
            : Buffer.from(binary, 'binary').toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

type WireEnvelope = StoredCredentialEnvelope & { data: string };

const normalizeEnvelopeForTransport = <T>(
    value: T
): Exclude<T, StoredCredentialEnvelope> | WireEnvelope => {
    if (!isStoredCredentialEnvelope(value)) {
        return value as Exclude<T, StoredCredentialEnvelope>;
    }
    if (typeof value.data === 'string') return value as WireEnvelope;
    return { ...value, data: uint8ArrayToBase64Url(value.data) };
};

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
    unencryptedFields: string[] = [],
    unencryptedCustomFields: string[] = [],
    automaticallyAssociateDids = true
): Promise<LearnCloudPlugin> => {
    let learnCard = initialLearnCard;

    learnCard.debug?.('Adding LearnCloud Plugin');

    let client = await getLearnCloudClient(url, learnCard);

    let dids: string[] = [learnCard.id.did()];
    let didsLoaded = false;

    const loadDids = async (currentClient: LearnCloudClient): Promise<void> => {
        if (didsLoaded) return;

        dids = await currentClient.user.getDids.query();
        didsLoaded = true;
    };

    const otherClients = new Map<string, Promise<LearnCloudClient>>();
    const learnCloudDids = new WeakMap<LearnCloudClient, Promise<string>>();

    const getLearnCloudDid = (currentClient: LearnCloudClient): Promise<string> => {
        let learnCloudDid = learnCloudDids.get(currentClient);

        if (!learnCloudDid) {
            learnCloudDid = currentClient.utilities.getDid.query();
            learnCloudDids.set(currentClient, learnCloudDid);
        }

        return learnCloudDid;
    };

    const getOtherClient = async (
        otherUrl: string,
        _learnCard: LearnCard<any, 'id', LearnCloudPluginDependentMethods>
    ): Promise<LearnCloudClient> => {
        const key = `${_learnCard.id.did()}\0${otherUrl}`;
        let otherClient = otherClients.get(key);

        if (!otherClient) {
            otherClient = getLearnCloudClient(otherUrl, _learnCard);
            otherClients.set(key, otherClient);
        }

        try {
            return await otherClient;
        } catch (error) {
            if (otherClients.get(key) === otherClient) otherClients.delete(key);

            throw error;
        }
    };

    let updateQueue = Promise.resolve();

    const updateLearnCard = (
        _learnCard: LearnCard<any, 'id', LearnCloudPluginDependentMethods>
    ): Promise<LearnCloudClient> => {
        const update = updateQueue.then(async () => {
            const oldDid = learnCard.id.did();
            const newDid = _learnCard.id.did();

            if (oldDid !== newDid) {
                if (automaticallyAssociateDids) {
                    await loadDids(client);

                    if (!dids.includes(newDid)) {
                        const presentation = await _learnCard.invoke.getDidAuthVp();

                        await client.user.addDid.mutate({ presentation });

                        if (newDid.split(':')[1] === 'web') {
                            await client.user.setPrimaryDid.mutate({ presentation });
                        }

                        dids = await client.user.getDids.query();
                    }
                }

                client = await getLearnCloudClient(url, _learnCard);
            }

            learnCard = _learnCard;

            return client;
        });

        updateQueue = update.then(
            () => undefined,
            () => undefined
        );

        return update;
    };

    return {
        name: 'LearnCloud',
        displayName: 'LearnCloud',
        description: 'LearnCloud Integration',
        methods: {
            learnCloudCreate: async (_learnCard, document) => {
                const currentClient = await updateLearnCard(_learnCard);

                const item = await generateEncryptedRecord(
                    _learnCard,
                    document,
                    unencryptedCustomFields
                );

                return currentClient.customStorage.create.mutate({
                    item: await generateJWE(
                        _learnCard,
                        await getLearnCloudDid(currentClient),
                        item
                    ),
                });
            },
            learnCloudCreateMany: async (_learnCard, documents) => {
                const currentClient = await updateLearnCard(_learnCard);

                const items = await Promise.all(
                    documents.map(async document =>
                        generateEncryptedRecord(_learnCard, document, unencryptedCustomFields)
                    )
                );

                return currentClient.customStorage.createMany.mutate({
                    items: await generateJWE(
                        _learnCard,
                        await getLearnCloudDid(currentClient),
                        items
                    ),
                });
            },
            learnCloudRead: async (_learnCard, query, includeAssociatedDids) => {
                await updateLearnCard(_learnCard);

                const documents: Record<string, any>[] = [];

                let result = await _learnCard.invoke.learnCloudReadPage(
                    query,
                    {},
                    includeAssociatedDids
                );

                documents.push(...result.records);

                while (result.hasMore) {
                    result = await _learnCard.invoke.learnCloudReadPage(
                        query,
                        {},
                        includeAssociatedDids
                    );

                    documents.push(...result.records);
                }

                return documents;
            },
            learnCloudReadPage: async (
                _learnCard,
                query,
                paginationOptions,
                includeAssociatedDids
            ) => {
                const currentClient = await updateLearnCard(_learnCard);

                if (!query) {
                    const jwe: JWE = (await currentClient.customStorage.read.query({
                        includeAssociatedDids,
                        ...paginationOptions,
                    })) as any;

                    const encryptedRecords = isEncrypted(jwe)
                        ? await decryptJWE<PaginatedEncryptedRecordsType>(_learnCard, jwe)
                        : (jwe as PaginatedEncryptedRecordsType);

                    return {
                        ...encryptedRecords,
                        records: await Promise.all(
                            encryptedRecords.records.map(async record => ({
                                ...(await decryptJWE<CredentialRecord>(
                                    _learnCard,
                                    record.encryptedRecord
                                )),
                                _id: record._id,
                            }))
                        ),
                    };
                }

                const fields = await generateEncryptedFieldsArray(_learnCard, query, [
                    ...unencryptedCustomFields,
                    '_id',
                ]);

                const unencryptedEntries = Object.fromEntries(
                    Object.entries(query).filter(([key]) =>
                        [...unencryptedCustomFields, '_id'].includes(key)
                    )
                );

                const jwe: JWE = (await currentClient.customStorage.read.query({
                    query: await generateJWE(_learnCard, await getLearnCloudDid(currentClient), {
                        ...unencryptedEntries,
                        ...(fields.length > 0 ? { fields: { $in: fields } } : {}),
                    }),
                    ...paginationOptions,
                    includeAssociatedDids,
                })) as any;

                const encryptedRecords = isEncrypted(jwe)
                    ? await decryptJWE<PaginatedEncryptedRecordsType>(_learnCard, jwe)
                    : (jwe as PaginatedEncryptedRecordsType);

                return {
                    ...encryptedRecords,
                    records: await Promise.all(
                        encryptedRecords.records.map(async record => ({
                            ...(await decryptJWE<CredentialRecord>(
                                _learnCard,
                                record.encryptedRecord
                            )),
                            _id: record._id,
                        }))
                    ),
                };
            },
            learnCloudCount: async (_learnCard, query, includeAssociatedDids) => {
                const currentClient = await updateLearnCard(_learnCard);

                if (!query)
                    return currentClient.customStorage.count.query({ includeAssociatedDids });

                const fields = await generateEncryptedFieldsArray(_learnCard, query, [
                    ...unencryptedCustomFields,
                    '_id',
                ]);

                const unencryptedEntries = Object.fromEntries(
                    Object.entries(query).filter(([key]) =>
                        [...unencryptedCustomFields, '_id'].includes(key)
                    )
                );

                return currentClient.customStorage.count.query({
                    query: await generateJWE(_learnCard, await getLearnCloudDid(currentClient), {
                        ...unencryptedEntries,
                        ...(fields.length > 0 ? { fields: { $in: fields } } : {}),
                    }),
                    includeAssociatedDids,
                });
            },
            learnCloudUpdate: async (_learnCard, query, update) => {
                const currentClient = await updateLearnCard(_learnCard);

                const documents = await _learnCard.invoke.learnCloudRead(query);

                const updates = await Promise.all(
                    documents.map(async document =>
                        currentClient.customStorage.update.mutate({
                            query: await generateJWE(
                                _learnCard,
                                await getLearnCloudDid(currentClient),
                                {
                                    _id: document._id,
                                }
                            ),
                            update: await generateJWE(
                                _learnCard,
                                await getLearnCloudDid(currentClient),
                                await generateEncryptedRecord(
                                    _learnCard,
                                    { ...document, ...update },
                                    unencryptedCustomFields
                                )
                            ),
                        })
                    )
                );

                return updates.reduce((sum, current) => current + sum, 0);
            },
            learnCloudDelete: async (_learnCard, query, includeAssociatedDids) => {
                const currentClient = await updateLearnCard(_learnCard);

                if (!query)
                    return currentClient.customStorage.delete.mutate({ includeAssociatedDids });

                const fields = await generateEncryptedFieldsArray(_learnCard, query, [
                    ...unencryptedCustomFields,
                    '_id',
                ]);

                const unencryptedEntries = Object.fromEntries(
                    Object.entries(query).filter(([key]) =>
                        [...unencryptedCustomFields, '_id'].includes(key)
                    )
                );

                return currentClient.customStorage.delete.mutate({
                    query: await generateJWE(_learnCard, await getLearnCloudDid(currentClient), {
                        ...unencryptedEntries,
                        ...(fields.length > 0 ? { fields: { $in: fields } } : {}),
                    }),
                    includeAssociatedDids,
                });
            },
            learnCloudBatchResolve: async (_learnCard, uris) => {
                const currentClient = await updateLearnCard(_learnCard);
                const results = await currentClient.storage.batchResolve.query({ uris });

                return Promise.all(
                    results.map(async result => {
                        if (!result) return null;

                        try {
                            const decryptedResult = await _learnCard.invoke.decryptDagJwe(result);

                            const parsed = await VCValidator.or(VPValidator)
                                .or(StoredCredentialEnvelopeValidator)
                                .parseAsync(decryptedResult);

                            const resolved = resolveStorageReadResult(parsed);
                            return resolved === undefined || isStoredCredentialEnvelope(resolved)
                                ? null
                                : resolved;
                        } catch (error) {
                            _learnCard.debug?.(error);

                            return null;
                        }
                    })
                );
            },
        },
        read: {
            get: async (_learnCard, uri) => {
                _learnCard.debug?.('LearnCloud read.get', uri);

                if (!uri) return undefined;
                const currentClient = await updateLearnCard(_learnCard);

                const parts = uri.split(':');

                _learnCard.debug?.('LearnCloud read.get parts:', parts);

                if (parts.length !== 5) return undefined;

                const [lc, method, uriUrl] = parts as [string, string, string, string, string];

                if (lc !== 'lc' || method !== 'cloud') {
                    _learnCard.debug?.('LearnCloud read.get not cloud URI!', { lc, method });

                    return undefined;
                }

                if (
                    uriUrl.replace(/https?:\/\//g, '') !==
                    url.replace(/https?:\/\//g, '').replace(/:/g, '%3A')
                ) {
                    const fullUrl = (
                        uriUrl.startsWith('http')
                            ? uriUrl
                            : `http${
                                  uriUrl.includes('http') || uriUrl.includes('localhost') ? '' : 's'
                              }://${uriUrl}`
                    ).replaceAll('%3A', ':');

                    _learnCard.debug?.('LearnCloud read.get different LearnCloud!', {
                        uriUrl,
                        url,
                        fullUrl,
                        comparison: {
                            a: uriUrl.replace(/https?:\/\//g, ''),
                            b: url.replace(/https?:\/\//g, '').replace(/:/g, '%3A'),
                        },
                    });

                    const otherClient = await getOtherClient(fullUrl, _learnCard);

                    try {
                        const result = await otherClient.storage.resolve.query({ uri: uri });

                        _learnCard.debug?.('LearnCloud read.get result', result);

                        const decryptedResult = await _learnCard.invoke.decryptDagJwe(result);

                        _learnCard.debug?.('LearnCloud read.get decryptedResult', decryptedResult);

                        const parsed = await VCValidator.or(VPValidator)
                            .or(StoredCredentialEnvelopeValidator)
                            .parseAsync(decryptedResult);
                        return resolveStorageReadResult(parsed);
                    } catch (error) {
                        _learnCard.debug?.(error);
                        return undefined;
                    }
                }

                try {
                    const result = await currentClient.storage.resolve.query({ uri });

                    _learnCard.debug?.('LearnCloud read.get result', result);

                    const decryptedResult = await _learnCard.invoke.decryptDagJwe(result);

                    _learnCard.debug?.('LearnCloud read.get decryptedResult', decryptedResult);

                    const parsed = await VCValidator.or(VPValidator)
                        .or(StoredCredentialEnvelopeValidator)
                        .parseAsync(decryptedResult);
                    return resolveStorageReadResult(parsed);
                } catch (error) {
                    _learnCard.debug?.(error);
                    return undefined;
                }
            },
        },
        store: {
            upload: async (_learnCard, credential) => {
                _learnCard.debug?.("learnCard.store['LearnCard Network'].upload");
                const currentClient = await updateLearnCard(_learnCard);

                return currentClient.storage.store.mutate({
                    item: normalizeEnvelopeForTransport(credential),
                });
            },
            uploadEncrypted: async (
                _learnCard,
                credential,
                { recipients = [] } = { recipients: [] }
            ) => {
                _learnCard.debug?.("learnCard.store['LearnCard Network'].upload");
                const currentClient = await updateLearnCard(_learnCard);

                const jwe = await _learnCard.invoke.createDagJwe(
                    normalizeEnvelopeForTransport(credential),
                    [_learnCard.id.did(), ...recipients]
                );

                return currentClient.storage.store.mutate({ item: jwe });
            },
            delete: async (_learnCard, uri) => {
                _learnCard.debug?.("learnCard.store['LearnCloud'].delete", { uri });
                const currentClient = await updateLearnCard(_learnCard);

                let deleted = false;

                try {
                    deleted = Boolean(await currentClient.storage.delete.mutate({ uri }));
                } catch (error) {
                    _learnCard.debug?.('LearnCloud store.delete storage.delete failed', error);
                }

                if (!deleted) return false;

                try {
                    const records = await _learnCard.index.LearnCloud.get({ uri });
                    for (const record of records) {
                        await _learnCard.index.LearnCloud.remove(record.id, {
                            cache: 'skip-cache',
                        });
                    }
                } catch (error) {
                    _learnCard.debug?.('LearnCloud store.delete index cleanup failed', error);
                }

                return true;
            },
        },
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
                const currentClient = await updateLearnCard(_learnCard);

                _learnCard.debug?.('LearnCloud index.getPaginated', query, paginationOptions);

                const options = {
                    ...paginationOptions,
                    sort: ['newestFirst', 'oldestFirst'].includes(paginationOptions?.sort ?? '')
                        ? (paginationOptions?.sort as 'newestFirst' | 'oldestFirst')
                        : undefined,
                };

                if (!query) {
                    _learnCard.debug?.('LearnCloud index.get (no query)');
                    const jwe: JWE = (await currentClient.index.get.query(options)) as any;

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
                    query,
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

                const jwe: JWE = (await currentClient.index.get.query({
                    query: await generateJWE(_learnCard, await getLearnCloudDid(currentClient), {
                        ...unencryptedEntries,
                        ...(fields.length > 0 ? { fields: { $in: fields } } : {}),
                    }),
                    ...options,
                })) as any;

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
            getCount: async (_learnCard, query) => {
                const currentClient = await updateLearnCard(_learnCard);

                if (!query) {
                    _learnCard.debug?.('LearnCloud index.count (no query)');
                    const jwe = await currentClient.index.count.query();

                    _learnCard.debug?.('LearnCloud index.count (no query response)', jwe);

                    const count = isEncrypted(jwe as any)
                        ? await decryptJWE<number>(_learnCard, jwe as JWE)
                        : (jwe as number);

                    _learnCard.debug?.('LearnCloud index.count (no query count)', count);

                    return count;
                }

                _learnCard.debug?.('LearnCloud index.getCount (query)');

                const fields = await generateEncryptedFieldsArray(
                    _learnCard,
                    query,
                    unencryptedFields
                );

                _learnCard.debug?.('LearnCloud index.getCount (query fields)', fields);

                const unencryptedEntries = Object.fromEntries(
                    Object.entries(query).filter(([key]) => unencryptedFields.includes(key))
                );

                _learnCard.debug?.(
                    'LearnCloud index.getCount (query unencryptedEntries)',
                    unencryptedEntries
                );

                const jwe = await currentClient.index.count.query({
                    query: await generateJWE(_learnCard, await getLearnCloudDid(currentClient), {
                        ...unencryptedEntries,
                        ...(fields.length > 0 ? { fields: { $in: fields } } : {}),
                    }),
                });

                _learnCard.debug?.('LearnCloud index.count (query response)', jwe);

                const count = isEncrypted(jwe as any)
                    ? await decryptJWE<number>(_learnCard, jwe as JWE)
                    : (jwe as number);

                _learnCard.debug?.('LearnCloud index.count (query count)', count);

                return count;
            },
            add: async (_learnCard, record) => {
                const currentClient = await updateLearnCard(_learnCard);

                const id = record.id || _learnCard.invoke.crypto().randomUUID();

                return currentClient.index.add.mutate({
                    record: await generateJWE(_learnCard, await getLearnCloudDid(currentClient), {
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
                const currentClient = await updateLearnCard(_learnCard);

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

                        return currentClient.index.addMany.mutate({
                            records: await generateJWE(
                                _learnCard,
                                await getLearnCloudDid(currentClient),
                                records
                            ),
                        });
                    })
                );

                return results.every(Boolean);
            },
            update: async (_learnCard, id, updates) => {
                const currentClient = await updateLearnCard(_learnCard);

                const records = await _learnCard.index.LearnCloud.get({ id });

                if (records.length !== 1) return false;

                const record = records[0];

                const newRecord = { ...record, ...updates };

                return currentClient.index.update.mutate({
                    id: await hash(_learnCard, id),
                    updates: await generateJWE(
                        _learnCard,
                        await getLearnCloudDid(currentClient),
                        await generateEncryptedRecord(_learnCard, newRecord, unencryptedFields)
                    ),
                });
            },
            remove: async (_learnCard, id) => {
                const currentClient = await updateLearnCard(_learnCard);

                return currentClient.index.remove.mutate({ id: await hash(_learnCard, id) });
            },
            removeAll: async _learnCard => {
                const currentClient = await updateLearnCard(_learnCard);

                return currentClient.index.removeAll.mutate();
            },
        },
    };
};
