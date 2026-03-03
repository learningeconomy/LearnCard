import { LearnCard } from '@learncard/core';
import { CredentialRecord } from '@learncard/types';
import { stringify } from 'learn-card-base/helpers/jsonHelpers';
import {
    ensureCredentialCacheTableExists,
    ensureCredentialsTableExists,
    ensureIndexCacheTableExists,
    ensureIndexCountCacheTableExists,
    ensureIndexPageCacheTableExists,
    ensureIndexTableExists,
} from 'learn-card-base/hooks/useSQLiteStorage';
import sqliteStore from 'learn-card-base/stores/sqliteStore';
import { SQLitePlugin, SQLitePluginDependentMethods } from './types';

export const getSQLitePlugin = async (
    learnCard: LearnCard<any, 'id', SQLitePluginDependentMethods>
): Promise<SQLitePlugin> => {
    const getIndex = async (
        _learnCard: LearnCard<any, 'id', SQLitePluginDependentMethods>
    ): Promise<CredentialRecord[]> => {
        // TODO: Add query support
        const db = sqliteStore.get.db();

        if (!db) return [];

        await ensureIndexTableExists(db);
        await db.open();

        const result = await db.query(
            `SELECT * FROM indexRecords WHERE did="${learnCard.id.did()}";`
        );

        await db.close();

        if (result.values?.length === 0) return [];

        const encryptedRecords = JSON.parse(result.values![0].records);

        return _learnCard.invoke.decryptDagJwe(encryptedRecords) as any;
    };

    const upsertIndex = async (
        _learnCard: LearnCard<any, 'id', SQLitePluginDependentMethods>,
        records: CredentialRecord[]
    ) => {
        const db = sqliteStore.get.db();

        if (!db) return false;

        await ensureIndexTableExists(db);
        await db.open();

        const encryptedRecords = await _learnCard.invoke.createDagJwe(records, [
            _learnCard.id.did(),
        ]);

        const result = await db.execute(
            `INSERT INTO indexRecords (did, records) VALUES ('${learnCard.id.did()}', '${JSON.stringify(
                encryptedRecords
            )}')
                ON CONFLICT (did) DO UPDATE SET records=excluded.records;`
        );

        await db.close();

        return (result.changes?.changes ?? 0) > 0;
    };

    return {
        name: 'SQLite',
        displayName: 'SQLite',
        description: 'Stores Credentials/Index locally using SQLite',
        methods: {},
        read: {
            get: async (_learnCard, uri) => {
                _learnCard.debug?.('sqlite:read:get', uri);

                if (!uri) return undefined;

                const [_lc, method, id] = uri.split(':');

                if (method !== 'sqlite') return undefined;

                const db = sqliteStore.get.db();

                if (!db) return undefined;

                await ensureCredentialsTableExists(db);
                await db.open();

                const result = await db.query(`SELECT * FROM credentials WHERE id="${id}";`);

                await db.close();

                if (result.values?.length === 0) return undefined;

                const encryptedVc = JSON.parse(result.values![0].credential);

                return _learnCard.invoke.decryptDagJwe(encryptedVc) as any;
            },
        },
        store: {
            upload: async (_learnCard, vc) => {
                _learnCard.debug?.('sqlite:store:upload', vc);

                const db = sqliteStore.get.db();

                if (!db) throw new Error('SQLite unavailable');

                await ensureCredentialsTableExists(db);
                await db.open();

                const encryptedVc = await _learnCard.invoke.createDagJwe(vc, [_learnCard.id.did()]);

                const result = await db.execute(
                    `INSERT INTO credentials (credential) VALUES ('${JSON.stringify(
                        encryptedVc
                    )}');`
                );

                await db.close();

                if (result.changes?.changes) return `lc:sqlite:${result.changes.lastId}`;

                throw new Error('Could not get ID From SQLite');
            },
            uploadEncrypted: async (_learnCard, vc, params) => {
                _learnCard.debug?.('sqlite:store:uploadEncrypted', vc);

                const db = sqliteStore.get.db();

                if (!db) throw new Error('SQLite unavailable');

                await ensureCredentialsTableExists(db);
                await db.open();

                const encryptedVc = await _learnCard.invoke.createDagJwe(vc, [
                    _learnCard.id.did(),
                    ...(params?.recipients ?? []),
                ]);

                const result = await db.execute(
                    `INSERT INTO credentials (credential) VALUES ('${JSON.stringify(
                        encryptedVc
                    )}');`
                );

                await db.close();

                if (result.changes?.changes) return `lc:sqlite:${result.changes.lastId}`;

                throw new Error('Could not get ID From SQLite');
            },
        },
        index: {
            get: async (_learnCard, _query) => {
                _learnCard.debug?.('sqlite:index:get', _query);

                return getIndex(_learnCard);
            },
            add: async (_learnCard, record) => {
                _learnCard.debug?.('sqlite:index:add', record);

                const records = await getIndex(_learnCard);

                return upsertIndex(_learnCard, [...records, record]);
            },
            addMany: async (_learnCard, records) => {
                _learnCard.debug?.('sqlite:index:addMany', records);

                const existingRecords = await getIndex(_learnCard);

                return upsertIndex(_learnCard, [...existingRecords, ...records]);
            },
            update: async () => false, // TODO: Implement
            remove: async (_learnCard, id) => {
                _learnCard.debug?.('sqlite:index:remove', id);

                const records = await getIndex(_learnCard);

                return upsertIndex(
                    _learnCard,
                    records.filter(record => record.id !== id)
                );
            },
            removeAll: async _learnCard => {
                _learnCard.debug?.('sqlite:index:removeAll');

                const db = sqliteStore.get.db();

                if (!db) return false;

                await ensureIndexTableExists(db);
                await db.open();

                const result = await db.execute(
                    `DELETE FROM indexRecords WHERE did='${learnCard.id.did()}';`
                );

                await db.close();

                return (result.changes?.changes ?? 0) > 0;
            },
        },
        cache: {
            getVc: async (_learnCard, uri) => {
                _learnCard.debug?.('sqlite:cache:getVc', uri);

                if (!uri) return undefined;

                const db = sqliteStore.get.db();

                if (!db) return undefined;

                await ensureCredentialCacheTableExists(db);
                await db.open();

                const result = await db.query(`SELECT * FROM credentialsCache WHERE uri="${uri}";`);

                await db.close();

                if (result.values?.length === 0) return undefined;

                return JSON.parse(result.values![0].credential);
            },
            setVc: async (_learnCard, uri, vc) => {
                _learnCard.debug?.('sqlite:cache:setVc', uri, vc);

                const db = sqliteStore.get.db();

                if (!db) return false;

                await ensureCredentialCacheTableExists(db);
                await db.open();

                const result = await db.execute(
                    `INSERT INTO credentialsCache (uri, credential) VALUES ('${uri}', '${JSON.stringify(
                        vc
                    )}')
                        ON CONFLICT (uri) DO UPDATE SET credential=excluded.credential;`
                );

                await db.close();

                return !!result.changes?.changes;
            },
            flushVc: async _learnCard => {
                _learnCard.debug?.('sqlite:cache:flushVc');

                const db = sqliteStore.get.db();

                if (!db) return false;

                await ensureCredentialCacheTableExists(db);
                await db.open();

                const result = await db.execute(`DELETE FROM credentialsCache;`);

                await db.close();

                return !!result.changes?.changes;
            },
            getIndex: async (_learnCard, name, query) => {
                _learnCard.debug?.('sqlite:cache:getIndex', name, query);

                if (!name) return undefined;

                const db = sqliteStore.get.db();

                if (!db) return undefined;

                await ensureIndexCacheTableExists(db);
                await db.open();

                const result = await db.query(
                    `SELECT * FROM indexCache WHERE did='${learnCard.id.did()}' AND name='${name}' AND indexQuery='${stringify(
                        query
                    )}';`
                );

                await db.close();

                if (result.values?.length === 0) return undefined;

                return JSON.parse(result.values![0].records);
            },
            setIndex: async (_learnCard, name, query, records) => {
                _learnCard.debug?.('sqlite:cache:setIndex', name, query, records);

                const db = sqliteStore.get.db();

                if (!db) return false;

                await ensureIndexCacheTableExists(db);
                await db.open();

                const result = await db.execute(
                    `INSERT INTO indexCache (did, name, indexQuery, records) VALUES ('${learnCard.id.did()}', '${name}', '${stringify(
                        query
                    )}', '${JSON.stringify(records)} ')
                        ON CONFLICT(did, name, indexQuery) DO UPDATE SET records=excluded.records; `
                );

                await db.close();

                return !!result.changes?.changes;
            },
            getIndexPage: async (_learnCard, name, query, paginationOptions) => {
                _learnCard.debug?.('sqlite:cache:getIndexPage', name, query, paginationOptions);

                if (!name) return undefined;

                const db = sqliteStore.get.db();

                if (!db) return undefined;

                await ensureIndexPageCacheTableExists(db);
                await db.open();

                const result = await db.query(
                    `SELECT * FROM indexPageCache WHERE did='${learnCard.id.did()}' AND name='${name}' AND indexQuery='${stringify(
                        query
                    )}' AND paginationOptions='${stringify(paginationOptions)}';`
                );

                await db.close();

                if (result.values?.length === 0) return undefined;

                return JSON.parse(result.values![0].result);
            },
            setIndexPage: async (_learnCard, name, query, result, paginationOptions) => {
                _learnCard.debug?.(
                    'sqlite:cache:setIndexPage',
                    name,
                    query,
                    result,
                    paginationOptions
                );

                const db = sqliteStore.get.db();

                if (!db) return false;

                await ensureIndexPageCacheTableExists(db);
                await db.open();

                const results = await db.execute(
                    `INSERT INTO indexPageCache (did, name, indexQuery, paginationOptions, result) VALUES ('${learnCard.id.did()}', '${name}', '${stringify(
                        query
                    )}', '${stringify(paginationOptions)}', '${stringify(result)} ')
                        ON CONFLICT(did, name, indexQuery, paginationOptions) DO UPDATE SET result=excluded.result; `
                );

                await db.close();

                return !!results.changes?.changes;
            },
            getIndexCount: async (_learnCard, name, query) => {
                _learnCard.debug?.('sqlite:cache:getIndexCount', name, query);

                if (!name) return undefined;

                const db = sqliteStore.get.db();

                if (!db) return undefined;

                await ensureIndexCountCacheTableExists(db);
                await db.open();

                const result = await db.query(
                    `SELECT * FROM indexCountCache WHERE did='${learnCard.id.did()}' AND name='${name}' AND indexQuery='${stringify(
                        query
                    )}';`
                );

                await db.close();

                if (result.values?.length === 0) return undefined;

                return JSON.parse(result.values![0].count);
            },
            setIndexCount: async (_learnCard, name, query, count) => {
                _learnCard.debug?.('sqlite:cache:setIndexCount', name, query, count);

                const db = sqliteStore.get.db();

                if (!db) return false;

                await ensureIndexCountCacheTableExists(db);
                await db.open();

                const result = await db.execute(
                    `INSERT INTO indexCountCache (did, name, indexQuery, count) VALUES ('${learnCard.id.did()}', '${name}', '${stringify(
                        query
                    )}', ${count})
                        ON CONFLICT(did, name, indexQuery) DO UPDATE SET count=excluded.count; `
                );

                await db.close();

                return !!result.changes?.changes;
            },
            flushIndex: async _learnCard => {
                _learnCard.debug?.('sqlite:cache:flushIndex');

                const db = sqliteStore.get.db();

                if (!db) return false;

                await ensureIndexCacheTableExists(db);
                await ensureIndexPageCacheTableExists(db);
                await ensureIndexCountCacheTableExists(db);
                await db.open();

                const indexResult = await db.execute(
                    `DELETE FROM indexCache WHERE did='${learnCard.id.did()}';`
                );
                const pageResult = await db.execute(
                    `DELETE FROM indexPageCache WHERE did='${learnCard.id.did()}';`
                );
                const countResult = await db.execute(
                    `DELETE FROM indexCountCache WHERE did='${learnCard.id.did()}';`
                );

                await db.close();

                return Boolean(
                    indexResult.changes?.changes ||
                    pageResult.changes?.changes ||
                    countResult.changes?.changes
                );
            },
        },
    };
};
