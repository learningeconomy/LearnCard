/** V1 owner authorization, distinct from authentication and from recovery. */
export interface EscrowEnrollmentIntent {
    version: 1;
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
}

/** Signature is canonical padded standard base64 of raw Ed25519 R || S. */
export interface SignedEscrowEnrollmentIntent {
    intent: EscrowEnrollmentIntent;
    signature: string;
}
