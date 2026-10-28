import { CapacitorSQLite } from '@capacitor-community/sqlite';

interface NativeEncryptionBootstrap {
    prepareEncryptedDatabase: (options: { database: string }) => Promise<{
        version: number;
        encrypted: boolean;
        migrated: boolean;
    }>;
}

/** Require the native migration implementation; never open a plaintext fallback. */
export const prepareNativeEncryption = async (): Promise<void> => {
    const native = CapacitorSQLite as typeof CapacitorSQLite & NativeEncryptionBootstrap;
    const result = await native.prepareEncryptedDatabase({ database: 'learncardDB' });
    if (result.version !== 1 || !result.encrypted) {
        throw new Error('Encrypted native account storage is unavailable');
    }
};
