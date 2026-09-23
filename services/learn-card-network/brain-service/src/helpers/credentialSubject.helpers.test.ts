import { describe, expect, it } from 'vitest';
import type { UnsignedVC } from '@learncard/types';

import { setCredentialSubjectIds } from './credentialSubject.helpers';

const collectSubjectIds = (credential: Record<string, unknown>): string[] => {
    const subject = credential.credentialSubject;
    const subjects = Array.isArray(subject) ? subject : [subject];

    return subjects.flatMap(currentSubject => {
        if (!currentSubject || typeof currentSubject !== 'object') return [];

        const subjectRecord = currentSubject as Record<string, unknown>;
        const embedded = subjectRecord.verifiableCredential;
        const embeddedCredentials = Array.isArray(embedded) ? embedded : embedded ? [embedded] : [];

        return [
            subjectRecord.id as string,
            ...embeddedCredentials.flatMap(nested =>
                collectSubjectIds(nested as Record<string, unknown>)
            ),
        ];
    });
};

describe('setCredentialSubjectIds', () => {
    it('patches every CLR learner subject without rewriting achievement identities', () => {
        const credential = {
            credentialSubject: {
                id: 'did:example:old-root',
                achievement: {
                    id: 'https://example.edu/transcript',
                    creator: { id: 'https://example.edu' },
                },
                verifiableCredential: [
                    {
                        credentialSubject: {
                            id: 'did:example:old-course',
                            achievement: {
                                id: 'https://example.edu/courses/imd-120',
                                creator: { id: 'https://example.edu/departments/design' },
                            },
                            verifiableCredential: {
                                credentialSubject: { id: 'did:example:old-assessment' },
                            },
                        },
                    },
                ],
            },
        } as unknown as UnsignedVC;

        setCredentialSubjectIds(credential, 'did:example:learner');

        expect(collectSubjectIds(credential as unknown as Record<string, unknown>)).toEqual([
            'did:example:learner',
            'did:example:learner',
            'did:example:learner',
        ]);
        expect(credential.credentialSubject).toMatchObject({
            achievement: {
                id: 'https://example.edu/transcript',
                creator: { id: 'https://example.edu' },
            },
            verifiableCredential: [
                {
                    credentialSubject: {
                        achievement: {
                            id: 'https://example.edu/courses/imd-120',
                            creator: { id: 'https://example.edu/departments/design' },
                        },
                    },
                },
            ],
        });
    });
});
