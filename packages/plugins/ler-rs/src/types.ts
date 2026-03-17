import { Plugin, LearnCard } from '@learncard/core';
import {
    VC as VerifiableCredential,
    VP as VerifiablePresentation,
    UnsignedVC,
    UnsignedVP,
    VerificationCheck,
} from '@learncard/types';
import type { VCPluginMethods, VCPluginDependentMethods } from '@learncard/vc-plugin';

/**
 * Legacy W3C VC v1 context kept for interop with previously issued records.
 */
export const LER_RS_CREDENTIAL_CONTEXT_V1 = 'https://www.w3.org/2018/credentials/v1';
/**
 * Base W3C VC v2 context used by newly issued LER-RS credentials and presentations.
 */
export const LER_RS_CREDENTIAL_CONTEXT_V2 = 'https://www.w3.org/ns/credentials/v2';
/**
 * HR Open Standards VC wrapper context for LER-RS v4.5.
 */
export const LER_RS_VC_CONTEXT_V45 =
    'http://schema.hropenstandards.org/4.5/recruiting/json/VerifiableCredentialLER-RSType.json';
/**
 * Canonical LER-RS type URI for v4.5.
 */
export const LER_RS_TYPE_URI_V45 =
    'http://schema.hropenstandards.org/4.5/recruiting/json/LER-RSType.json';
/**
 * Legacy LER-RS type URI for v4.4 interop.
 */
export const LEGACY_LER_RS_TYPE_URI_V44 =
    'http://schema.hropenstandards.org/4.4/recruiting/json/ler-rs/LER-RSType.json';
/**
 * Legacy short type token used by older issuers.
 */
export const LEGACY_LER_RS_TYPE_TOKEN = 'LERRS';
/**
 * Hosted TCP JSON-LD context URL.
 *
 * Note: current local wrapper issuance can inline context during local testing.
 */
export const TCP_CONTEXT_V1 = 'https://ctx.learncard.com/tcp/1.0.0.json';
/**
 * LearnCard-defined wrapper VC type for TCP resume package artifacts.
 *
 * This is intentionally NOT a canonical HR Open Standards LER-RS type;
 * it is a custom wrapper used to bind PDF URL/hash + included credential refs.
 */
export const TCP_WRAPPER_TYPE = 'TrustedCareerProfile';

/**
 * Identity details used to populate `credentialSubject.person`.
 */
export interface PersonProfile {
    /** Subject DID for the issued LER-RS record. */
    id: string;
    /** Given/first name. */
    givenName: string;
    /** Family/last name. */
    familyName: string;
    /** Optional display name override. */
    formattedName?: string;
    /** Optional contact email to include in communication block. */
    email?: string;
    /** Optional contact phone to include in communication block. */
    phone?: string;
    /** Optional physical/mailing address to include in communication block. */
    address?: {
        formattedAddress?: string;
        line?: string;
        city?: string;
        postalCode?: string;
        countryCode?: string;
    };
    /** Optional website URLs to include in communication block. */
    web?: Array<{ url: string; name?: string }>;
    /** Optional social profile URLs to include in communication block. */
    social?: Array<{ uri: string; name?: string }>;
}

/**
 * Skill item structure used inside generated LER-RS records.
 */
export interface LerSkill {
    name: string;
    comments?: string[];
    description?: string;
    yearsOfExperience?: number;
    endorsers?: Array<{
        person?: { name?: { formattedName?: string } };
        organization?: { name?: string };
    }>;
}

/**
 * Source work history entry. Can be self-asserted fields and/or third-party verification VCs.
 */
export interface WorkHistoryItem {
    narrative?: string;
    descriptions?: string[];
    verifiableCredential?: VerifiableCredential;
    verifications?: VerifiableCredential[];
    // Common self-asserted fields
    position?: string;
    employer?: string;
    start?: string;
    end?: string;
    current?: boolean;
    [key: string]: unknown;
}

/**
 * Source education entry. Can include freeform fields and optional verification VCs.
 */
export interface EducationHistoryItem {
    narrative?: string;
    descriptions?: string[];
    verifiableCredential?: VerifiableCredential;
    verifications?: VerifiableCredential[];
    institution?: string;
    start?: string;
    end?: string;
    current?: boolean;
    degree?: string;
    specializations?: string[];
    [key: string]: unknown;
}

/**
 * Source certification entry for `credentialSubject.certifications`.
 */
export interface CertificationItem {
    narrative?: string;
    descriptions?: string[];
    verifiableCredential?: VerifiableCredential;
    verifications?: VerifiableCredential[];
    name?: string;
    issuingAuthority?: string | Record<string, unknown>;
    status?: string;
    start?: string;
    end?: string;
    effectiveTimePeriod?: { validFrom?: string; validTo?: string };
    [key: string]: unknown;
}

