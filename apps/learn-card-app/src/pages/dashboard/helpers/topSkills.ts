import {
    SKILLS,
    SUBSKILLS,
} from '../../../components/boost/boostCMS/boostCMSForms/boostCMSSkills/boostSkills';
import type { DashboardSkillCategory, DashboardTopSkill } from '../DashboardView.types';

type RawTopSkill = {
    name: string;
    count: number;
    type: string;
};

type ResolvedSkillMeta = {
    title: string;
    description: string;
    category: DashboardSkillCategory | null;
};

const SKILL_CATEGORIES = new Set<DashboardSkillCategory>([
    'durable',
    'stem',
    'athletic',
    'creative',
    'business',
    'trade',
    'social',
    'digital',
    'medical',
]);

const toSkillCategory = (value: unknown): DashboardSkillCategory | null =>
    typeof value === 'string' && SKILL_CATEGORIES.has(value as DashboardSkillCategory)
        ? (value as DashboardSkillCategory)
        : null;

const resolveSkillMeta = (raw: RawTopSkill): ResolvedSkillMeta => {
    const table = raw.type === 'skill' ? SKILLS : SUBSKILLS;
    const match = table?.find(entry => entry.type === raw.name);

    return {
        title: match?.title ?? raw.name,
        description: match?.description ?? '',
        category: toSkillCategory(match?.category),
    };
};

export const buildTopSkills = (rawTopSkills: RawTopSkill[] = []): DashboardTopSkill[] =>
    rawTopSkills
        .filter(skill => skill?.name && skill.count > 0)
        .map(skill => ({ ...resolveSkillMeta(skill), count: skill.count }));
