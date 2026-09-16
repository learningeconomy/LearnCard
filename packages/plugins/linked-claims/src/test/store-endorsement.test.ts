import { describe, expect, it, vi } from 'vitest';
import type { VC } from '@learncard/types';

import { getLinkedClaimsPlugin } from '../index';

type LinkedClaimsLearnCard = Parameters<typeof getLinkedClaimsPlugin>[0];

const endorsement = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'EndorsementCredential'],
    issuer: 'did:example:endorser',
    credentialSubject: {
        id: 'urn:uuid:original-123',
        type: ['EndorsementSubject'],
    },
} as unknown as VC;

const createTestContext = () => {
    const add = vi.fn().mockResolvedValue(true);
    const learnCard = {
        store: {
            LearnCloud: {
                uploadEncrypted: vi.fn().mockResolvedValue('lc:endorsement:1'),
            },
        },
        index: { LearnCloud: { add } },
    } as unknown as LinkedClaimsLearnCard;

    return { add, learnCard };
};

describe('storeEndorsement', () => {
    it('indexes the signed target when metadata omits credentialId', async () => {
        const { add, learnCard } = createTestContext();
        const plugin = getLinkedClaimsPlugin(learnCard);

        await plugin.methods.storeEndorsement(learnCard, endorsement, {});

        expect(add).toHaveBeenCalledWith(
            expect.objectContaining({
                credentialId: 'urn:uuid:original-123',
                originalCredentialId: 'urn:uuid:original-123',
            })
        );
    });

    it('preserves an explicit wrapper credential id', async () => {
        const { add, learnCard } = createTestContext();
        const plugin = getLinkedClaimsPlugin(learnCard);

        await plugin.methods.storeEndorsement(learnCard, endorsement, {
            credentialId: 'urn:uuid:wrapper-credential',
        });

        expect(add).toHaveBeenCalledWith(
            expect.objectContaining({
                credentialId: 'urn:uuid:wrapper-credential',
                originalCredentialId: 'urn:uuid:original-123',
            })
        );
    });
});