/**
 * Narrative section block supported by LER-RS schema.
 */
export interface LerNarrative {
    name: string;
    texts: Array<{
        name: string;
        lines: string[];
    }>;
}

/**
 * Typed shape of the LER-RS object embedded into `credentialSubject`.
 */
export interface LerRsRecord {
    type: string;
    documentId?: { value: string };
    person: {
        name: {
            given: string;
            family: string;
            formattedName?: string;
        };
    };
    communication?: {
        email?: { address: string }[];
        web?: { url: string; name?: string }[];
        phone?: Array<Record<string, unknown>>;
        address?: Array<Record<string, unknown>>;
        social?: Array<Record<string, unknown>>;
    };
    skills?: LerSkill[];
    narratives?: LerNarrative[];
    educationAndLearnings?: Array<
        { verifications?: VerifiableCredential[] } & Record<string, unknown>
    >;
    employmentHistories?: Array<
        { verifications?: VerifiableCredential[] } & Record<string, unknown>
    >;
    licenses?: Array<{ verifications?: VerifiableCredential[] } & Record<string, unknown>>;
    certifications?: Array<{ verifications?: VerifiableCredential[] } & Record<string, unknown>>;
    employmentPreferences?: Array<Record<string, unknown>>;
    positionPreferences?: Array<Record<string, unknown>>;
    attachments?: Array<Record<string, unknown>>;
}

/**
 * Parameters for issuing a signed LER-RS VC from normalized source data.
 */
export interface CreateLerRecordParams {
    learnCard: LearnCard<any, 'id', VCPluginMethods & VCPluginDependentMethods>;
    person: PersonProfile;
    workHistory?: WorkHistoryItem[];
    educationHistory?: EducationHistoryItem[];
    certifications?: CertificationItem[];
    skills?: string[];
    narratives?: LerNarrative[];
    attachments?: Array<Record<string, unknown>>;
}

/**
 * Parameters for issuing a VP that packages one or more credentials including at least one LER-RS credential.
 */
export interface CreateLerPresentationParams {
    learnCard: LearnCard<any, 'id', VCPluginMethods & VCPluginDependentMethods>;
    credentials: VerifiableCredential[];
    domain?: string;
    challenge?: string;
}

/**
 * Parameters for verifying a LER-focused VP and nested credentials.
 */
export interface VerifyLerPresentationParams {
    presentation: VerifiablePresentation | string;
    domain?: string;
    challenge?: string;
}

/**
 * Credential reference stored in TCP wrapper VC.
 */
export interface TcpIncludedCredentialRef {
    /** Resolved VC id when available; falls back to URI if id is unavailable. */
    id: string;
    /** Category label used for UI grouping and downstream filtering. */
    category: string;
}

/**
 * Parameters for issuing TrustedCareerProfile wrapper VCs.
 */
export interface CreateTcpWrapperVcParams {
    learnCard: LearnCard<any, 'id', VCPluginMethods & VCPluginDependentMethods>;
    wrapperId: string;
    subjectDid?: string;
    pdfUrl: string;
    pdfHash: string;
    includedCredentials: TcpIncludedCredentialRef[];
    generatedAt?: string;
    /** Timestamp used as the issued credential's `validFrom` value. */
    issuanceDate?: string;
    coSignerDid?: string;
    enableCoSign?: boolean;
}

/**
 * Structured verification output for LER presentation verification.
 */
export interface VerificationResult {
    verified: boolean; // Overall status
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

/**
 * LearnCard dependency contract required by this plugin.
 */
export type LERRSDependentLearnCard = LearnCard<
    any,
    'id',
    VCPluginMethods & VCPluginDependentMethods
>;

/**
 * Public invoke methods exposed by the LER-RS plugin.
 */
export type LERRSPluginMethods = {
    createLerRecord: (params: CreateLerRecordParams) => Promise<VerifiableCredential>;
    createLerPresentation: (params: CreateLerPresentationParams) => Promise<VerifiablePresentation>;
    verifyLerPresentation: (params: VerifyLerPresentationParams) => Promise<VerificationResult>;
    createTcpWrapperVc: (params: CreateTcpWrapperVcParams) => Promise<VerifiableCredential>;
};

/**
 * Plugin type definition for registration in LearnCard.
 */
export type LERRSPlugin = Plugin<
    'LER-RS',
    never,
    LERRSPluginMethods,
    'id',
    VCPluginMethods & VCPluginDependentMethods
>;
