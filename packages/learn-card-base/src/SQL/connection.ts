import type { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { getLogger } from '../logging/logger';

const log = getLogger('sqlite-connection');

interface SQLiteConnectionAccess {
    open: () => Promise<void>;
    close: () => Promise<void>;
    isDBOpen?: () => Promise<{ result?: boolean }>;
}

interface ConnectionState {
    users: number;
    open: boolean | 'unknown';
    transition: Promise<void>;
}

const connections = new WeakMap<SQLiteConnectionAccess, ConnectionState>();
const schemas = new WeakMap<SQLiteConnectionAccess, Map<string, Promise<void>>>();
const retained = new WeakSet<SQLiteConnectionAccess>();

/** Native SQLCipher owners retain connections to avoid deriving the key for every query. */
export const retainSQLiteConnection = (db: SQLiteConnectionAccess): void => {
    retained.add(db);
};

/** Release retention; overlapping operations finish before the last close. */
export const releaseSQLiteConnection = async (db: SQLiteConnectionAccess): Promise<void> => {
    retained.delete(db);
    const state = connections.get(db);
    if (!state) return;
    await transition(state, async () => {
        if (state.users) return;
        if (state.open === 'unknown') {
            const status = await db.isDBOpen?.();
            if (typeof status?.result !== 'boolean') {
                throw new Error('SQLite connection state could not be determined');
            }
            state.open = status.result;
        }
        if (state.open) {
            try {
                await db.close();
                state.open = false;
            } catch (error) {
                state.open = 'unknown';
                throw error;
            }
        }
    });
};

const transition = (state: ConnectionState, operation: () => Promise<void>): Promise<void> => {
    const result = state.transition.then(operation);
    state.transition = result.catch(() => undefined);
    return result;
};

/**
 * Hold the shared connection until every overlapping operation has finished.
 * Only open/close transitions are serialized: nested SDK cache reads are allowed.
 * Every user of this handle must use this helper; raw open/close calls bypass
 * ownership and are unsupported, including inside the callback.
 */
export const withSQLiteDatabase = async <T, Database extends SQLiteConnectionAccess>(
    db: Database,
    operation: (db: Database) => Promise<T>
): Promise<T> => {
    let state = connections.get(db);
    if (!state) {
        state = { users: 0, open: false, transition: Promise.resolve() };
        connections.set(db, state);
    }
    const connection = state;
    connection.users++;
    try {
        await transition(connection, async () => {
            // A rejected close may have closed the handle or left it open. Check
            // before reuse rather than double-opening or trusting a stale flag.
            if (connection.open === 'unknown') {
                const status = await db.isDBOpen?.();
                if (typeof status?.result !== 'boolean') {
                    throw new Error('SQLite connection state could not be determined');
                }
                connection.open = status.result;
            }
            if (!connection.open) {
                await db.open();
                connection.open = true;
            }
        });
    } catch (error) {
        connection.users--;
        throw error;
    }

    try {
        return await operation(db);
    } finally {
        connection.users--;
        await transition(connection, async () => {
            if (!connection.users && connection.open === true && !retained.has(db)) {
                try {
                    await db.close();
                    connection.open = false;
                } catch (error) {
                    connection.open = 'unknown';
                    throw error;
                }
            }
        }).catch(() => {
            // Cleanup must not turn a committed write into an apparent failure
            // (and encourage a duplicate retry), or mask the operation's error.
            log.warn('SQLite cleanup failed; connection state will be checked before reuse');
        });
    }
};

/** Ensure an idempotent schema once per connection, sharing concurrent initialization. */
export const ensureSQLiteSchema = (
    db: Pick<SQLiteDBConnection, 'open' | 'close' | 'execute'>,
    name: string,
    statements: string
): Promise<void> => {
    let initialized = schemas.get(db);
    if (!initialized) {
        initialized = new Map();
        schemas.set(db, initialized);
    }
    let result = initialized.get(name);
    if (!result) {
        result = withSQLiteDatabase(db, async connection => {
            await connection.execute(statements);
        });
        initialized.set(name, result);
        const pending = result;
        void result.catch(() => {
            if (initialized.get(name) === pending) initialized.delete(name);
        });
    }
    return result;
};

/** Invalidate after database deletion, only when the owner has no active operations. */
export const forgetSQLiteSchema = (db: SQLiteConnectionAccess): void => {
    schemas.delete(db);
    connections.delete(db);
    retained.delete(db);
};
