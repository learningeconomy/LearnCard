import React, { useEffect, useState } from 'react';
import { SQLiteHook, useSQLite } from 'learn-card-base/react-sqlite-hook';
import { SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { UserInfo } from '@web3auth/base';
import { Capacitor } from '@capacitor/core';

import { CurrentUser } from 'learn-card-base';

import { sqliteStore } from '../stores/sqliteStore';
import { markSQLiteReady } from 'learn-card-base/SQL/sqliteReady';
// import { MIGRATIONS, performSqliteMigrations } from 'learn-card-base/SQL/migrations';

export const ensureUserTableExists = async (db: SQLiteDBConnection) => {
    await db.open();

    const usersTableExists = await db.isTable('users');

    if (!usersTableExists.result) {
        await db.execute(`
                    CREATE TABLE users( 
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
                `);
    }

    const tokensTableExists = await db.isTable('tokens');

    if (!tokensTableExists.result) {
        await db.execute(`
                    CREATE TABLE tokens( 
                        authProviderName TEXT, 
                        token TEXT
                    );
                `);
    }

    await db.close();
};

export const ensureReactQueryTableExists = async (db: SQLiteDBConnection) => {
    await db.open();

    const tableExists = await db.isTable('reactQuery');

    if (!tableExists.result) {
        // create tables in db
        await db.execute(`
                    CREATE TABLE reactQuery( 
                        id TEXT PRIMARY KEY,
                        cache TEXT
                    );
                `);
    }
    await db.close();
};

export const ensureCredentialsTableExists = async (db: SQLiteDBConnection) => {
    await db.open();

    const tableExists = await db.isTable('credentials');

    if (!tableExists.result) {
        // create tables in db
        await db.execute(`
                    CREATE TABLE credentials( 
                        id INTEGER PRIMARY KEY,
                        credential TEXT
                    );
                `);
    }
    await db.close();
};

export const ensureIndexTableExists = async (db: SQLiteDBConnection) => {
    await db.open();

    const tableExists = await db.isTable('indexRecords');

    if (!tableExists.result) {
        // create tables in db
        await db.execute(`
                    CREATE TABLE indexRecords( 
                        did TEXT PRIMARY KEY,
                        records TEXT
                    );
                `);
    }
    await db.close();
};

export const ensureCredentialCacheTableExists = async (db: SQLiteDBConnection) => {
    await db.open();

    const tableExists = await db.isTable('credentialsCache');

    if (!tableExists.result) {
        // create tables in db
        await db.execute(`
                    CREATE TABLE credentialsCache( 
                        uri TEXT PRIMARY KEY,
                        credential TEXT
                    );
                `);
    }
    await db.close();
};

export const ensureIndexCacheTableExists = async (db: SQLiteDBConnection) => {
    await db.open();

    const tableExists = await db.isTable('indexCache');

    if (!tableExists.result) {
        // create tables in db
        await db.execute(`
                    CREATE TABLE indexCache( 
                        did TEXT NOT NULL,
                        name TEXT NOT NULL,
                        indexQuery TEXT,
                        records TEXT,
                        PRIMARY KEY (did, name, indexQuery)
                    );
                `);
    }
    await db.close();
};

export const ensureIndexPageCacheTableExists = async (db: SQLiteDBConnection) => {
    await db.open();

    const tableExists = await db.isTable('indexPageCache');

    if (!tableExists.result) {
        // create tables in db
        await db.execute(`
                    CREATE TABLE indexPageCache( 
                        did TEXT NOT NULL,
                        name TEXT NOT NULL,
                        indexQuery TEXT,
                        paginationOptions TEXT,
                        result TEXT,
                        PRIMARY KEY (did, name, indexQuery, paginationOptions)
                    );
                `);
    }
    await db.close();
};

export const ensureIndexCountCacheTableExists = async (db: SQLiteDBConnection) => {
    await db.open();

    const tableExists = await db.isTable('indexCountCache');

    if (!tableExists.result) {
        // create tables in db
        await db.execute(`
                    CREATE TABLE indexCountCache( 
                        did TEXT NOT NULL,
                        name TEXT NOT NULL,
                        indexQuery TEXT,
                        count INTEGER,
                        PRIMARY KEY (did, name, indexQuery)
                    );
                `);
    }
    await db.close();
};

export const ensureWriteAheadLogging = async (db: SQLiteDBConnection) => {
    await db.open();

    await db.execute('PRAGMA journal_mode = WAL;', false);

    await db.close();
};

export const sqliteInit = () => {
    const nativeSqlite = useSQLite();
    const webSqlite = sqliteStore.use.sqlite();

    const [existingConnection, setExistConnection] = useState(false);

    useEffect(() => {
        try {
            if (nativeSqlite.isAvailable) {
                const sqlite = Capacitor.getPlatform() === 'web' ? webSqlite : nativeSqlite;
                initDB(sqlite).then(db => {
                    sqliteStore.set.db(db);
                    sqliteStore.set.sqlite(sqlite);
                    
                    // Mark SQLite as ready so wallet initialization can proceed
                    try {
                        markSQLiteReady();
                    } catch (e) {
                        console.warn('markSQLiteReady (native) failed', e);
                    }
                }).catch(error => {
                    console.error('Failed to initialize SQLite database:', error);
                    // Mark ready even on error so app doesn't hang
                    try {
                        markSQLiteReady();
                    } catch (e) {
                        console.warn('markSQLiteReady (native, on error) failed', e);
                    }
                });
            } else {
                nativeSqlite.getPlatform().then(async (ret: { platform: string }) => {
                    console.debug('\n* Not available for ' + ret.platform + ' platform *\n');
                });
            }
        } catch (error) {
            console.warn(error);
            // Mark ready on exception to prevent app from hanging
            try {
                markSQLiteReady();
            } catch (e) {
                console.warn('markSQLiteReady (native, on exception) failed', e);
            }
        }
    }, [nativeSqlite.isAvailable]);

    const initDB = async (sqlite: SQLiteConnection | SQLiteHook | null): Promise<any> => {
        try {
            // await performSqliteMigrations(sqlite);

            const isDBConnected = (await sqlite?.isConnection('learncardDB', false))?.result;

            let db: SQLiteDBConnection;

            const ret = await sqlite?.checkConnectionsConsistency();

            // initialize the connection
            if (isDBConnected && ret?.result) {
                db = await sqlite!.retrieveConnection('learncardDB', false);
            } else {
                db = await sqlite!.createConnection(
                    'learncardDB',
                    false,
                    'no-encryption',
                    1,
                    false
                );
            }
            await ensureUserTableExists(db);
            await ensureCredentialsTableExists(db);
            await ensureIndexTableExists(db);
            await ensureCredentialCacheTableExists(db);
            await ensureIndexCacheTableExists(db);
            await ensureIndexPageCacheTableExists(db);
            await ensureIndexCountCacheTableExists(db);

            setExistConnection(true);
            return db;
        } catch (error) {
            console.warn('initDB::error', (error as any).message);
            return false;
        }
    };

    return {
        existingConnection,
        setExistConnection,
    };
};

export const useSQLiteStorage = () => {
    const db = sqliteStore.use.db();

    const setCurrentUser = async (currentUser: Partial<CurrentUser> | null) => {
        try {
            if (!currentUser) return;
            if (db) {
                await ensureUserTableExists(db);
                await db.open();
                // query user using stable identifiers (uid -> verifierId -> email)
                let userExists;
                if (currentUser?.uid) {
                    userExists = await db.query(
                        `SELECT * FROM users WHERE uid="${currentUser.uid}"`
                    );
                } else if ((currentUser as Partial<UserInfo>)?.verifierId) {
                    userExists = await db.query(
                        `SELECT * FROM users WHERE verifierId="${
                            (currentUser as Partial<UserInfo>).verifierId
                        }"`
                    );
                } else if (currentUser?.email) {
                    userExists = await db.query(
                        `SELECT * FROM users WHERE email="${currentUser.email}"`
                    );
                } else {
                    userExists = { values: [] } as any;
                }

                // check if user already exists
                if (userExists.values?.length === 0) {
                    await db.execute(`INSERT INTO users (
                        email,
                        name,
                        profileImage,
                        aggregateVerifier,
                        verifier,
                        verifierId,
                        typeOfLogin,
                        dappShare,
                        baseColor,
                        uid,
                        phoneNumber
                    ) VALUES (
                        '${currentUser.email ?? ''}',
                        '${currentUser.name ?? ''}',
                        '${currentUser.profileImage ?? ''}',
                        '${(currentUser as Partial<UserInfo>).aggregateVerifier ?? ''}',
                        '${(currentUser as Partial<UserInfo>).verifier ?? ''}',
                        '${(currentUser as Partial<UserInfo>).verifierId ?? ''}',
                        '${(currentUser as Partial<UserInfo>).typeOfLogin ?? ''}',
                        '${(currentUser as Partial<UserInfo>).dappShare ?? ''}',
                        '${currentUser.baseColor ?? ''}',
                        '${(currentUser as any).uid ?? currentUser?.uid ?? ''}',
                        '${(currentUser as any).phoneNumber ?? ''}'
                    )`);
                } else {
                }
                await db.close();
            }
        } catch (e) {
            console.warn('😵 useSQLiteStorage::setCurrentUser', e);
        } finally {
            if (db && (await db?.isDBOpen())?.result) {
                await db?.close();
            }
        }
        //     }
        // }
    };

    const getCurrentUser = async (): Promise<CurrentUser | null> => {
        try {
            if (db) {
                await ensureUserTableExists(db);
                await db.open();
                const results = await db.query('SELECT * FROM users');

                await db.close();

                return results?.values?.[0];
            }

            return null;
        } catch (e) {
            console.warn('😵 useSQLiteStorage::getCurrentUser', e);

            return null;
        } finally {
            if (db && (await db?.isDBOpen())?.result) {
                try {
                    await db?.close();
                } catch (closeError) {
                    console.warn(
                        '😵 useSQLiteStorage::getCurrentUser:await db?.close()',
                        closeError
                    );
                    return null;
                }
            }
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
                await ensureUserTableExists(db);
                await db.open();
                if (uid) {
                    await db.execute(`
                        UPDATE users
                        SET 
                        name="${payload.name}",
                        profileImage="${payload.profileImage}"
                        WHERE uid="${uid}"`);
                } else {
                    // Fallback: update existing row(s) if uid is unavailable
                    await db.execute(`
                        UPDATE users
                        SET 
                        name="${payload.name}",
                        profileImage="${payload.profileImage}"`);
                }

                await db.close();

                return;
            }
        } catch (e) {
            console.warn('😵 useSQLiteStorage::getCurrentUser', e);
        } finally {
            if (db && (await db?.isDBOpen())?.result) {
                await db?.close();
            }
        }
    };

    const setProviderAuthToken = async (authProviderName: string | null, token: string | null) => {
        try {
            if (db) {
                await ensureUserTableExists(db);
                await db.open();

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
                    await db.close();
                } else {
                    // no-op
                }
            }
        } catch (e) {
            console.warn('😵 useSQLiteStorage::setProviderAuthToken::error', e);
        } finally {
            if (db && (await db?.isDBOpen())?.result) {
                await db?.close();
            }
        }
    };

    const getProviderAuthToken = async (
        authProviderName: string
    ): Promise<{ authProviderName: string; token: string } | undefined> => {
        try {
            if (db) {
                await ensureUserTableExists(db);
                await db.open();

                const results = await db.query(
                    `SELECT * FROM tokens WHERE authProviderName="${authProviderName}"`
                );

                await db.close();

                return results?.values?.[0];
            }
        } catch (error) {
            console.warn('😵 useSQLiteStorage::getProviderAuthToken::error', error);
        } finally {
            if (db && (await db?.isDBOpen())?.result) {
                await db?.close();
            }
        }
        return undefined;
    };

    const clearDB = async () => {
        try {
            if (db) {
                await db.open();
                await db.query('DELETE FROM users');
                await db.query('DELETE FROM tokens');
                
                // ! hot fix - credentials remained cached & accessible
                // ! to wrong logged in user after logout
                // ! drop DB to ensure data is cleared on logout
                try {
                    await deleteDatabase(db);
                } catch (dropErr) {
                    console.warn('drop DB failed', dropErr);
                    // If delete fails, at least close the db
                    await db.close();
                }

                sqliteStore.set.sqlite(null);
                sqliteStore.set.db(null);
            }
        } catch (e) {
            console.warn('😵 useSQLiteStorage::clearDB', e);
        } finally {
            if (db && (await db?.isDBOpen())?.result) {
                try {
                    await db?.close();
                } catch (closeErr) {
                    console.warn('😵 useSQLiteStorage::clearDB close failed', closeErr);
                }
            }
        }
        // }
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
            return Promise.resolve();
        } else {
            return Promise.resolve();
        }
    } catch (err) {
        return Promise.reject(err);
    }
}

export default useSQLiteStorage;
