export type ResumeUnknownRecord = Record<string, unknown>;

export const asRecord = (value: unknown): ResumeUnknownRecord | undefined =>
    value && typeof value === 'object' && !Array.isArray(value)
        ? (value as ResumeUnknownRecord)
        : undefined;

export const asString = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
};

export const getNestedValue = (value: unknown, path: string[]): unknown => {
    let current = value;

    for (const key of path) {
        if (Array.isArray(current)) {
            const index = Number(key);
            if (Number.isNaN(index)) return undefined;
            current = current[index];
            continue;
        }

        const record = asRecord(current);
        if (!record) return undefined;
        current = record[key];
    }

    return current;
};

export const firstStringFromPaths = (value: unknown, paths: string[][]): string | undefined => {
    for (const path of paths) {
        const resolved = asString(getNestedValue(value, path));
        if (resolved) return resolved;
    }

    return undefined;
};
