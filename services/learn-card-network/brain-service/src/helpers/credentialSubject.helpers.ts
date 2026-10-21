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

        const credentialRecord = credential as Record<string, unknown>;
        if (credentialRecord.proof !== undefined) return;

        setSubjectIds(credentialRecord.credentialSubject, subjectDid);
    });
};

/**
 * Sets the recipient DID on the outer credential and unsigned credentials nested in a CLR.
 * Signed embedded credentials are immutable because changing their subject invalidates the proof.
 */
export const setCredentialSubjectIds = (credential: UnsignedVC | VC, subjectDid: string): void => {
    if (!credential.credentialSubject) {
        credential.credentialSubject = { id: subjectDid };
        return;
    }

    setSubjectIds(credential.credentialSubject, subjectDid);
};
