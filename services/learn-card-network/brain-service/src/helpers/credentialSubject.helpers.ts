import type { UnsignedVC, VC } from '@learncard/types';

const setSubjectIds = (subject: unknown, subjectDid: string): void => {
    if (Array.isArray(subject)) {
        subject.forEach(nestedSubject => setSubjectIds(nestedSubject, subjectDid));
        return;
    }

    if (!subject || typeof subject !== 'object') return;

    const mutableSubject = subject as Record<string, unknown>;
    mutableSubject.id = subjectDid;

    const embeddedCredentials = mutableSubject.verifiableCredential;
    const credentials = Array.isArray(embeddedCredentials)
        ? embeddedCredentials
        : [embeddedCredentials];

    credentials.forEach(credential => {
        if (!credential || typeof credential !== 'object' || Array.isArray(credential)) return;

        setSubjectIds((credential as Record<string, unknown>).credentialSubject, subjectDid);
    });
};

/** Sets the recipient DID on the outer credential and every credential nested in a CLR. */
export const setCredentialSubjectIds = (credential: UnsignedVC | VC, subjectDid: string): void => {
    setSubjectIds(credential.credentialSubject, subjectDid);
};
