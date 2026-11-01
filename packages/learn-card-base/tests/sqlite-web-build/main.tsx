import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useSQLiteInitWeb } from '../../src/SQL/useSQLiteInitWeb';
import { withSQLiteDatabase } from '../../src/SQL/connection';
import { sqliteStore } from '../../src/stores/sqliteStore';

/** Production-build fixture: real component, Capacitor web driver, WASM and IndexedDB. */
const Probe = () => {
    useSQLiteInitWeb();
    const db = sqliteStore.use.db();
    const [status, setStatus] = useState('Waiting for bundled SQLite');
    const check = async (write: boolean) => {
        if (!db) return;
        try {
            await withSQLiteDatabase(db, async connection => {
                if (write) {
                    await connection.execute(
                        'CREATE TABLE IF NOT EXISTS probe(id INTEGER PRIMARY KEY, value TEXT)'
                    );
                    await connection.run('INSERT OR REPLACE INTO probe(id, value) VALUES (?, ?)', [
                        1,
                        'synthetic-value',
                    ]);
                }
                const row = await connection.query('SELECT value FROM probe WHERE id = ?', [1]);
                if (row.values?.[0]?.value !== 'synthetic-value')
                    throw new Error('Synthetic row missing');
            });
            setStatus(write ? 'Saved synthetic row' : 'Restored synthetic row');
        } catch (error) {
            setStatus(`SQLite check failed: ${String(error)}`);
        }
    };
    return (
        <main>
            <h1>Bundled SQLite production regression</h1>
            <p>No CDN, accounts or remote services.</p>
            <button disabled={!db} onClick={() => void check(true)}>
                Write synthetic row
            </button>
            <button disabled={!db} onClick={() => void check(false)}>
                Read saved row
            </button>
            <p role="status">{status}</p>
        </main>
    );
};

createRoot(document.getElementById('root')!).render(<Probe />);
