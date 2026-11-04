import { CredentialCategoryEnum } from '../types/boostCategories';
import { FILE_KINDS } from '../types/file-extraction';
import type { LCR } from '../types/credential-records';

const INTERNAL_CATEGORIES: Record<string, true> = {
    [CredentialCategoryEnum.selfAssignedSkills]: true,
    [CredentialCategoryEnum.verifiableData]: true,
    [CredentialCategoryEnum.goals]: true,
    [CredentialCategoryEnum.professionalTitle]: true,
    [CredentialCategoryEnum.roleExperience]: true,
    [CredentialCategoryEnum.workExperience]: true,
    [CredentialCategoryEnum.payRate]: true,
    [CredentialCategoryEnum.workLifeBalance]: true,
    [CredentialCategoryEnum.jobStability]: true,
    [CredentialCategoryEnum.aiSummary]: true,
    [CredentialCategoryEnum.aiTopic]: true,
    [CredentialCategoryEnum.aiPathway]: true,
    [CredentialCategoryEnum.aiInsight]: true,
    [CredentialCategoryEnum.aiAssessment]: true,
    [CredentialCategoryEnum.resume]: true,
};
const CATEGORY_ALIASES: Record<string, string> = {
    ...Object.fromEntries(
        Object.entries(CredentialCategoryEnum).flatMap(([key, value]) => [
            [key.toLowerCase(), value],
            [value.toLowerCase(), value],
        ])
    ),
    'ai session': CredentialCategoryEnum.aiTopic,
    'ai sessions': CredentialCategoryEnum.aiTopic,
    'ai-topic': CredentialCategoryEnum.aiTopic,
};

/** Original uploads are lowercase; issued "Certificate"/"Transcript" records stay visible. */
export const isInternalCredentialCategory = (category?: string): boolean =>
    Boolean(
        category &&
        ((FILE_KINDS as readonly string[]).includes(category) ||
            Object.hasOwn(
                INTERNAL_CATEGORIES,
                CATEGORY_ALIASES[category.toLowerCase()] ?? category
            ))
    );

export const isCredentialCollectionCategoryVisible = (category?: string): boolean =>
    category?.toLowerCase() !== 'hidden' && !isInternalCredentialCategory(category);

/** User-facing collection membership depends only on encrypted index metadata. */
export const isCredentialCollectionRecordVisible = (record: LCR): boolean =>
    Boolean(record.uri) &&
    !record.id?.startsWith('__verifiable_data_') &&
    isCredentialCollectionCategoryVisible(record.category) &&
    record.title?.trim() !== 'Self-Assigned Skills';
