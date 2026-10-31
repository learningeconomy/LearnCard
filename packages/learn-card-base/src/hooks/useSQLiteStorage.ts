import {
    withSQLiteDatabase,
    ensureSQLiteSchema,
    forgetSQLiteSchema,
    retainSQLiteConnection,
    releaseSQLiteConnection,
} from 'learn-card-base/SQL/connection';
import { prepareNativeEncryption } from 'learn-card-base/SQL/nativeEncryption';
import React, { useEffect, useState } from 'react';
import { SQLiteHook, useSQLite } from 'learn-card-base/react-sqlite-hook';
import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { UserInfo } from '@web3auth/base';
import { Capacitor } from '@capacitor/core';

import { CurrentUser } from 'learn-card-base';

import { sqliteStore } from '../stores/sqliteStore';
import { markSQLiteReady } from 'learn-card-base/SQL/sqliteReady';
import { clearUserData } from '../SQL/clearUserData';
// import { MIGRATIONS, performSqliteMigrations } from 'learn-card-base/SQL/migrations';

export { clearUserData, PRESERVED_TABLES } from '../SQL/clearUserData';

import { getLogger } from '../logging/logger';
const log = getLogger('use-sqlite-storage');

export const ensureUserTableExists = (db: SQLiteDBConnection): Promise<void> =>
    ensureSQLiteSchema(
        db,
        'ensureUserTableExists',
        `
                    CREATE TABLE IF NOT EXISTS users(
                        email TEXT,
                        name TEXT,
                        profileImage TEXT,
                        aggregateVerifier TEXT,
                        verifier TEXT,
                        verifierId TEXT,
                        typeOfLogin TEXT,
                        dappShare TEXT,
                        privateKey TEXT,
                        baseColor TEXT,
                        uid TEXT,
                        phoneNumber TEXT
                    );

                    CREATE TABLE IF NOT EXISTS tokens(
                        authProviderName TEXT,
                        token TEXT
                    );
`
    );

export const ensureReactQueryTableExists = (db: SQLiteDBConnection): Promise<void> =>
    ensureSQLiteSchema(
        db,
        'ensureReactQueryTableExists',
        `
                    CREATE TABLE IF NOT EXISTS reactQuery(
                        id TEXT PRIMARY KEY,
                        cache TEXT
                    );
`
    );

export const ensureCredentialsTableExists = (db: SQLiteDBConnection): Promise<void> =>
    ensureSQLiteSchema(
        db,
        'ensureCredentialsTableExists',
        `
                    CREATE TABLE IF NOT EXISTS credentials(
                        id INTEGER PRIMARY KEY,
                        credential TEXT
                    );
`
    );

export const ensureIndexTableExists = (db: SQLiteDBConnection): Promise<void> =>
    ensureSQLiteSchema(
        db,
        'ensureIndexTableExists',
        `
                    CREATE TABLE IF NOT EXISTS indexRecords(
                        did TEXT PRIMARY KEY,
                        records TEXT
                    );
`
    );

export const ensureCredentialCacheTableExists = (db: SQLiteDBConnection): Promise<void> =>
    ensureSQLiteSchema(
        db,
        'ensureCredentialCacheTableExists',
        `
                    CREATE TABLE IF NOT EXISTS credentialsCache(
                        uri TEXT PRIMARY KEY,
                        credential TEXT
                    );
`
    );

export const ensureIndexCacheTableExists = (db: SQLiteDBConnection): Promise<void> =>
    ensureSQLiteSchema(
        db,
        'ensureIndexCacheTableExists',
        `
                    CREATE TABLE IF NOT EXISTS indexCache(
                        did TEXT NOT NULL,
                        name TEXT NOT NULL,
                        indexQuery TEXT,
                        records TEXT,
                        PRIMARY KEY (did, name, indexQuery)
                    );
`
    );

export const ensureIndexPageCacheTableExists = (db: SQLiteDBConnection): Promise<void> =>
    ensureSQLiteSchema(
        db,
        'ensureIndexPageCacheTableExists',
        `
                    CREATE TABLE IF NOT EXISTS indexPageCache(
                        did TEXT NOT NULL,
                        name TEXT NOT NULL,
                        indexQuery TEXT,
                        paginationOptions TEXT,
                        result TEXT,
                        PRIMARY KEY (did, name, indexQuery, paginationOptions)
                    );
`
    );

