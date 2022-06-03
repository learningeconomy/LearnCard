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

export type AchievementCriteria = {
    type?: string;
    narrative?: string;
};

export type CredentialSubjectAchievement = {
    type?: string;
    name?: string;
    description?: string;
    criteria?: AchievementCriteria;
    image?: string;
};

export type CredentialSubject = {
    type?: string;
    id?: string;
    achievement?: CredentialSubjectAchievement;
};

export type Issuer =
    | string
    | { type?: string; id?: string; name?: string; url?: string; image?: string };

export type CredentialInfo = {
    title?: string;
    createdAt?: string;
    issuer?: Issuer;
    issuee?: Issuer;
    credentialSubject?: CredentialSubject;
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
    credentialSubject: CredentialSubject;
    id: string;
    issuanceDate: string;
    expirationDate?: string;
    issuer: Issuer;
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
