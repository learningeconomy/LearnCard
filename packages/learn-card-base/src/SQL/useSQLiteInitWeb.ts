import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { sqliteStore } from '../stores/sqliteStore';
import { markSQLiteReady } from 'learn-card-base/SQL/sqliteReady';
import { getLogger } from '../logging/logger';

const log = getLogger('use-sqlite-init-web');
const INIT_WEBSTORE_TIMEOUT_MS = 3000;

export const useSQLiteInitWeb = () => {
    useEffect(() => {
        // Web setup and cleanup must never touch the native account connection.
        if (Capacitor.getPlatform() !== 'web') return;
        let stopped = false;
        let element: HTMLElement | undefined;
        let sqlite: SQLiteConnection | undefined;
        const initialize = async () => {
            let timeout: ReturnType<typeof setTimeout> | undefined;
            try {
                // A remote module in HTML previously blocked native React startup.
                const { defineCustomElements } = await import('jeep-sqlite/loader');
                if (stopped) return;
                defineCustomElements(window);
                element = document.createElement('jeep-sqlite');
                document.body.appendChild(element);
                await customElements.whenDefined('jeep-sqlite');
                if (stopped) return;
                const connection = new SQLiteConnection(CapacitorSQLite);
                sqlite = connection;
                await Promise.race([
                    connection.initWebStore(),
                    new Promise<never>((_, reject) => {
                        timeout = setTimeout(
                            () => reject(new Error('Web SQLite initialization timed out')),
                            INIT_WEBSTORE_TIMEOUT_MS
                        );
                    }),
                ]);
                if (stopped) return;
                const consistent = (await connection.checkConnectionsConsistency()).result;
                const connected = (await connection.isConnection('learncardDB', false)).result;
                const db =
                    consistent && connected
                        ? await connection.retrieveConnection('learncardDB', false)
                        : await connection.createConnection(
                              'learncardDB',
                              false,
                              'no-encryption',
                              1,
                              false
                          );
                if (stopped) return;
                sqliteStore.set.sqlite(connection);
                sqliteStore.set.db(db);
            } catch (error) {
                if (!stopped) log.warn('Optional web SQLite initialization failed', error);
            } finally {
                clearTimeout(timeout);
                if (!stopped) markSQLiteReady();
            }
        };
        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', initialize, { once: true });
        } else {
            void initialize();
        }
        return () => {
            stopped = true;
            window.removeEventListener('DOMContentLoaded', initialize);
            element?.remove();
            // Never close a connection published by another owner.
            if (sqlite && sqliteStore.get.sqlite() === sqlite) {
                void sqlite
                    .closeAllConnections()
                    .catch(error => log.warn('Web SQLite cleanup failed', error));
            }
        };
    }, []);
};

export default useSQLiteInitWeb;
