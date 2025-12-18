import { SQLiteHook } from 'learn-card-base/react-sqlite-hook';
import { SQLiteConnection } from '@capacitor-community/sqlite';

export const MIGRATIONS: string[][] = [
    [
        `CREATE TABLE IF NOT EXISTS users( 
            email TEXT, 
            name TEXT, 
            profileImage TEXT, 
            aggregateVerifier TEXT, 
            verifier TEXT, 
            verifierId TEXT, 
            typeOfLogin TEXT, 
            dappShare TEXT, 
            privateKey TEXT, 
            baseColor TEXT 
        );`,
        `CREATE TABLE IF NOT EXISTS tokens( 
            authProviderName TEXT, 
            token TEXT
        );`,
    ],
    [
        `CREATE TABLE IF NOT EXISTS credentials( 
            id INTEGER PRIMARY KEY,
            credential TEXT
        );`,
        `CREATE TABLE IF NOT EXISTS indexRecords( 
            did TEXT PRIMARY KEY,
            records TEXT
        );`,
        `CREATE TABLE IF NOT EXISTS credentialsCache( 
            uri TEXT PRIMARY KEY,
            credential TEXT
        );`,
        `CREATE TABLE IF NOT EXISTS indexCache( 
            did TEXT NOT NULL,
            name TEXT NOT NULL,
            indexQuery TEXT,
            records TEXT,
            PRIMARY KEY (did, name, indexQuery)
        );`,
    ],
    ['ALTER TABLE users ADD uid TEXT', 'ALTER TABLE users ADD phoneNumber TEXT'],
];

export const performSqliteMigrations = async (
    sqlite: SQLiteConnection | SQLiteHook | null
): Promise<void> => {
    if (!sqlite) return;

    if ((await sqlite.isConnection('learncardDB', false)).result) {
        await sqlite.closeConnection('learncardDB', false);
    }

    // Build a single upgrades array once
    const upgrades = MIGRATIONS.map((statements, i) => ({
        toVersion: i + 1,
        statements,
    }));

    // Prefer modern array-based API; fallback to legacy 3-arg form if needed
    try {
        // Plugin wrapper signature: (database, upgrade[])
        await sqlite.addUpgradeStatement('learncardDB', upgrades as any);
    } catch (e) {
        console.debug(
            'performSqliteMigrations: addUpgradeStatement array API failed; falling back to legacy signature',
            e
        );
        // Legacy fallback: loop over 3-arg form (database, toVersion, statements)
        for (const u of upgrades) {
            // Using a narrow cast to accommodate older signatures without overusing `any`
            await (
                sqlite as unknown as {
                    addUpgradeStatement: (
                        db: string,
                        toVersion: number,
                        statements: string[]
                    ) => Promise<void>;
                }
            ).addUpgradeStatement('learncardDB', u.toVersion, u.statements);
        }
    }
};
