import { createHash } from 'crypto';

export const computeBoostTemplateHash = (boostTemplate: Record<string, unknown>): string => {
    return createHash('sha256').update(JSON.stringify(boostTemplate)).digest('hex');
};

export const verifyBoostTemplateHash = (
    credential: Record<string, unknown>,
    boostTemplate: Record<string, unknown>
): boolean => {
    return (
        typeof credential.boostTemplateHash === 'string' &&
        credential.boostTemplateHash === computeBoostTemplateHash(boostTemplate)
    );
};
