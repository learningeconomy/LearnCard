import {
    defineCustomElements as jeepSqlite,
    applyPolyfills,
    JSX as LocalJSX,
} from 'jeep-sqlite/loader';
import { HTMLAttributes } from 'react';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { sqliteStore } from '../stores/sqliteStore';
import { markSQLiteReady } from 'learn-card-base/SQL/sqliteReady';
// import { performSqliteMigrations } from './migrations';

type StencilToReact<T> = {
    [P in keyof T]?: T[P] &
    Omit<HTMLAttributes<Element>, 'className'> & {
        class?: string;
    };
};

declare global {
    export namespace JSX {
        interface IntrinsicElements extends StencilToReact<LocalJSX.IntrinsicElements> { }
    }
}

const INIT_WEBSTORE_TIMEOUT_MS = 3000;

export const initSQLiteStorageWeb = (initApp: () => void) => {
    window.addEventListener('DOMContentLoaded', async () => {
        const platform = Capacitor.getPlatform();
        const sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
        try {
            if (platform === 'web') {
                const jeepEl = document.createElement('jeep-sqlite');
                document.body.appendChild(jeepEl);
                await customElements.whenDefined('jeep-sqlite');
                await Promise.race([
                    sqlite.initWebStore(),
                    new Promise((_, reject) =>
                        setTimeout(
                            () =>
                                reject(
                                    new Error(
                                        `Sqlite could not init web store in ${INIT_WEBSTORE_TIMEOUT_MS}ms ❌`
                                    )
                                ),
                            INIT_WEBSTORE_TIMEOUT_MS
                        )
                    ),
                ]);
                await sqliteStore.set.sqlite(sqlite);

                try {
                    // await performSqliteMigrations(sqlite);
                    // initialize some database schema if needed
                    const ret = await sqlite.checkConnectionsConsistency();
                    const isConn = (await sqlite.isConnection('learncardDB', false)).result;
                    var db: SQLiteDBConnection;
                    if (ret.result && isConn) {
                        db = await sqlite.retrieveConnection('learncardDB', false);
                    } else {
                        db = await sqlite.createConnection(
                            'learncardDB',
                            false,
                            'no-encryption',
                            1,
                            false
                        );
                    }
                    // await db.open();
                    await sqliteStore.set.db(db);
                    try {
                        markSQLiteReady();
                    } catch (e) {
                        console.warn('markSQLiteReady (initSQLiteStorageWeb) failed', e);
                    }
                } catch (e) {
                    console.error('SQL Lite DB could not be initialized', e);
                    try {
                        markSQLiteReady();
                    } catch (e2) {
                        console.warn('markSQLiteReady (initSQLiteStorageWeb, on error) failed', e2);
                    }
                }
            }
            initApp();
        } catch (err: any) {
            if (err.message?.includes('Sqlite could not init web store in')) {
                console.warn(`Error: ${err.message}`);
            } else {
                console.error(`Error: ${err}`);
            }
            try {
                markSQLiteReady();
            } catch {}
            initApp();
        }
    });
};

export { initSQLiteStorageWeb as default };
