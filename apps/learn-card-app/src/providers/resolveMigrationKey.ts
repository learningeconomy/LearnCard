interface MigrationKeyDependencies {
    fetchArchivedKey: () => Promise<{ privateKey: string; did: string } | null>;
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

/** Prefer server-attested material without changing legacy derivation failures. */
export const resolveMigrationKey = async ({
    fetchArchivedKey,
    deriveLegacyKey,
    getExistingExpectedDid = () => undefined,
    isCurrentAttempt = () => true,
}: MigrationKeyDependencies): Promise<MigrationKey | null> => {
    try {
        const archived = await fetchArchivedKey();
        if (!isCurrentAttempt()) return null;
        if (archived) {
            return {
                privateKey: archived.privateKey,
                source: 'archive',
                expectedDid: getExistingExpectedDid() || archived.did,
            };
        }
    } catch {
        // Optional lookup failures must fall back; never forward raw errors or credentials.
    }

    if (!isCurrentAttempt()) return null;
    const privateKey = await deriveLegacyKey();
    return privateKey && isCurrentAttempt() ? { privateKey, source: 'derived' } : null;
};
