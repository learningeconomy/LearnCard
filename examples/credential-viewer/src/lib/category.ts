/**
 * Simplified category detection for credential fixtures.
 *
 * Mirrors the CATEGORY_MAP + getDefaultCategoryForCredential logic from
 * learn-card-base/src/helpers/credentialHelpers.ts so that credentials
 * issued from the viewer land in the correct wallet category.
 */

export type CredentialCategory =
    | 'Achievement'
    | 'ID'
    | 'Membership'
    | 'Learning History'
    | 'Work History'
    | 'Social Badge'
    | 'Accommodation';

export const ALL_CATEGORIES: CredentialCategory[] = [
    'Achievement',
    'ID',
    'Membership',
    'Learning History',
    'Work History',
    'Social Badge',
    'Accommodation',
];

const CATEGORY_MAP: Record<string, CredentialCategory> = {
    // Achievement
    Achievement: 'Achievement',
    Award: 'Achievement',
    Badge: 'Achievement',
    CommunityService: 'Achievement',
    Degree: 'Achievement',
    Certificate: 'Achievement',
    Competency: 'Achievement',
    Assessment: 'Achievement',
    Certification: 'Achievement',
    MicroCredential: 'Achievement',

    // ID
    License: 'ID',
    Membership: 'ID',
    PermanentResidentCard: 'ID',
    AlumniCredential: 'ID',

    // Work History
    ApprenticeshipCertificate: 'Work History',
    JourneymanCertificate: 'Work History',
    MasterCertificate: 'Work History',

    // Learning History
    Assignment: 'Learning History',
    AssociateDegree: 'Learning History',
    BachelorDegree: 'Learning History',
    CertificateOfCompletion: 'Learning History',
    Course: 'Learning History',
    CoCurricular: 'Learning History',
    Diploma: 'Learning History',
    DoctoralDegree: 'Learning History',
    GeneralEducationDevelopment: 'Learning History',
    LearningProgram: 'Learning History',
    MasterDegree: 'Learning History',
    ProfessionalDoctorate: 'Learning History',
    ResearchDoctorate: 'Learning History',
    SecondarySchoolDiploma: 'Learning History',
    Fieldwork: 'Learning History',
    QualityAssuranceCredential: 'Learning History',
};

/**
 * Determine the wallet category for a credential object.
 *
 * Handles OBv3 (AchievementSubject), CLR (ClrSubject), BoostID, and
 * plain VC credentials. Falls back to 'Achievement'.
 */
export const getCategoryForCredential = (
    credential: Record<string, unknown>
): CredentialCategory => {
    const types = (credential.type ?? []) as string[];

    // BoostID → always ID
    if (types.includes('BoostID')) return 'ID';

    // CLR credentials → Learning History
    if (types.includes('ClrCredential')) return 'Learning History';

    // Try to extract achievementType from credentialSubject
    const subject = credential.credentialSubject as Record<string, unknown> | undefined;

    if (!subject) return 'Achievement';

    const achievement = subject.achievement as Record<string, unknown> | Record<string, unknown>[] | undefined;

    if (!achievement) return 'Achievement';

    // CLR-style array of achievements — use the first one or fall back
    if (Array.isArray(achievement)) {
        if (achievement.length === 0) return 'Achievement';

        const firstType = (achievement[0] as Record<string, unknown>)?.achievementType as string | undefined;

        if (firstType && CATEGORY_MAP[firstType]) return CATEGORY_MAP[firstType];

        return 'Learning History';
    }

    const achievementType = achievement.achievementType as string | undefined;

    if (!achievementType) return 'Achievement';

    return CATEGORY_MAP[achievementType] ?? 'Achievement';
};
