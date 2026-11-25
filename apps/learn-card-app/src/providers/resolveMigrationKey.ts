import type { ArchivedKeyLookup } from '@learncard/types';

interface MigrationKeyDependencies {
    fetchArchivedKey: () => Promise<ArchivedKeyLookup>;
    deriveLegacyKey: () => Promise<string | null>;
    /** Read after the archive lookup so a server DID that arrives meanwhile still wins. */
    getExistingExpectedDid?: () => string | undefined;
    isCurrentAttempt?: () => boolean;
}

type MigrationKey = {
    privateKey: string;
    source: 'archive' | 'derived';
    expectedDid?: string;
};

/**
 * Legacy derivation failed after the archive lookup returned `archivedKey`. The coordinator
 * needs both: a provider "never assigned" error means a new account only when the archive
 * also confirmed it holds no key.
 */
export class MigrationKeyDerivationError extends Error {
    constructor(
        readonly derivationError: unknown,
        readonly archivedKey: Exclude<ArchivedKeyLookup['status'], 'found'>
    ) {
        super('Legacy key derivation failed.');
        this.name = 'MigrationKeyDerivationError';
    }
}

/** Prefer server-attested material without changing legacy derivation failures. */
export const resolveMigrationKey = async ({
    fetchArchivedKey,
    deriveLegacyKey,
    getExistingExpectedDid = () => undefined,
    isCurrentAttempt = () => true,
}: MigrationKeyDependencies): Promise<MigrationKey | null> => {
    // Optional lookup: a thrown error is a failed lookup, never forwarded (it may hold credentials).
    const archived = await fetchArchivedKey().catch((): ArchivedKeyLookup => ({
        status: 'failed',
    }));
    if (!isCurrentAttempt()) return null;
    if (archived.status === 'found') {
        return {
            privateKey: archived.privateKey,
            source: 'archive',
            expectedDid: getExistingExpectedDid() || archived.did,
        };
    }

    let privateKey: string | null;
    try {
        privateKey = await deriveLegacyKey();
    } catch (error) {
        throw new MigrationKeyDerivationError(error, archived.status);
    }
    return privateKey && isCurrentAttempt() ? { privateKey, source: 'derived' } : null;
};
