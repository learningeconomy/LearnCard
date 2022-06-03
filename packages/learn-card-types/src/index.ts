export enum VerificationStatus {
    Success = 'Success',
    Failed = 'Failed',
    Error = 'Error',
}

export type VerificationItem = {
    check: string;
    status: VerificationStatus;
    message?: string;
    details?: string;
};

export type Proof = {
    type: string;
    proofPurpose: string;
    verificationMethod: string;
    jws: string;
    created: string;
};

export type UnsignedVC = {
    [key: string]: any;
    '@context': string | string[];
    credentialSubject: { id: string };
    id: string;
    issuanceDate: string;
    expirationDate?: string;
    issuer: string;
    type: string[];
};

export type VC = UnsignedVC & { proof: Proof };

export type UnsignedVP = {
    [key: string]: any;
    '@context': string | string[];
    holder: string;
    type: string[];
    verifiableCredential: VC;
};

export type VP = UnsignedVP & { proof: Proof };
