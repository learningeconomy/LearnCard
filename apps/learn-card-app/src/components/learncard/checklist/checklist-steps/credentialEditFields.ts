/** Read a nested VC path, returning '' for missing values. Handles array values (e.g. achievementType: ["Certificate"]) */
export const getField = (vc: Record<string, unknown>, path: string): string => {
    const value = path.split('.').reduce<unknown>((obj, key) => {
        if (Array.isArray(obj)) obj = obj[0];
        if (obj && typeof obj === 'object' && Object.hasOwn(obj, key)) {
            return (obj as Record<string, unknown>)[key];
        }
        return undefined;
    }, vc);
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') return value[0];
    return '';
};

/** Set a nested path on a deep-cloned VC. Empty string removes the key. */
export const setField = (
    vc: Record<string, unknown>,
    path: string,
    value: string
): Record<string, unknown> => {
    const clone = JSON.parse(JSON.stringify(vc));
    const keys = path.split('.');
    let obj = clone;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        // Guard against prototype pollution - inline check for CodeQL recognition
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            return clone;
        }
        const existing = obj[key];
        if (Array.isArray(existing)) {
            // VC 1.1 permits credentialSubject as an array - traverse into first element
            if (existing.length === 0) {
                existing.push({});
            }
            const firstElement = existing[0];
            // If first element is a primitive (e.g., ["did:example:123"]), replace with object
            if (typeof firstElement !== 'object' || firstElement === null) {
                existing[0] = {};
            }
            obj = existing[0];
        } else if (typeof existing !== 'object' || existing === null) {
            // Replace null/primitive with object to allow deeper property assignment
            obj[key] = {};
            obj = obj[key];
        } else {
            obj = existing;
        }
    }
    const lastKey = keys[keys.length - 1];
    // Guard against prototype pollution - inline check for CodeQL recognition
    if (lastKey === '__proto__' || lastKey === 'constructor' || lastKey === 'prototype') {
        return clone;
    }
    if (value === '') {
        delete obj[lastKey];
    } else {
        obj[lastKey] = value;
    }
    return clone;
};
