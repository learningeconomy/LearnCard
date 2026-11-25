// The root @types/node (18.x) predates node:sqlite (Node 22.5+). CI runs Node 24, so the module
// exists at runtime; this declares the subset useSQLiteStorage.test.ts uses. Delete it once
// @types/node ships node:sqlite.
declare module 'node:sqlite' {
    type SQLInputValue = null | number | bigint | string | Uint8Array;
    type SQLOutputValue = null | number | bigint | string | Uint8Array;

    interface StatementResultingChanges {
        changes: number | bigint;
        lastInsertRowid: number | bigint;
    }

    class StatementSync {
        all(...anonymousParameters: SQLInputValue[]): Record<string, SQLOutputValue>[];
        get(...anonymousParameters: SQLInputValue[]): Record<string, SQLOutputValue> | undefined;
        run(...anonymousParameters: SQLInputValue[]): StatementResultingChanges;
    }

    class DatabaseSync {
        constructor(path: string);
        close(): void;
        exec(sql: string): void;
        prepare(sql: string): StatementSync;
    }
}
