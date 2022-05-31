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

export type VerificationCheck = {
    checks: string[];
    warnings: string[];
    errors: string[];
};

export type VCPluginMethods = {
    issueCredential: (credential: UnsignedVC) => Promise<VC>;
    verifyCredential: (credential: VC) => Promise<VerificationCheck>;
    issuePresentation: (credential: VC) => Promise<VP>;
    verifyPresentation: (presentation: VP) => Promise<VerificationCheck>;
    getTestVc: (subject?: string) => UnsignedVC;

    // Dependent methods
    getSubjectDid: () => string;
    getSubjectKeypair: () => Record<string, string>;
};
