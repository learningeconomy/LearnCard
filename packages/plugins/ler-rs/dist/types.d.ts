import { Plugin, LearnCard } from '@learncard/core';
import { VC as VerifiableCredential, VP as VerifiablePresentation } from '@learncard/types';
import type { VCPluginMethods, VCPluginDependentMethods } from '@learncard/vc-plugin';
export interface PersonProfile {
    id: string;
    givenName: string;
    familyName: string;
    email?: string;
}
export interface LerSkill {
    name: string;
    comments?: string[];
    yearsOfExperience?: number;
    endorsers?: Array<{
        person?: {
            name?: {
                formattedName?: string;
            };
        };
        organization?: {
            name?: string;
        };
    }>;
}
export interface WorkHistoryItem {
    narrative?: string;
    verifiableCredential?: VerifiableCredential;
    position?: string;
    employer?: string;
    start?: string;
    end?: string;
    [key: string]: unknown;
}
export interface EducationHistoryItem {
    narrative?: string;
    verifiableCredential?: VerifiableCredential;
    institution?: string;
    start?: string;
    end?: string;
    degree?: string;
    specializations?: string[];
    [key: string]: unknown;
}
export interface CertificationItem {
    narrative?: string;
    verifiableCredential?: VerifiableCredential;
    name?: string;
    issuingAuthority?: string;
    status?: string;
    effectiveTimePeriod?: {
        start?: string;
        end?: string;
    };
    [key: string]: unknown;
}
export interface LerRsRecord {
    person: {
        id: string;
        name: {
            givenName: string;
            familyName: string;
            formattedName?: string;
        };
    };
    communication?: {
        emails?: {
            address: string;
        }[];
        web?: string[];
        phone?: string[];
        address?: unknown;
        social?: string[];
    };
    skills?: LerSkill[];
    narratives?: string[];
    educationAndLearnings?: Array<({
        verifications?: VerifiableCredential[];
    } & Record<string, unknown>)>;
    employmentHistories?: Array<({
        verifications?: VerifiableCredential[];
    } & Record<string, unknown>)>;
    licenses?: Array<({
        verifications?: VerifiableCredential[];
    } & Record<string, unknown>)>;
    certifications?: Array<({
        verifications?: VerifiableCredential[];
    } & Record<string, unknown>)>;
    positionPreferences?: Record<string, unknown>;
    attachments?: Array<Record<string, unknown>>;
}
export interface CreateLerRecordParams {
    learnCard: LearnCard<any, 'id', VCPluginMethods & VCPluginDependentMethods>;
    person: PersonProfile;
    workHistory?: WorkHistoryItem[];
    educationHistory?: EducationHistoryItem[];
    certifications?: CertificationItem[];
    skills?: string[];
}
export interface CreateLerPresentationParams {
    learnCard: LearnCard<any, 'id', VCPluginMethods & VCPluginDependentMethods>;
    credentials: VerifiableCredential[];
    domain?: string;
    challenge?: string;
}
export interface VerifyLerPresentationParams {
    presentation: VerifiablePresentation | string;
    domain?: string;
    challenge?: string;
}
export interface VerificationResult {
    verified: boolean;
    presentationResult: {
        verified: boolean;
        errors?: string[];
    };
    credentialResults: {
        credential: VerifiableCredential;
        verified: boolean;
        isSelfIssued: boolean;
        errors?: string[];
    }[];
}
export type LERRSDependentLearnCard = LearnCard<any, 'id', VCPluginMethods & VCPluginDependentMethods>;
export type LERRSPluginMethods = {
    createLerRecord: (params: CreateLerRecordParams) => Promise<VerifiableCredential>;
    createLerPresentation: (params: CreateLerPresentationParams) => Promise<VerifiablePresentation>;
    verifyLerPresentation: (params: VerifyLerPresentationParams) => Promise<VerificationResult>;
};
export type LERRSPlugin = Plugin<'LER-RS', never, LERRSPluginMethods, 'id', VCPluginMethods & VCPluginDependentMethods>;
//# sourceMappingURL=types.d.ts.map