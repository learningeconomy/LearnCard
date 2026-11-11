export class CredentialFieldError extends Error {
    constructor(readonly field: 'creditsEarned' | 'creditsAvailable' | 'awardedDate') {
        super(`Invalid standard credential field: ${field}`);
        this.name = 'CredentialFieldError';
    }
}

/** Parse a complete finite decimal, without guessing locale or accepting partial input. */
export const parseCredentialNumber = (value: unknown): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (
        typeof value !== 'string' ||
        !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())
    )
        throw new Error('Expected a finite decimal');
    const number = Number(value.trim());
    if (!Number.isFinite(number)) throw new Error('Expected a finite decimal');
    return number;
};

/** Calendar dates keep their day; timestamps must declare their timezone. */
export const normalizeCredentialAwardDate = (value: string): string => {
    const text = value.trim();
    const calendar = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
    if (
        !calendar ||
        !/^\d{4}-\d{2}-\d{2}(?:T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/i.test(
            text
        )
    )
        throw new CredentialFieldError('awardedDate');
    const day = new Date(`${calendar[0]}T00:00:00Z`);
    if (
        !Number.isFinite(day.getTime()) ||
        day.getUTCFullYear() !== Number(calendar[1]) ||
        day.getUTCMonth() + 1 !== Number(calendar[2]) ||
        day.getUTCDate() !== Number(calendar[3])
    )
        throw new CredentialFieldError('awardedDate');
    const instant = text.length === 10 ? day : new Date(text);
    if (!Number.isFinite(instant.getTime())) throw new CredentialFieldError('awardedDate');
    const fraction = /\.(\d+)(?:Z|[+-]\d{2}:\d{2})$/i.exec(text)?.[1];
    const iso = instant.toISOString();
    return fraction && fraction.length > 3 ? iso.replace(/\.\d{3}Z$/, `.${fraction}Z`) : iso;
};

const object = (value: unknown): value is Record<string, unknown> =>
    Boolean(value && typeof value === 'object' && !Array.isArray(value));

/**
 * Materialize declared OBv3/CLR numeric fields after template substitution.
 * Result values and identifiers remain strings. Signed credentials are never changed.
 */
export const materializeCredentialFields = (
    credential: Record<string, unknown>
): Record<string, unknown> => {
    if (credential.proof) return credential;
    const types = Array.isArray(credential.type) ? credential.type : [credential.type];
    if (
        !types.some(type =>
            ['OpenBadgeCredential', 'AchievementCredential', 'ClrCredential'].includes(String(type))
        )
    )
        return credential;
    const result = structuredClone(credential);
    const numeric = (
        container: Record<string, unknown>,
        field: 'creditsEarned' | 'creditsAvailable'
    ): void => {
        if (container[field] === undefined) return;
        if (typeof container[field] === 'string' && !(container[field] as string).trim()) {
            delete container[field];
            return;
        }
        try {
            container[field] = parseCredentialNumber(container[field]);
        } catch {
            throw new CredentialFieldError(field);
        }
    };
    const subject = (value: unknown): void => {
        if (!object(value)) return;
        numeric(value, 'creditsEarned');
        for (const achievement of Array.isArray(value.achievement)
            ? value.achievement
            : [value.achievement]) {
            if (object(achievement)) numeric(achievement, 'creditsAvailable');
        }
        // Embedded verifiableCredential entries have independent signatures.
    };
    for (const value of Array.isArray(result.credentialSubject)
        ? result.credentialSubject
        : [result.credentialSubject])
        subject(value);
    if (result.awardedDate !== undefined) {
        if (typeof result.awardedDate !== 'string') throw new CredentialFieldError('awardedDate');
        if (!result.awardedDate.trim()) delete result.awardedDate;
        else result.awardedDate = normalizeCredentialAwardDate(result.awardedDate);
    }
    return result;
};
