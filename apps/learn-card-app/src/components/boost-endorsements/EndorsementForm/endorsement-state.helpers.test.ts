import { describe, expect, it } from 'vitest';

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

    it('rejects credentials without a credential-specific id', () => {
        expect(() =>
            getEndorsementTarget({
                type: ['VerifiableCredential'],
                credentialSubject: { id: 'did:example:holder' },
            } as never)
        ).toThrow('The credential must have an id before it can be endorsed');
    });
});