export const ensureIndexCountCacheTableExists = (db: SQLiteDBConnection): Promise<void> =>
    ensureSQLiteSchema(
        db,
        'ensureIndexCountCacheTableExists',
        `
                    CREATE TABLE IF NOT EXISTS indexCountCache(
                        did TEXT NOT NULL,
                        name TEXT NOT NULL,
                        indexQuery TEXT,
                        count INTEGER,
                        PRIMARY KEY (did, name, indexQuery)
                    );
`
    );

export const ensureWriteAheadLogging = async (db: SQLiteDBConnection) => {
    return await withSQLiteDatabase(db, async () => {
        await db.execute('PRAGMA journal_mode = WAL;', false);
    });
};

type NativeDatabase = { db: SQLiteDBConnection; sqlite: SQLiteHook };
let nativeInitialization: Promise<NativeDatabase> | undefined;
const initializeNativeDatabase = async (sqlite: SQLiteHook): Promise<NativeDatabase> => {
    const encrypted = (await prepareNativeEncryption()) === 'encrypted';
    const consistent = (await sqlite.checkConnectionsConsistency()).result;
    const connected = (await sqlite.isConnection('learncardDB', false)).result;
    const db =
        consistent && connected
            ? await sqlite.retrieveConnection('learncardDB', false)
            : await sqlite.createConnection(
                  'learncardDB',
                  encrypted,
                  encrypted ? 'secret' : 'no-encryption',
                  1,
                  false
              );
    retainSQLiteConnection(db);
    try {
        await withSQLiteDatabase(db, async () => {
            await ensureUserTableExists(db);
            await ensureCredentialsTableExists(db);
            await ensureIndexTableExists(db);
            await ensureCredentialCacheTableExists(db);
            await ensureIndexCacheTableExists(db);
            await ensureIndexPageCacheTableExists(db);
            await ensureIndexCountCacheTableExists(db);
            await ensureReactQueryTableExists(db);
        });
    } catch (error) {
        await releaseSQLiteConnection(db).catch(() => undefined);
        await sqlite.closeConnection('learncardDB', false).catch(() => undefined);
        throw error;
    }
    return { db, sqlite };
};
/** Native connection initialization is shared by remounts and account consumers. */
export const sqliteInit = () => {
    const nativeSqlite = useSQLite();
    const [existingConnection, setExistConnection] = useState(false);
    useEffect(() => {
        if (Capacitor.getPlatform() === 'web' || !nativeSqlite.isAvailable) return;
        let stopped = false;
        nativeInitialization ??= initializeNativeDatabase(nativeSqlite).catch(error => {
            nativeInitialization = undefined;
            throw error;
        });
        void nativeInitialization
            .then(({ db, sqlite }) => {
                sqliteStore.set.db(db);
                sqliteStore.set.sqlite(sqlite);
                if (!stopped) setExistConnection(true);
            })
            .catch(error => {
                log.error('Failed to initialize SQLite database:', error);
            })
            .finally(() => {
                // Failure still releases boot waiters; never store a false DB handle.
                markSQLiteReady();
            });
        return () => {
            stopped = true;
        };
        // The first hook owns the connection; later remounts reuse its promise/driver.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nativeSqlite.isAvailable]);
    return { existingConnection, setExistConnection };
};

export const useSQLiteStorage = () => {
    const db = sqliteStore.use.db();

    const setCurrentUser = async (currentUser: Partial<CurrentUser> | null) => {
        try {
            if (!currentUser) return;
            if (db) {
                return await withSQLiteDatabase(db, async () => {
                    await ensureUserTableExists(db);

                    // query user using stable identifiers (uid -> verifierId -> email)
                    let userExists;
                    if (currentUser?.uid) {
                        userExists = await db.query('SELECT * FROM users WHERE uid = ?', [
                            currentUser.uid,
                        ]);
                    } else if ((currentUser as Partial<UserInfo>)?.verifierId) {
                        userExists = await db.query('SELECT * FROM users WHERE verifierId = ?', [
                            (currentUser as Partial<UserInfo>).verifierId,
                        ]);
                    } else if (currentUser?.email) {
                        userExists = await db.query('SELECT * FROM users WHERE email = ?', [
                            currentUser.email,
                        ]);
                    } else {
                        userExists = { values: [] } as any;
                    }

                    // check if user already exists
                    if (userExists.values?.length === 0) {
                        await db.run(
                            `INSERT INTO users (
                            email, name, profileImage, aggregateVerifier, verifier, verifierId,
                            typeOfLogin, dappShare, baseColor, uid, phoneNumber
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                currentUser.email ?? '',
                                currentUser.name ?? '',
                                currentUser.profileImage ?? '',
                                (currentUser as Partial<UserInfo>).aggregateVerifier ?? '',
                                (currentUser as Partial<UserInfo>).verifier ?? '',
                                (currentUser as Partial<UserInfo>).verifierId ?? '',
                                (currentUser as Partial<UserInfo>).typeOfLogin ?? '',
                                (currentUser as Partial<UserInfo>).dappShare ?? '',
                                currentUser.baseColor ?? '',
                                currentUser.uid ?? '',
                                currentUser.phoneNumber ?? '',
                            ]
                        );
                    }
                });
            }
        } catch (e) {
            log.warn('😵 useSQLiteStorage::setCurrentUser', e);
        }
        //     }
        // }
    };

    const getCurrentUser = async (): Promise<CurrentUser | null> => {
        try {
            if (db) {
                return await withSQLiteDatabase(db, async () => {
                    await ensureUserTableExists(db);

                    const results = await db.query('SELECT * FROM users');

                    return results?.values?.[0];
                });
            }

            return null;
        } catch (e) {
            log.warn('😵 useSQLiteStorage::getCurrentUser', e);

            return null;
        }
        // }
        // }
    };

    const updateCurrentUser = async (
        uid: string | null | undefined,
        payload: { name: string; profileImage: string }
    ) => {
        try {
            if (db) {
                return await withSQLiteDatabase(db, async () => {
                    await ensureUserTableExists(db);

                    if (uid) {
                        await db.run('UPDATE users SET name = ?, profileImage = ? WHERE uid = ?', [
                            payload.name,
                            payload.profileImage,
                            uid,
                        ]);
                    } else {
                        // Fallback: update existing row(s) if uid is unavailable.
                        await db.run('UPDATE users SET name = ?, profileImage = ?', [
                            payload.name,
                            payload.profileImage,
                        ]);
                    }

                    return;
                });
            }
        } catch (e) {
            log.warn('useSQLiteStorage::updateCurrentUser', e);
            throw e;
        }
    };

    const setProviderAuthToken = async (authProviderName: string | null, token: string | null) => {
        try {
            if (db) {
                return await withSQLiteDatabase(db, async () => {
                    await ensureUserTableExists(db);

                    // query auth provider
                    const authProviderExists = await db.query(
                        `SELECT * FROM tokens WHERE authProviderName="${authProviderName}"`
                    );

                    if (!authProviderExists.values?.[0]?.token) {
                        await db.execute(`INSERT INTO tokens(
                        authProviderName,
                        token
                    ) VALUES (
                        '${authProviderName}',
                        '${token}'
                    )`);
                    } else {
                        // no-op
                    }
                });
            }
        } catch (e) {
            log.warn('😵 useSQLiteStorage::setProviderAuthToken::error', e);
        }
    };

    const getProviderAuthToken = async (
        authProviderName: string
    ): Promise<{ authProviderName: string; token: string } | undefined> => {
        try {
            if (db) {
                return await withSQLiteDatabase(db, async () => {
                    await ensureUserTableExists(db);

                    const results = await db.query(
                        `SELECT * FROM tokens WHERE authProviderName="${authProviderName}"`
                    );

                    return results?.values?.[0];
                });
            }
        } catch (error) {
            log.warn('😵 useSQLiteStorage::getProviderAuthToken::error', error);
        }
        return undefined;
    };

    const clearDB = async () => {
        if (db) {
            await clearUserData(db);
        }
    };

    return {
        setCurrentUser,
        getCurrentUser,
        updateCurrentUser,
        setProviderAuthToken,
        getProviderAuthToken,
        clearDB,
    };
};

export async function deleteDatabase(db: SQLiteDBConnection): Promise<void> {
    try {
        let ret: any = await db.isExists();
        if (ret.result) {
            const dbName = db.getConnectionDBName();
            await db.delete();
            forgetSQLiteSchema(db);
            return Promise.resolve();
        } else {
            return Promise.resolve();
        }
    } catch (err) {
        return Promise.reject(err);
    }
}

export default useSQLiteStorage;
