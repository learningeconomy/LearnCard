import { SkillsProvider, Options, Framework, Skill, Obv3Alignment } from '../types';

// Very small in-memory store, reset on process restart. Suitable for E2E tests.
const frameworks = new Map<string, Framework & { skills: Map<string, Skill> }>();

export function seedFramework(framework: Framework) {
    if (!frameworks.has(framework.id)) {
        frameworks.set(framework.id, { ...framework, skills: new Map() });
    } else {
        const existing = frameworks.get(framework.id)!;
        frameworks.set(framework.id, { ...existing, ...framework });
    }
}

export function seedSkills(frameworkId: string, skills: Skill[]) {
    const fw = frameworks.get(frameworkId);
    if (!fw) throw new Error(`Framework not found: ${frameworkId}`);
    skills.forEach(s => fw.skills.set(s.id, { ...s, type: s.type ?? 'skill' }));
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

    return {
        id: 'dummy',
        getFrameworkById,
        getSkillsForFramework,
        getSkillsByIds,
        buildObv3Alignments,
    };
}
