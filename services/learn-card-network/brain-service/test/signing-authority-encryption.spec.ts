import { describe, expect, it } from 'vitest';
import { JWEValidator, VCValidator, type UnsignedVC } from '@learncard/types';
import { getLearnCard } from '@helpers/learnCard.helpers';
import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';
import type { CredentialIssuer } from 'types/issuer';
import type { SigningAuthorityForUserType } from 'types/profile';

const issuer = {
    type: 'profile',
    profile: { profileId: 'signer-owner' },
} as unknown as CredentialIssuer;
const authority = {
    signingAuthority: { endpoint: 'https://sa.example' },
    relationship: { name: 'test', did: 'did:example:authority' },
} as unknown as SigningAuthorityForUserType;
const unsignedFor = (subjectDid: string): UnsignedVC => ({
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    validFrom: '2026-01-01T00:00:00Z',
    name: 'Private signer credential',
    credentialSubject: { id: subjectDid },
});

describe('test signing-authority encryption', () => {
    it('encrypts for subject, owner, and delegated readers but not outsiders or the brain signer', async () => {
        const subject = await getLearnCard('1'.repeat(64));
        const owner = await getLearnCard('2'.repeat(64));
        const delegate = await getLearnCard('3'.repeat(64));
        const outsider = await getLearnCard('4'.repeat(64));
        const brain = await getLearnCard();
        const issued = await issueCredentialWithSigningAuthority(
            issuer,
            unsignedFor(subject.id.did()),
            authority,
            'network.example',
            true,
            owner.id.did(),
            false,
            [delegate.id.did()]
        );
        const jwe = JWEValidator.parse(issued.credential);
        const decrypted = await subject.invoke.decryptDagJwe(jwe);
        expect(decrypted).toMatchObject({
            name: 'Private signer credential',
            credentialSubject: { id: subject.id.did() },
        });
        expect(await owner.invoke.decryptDagJwe(jwe)).toEqual(decrypted);
        expect(await delegate.invoke.decryptDagJwe(jwe)).toEqual(decrypted);
        expect(await outsider.invoke.decryptDagJwe(jwe).catch(() => undefined)).toBeFalsy();
        expect(await brain.invoke.decryptDagJwe(jwe).catch(() => undefined)).toBeFalsy();
    });

    it('preserves signed status coordinates when explicitly opting out of encryption', async () => {
        const subject = await getLearnCard('6'.repeat(64));
        const status = {
            id: 'https://network.example/status/1#7',
            type: 'BitstringStatusListEntry' as const,
            statusPurpose: 'revocation' as const,
            statusListIndex: '7',
            statusListCredential: 'https://network.example/status/1',
        };
        const issued = await issueCredentialWithSigningAuthority(
            issuer,
            { ...unsignedFor(subject.id.did()), credentialStatus: status },
            authority,
            'network.example',
            false,
            undefined,
            false
        );
        expect(VCValidator.parse(issued.credential).credentialStatus).toEqual(status);
        expect(issued.statusEntries).toEqual([status]);
    });
});
