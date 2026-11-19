import type { UnsignedVC } from '@learncard/types';
import type { BespokeLearnCard } from '../types/learn-card';

/** Prefix used for the LearnCloud index `id` of every verifiable-data record. */
export const VERIFIABLE_DATA_INDEX_PREFIX = '__verifiable_data_';

/** Builds the canonical index `id` for a verifiable-data key. */
export const getVerifiableDataIndexId = (key: string): string =>
    `${VERIFIABLE_DATA_INDEX_PREFIX}${key}__`;

/**
 * Inline JSON-LD context for VerifiableData credentials.
 * Uses @json type so the payload is preserved as a native JSON literal
 * without needing to stringify/parse.
 */
const VERIFIABLE_DATA_CONTEXT = {
    VerifiableData: 'https://docs.learncard.com/schemas/credentials/verifiable-data#VerifiableData',
    dataKey: 'https://docs.learncard.com/schemas/credentials/verifiable-data#dataKey',
    dataPayload: {
        '@id': 'https://docs.learncard.com/schemas/credentials/verifiable-data#dataPayload',
        '@type': '@json',
    },
} as const;

/**
 * Creates a simple self-issued VC v2 credential containing arbitrary data.
 * The data is stored as a native JSON literal via the @json-typed dataPayload field.
 */
export const createVerifiableDataCredential = async <T>(
    wallet: BespokeLearnCard,
    key: string,
    data: T,
    options?: { name?: string; description?: string }
) => {
    const did = wallet.id.did();
    const validFrom = new Date().toISOString();

    const unsignedCredential: UnsignedVC = {
        '@context': ['https://www.w3.org/ns/credentials/v2', VERIFIABLE_DATA_CONTEXT],
        type: ['VerifiableCredential', 'VerifiableData'],
        issuer: did,
        validFrom,
        ...(options?.name && { name: options.name }),
        ...(options?.description && { description: options.description }),
        credentialSubject: {
            id: did,
            dataKey: key,
            dataPayload: data,
        },
    };

    return wallet.invoke.issueCredential(unsignedCredential);
};
