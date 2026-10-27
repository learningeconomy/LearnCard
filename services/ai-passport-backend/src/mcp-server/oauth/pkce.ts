import crypto from 'crypto';

export function verifyPKCE(
    codeVerifier: string,
    codeChallenge: string,
    codeChallengeMethod: string
): boolean {
    if (codeChallengeMethod === 'S256') {
        const hash = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
        return hash === codeChallenge;
    } else if (codeChallengeMethod === 'plain') {
        return codeVerifier === codeChallenge;
    }

    return false;
}
