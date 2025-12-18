import { useMemo } from 'react';

import { Capacitor } from '@capacitor/core';
import {
    CapacitorSQLite,
    SQLiteConnection,
    SQLiteDBConnection,
} from '@capacitor-community/sqlite';

export type AvailableResult = {
    isAvailable: boolean;

    message?: string;
};

export type Result = {
    result: boolean;
};

export interface VersionUpgrade {
    toVersion: number;

    statements: string[];
}

export interface SQLiteHook extends AvailableResult {
    initWebStore(): Promise<void>;

    saveToStore(database: string): Promise<void>;

    echo(value: string): Promise<{ value: string }>; // not used but kept for parity

    getPlatform(): Promise<{ platform: string }>;

    getCapacitorSQLite(): Promise<{ plugin: any }>;

    addUpgradeStatement(
        dbName: string,
        upgrade: VersionUpgrade | VersionUpgrade[]
    ): Promise<void>;

    createConnection(
        database: string,
        encrypted?: boolean,
        mode?: string,
        version?: number,
        readonly?: boolean
    ): Promise<SQLiteDBConnection>;

    retrieveConnection(database: string, readonly?: boolean): Promise<SQLiteDBConnection>;

    retrieveAllConnections(): Promise<Map<string, SQLiteDBConnection>>;

    closeConnection(database: string, readonly?: boolean): Promise<void>;

    closeAllConnections(): Promise<void>;

    isConnection(database: string, readonly?: boolean): Promise<Result>;

    isDatabase(database: string): Promise<Result>;

    isDatabaseEncrypted(database: string): Promise<Result>;

    isInConfigEncryption(): Promise<Result>;

    isSecretStored(): Promise<Result>;

    setEncryptionSecret(passphrase: string): Promise<void>;

    clearEncryptionSecret(): Promise<void>;

    checkConnectionsConsistency(): Promise<Result>;
}

export const useSQLite = (): SQLiteHook => {
    const platform = Capacitor.getPlatform();

    const mSQLite = useMemo(() => new SQLiteConnection(CapacitorSQLite), []);

    // Helper wrappers to keep types strong and avoid any
    const ensureDbName = (dbName: string) => {
        if (!dbName) throw new Error('Must provide a database name');
    };

    const addUpgradeStatement = async (
        dbName: string,
        upgrade: VersionUpgrade | VersionUpgrade[]
    ): Promise<void> => {
        ensureDbName(dbName);

        const upgrades = Array.isArray(upgrade) ? upgrade : [upgrade];

        // Try modern array-of-upgrades first; fallback to legacy 3-arg per upgrade
        try {
            await (mSQLite as unknown as {
                addUpgradeStatement: (
                    db: string,
                    ups: VersionUpgrade[]
                ) => Promise<void>;
            }).addUpgradeStatement(dbName, upgrades);

            return;
        } catch {
            // Fallback: loop and call 3-arg signature
            for (const u of upgrades) {
                if (!u || typeof u.toVersion !== 'number' || !Array.isArray(u.statements)) {
                    throw new Error('Invalid upgrade statement');
                }

                await (mSQLite as unknown as {
                    addUpgradeStatement: (
                        db: string,
                        toVersion: number,
                        statements: string[]
                    ) => Promise<void>;
                }).addUpgradeStatement(dbName, u.toVersion, u.statements);
            }
        }
    };

    return {
        isAvailable: true,

        initWebStore: async (): Promise<void> => {
            if (platform !== 'web') return Promise.reject(`Not implemented on platform ${platform}`);

            await mSQLite.initWebStore();
        },

        saveToStore: async (database: string): Promise<void> => {
            if (platform !== 'web') return Promise.reject(`Not implemented on platform ${platform}`);

            if (!database) throw new Error('Must provide a database name');

            await mSQLite.saveToStore(database);
        },

        echo: async (value: string): Promise<{ value: string }> => {
            if (!value) return { value: '' };

            const r = await mSQLite.echo(value as any);

            return { value: r?.value ?? '' };
        },

        getPlatform: async (): Promise<{ platform: string }> => ({ platform }),

        getCapacitorSQLite: async (): Promise<{ plugin: any }> => ({ plugin: CapacitorSQLite }),

        addUpgradeStatement,

        createConnection: async (
            database: string,
            encrypted?: boolean,
            mode?: string,
            version?: number,
            readonly?: boolean
        ): Promise<SQLiteDBConnection> => {
            ensureDbName(database);

            const mDatabase = database;

            const mVersion = version ?? 1;

            const mEncrypted = encrypted ?? false;

            const mMode = mode ?? 'no-encryption';

            const mReadonly = readonly ?? false;

            const r = await mSQLite.createConnection(
                mDatabase,
                mEncrypted,
                mMode,
                mVersion,
                mReadonly
            );

            if (!r) throw new Error('No returned connection');

            return r;
        },

        closeConnection: async (database: string, readonly?: boolean): Promise<void> => {
            ensureDbName(database);

            await mSQLite.closeConnection(database, readonly ?? false);
        },

        retrieveConnection: async (
            database: string,
            readonly?: boolean
        ): Promise<SQLiteDBConnection> => {
            ensureDbName(database);

            const r = await mSQLite.retrieveConnection(database, readonly ?? false);

            if (!r) throw new Error('No returned connection');

            return r;
        },

        retrieveAllConnections: async (): Promise<Map<string, SQLiteDBConnection>> => {
            const r = await mSQLite.retrieveAllConnections();

            if (!r) throw new Error('No returned connection');

            return r;
        },

        closeAllConnections: async (): Promise<void> => {
            await mSQLite.closeAllConnections();
        },

        isConnection: async (database: string, readonly?: boolean): Promise<Result> => {
            ensureDbName(database);

            const r = await mSQLite.isConnection(database, readonly ?? false);

            return { result: !!r?.result };
        },

        isDatabase: async (database: string): Promise<Result> => {
            ensureDbName(database);

            const r = await mSQLite.isDatabase(database);

            return { result: !!r?.result };
        },

        isDatabaseEncrypted: async (database: string): Promise<Result> => {
            ensureDbName(database);

            const r = await mSQLite.isDatabaseEncrypted(database);

            return { result: !!r?.result };
        },

        isInConfigEncryption: async (): Promise<Result> => {
            const r = await mSQLite.isInConfigEncryption();

            return { result: !!r?.result };
        },

        isSecretStored: async (): Promise<Result> => {
            const r = await mSQLite.isSecretStored();

            return { result: !!r?.result };
        },

        setEncryptionSecret: async (passphrase: string): Promise<void> => {
            if (!passphrase) throw new Error('Must provide a passphrase');

            await mSQLite.setEncryptionSecret(passphrase);
        },

        clearEncryptionSecret: async (): Promise<void> => {
            await mSQLite.clearEncryptionSecret();
        },

        checkConnectionsConsistency: async (): Promise<Result> => {
            const r = await mSQLite.checkConnectionsConsistency();

            return { result: !!r?.result };
        },
    };
};

export { SQLiteDBConnection, SQLiteConnection };
