/**
 * Types for the interactive OBv3 Credential Builder
 */

// A field that can be static or dynamic (Mustache variable)
export interface TemplateFieldValue {
    value: string;
    isDynamic: boolean;
    variableName: string;
}

// Helper to create a static field
export const staticField = (value: string): TemplateFieldValue => ({
    value,
    isDynamic: false,
    variableName: '',
});

// Helper to create a dynamic field
export const dynamicField = (variableName: string, defaultValue: string = ''): TemplateFieldValue => ({
    value: defaultValue,
    isDynamic: true,
    variableName,
});

// OBv3 Achievement structure
export interface AchievementTemplate {
    id?: TemplateFieldValue;
    name: TemplateFieldValue;
    description: TemplateFieldValue;
    achievementType?: TemplateFieldValue;
    image?: TemplateFieldValue;
    criteria?: {
        id?: TemplateFieldValue;
        narrative?: TemplateFieldValue;
    };
    alignment?: AlignmentTemplate[];
}

// OBv3 Alignment structure
export interface AlignmentTemplate {
    id: string; // Internal ID for React keys
    targetName: TemplateFieldValue;
    targetUrl: TemplateFieldValue;
    targetDescription?: TemplateFieldValue;
    targetFramework?: TemplateFieldValue;
    targetCode?: TemplateFieldValue;
}

// OBv3 Evidence structure
export interface EvidenceTemplate {
    id: string; // Internal ID for React keys
    type?: TemplateFieldValue;
    name?: TemplateFieldValue;
    description?: TemplateFieldValue;
    narrative?: TemplateFieldValue;
    genre?: TemplateFieldValue;
    audience?: TemplateFieldValue;
}

// OBv3 Issuer/Profile structure
export interface IssuerTemplate {
    id?: TemplateFieldValue;
    name: TemplateFieldValue;
    url?: TemplateFieldValue;
    email?: TemplateFieldValue;
    description?: TemplateFieldValue;
    image?: TemplateFieldValue;
}

// OBv3 Credential Subject structure
export interface CredentialSubjectTemplate {
    id?: TemplateFieldValue; // Recipient DID - usually set at issuance
    name?: TemplateFieldValue; // Recipient name
    achievement: AchievementTemplate;
    evidence?: EvidenceTemplate[];
}

// Custom extension field
export interface CustomFieldTemplate {
    id: string; // Internal ID for React keys
    key: TemplateFieldValue;
    value: TemplateFieldValue;
}

// Full OBv3 Credential Template
export interface OBv3CredentialTemplate {
    // Contexts (usually fixed)
    contexts: string[];
    
    // Types
    types: string[];
    
    // Core credential info
    id?: TemplateFieldValue;
    name: TemplateFieldValue;
    description?: TemplateFieldValue;
    image?: TemplateFieldValue;
    
    // Issuer
    issuer: IssuerTemplate;
    
    // Subject
    credentialSubject: CredentialSubjectTemplate;
    
    // Dates
    issuanceDate: TemplateFieldValue;
    expirationDate?: TemplateFieldValue;
    
    // Custom fields in extensions
    customFields: CustomFieldTemplate[];
}

// UI State for the builder
export interface CredentialBuilderState {
    activeTab: 'builder' | 'json' | 'preview';
    expandedSections: Set<string>;
    jsonError: string | null;
    isDirty: boolean;
}

// Section identifiers
export type SectionId = 
    | 'credential'
    | 'issuer'
    | 'recipient'
    | 'achievement'
    | 'criteria'
    | 'alignment'
    | 'evidence'
    | 'dates'
    | 'custom';

// OBv3 Achievement Types per spec
export const OBV3_ACHIEVEMENT_TYPES = [
    'Achievement',
    'ApprenticeshipCertificate',
    'Assessment',
    'Assignment',
    'AssociateDegree',
    'Award',
    'Badge',
    'BachelorDegree',
    'Certificate',
    'CertificateOfCompletion',
    'Certification',
    'CommunityService',
    'Competency',
    'Course',
    'CoCurricular',
    'Degree',
    'Diploma',
    'DoctoralDegree',
    'Fieldwork',
    'GeneralEducationDevelopment',
    'JourneymanCertificate',
    'LearningProgram',
    'License',
    'Membership',
    'ProfessionalDoctorate',
    'QualityAssuranceCredential',
    'MasterCertificate',
    'MasterDegree',
    'MicroCredential',
    'ResearchDoctorate',
    'SecondarySchoolDiploma',
] as const;

// Default OBv3 contexts
export const DEFAULT_CONTEXTS = [
    'https://www.w3.org/2018/credentials/v1',
    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json',
    'https://ctx.learncard.com/boosts/1.0.0.json',
];

// Default types
export const DEFAULT_TYPES = [
    'VerifiableCredential',
    'OpenBadgeCredential',
    'BoostCredential',
];
