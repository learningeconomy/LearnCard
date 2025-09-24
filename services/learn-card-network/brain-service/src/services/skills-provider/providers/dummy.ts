import { SkillsProvider, Options, Framework, Skill, Obv3Alignment } from '../types';

// Very small in-memory store, reset on process restart. Suitable for E2E tests.
type StoredSkill = Skill & { status: string; type: string };
type StoredFramework = Framework & { status: string; skills: Map<string, StoredSkill> };

const frameworks = new Map<string, StoredFramework>();

const normalizeSkill = (skill: Skill): StoredSkill => ({
    ...skill,
    type: skill.type ?? 'skill',
    status: skill.status ?? 'active',
});

const normalizeFramework = (framework: Framework, existing?: StoredFramework): StoredFramework => ({
    id: framework.id,
    name: framework.name,
    description: framework.description,
    sourceURI: framework.sourceURI,
    status: framework.status ?? existing?.status ?? 'active',
    skills: existing?.skills ?? new Map(),
});

export function seedFramework(framework: Framework) {
    const existing = frameworks.get(framework.id);
    const normalized = normalizeFramework(framework, existing);
    frameworks.set(framework.id, normalized);
}

export function seedSkills(frameworkId: string, skills: Skill[]) {
    const fw = frameworks.get(frameworkId);
    if (!fw) throw new Error(`Framework not found: ${frameworkId}`);
    skills.forEach(s => fw.skills.set(s.id, normalizeSkill(s)));
}

export function createDummyProvider(options?: Options): SkillsProvider {
    const baseUrl = options?.baseUrl?.replace(/\/$/, '');

    const getFrameworkById: SkillsProvider['getFrameworkById'] = async (frameworkId) => {
        const fw = frameworks.get(frameworkId);
        if (!fw) return null;
        // Drop internal map for external returns
        const { skills: _skills, ...rest } = fw;
        return { ...rest };
    };

    const getSkillsForFramework: SkillsProvider['getSkillsForFramework'] = async (frameworkId) => {
        const fw = frameworks.get(frameworkId);
        if (!fw) return [];
        return Array.from(fw.skills.values()).map(skill => ({
            ...skill,
            type: skill.type ?? 'skill',
        }));
    };

    const getSkillsByIds: SkillsProvider['getSkillsByIds'] = async (frameworkId, skillIds) => {
        const fw = frameworks.get(frameworkId);
        if (!fw) return [];
        return skillIds
            .map(id => fw.skills.get(id))
            .filter(Boolean)
            .map(skill => ({
                ...skill!,
                type: skill!.type ?? 'skill',
            }));
    };

    const buildObv3Alignments: SkillsProvider['buildObv3Alignments'] = async (
        frameworkId,
        skillIds
    ) => {
        const fw = frameworks.get(frameworkId);
        if (!fw) return [];
        const alignments: Obv3Alignment[] = [];

        for (const id of skillIds) {
            const skill = fw.skills.get(id);
            if (!skill) continue;

            const targetUrl = baseUrl
                ? `${baseUrl}/frameworks/${encodeURIComponent(frameworkId)}/skills/${encodeURIComponent(skill.id)}`
                : undefined;

            alignments.push({
                targetCode: skill.code ?? skill.id,
                targetName: skill.statement,
                targetDescription: skill.description,
                targetUrl,
                targetFramework: fw.name,
            });
        }

        return alignments;
    };

    const createFramework: SkillsProvider['createFramework'] = async framework => {
        const normalized = normalizeFramework(framework, frameworks.get(framework.id));
        frameworks.set(framework.id, normalized);
        const { skills: _skills, ...rest } = normalized;
        return { ...rest };
    };

    const updateFramework: SkillsProvider['updateFramework'] = async (frameworkId, updates) => {
        const existing = frameworks.get(frameworkId);
        if (!existing) return null;
        const updated: StoredFramework = {
            ...existing,
            ...updates,
            status: updates?.status ?? existing.status,
            skills: existing.skills,
        };
        frameworks.set(frameworkId, updated);
        const { skills: _skills, ...rest } = updated;
        return { ...rest };
    };

    const deleteFramework: SkillsProvider['deleteFramework'] = async frameworkId => {
        frameworks.delete(frameworkId);
    };

    const createSkill: SkillsProvider['createSkill'] = async (frameworkId, skill) => {
        const fw = frameworks.get(frameworkId);
        if (!fw) throw new Error(`Framework not found: ${frameworkId}`);
        const normalized = normalizeSkill(skill);
        fw.skills.set(normalized.id, normalized);
        return { ...normalized };
    };

    const updateSkill: SkillsProvider['updateSkill'] = async (frameworkId, skillId, updates) => {
        const fw = frameworks.get(frameworkId);
        if (!fw) return null;
        const existing = fw.skills.get(skillId);
        if (!existing) return null;
        const merged = normalizeSkill({ ...existing, ...updates, id: skillId });
        fw.skills.set(skillId, merged);
        return { ...merged };
    };

    const deleteSkill: SkillsProvider['deleteSkill'] = async (frameworkId, skillId) => {
        const fw = frameworks.get(frameworkId);
        if (!fw) return;
        fw.skills.delete(skillId);
    };

    return {
        id: 'dummy',
        getFrameworkById,
        getSkillsForFramework,
        getSkillsByIds,
        buildObv3Alignments,
        createFramework,
        updateFramework,
        deleteFramework,
        createSkill,
        updateSkill,
        deleteSkill,
    };
}
