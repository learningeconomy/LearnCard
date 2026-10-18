/** Read-only lifecycle checks. Never derive a status from human-readable errors. */
export type NativeLifecycleState =
    'active' | 'revoked' | 'suspended' | 'unavailable' | 'notProvided';
type Purpose = 'revocation' | 'suspension';
export interface NativeCredentialStatus {
    state: NativeLifecycleState;
    source?: 'network' | 'statusList';
    checkedAt?: string;
    purposes: Purpose[];
}
export interface CredentialStatusReader {
    getStatuses: (uris: string[]) => Promise<unknown>;
    verify: (
        credential: Record<string, unknown>,
        checks: ('proof' | 'credentialStatus')[]
    ) => Promise<unknown>;
}
const object = (value: unknown): Record<string, unknown> =>
    value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
const statuses = (credential: Record<string, unknown>): Record<string, unknown>[] => {
    const own = credential.credentialStatus;
    return [
        ...(Array.isArray(own) ? own : own == null ? [] : [own]).map(object).map(entry =>
            entry.type === 'RevocationList2020Status'
                ? {
                      ...entry,
                      statusPurpose: 'revocation',
                      statusListCredential: entry.revocationListCredential,
                      statusListIndex: entry.revocationListIndex,
                  }
                : entry
        ),
        ...(credential.boostCredential ? statuses(object(credential.boostCredential)) : []),
    ];
};
const unavailable = (): NativeCredentialStatus => ({ state: 'unavailable', purposes: [] });

// Bound each remote attempt so details remain usable if an issuer does not respond.
const bounded = async <T>(work: Promise<T>, timeoutMS: number): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            work,
            new Promise<never>((_, reject) => {
                timer = setTimeout(() => reject(new Error('Status check timed out')), timeoutMS);
            }),
        ]);
    } finally {
        clearTimeout(timer);
    }
};

/** Prefer the authenticated holder network record; otherwise check the original signed status list. */
export const checkCredentialStatus = async (
    reader: CredentialStatusReader,
    uri: string,
    credential: Record<string, unknown>,
    timeoutMS = 8_000
): Promise<NativeCredentialStatus> => {
    let networkAnswered = false;
    const checked = (
        state: 'active' | 'revoked' | 'suspended',
        source: 'network' | 'statusList',
        purposes: Purpose[]
    ): NativeCredentialStatus => ({ state, source, purposes, checkedAt: new Date().toISOString() });
    try {
        const response = await bounded(reader.getStatuses([uri]), timeoutMS);
        const result = object(response);
        const state = Object.hasOwn(result, uri) ? result[uri] : undefined;
        networkAnswered =
            response != null &&
            typeof response === 'object' &&
            !Array.isArray(response) &&
            !Object.hasOwn(result, uri);
        if (state === 'active' || state === 'revoked' || state === 'suspended')
            return checked(state, 'network', ['revocation', 'suspension']);
    } catch {
        /* Missing deployment, offline, or external credential: try the signed list. */
    }

    const entries = statuses(credential);
    if (!entries.length)
        return networkAnswered ? { state: 'notProvided', purposes: [] } : unavailable();
    try {
        // An altered status URL/index must not be accepted merely because its list bit is set.
        const proof = object(await bounded(reader.verify(credential, ['proof']), timeoutMS));
        if (!Array.isArray(proof.errors) || proof.errors.length) return unavailable();
        const result = object(
            await bounded(reader.verify(credential, ['credentialStatus']), timeoutMS)
        );
        const outcomes = Array.isArray(result.status) ? result.status.map(object) : [];
        const matched = entries.map(entry =>
            outcomes.find(
                outcome =>
                    [
                        'BitstringStatusListEntry',
                        'StatusList2021Entry',
                        'RevocationList2020Status',
                    ].includes(String(entry.type)) &&
                    typeof entry.statusListCredential === 'string' &&
                    /^\d+$/.test(String(entry.statusListIndex)) &&
                    typeof outcome.isSet === 'boolean' &&
                    outcome.entryType === entry.type &&
                    outcome.statusPurpose === entry.statusPurpose &&
                    outcome.statusListCredential === entry.statusListCredential &&
                    String(outcome.statusListIndex) === String(entry.statusListIndex)
            )
        );
        if (matched.some(entry => entry?.statusPurpose === 'revocation' && entry.isSet === true))
            return checked('revoked', 'statusList', ['revocation']);
        if (matched.some(entry => entry?.statusPurpose === 'suspension' && entry.isSet === true))
            return checked('suspended', 'statusList', ['suspension']);
        // A missing, malformed or partly failed check is never evidence of an active credential.
        if (
            matched.some(
                entry =>
                    !entry || !['revocation', 'suspension'].includes(String(entry.statusPurpose))
            ) ||
            !Array.isArray(result.errors) ||
            result.errors.length ||
            !matched.length
        )
            return unavailable();
        return checked('active', 'statusList', [
            ...new Set(matched.map(entry => entry!.statusPurpose as Purpose)),
        ]);
    } catch {
        return unavailable();
    }
};
