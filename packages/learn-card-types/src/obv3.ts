import { z } from 'zod';
import {
    UnsignedVCValidator,
    ProofValidator,
    ProfileValidator,
    ImageValidator,
    IdentifierEntryValidator,
} from './vc';

export const AlignmentTargetTypeValidator = z
    .enum([
        'ceasn:Competency',
        'ceterms:Credential',
        'CFItem',
        'CFRubric',
        'CFRubricCriterion',
        'CFRubricCriterionLevel',
        'CTDL',
    ])
    .or(z.string());
export type AlignmentTargetType = z.infer<typeof AlignmentTargetTypeValidator>;

export const AlignmentValidator = z.object({
    type: z.string().array().nonempty(),
    targetCode: z.string().optional(),
    targetDescription: z.string().optional(),
    targetName: z.string(),
    targetFramework: z.string().optional(),
    targetType: AlignmentTargetTypeValidator.optional(),
    targetUrl: z.string(),
});
export type Alignment = z.infer<typeof AlignmentValidator>;

export const KnownAchievementTypeValidator = z.enum([
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
]);
export type KnownAchievementType = z.infer<typeof KnownAchievementTypeValidator>;

export const AchievementTypeValidator = KnownAchievementTypeValidator.or(z.string());
export type AchievementType = z.infer<typeof AchievementTypeValidator>;

export const CriteriaValidator = z
    .object({ id: z.string().optional(), narrative: z.string().optional() })
    .catchall(z.any());
export type Criteria = z.infer<typeof CriteriaValidator>;

export const EndorsementSubjectValidator = z.object({
    id: z.string(),
    type: z.string().array().nonempty(),
    endorsementComment: z.string().optional(),
});
export type EndorsementSubject = z.infer<typeof EndorsementSubjectValidator>;

export const EndorsementCredentialValidator = UnsignedVCValidator.extend({
    credentialSubject: EndorsementSubjectValidator,
    proof: ProofValidator.or(ProofValidator.array()).optional(),
});
export type EndorsementCredential = z.infer<typeof EndorsementCredentialValidator>;

export const RelatedValidator = z.object({
    id: z.string(),
    '@language': z.string().optional(),
    version: z.string().optional(),
});
export type Related = z.infer<typeof RelatedValidator>;

export const ResultTypeValidator = z
    .enum([
        'GradePointAverage',
        'LetterGrade',
        'Percent',
        'PerformanceLevel',
        'PredictedScore',
        'RawScore',
        'Result',
        'RubricCriterion',
        'RubricCriterionLevel',
        'RubricScore',
        'ScaledScore',
        'Status',
    ])
    .or(z.string());
export type ResultType = z.infer<typeof ResultTypeValidator>;

export const RubricCriterionValidator = z
    .object({
        id: z.string(),
        type: z.string().array().nonempty(),
        alignment: AlignmentValidator.array().optional(),
        description: z.string().optional(),
        level: z.string().optional(),
        name: z.string(),
        points: z.string().optional(),
    })
    .catchall(z.any());
export type RubricCriterion = z.infer<typeof RubricCriterionValidator>;

export const ResultDescriptionValidator = z
    .object({
        id: z.string(),
        type: z.string().array().nonempty(),
        alignment: AlignmentValidator.array().optional(),
        allowedValue: z.string().array().optional(),
        name: z.string(),
        requiredLevel: z.string().optional(),
        requiredValue: z.string().optional(),
        resultType: ResultTypeValidator,
        rubricCriterionLevel: RubricCriterionValidator.array().optional(),
        valueMax: z.string().optional(),
        valueMin: z.string().optional(),
    })
    .catchall(z.any());
export type ResultDescription = z.infer<typeof ResultDescriptionValidator>;

export const AchievementValidator = z
    .object({
        id: z.string().optional(),
        type: z.string().array().nonempty(),
        alignment: AlignmentValidator.array().optional(),
        achievementType: AchievementTypeValidator.optional(),
        creator: ProfileValidator.optional(),
        creditsAvailable: z.number().optional(),
        criteria: CriteriaValidator,
        description: z.string(),
        endorsement: EndorsementCredentialValidator.array().optional(),
        fieldOfStudy: z.string().optional(),
        humanCode: z.string().optional(),
        image: ImageValidator.optional(),
        '@language': z.string().optional(),
        name: z.string(),
        otherIdentifier: IdentifierEntryValidator.array().optional(),
        related: RelatedValidator.array().optional(),
        resultDescription: ResultDescriptionValidator.array().optional(),
        specialization: z.string().optional(),
        tag: z.string().array().optional(),
        version: z.string().optional(),
    })
    .catchall(z.any());
export type Achievement = z.infer<typeof AchievementValidator>;

export const IdentityObjectValidator = z.object({
    type: z.string(),
    hashed: z.boolean(),
    identityHash: z.string(),
    identityType: z.string(),
    salt: z.string().optional(),
});
export type IdentityObject = z.infer<typeof IdentityObjectValidator>;

export const ResultStatusTypeValidator = z.enum([
    'Completed',
    'Enrolled',
    'Failed',
    'InProgress',
    'OnHold',
    'Withdrew',
]);
export type ResultStatusType = z.infer<typeof ResultStatusTypeValidator>;

export const ResultValidator = z
    .object({
        type: z.string().array().nonempty(),
        achievedLevel: z.string().optional(),
        alignment: AlignmentValidator.array().optional(),
        resultDescription: z.string().optional(),
        status: ResultStatusTypeValidator.optional(),
        value: z.string().optional(),
    })
    .catchall(z.any());
export type Result = z.infer<typeof ResultValidator>;

export const AchievementSubjectValidator = z
    .object({
        id: z.string().optional(),
        type: z.string().array().nonempty(),
        activityEndDate: z.string().optional(),
        activityStartDate: z.string().optional(),
        creditsEarned: z.number().optional(),
        achievement: AchievementValidator.optional(),
        identifier: IdentityObjectValidator.array().optional(),
        image: ImageValidator.optional(),
        licenseNumber: z.string().optional(),
        narrative: z.string().optional(),
        result: ResultValidator.array().optional(),
        role: z.string().optional(),
        source: ProfileValidator.optional(),
        term: z.string().optional(),
    })
    .catchall(z.any());
export type AchievementSubject = z.infer<typeof AchievementSubjectValidator>;

export const EvidenceValidator = z
    .object({
        id: z.string().optional(),
        type: z.string().array().nonempty(),
        narrative: z.string().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        genre: z.string().optional(),
        audience: z.string().optional(),
    })
    .catchall(z.any());
export type Evidence = z.infer<typeof EvidenceValidator>;

export const UnsignedAchievementCredentialValidator = UnsignedVCValidator.extend({
    name: z.string().optional(),
    description: z.string().optional(),
    image: ImageValidator.optional(),
    credentialSubject: AchievementSubjectValidator.or(
        AchievementSubjectValidator.array()
    ) as z.ZodUnion<
        [typeof AchievementSubjectValidator, z.ZodArray<typeof AchievementSubjectValidator>]
    >,
    endorsement: UnsignedVCValidator.array().optional(),
    evidence: EvidenceValidator.array().optional(),
});
export type UnsignedAchievementCredential = z.infer<typeof UnsignedAchievementCredentialValidator>;

export const AchievementCredentialValidator = UnsignedAchievementCredentialValidator.extend({
    proof: ProofValidator.or(ProofValidator.array()),
});
export type AchievementCredential = z.infer<typeof AchievementCredentialValidator>;
