import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { sqliteStore } from '../stores/sqliteStore';
import { markSQLiteReady } from 'learn-card-base/SQL/sqliteReady';

const INIT_WEBSTORE_TIMEOUT_MS = 3000;

export const useSQLiteInitWeb = () => {
    useEffect(() => {
        const handleDOMContentLoaded = async () => {
            const platform = Capacitor.getPlatform();
            const sqlite = new SQLiteConnection(CapacitorSQLite);

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
                        const ret = await sqlite.checkConnectionsConsistency();
                        const isConn = (await sqlite.isConnection('learncardDB', false)).result;
                        let db: SQLiteDBConnection;
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
                        await sqliteStore.set.db(db);
                        try {
                            markSQLiteReady();
                        } catch (e) {
                            console.warn('markSQLiteReady (web) failed', e);
                        }
                    } catch (e) {
                        console.error('SQL Lite DB could not be initialized', e);
                        // Still mark readiness so app can proceed without DB on web
                        try {
                            markSQLiteReady();
                        } catch (e2) {
                            console.warn('markSQLiteReady (web, on error) failed', e2);
                        }
                    }
                }
            } catch (err: unknown) {
                const message = typeof err === 'object' && err && 'message' in err ? String((err as any).message) : '';
                if (message.includes('Sqlite could not init web store in')) {
                    console.warn(`Error: ${message}`);
                } else {
                    console.error('Error:', err);
                }
                // Ensure readiness is marked even on unexpected errors
                try {
                    markSQLiteReady();
                } catch {}
            }
        };

        // Add event listener for DOMContentLoaded
        window.addEventListener('DOMContentLoaded', handleDOMContentLoaded);

        // Cleanup function to remove the event listener and remove the dynamically created element
        return () => {
            window.removeEventListener('DOMContentLoaded', handleDOMContentLoaded);

            // Remove the dynamically added 'jeep-sqlite' element from the DOM
            const jeepEl = document.querySelector('jeep-sqlite');
            if (jeepEl) {
                jeepEl.remove();
            }

            // Optionally: Close the SQLite connection if it was opened
            const _sqlite = sqliteStore.get.sqlite(); // Assuming you store sqlite instance in the store
            if (_sqlite) {
                _sqlite?.closeAllConnections();
            }
        };
    }, []); // Empty dependency array ensures this effect only runs once (on mount)
};

export default useSQLiteInitWeb;
