import {
    SKILLS,
    SUBSKILLS,
    SKILLS_TO_SUBSKILLS,
} from '../../../components/boost/boostCMS/boostCMSForms/boostCMSSkills/boostSkills';
import type { DashboardSkillCategory, DashboardProfileSkill } from '../DashboardView.types';

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

// Build reverse map: subskillType -> parentSkillEnum
const SUBSKILL_TO_PARENT = new Map<string, string>();
Object.entries(SKILLS_TO_SUBSKILLS).forEach(([parentSkill, subskills]) => {
    subskills.forEach(subskill => {
        SUBSKILL_TO_PARENT.set(subskill.type, parentSkill);
    });
});

type DedupedSkill = RawTopSkill & { subskillNames: string[] };

export const buildTopSkills = (
    rawTopSkills: RawTopSkill[] = [],
    limit = 3
): DashboardProfileSkill[] => {
    const validSkills = rawTopSkills.filter(skill => skill?.name && skill.count > 0);

    const parentNames = new Set(validSkills.filter(s => s.type === 'skill').map(s => s.name));

    const dedupedMap = new Map<string, DedupedSkill>();

    const ensureEntry = (raw: RawTopSkill): DedupedSkill => {
        const existing = dedupedMap.get(raw.name);
        if (existing) return existing;
        const entry: DedupedSkill = { ...raw, subskillNames: [] };
        dedupedMap.set(raw.name, entry);
        return entry;
    };

    validSkills.forEach(skill => {
        if (skill.type === 'subskill') {
            const parentName = SUBSKILL_TO_PARENT.get(skill.name);
            if (parentName && parentNames.has(parentName)) {
                const parentRaw = validSkills.find(s => s.name === parentName)!;
                const parent = ensureEntry(parentRaw);
                parent.count += skill.count;
                parent.subskillNames.push(skill.name);
                return;
            }
        }
        ensureEntry(skill);
    });

    const dedupedSkills = Array.from(dedupedMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

    return dedupedSkills.map((skill, index) => {
        let strengthTier: 'strongest' | 'strong' | 'growing' = 'growing';
        if (index === 0) strengthTier = 'strongest';
        else if (index === 1) strengthTier = 'strong';

        return {
            ...resolveSkillMeta(skill),
            name: skill.name,
            subskillNames: skill.subskillNames,
            count: skill.count,
            strengthTier,
            mentionCount: skill.count,
        };
    });
};
