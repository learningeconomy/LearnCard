const REDACTED = '[REDACTED]';

export const SENSITIVE_CREDENTIAL_KEYS = new Set([
    'credentialSubject',
    'proof',
    'evidence',
    'verifiableCredential',
    'credential',
    'presentation',
    'verifiablePresentation',
]);

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null;
};

const isCredentialShape = (value: unknown): value is Record<string, unknown> => {
    return isRecord(value) && '@context' in value && 'type' in value;
};

export const scrubSensitiveCredentials = (value: unknown): unknown => {
    if (value === null || value === undefined) {
        return value;
    }

    if (Array.isArray(value)) {
        let hasChanges = false;
        const scrubbedArray = value.map(item => {
            const scrubbedItem = scrubSensitiveCredentials(item);

            if (scrubbedItem !== item) {
                hasChanges = true;
            }

            return scrubbedItem;
        });

        return hasChanges ? scrubbedArray : value;
    }

    if (!isRecord(value)) {
        return value;
    }

    if (isCredentialShape(value)) {
        return REDACTED;
    }

    let hasChanges = false;
    const scrubbedObject: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
        if (SENSITIVE_CREDENTIAL_KEYS.has(key)) {
            scrubbedObject[key] = REDACTED;
            hasChanges = hasChanges || nestedValue !== REDACTED;
            continue;
        }

        const scrubbedValue = scrubSensitiveCredentials(nestedValue);
        scrubbedObject[key] = scrubbedValue;
        hasChanges = hasChanges || scrubbedValue !== nestedValue;
    }

    return hasChanges ? scrubbedObject : value;
};

export const sanitizeTraceData = scrubSensitiveCredentials;
