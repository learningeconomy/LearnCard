import { getTypeByObv3, typeLabel as resolveTypeLabel } from '../components/credentialTypeCatalog';

export interface ImportSummary {
    name: string;
    description?: string;
    image?: string;
    achievementType?: string;
    typeLabel?: string;
}

const asRecord = (v: unknown): Record<string, unknown> =>
    typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {};

const str = (v: unknown): string | undefined =>
    typeof v === 'string' && v.trim() ? v.trim() : undefined;

export const summarizeObv3 = (json: Record<string, unknown>): ImportSummary => {
    const subject = asRecord(json.credentialSubject);
    const achievement = asRecord(subject.achievement);

    const name = str(achievement.name) ?? str(json.name) ?? 'Imported credential';
    const description = str(achievement.description) ?? str(json.description);
    const image = str(achievement.image) ?? str(json.image);
    const achievementType = str(achievement.achievementType);
    const typeEntry = achievementType ? getTypeByObv3(achievementType) : undefined;
    const typeLabel = typeEntry ? resolveTypeLabel(typeEntry) : undefined;

    return { name, description, image, achievementType, typeLabel };
};
