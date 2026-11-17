import { randomBytes } from 'node:crypto';

import type { JWE } from '@learncard/types';

import { getLearnCard } from '@helpers/learnCard.helpers';

export const WEBHOOK_SECRET_PREFIX = 'whsec_';
export const WEBHOOK_SECRET_JWE_PREFIX = 'lc-whsec-jwe:v1:';

/** A new plaintext signing secret: `whsec_` plus 32 random bytes in base64url. */
export const generateWebhookSecret = (): string =>
    `${WEBHOOK_SECRET_PREFIX}${randomBytes(32).toString('base64url')}`;

/** Encrypts a signing secret to the brain-service key before it is stored on an Integration. */
export const encryptWebhookSecret = async (secret: string): Promise<string> => {
    const learnCard = await getLearnCard();
    const jwe = await learnCard.invoke.createDagJwe({ secret }, [learnCard.id.did()]);

    return `${WEBHOOK_SECRET_JWE_PREFIX}${JSON.stringify(jwe)}`;
};

/** Decrypts a stored signing secret. Only delivery and rotation may call this. */
export const decryptWebhookSecret = async (stored: string): Promise<string> => {
    if (!stored.startsWith(WEBHOOK_SECRET_JWE_PREFIX)) {
        throw new Error('Webhook secret is not encrypted');
    }

    const learnCard = await getLearnCard();
    const jwe = JSON.parse(stored.slice(WEBHOOK_SECRET_JWE_PREFIX.length)) as JWE;
    const decrypted = await learnCard.invoke.decryptDagJwe<unknown>(jwe);

    // Some crypto backends return an empty value instead of rejecting failed decryption.
    if (
        !decrypted ||
        typeof decrypted !== 'object' ||
        !('secret' in decrypted) ||
        typeof decrypted.secret !== 'string' ||
        decrypted.secret.length === 0
    ) {
        throw new Error('Unable to decrypt webhook secret');
    }

    return decrypted.secret;
};
