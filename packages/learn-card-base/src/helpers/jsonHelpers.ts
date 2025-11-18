import stableStringify from 'json-stringify-deterministic';

export const stringify = (obj: any) => stableStringify(obj);

export const parseWithRegex = (json: string) => {
    return JSON.parse(json, (_key, value) => {
        if (typeof value === 'string' && value.startsWith('/') && value.endsWith('/')) {
            return new RegExp(value.slice(1, -1));
        }

        return value;
    });
};
