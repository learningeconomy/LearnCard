import type { SQLiteDBConnection } from '@capacitor-community/sqlite';

interface SQLiteConnectionAccess {
    open: () => Promise<void>;
    close: () => Promise<void>;
}

interface ConnectionState {
    users: number;
    open: boolean;
    transition: Promise<void>;
}

const connections = new WeakMap<SQLiteConnectionAccess, ConnectionState>();
const schemas = new WeakMap<SQLiteConnectionAccess, Map<string, Promise<void>>>();
const retained = new WeakSet<SQLiteConnectionAccess>();

/** Native SQLCipher owners retain the connection to avoid deriving its key for every query. */
export const retainSQLiteConnection = (db: SQLiteConnectionAccess): void => {
    retained.add(db);
};

/** Release an owner's retention; overlapping operations still finish before the last close. */
export const releaseSQLiteConnection = async (db: SQLiteConnectionAccess): Promise<void> => {
    retained.delete(db);
    const state = connections.get(db);
    if (!state) return;
    await transition(state, async () => {
        if (!state.users && state.open) {
            try {
                await db.close();
            } finally {
                state.open = false;
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
 * Callers must not open or close the connection themselves inside the callback.
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
            if (!connection.open) {
                await db.open();
                connection.open = true;
            }
        });
    } catch (error) {
        connection.users--;
        throw error;
    }

    let failed = false;
    try {
        return await operation(db);
    } catch (error) {
        failed = true;
        throw error;
    } finally {
        connection.users--;
        await transition(connection, async () => {
            if (!connection.users && connection.open && !retained.has(db)) {
                try {
                    await db.close();
                } finally {
                    connection.open = false;
                }
            }
        }).catch(error => {
            // Preserve the operation's original error if cleanup also failed.
            if (!failed) throw error;
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

/** Invalidate schema knowledge after the owning connection's database is deleted. */
export const forgetSQLiteSchema = (db: SQLiteConnectionAccess): void => {
    schemas.delete(db);
    connections.delete(db);
    retained.delete(db);
};
