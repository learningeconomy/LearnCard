/** V2 owner authorization, distinct from authentication and from recovery. */
export interface EscrowEnrollmentIntent {
    version: 2;
    tenant: string;
    did: string;
    authorityGeneration: string;
    expectedEnrollmentVersion: number;
    action: 'enroll' | 'replace' | 'disable' | 'carry';
    sourceBlobIdentity: string | null;
    targetBlobIdentity: string | null;
    pinAction: 'set' | 'change' | 'clear' | 'keep';
    shareVersion: number;
    enrollmentEpoch: number;
    requestId: string;
    allowRewrap: boolean;
    /** P9.1 (attack C): required (and must match the blob) on enroll/replace;
     *  must be null on disable/carry (the enclave carries the prior value forward).
     *  Changing the address requires a fresh signed `replace` intent, not an edit. */
    recoveryEmail: string | null;
    /** One of the app's compiled template languages (currently en/es/fr/ar). */
    recoveryLanguage: string | null;
}

/** Signature is canonical padded standard base64 of raw Ed25519 R || S. */
export interface SignedEscrowEnrollmentIntent {
    intent: EscrowEnrollmentIntent;
    signature: string;
}
