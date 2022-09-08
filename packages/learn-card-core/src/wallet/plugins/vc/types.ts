import { UnsignedVC, VC, UnsignedVP, VP, VerificationCheck } from '@learncard/types';
import { KeyPair, ProofOptions } from '../didkit/types';
import { DiscriminatedUnionize } from 'types/helpers';

export type TestVcs = {
    basic: { did?: string; subject?: string; issuanceDate?: string };
    achievement: {
        did?: string;
        subject?: string;
        name?: string;
        achievementName?: string;
        description?: string;
        criteriaNarrative?: string;
        issuanceDate?: string;
    };
    fullAchievement: {
        did?: string;
        subject?: string;
        name?: string;
        achievementName?: string;
        description?: string;
        issuanceDate?: string;
        expirationDate?: string;
    };
};

export type GetTestVc = (args?: DiscriminatedUnionize<TestVcs>) => UnsignedVC;

export type DependentMethods = {
    getSubjectDid: (type: 'key') => string;
    getSubjectKeypair: () => KeyPair;
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

export type VCPluginMethods = DependentMethods & {
    issueCredential: (credential: UnsignedVC) => Promise<VC>;
    verifyCredential: (credential: VC) => Promise<VerificationCheck>;
    issuePresentation: (credential: UnsignedVP) => Promise<VP>;
    verifyPresentation: (presentation: VP) => Promise<VerificationCheck>;
    getTestVc: GetTestVc;
    getTestVp: (credential?: VC) => Promise<UnsignedVP>;
};

export type VerifyExtension = { verifyCredential: (credential: VC) => Promise<VerificationCheck> };
