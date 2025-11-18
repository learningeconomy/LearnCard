import { createStore } from '@udecode/zustood';

import { SQLiteHook } from 'learn-card-base/react-sqlite-hook';
import { SQLiteDBConnection, SQLiteConnection } from '@capacitor-community/sqlite';

export const sqliteStore = createStore('sqliteStore')<{
    db: SQLiteDBConnection | null;
    sqlite: SQLiteHook | SQLiteConnection | null;
}>({ db: null, sqlite: null });
export default sqliteStore;
