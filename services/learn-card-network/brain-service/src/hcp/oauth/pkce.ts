import { createHash, randomBytes } from 'node:crypto';

export const createCodeVerifier = (): string => randomBytes(32).toString('base64url');

export const createCodeChallenge = (verifier: string): string =>
    createHash('sha256').update(verifier).digest('base64url');

export const verifyPkceS256 = (verifier: string, challenge: string): boolean =>
    createCodeChallenge(verifier) === challenge;
