import { CapacitorSQLite } from '@capacitor-community/sqlite';

interface NativeEncryptionBootstrap {
    prepareEncryptedDatabase: (options: { database: string }) => Promise<{
        version: number;
        encrypted: boolean;
        migrated: boolean;
    }>;
}

/** Old binaries retain their legacy path; implemented preparation failures never downgrade. */
export const prepareNativeEncryption = async (): Promise<'encrypted' | 'legacy'> => {
    const native = CapacitorSQLite as typeof CapacitorSQLite & NativeEncryptionBootstrap;
    let result: Awaited<ReturnType<NativeEncryptionBootstrap['prepareEncryptedDatabase']>>;
    try {
        result = await native.prepareEncryptedDatabase({ database: 'learncardDB' });
    } catch (error) {
        // Capacitor emits this code when the installed binary lacks the method.
        // The new native implementation rejects real failures without this code.
        if (
            error &&
            typeof error === 'object' &&
            'code' in error &&
            error.code === 'UNIMPLEMENTED'
        ) {
            return 'legacy';
        }
        throw error;
    }
    if (result?.version !== 1 || result.encrypted !== true) {
        throw new Error('Encrypted native account storage is unavailable');
    }
    return 'encrypted';
};
