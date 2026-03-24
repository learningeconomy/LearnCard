import type { SkillFramework, SkillFrameworkNode } from '../components/boost/boost';
import type { SkillTreeNode } from '@learncard/types';

/**
 * Recursively collects skill names from a tree of SkillFrameworkNodes (frontend format)
 * Only collects names for nodes that don't already have an icon
 */
export const collectSkillNames = (nodes?: SkillFrameworkNode[]): string[] => {
    if (!nodes) return [];
    const names: string[] = [];
    const stack: SkillFrameworkNode[] = [...nodes];
    const seen = new Set<string>();

    while (stack.length > 0) {
        const node = stack.pop()!;
        if (node.targetName && !node.icon) {
            names.push(node.targetName);
        }
        if (node.subskills) stack.push(...node.subskills);
    }

    return names.filter(n => (seen.has(n) ? false : (seen.add(n), true)));
};

/**
 * Skill info needed for icon updates
 */
export type SkillIconInfo = {
    id: string;
    statement: string;
};

/**
 * Recursively collects skill info from a tree of SkillTreeNodes (backend format)
 * Only collects skills that don't already have an icon
 */
export const collectSkillsNeedingIcons = (nodes?: SkillTreeNode[]): SkillIconInfo[] => {
    if (!nodes) return [];
    const skills: SkillIconInfo[] = [];
    const stack: SkillTreeNode[] = [...nodes];

    while (stack.length > 0) {
        const node = stack.pop()!;
        if (node.id && node.statement && !node.icon) {
            skills.push({ id: node.id, statement: node.statement });
        }
        if (node.children) stack.push(...node.children);
    }

    return skills;
};

const ICON_BATCH_CHARACTER_LIMIT = 10000;

/**
 * Generates icons for skill names in batches (API limit is ~10000 characters per request)
 */
const generateIconsInBatches = async (
    names: string[],
    generateSkillIcons: (names: string[]) => Promise<Record<string, string>>
): Promise<Record<string, string>> => {
    const iconMap: Record<string, string> = {};
    let i = 0;

    while (i < names.length) {
        const batch: string[] = [];
        let charactersInBatch = 0;

        while (
            i < names.length &&
            charactersInBatch + names[i].length <= ICON_BATCH_CHARACTER_LIMIT
        ) {
            charactersInBatch += names[i].length;
            batch.push(names[i]);
            i++;
        }

        // Handle case where a single name exceeds the limit
        if (batch.length === 0 && i < names.length) {
            batch.push(names[i]);
            charactersInBatch = names[i].length;
            i++;
        }

        const batchIcons = await generateSkillIcons(batch);
        Object.assign(iconMap, batchIcons);
    }

    return iconMap;
};

/**
 * Annotates skills in a framework with AI-generated icons.
 * This fetches the full skill tree from the backend, generates icons in batches, and updates each skill.
 *
 * @param frameworkId The framework ID
 * @param wallet The initialized wallet with network plugin
 * @param onProgress Optional callback for progress updates
 * @returns Number of skills updated
 */
export const annotateBackendSkillsWithIcons = async (
    frameworkId: string,
    wallet: {
        invoke: {
            getFullSkillTree: (input: {
                frameworkId: string;
            }) => Promise<{ skills: SkillTreeNode[] }>;
            generateSkillIcons: (names: string[]) => Promise<Record<string, string>>;
            updateSkill: (input: { frameworkId: string; id: string; icon: string }) => Promise<any>;
        };
    },
    onProgress?: (current: number, total: number) => void
): Promise<number> => {
    const result = await wallet.invoke.getFullSkillTree({ frameworkId });

    const skillsNeedingIcons = collectSkillsNeedingIcons(result.skills);

    if (skillsNeedingIcons.length === 0) return 0;

    const names = skillsNeedingIcons.map(s => s.statement);

    const iconMap = await generateIconsInBatches(names, wallet.invoke.generateSkillIcons);

    const skillsWithIcons = skillsNeedingIcons.filter(s => iconMap[s.statement]);

    const results = await Promise.all(
        skillsWithIcons.map(async skill => {
            try {
                await wallet.invoke.updateSkill({
                    frameworkId,
                    id: skill.id,
                    icon: iconMap[skill.statement]!,
                });
                return true;
            } catch (e) {
                console.error(`Failed to update icon for skill ${skill.id}:`, e);
                return false;
            }
        })
    );

    const updated = results.filter(Boolean).length;
    onProgress?.(updated, skillsWithIcons.length);

    return updated;
};

/**
 * Recursively applies icons from an icon map to a tree of SkillFrameworkNodes
 */
export const applyIconsToNodes = (
    nodes: SkillFrameworkNode[] | undefined,
    iconMap: Record<string, string>
): SkillFrameworkNode[] | undefined => {
    if (!nodes) return nodes;
    return nodes.map(n => ({
        ...n,
        icon: iconMap[n.targetName] ?? n.icon,
        subskills: applyIconsToNodes(n.subskills, iconMap),
    }));
};

/**
 * Annotates a SkillFramework with icons for all skills that don't have one.
 * Uses the wallet's generateSkillIcons method to generate icons in bulk.
 *
 * @param framework The framework to annotate
 * @param generateSkillIcons Function to generate icons (typically wallet.invoke.generateSkillIcons)
 * @returns The framework with icons applied to all skills
 */
export const annotateFrameworkWithIcons = async (
    framework: SkillFramework,
    generateSkillIcons: (names: string[]) => Promise<Record<string, string>>
): Promise<SkillFramework> => {
    const names = collectSkillNames(framework.skills);

    if (names.length === 0) return framework;

    const iconMap = await generateSkillIcons(names);
    const skillsWithIcons = applyIconsToNodes(framework.skills, iconMap) ?? framework.skills;

    return { ...framework, skills: skillsWithIcons };
};
