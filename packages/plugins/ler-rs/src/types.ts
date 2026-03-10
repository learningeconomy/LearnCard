import { Plugin, LearnCard } from '@learncard/core';
import { VC as VerifiableCredential, VP as VerifiablePresentation, UnsignedVC, UnsignedVP, VerificationCheck } from '@learncard/types';
import type { VCPluginMethods, VCPluginDependentMethods } from '@learncard/vc-plugin';

export const LER_RS_CREDENTIAL_CONTEXT_V1 = 'https://www.w3.org/2018/credentials/v1';
export const LER_RS_VC_CONTEXT_V45 = 'http://schema.hropenstandards.org/4.5/recruiting/json/VerifiableCredentialLER-RSType.json';
export const LER_RS_TYPE_URI_V45 = 'http://schema.hropenstandards.org/4.5/recruiting/json/LER-RSType.json';
export const LEGACY_LER_RS_TYPE_URI_V44 = 'http://schema.hropenstandards.org/4.4/recruiting/json/ler-rs/LER-RSType.json';
export const LEGACY_LER_RS_TYPE_TOKEN = 'LERRS';

export interface PersonProfile {
  id: string; // User's DID
  givenName: string;
  familyName: string;
  formattedName?: string;
  email?: string;
}

export interface LerSkill {
  name: string;
  comments?: string[];
  description?: string;
  yearsOfExperience?: number;
  endorsers?: Array<{ person?: { name?: { formattedName?: string } }; organization?: { name?: string } }>;
}

export interface WorkHistoryItem {
  narrative?: string;
  verifiableCredential?: VerifiableCredential;
  verifications?: VerifiableCredential[];
  // Common self-asserted fields
  position?: string;
  employer?: string;
  start?: string;
  end?: string;
  [key: string]: unknown;
}

export interface EducationHistoryItem {
  narrative?: string;
  verifiableCredential?: VerifiableCredential;
  verifications?: VerifiableCredential[];
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
  verifications?: VerifiableCredential[];
  name?: string;
  issuingAuthority?: string;
  status?: string;
  effectiveTimePeriod?: { validFrom?: string; validTo?: string };
  [key: string]: unknown;
}

export interface LerNarrative {
  name: string;
  texts: Array<{
    name: string;
    lines: string[];
  }>;
}

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
    address?: unknown;
    social?: Array<Record<string, unknown>>;
  };
  skills?: LerSkill[];
  narratives?: LerNarrative[];
  educationAndLearnings?: Array<({ verifications?: VerifiableCredential[] } & Record<string, unknown>)>;
  employmentHistories?: Array<({ verifications?: VerifiableCredential[] } & Record<string, unknown>)>;
  licenses?: Array<({ verifications?: VerifiableCredential[] } & Record<string, unknown>)>;
  certifications?: Array<({ verifications?: VerifiableCredential[] } & Record<string, unknown>)>;
  employmentPreferences?: Array<Record<string, unknown>>;
  positionPreferences?: Array<Record<string, unknown>>;
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

export type LERRSDependentLearnCard = LearnCard<any, 'id', VCPluginMethods & VCPluginDependentMethods>;

export type LERRSPluginMethods = {
  createLerRecord: (params: CreateLerRecordParams) => Promise<VerifiableCredential>;
  createLerPresentation: (params: CreateLerPresentationParams) => Promise<VerifiablePresentation>;
  verifyLerPresentation: (params: VerifyLerPresentationParams) => Promise<VerificationResult>;
};

export type LERRSPlugin = Plugin<'LER-RS', never, LERRSPluginMethods, 'id', VCPluginMethods & VCPluginDependentMethods>;
