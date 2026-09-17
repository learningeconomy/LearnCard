import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getCredentialName: (credential: {
        boostCredential?: { credentialSubject?: { achievement?: { name?: string } } };
        credentialSubject?: { achievement?: { name?: string } };
    }) =>
        credential.boostCredential?.credentialSubject?.achievement?.name ??
        credential.credentialSubject?.achievement?.name,
}));
vi.mock('learn-card-base/svgs/Camera', () => ({ default: () => React.createElement('span') }));
vi.mock('learn-card-base/svgs/Document', () => ({ default: () => React.createElement('span') }));
vi.mock('learn-card-base/svgs/Video', () => ({ default: () => React.createElement('span') }));
vi.mock('learn-card-base/svgs/LinkChain', () => ({ default: () => React.createElement('span') }));

import {
    convertAttachmentsToEvidence,
    EndorsementMediaOptionsEnum,
    getEndorsementTarget,
} from './endorsement-state.helpers';

describe('convertAttachmentsToEvidence', () => {
    it('serializes uploaded media as standard OBv3 Evidence', () => {
        expect(
            convertAttachmentsToEvidence([
                {
                    title: 'Project photo',
                    fileName: 'project.png',
                    fileSize: '24 kB',
                    fileType: 'image/png',
                    url: 'https://example.com/project.png',
                    type: EndorsementMediaOptionsEnum.photo,
                },
            ])
        ).toEqual([
            {
                id: 'https://example.com/project.png',
                type: ['Evidence'],
                name: 'Project photo',
                genre: EndorsementMediaOptionsEnum.photo,
            },
        ]);
    });
});

describe('getEndorsementTarget', () => {
    it('uses the wrapper id and displayed credential name', () => {
        const credential = {
            id: 'urn:uuid:credential-a',
            type: ['VerifiableCredential', 'CertifiedBoostCredential'],
            boostCredential: {
                type: ['VerifiableCredential', 'OpenBadgeCredential'],
                credentialSubject: {
                    id: 'did:example:holder',
                    achievement: { name: 'First Aid' },
                },
            },
        };

        expect(getEndorsementTarget(credential as never)).toEqual({
            id: 'urn:uuid:credential-a',
            name: 'First Aid',
        });
    });

    it('uses the trusted wrapper when the display credential is unwrapped', () => {
        const credential = {
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            credentialSubject: {
                id: 'did:example:holder',
                achievement: { name: 'First Aid' },
            },
        };
        const targetCredential = { id: 'urn:uuid:credential-a' };

        expect(getEndorsementTarget(credential as never, targetCredential as never)).toEqual({
            id: 'urn:uuid:credential-a',
            name: 'First Aid',
        });
    });

    it('rejects credentials without a credential-specific id', () => {
        expect(() =>
            getEndorsementTarget({
                type: ['VerifiableCredential'],
                credentialSubject: { id: 'did:example:holder' },
            } as never)
        ).toThrow('The credential must have an id before it can be endorsed');
    });
});
