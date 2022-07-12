import { UnsignedVC, UnsignedVP, VC, VP, VerificationCheck } from '@learncard/types';

export type KeyPair = { kty: string; crv: string; x: string; d: string };

export type ProofOptions = {
    verificationMethod: string;
    proofPurpose: string;
};

export type DidkitPluginMethods = {
    generateEd25519KeyFromBytes: (bytes: Uint8Array) => KeyPair;
    keyToDid: (type: string, keypair: KeyPair) => string;
    keyToVerificationMethod: (type: string, keypair: KeyPair) => Promise<string>;
    issueCredential: (
        credential: UnsignedVC,
        options: ProofOptions,
        keypair: KeyPair
    ) => Promise<VC>;
    verifyCredential: (credential: VC) => Promise<VerificationCheck>;
    issuePresentation: (
        presentation: UnsignedVP,
        options: ProofOptions,
        keypair: KeyPair
    ) => Promise<VP>;
    verifyPresentation: (presentation: VP) => Promise<VerificationCheck>;
};
