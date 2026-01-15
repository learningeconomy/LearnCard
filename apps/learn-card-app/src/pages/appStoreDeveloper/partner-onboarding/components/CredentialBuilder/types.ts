/**
 * Types for the interactive OBv3 Credential Builder
 */

// Field mode: static (user value), dynamic (mustache variable), or system (auto-injected)
export type FieldMode = 'static' | 'dynamic' | 'system';

// A field that can be static, dynamic (Mustache variable), or system-controlled
export interface TemplateFieldValue {
    value: string;
    isDynamic: boolean;
    variableName: string;
    isSystem?: boolean; // System-controlled field (auto-injected at issuance)
    systemDescription?: string; // Description of what the system will inject
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

// Helper to create a system-controlled field
export const systemField = (description: string): TemplateFieldValue => ({
    value: '',
    isDynamic: false,
    variableName: '',
    isSystem: true,
    systemDescription: description,
});

// OBv3 Result structure (for grades/scores)
export interface ResultTemplate {
    id: string; // Internal ID for React keys
    resultDescription?: TemplateFieldValue; // Reference to ResultDescription id
    value?: TemplateFieldValue; // The actual result value (e.g., "A", "95")
    status?: TemplateFieldValue; // Status like "Completed", "Passed"
    achievedLevel?: TemplateFieldValue; // Reference to RubricCriterionLevel
}

// OBv3 ResultDescription structure (defines possible results for an achievement)
export interface ResultDescriptionTemplate {
    id: string; // Internal ID and also used as reference
    name: TemplateFieldValue; // e.g., "Final Grade"
    resultType?: TemplateFieldValue; // e.g., "LetterGrade", "GradePointAverage", "Percent"
    allowedValue?: string[]; // e.g., ["A", "B", "C", "D", "F"]
    requiredValue?: TemplateFieldValue; // Minimum passing value
}

// OBv3 IdentifierEntry structure (for otherIdentifier arrays)
export interface IdentifierEntryTemplate {
    id: string; // Internal ID for React keys
    identifier: TemplateFieldValue;
    identifierType: TemplateFieldValue; // e.g., "sourcedId", "systemId"
}

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
    // Additional OBv3 fields
    humanCode?: TemplateFieldValue; // Human-readable code like "CS101"
    fieldOfStudy?: TemplateFieldValue;
    specialization?: TemplateFieldValue;
    creditsAvailable?: TemplateFieldValue;
    tag?: string[]; // Tags/keywords array
    inLanguage?: TemplateFieldValue;
    version?: TemplateFieldValue;
    otherIdentifier?: IdentifierEntryTemplate[];
    resultDescription?: ResultDescriptionTemplate[]; // Defines possible results
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
    // Additional OBv3 AchievementSubject fields
    result?: ResultTemplate[]; // Actual achieved results
    creditsEarned?: TemplateFieldValue;
    activityStartDate?: TemplateFieldValue;
    activityEndDate?: TemplateFieldValue;
    term?: TemplateFieldValue; // Academic term
    licenseNumber?: TemplateFieldValue;
    role?: TemplateFieldValue;
    identifier?: IdentifierEntryTemplate[]; // Recipient identifiers
}

// Custom extension field
export interface CustomFieldTemplate {
    id: string; // Internal ID for React keys
    key: TemplateFieldValue;
    value: TemplateFieldValue;
}

// Schema type for credential detection
export type CredentialSchemaType = 'obv3' | 'clr2' | 'custom';

// Full OBv3 Credential Template
export interface OBv3CredentialTemplate {
    // Schema type detection (for hybrid mode)
    schemaType?: CredentialSchemaType;
    
    // Raw JSON storage for non-OBv3 credentials (passthrough mode)
    rawJson?: Record<string, unknown>;
    
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
    
    // Dates (VC v2 syntax)
    validFrom: TemplateFieldValue;
    validUntil?: TemplateFieldValue;
    
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

// Default OBv3 contexts (VC v2)
export const DEFAULT_CONTEXTS = [
    'https://www.w3.org/ns/credentials/v2',
    'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json',
];

// Default types
export const DEFAULT_TYPES = [
    'VerifiableCredential',
    'OpenBadgeCredential',
];
