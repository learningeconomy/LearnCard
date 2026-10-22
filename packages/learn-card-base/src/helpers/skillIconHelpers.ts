import type { SkillFramework, SkillFrameworkNode } from '../components/boost/boost';
import {
    SKILL_ICON_MAX_CHARACTERS_PER_REQUEST,
    SKILL_ICON_MAX_NAMES_PER_REQUEST,
    type SkillTreeNode,
} from '@learncard/types';
import { getLogger } from '../logging/logger';
const log = getLogger('skill-icon-helpers');

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

/**
 * Per-batch caps for icon generation requests. These mirror the server-side validator for
 * `ai.generateSkillIcons` (shared via `@learncard/types`), so a normal batch is never rejected.
 *
 * The request is a GET with every name in the URL (API Gateway returns HTTP 431 past ~10KB), and
 * model generation costs ~80ms per name against a 25s server timeout.
 */
export const ICON_BATCH_NAME_LIMIT = SKILL_ICON_MAX_NAMES_PER_REQUEST;
export const ICON_BATCH_CHARACTER_LIMIT = SKILL_ICON_MAX_CHARACTERS_PER_REQUEST;

/** Number of icon batches in flight at once; kept small so we don't hammer the model. */
export const ICON_BATCH_CONCURRENCY = 2;

/**
 * Splits skill names into batches of at most `ICON_BATCH_NAME_LIMIT` names and
 * `ICON_BATCH_CHARACTER_LIMIT` total characters, whichever is reached first.
 *
 * A single name longer than the character limit can't be split, so it is placed in a batch of
 * its own rather than being dropped.
 */
export const splitNamesIntoIconBatches = (
    names: string[],
    limits: { maxNames?: number; maxCharacters?: number } = {}
): string[][] => {
    const maxNames = limits.maxNames ?? ICON_BATCH_NAME_LIMIT;
    const maxCharacters = limits.maxCharacters ?? ICON_BATCH_CHARACTER_LIMIT;

    const batches: string[][] = [];
    let batch: string[] = [];
    let charactersInBatch = 0;

    for (const name of names) {
        const wouldOverflow =
            batch.length >= maxNames || charactersInBatch + name.length > maxCharacters;

        if (batch.length > 0 && wouldOverflow) {
            batches.push(batch);
            batch = [];
            charactersInBatch = 0;
        }

        batch.push(name);
        charactersInBatch += name.length;
    }

    if (batch.length > 0) batches.push(batch);

    return batches;
};

export type GenerateIconsInBatchesOptions = {
    /** Max batches in flight at once (default `ICON_BATCH_CONCURRENCY`) */
    concurrency?: number;
    /** Called after each batch completes with the number of names processed so far */
    onProgress?: (completed: number, total: number) => void;
};

/**
 * Generates icons for skill names in batches that fit within the API's per-request limits.
 *
 * Names are de-duplicated, and names too long to ever fit in a request (which the server would
 * reject) are skipped, so those skills simply get no icon. Batches run with small concurrency;
 * if any batch fails, no further batches are started and the error is rethrown so callers can
 * surface it and let the user retry.
 */
export const generateIconsInBatches = async (
    names: string[],
    generateSkillIcons: (names: string[]) => Promise<Record<string, string>>,
    options: GenerateIconsInBatchesOptions = {}
): Promise<Record<string, string>> => {
    const concurrency = Math.max(1, options.concurrency ?? ICON_BATCH_CONCURRENCY);

    const uniqueNames = [...new Set(names)].filter(name => {
        if (name.length <= ICON_BATCH_CHARACTER_LIMIT) return true;

        log.warn('Skipping icon generation for skill name that exceeds the request limit', {
            length: name.length,
        });

        return false;
    });

    const batches = splitNamesIntoIconBatches(uniqueNames);
    const iconMap: Record<string, string> = {};

    let nextBatch = 0;
    let completed = 0;
    let failed = false;

    const worker = async (): Promise<void> => {
        while (!failed && nextBatch < batches.length) {
            const batch = batches[nextBatch++]!;

            try {
                Object.assign(iconMap, await generateSkillIcons(batch));
            } catch (error) {
                failed = true;
                throw error;
            }

            completed += batch.length;
            options.onProgress?.(completed, uniqueNames.length);
        }
    };

    await Promise.all(
        Array.from({ length: Math.min(concurrency, batches.length) }, () => worker())
    );

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
                log.error(`Failed to update icon for skill ${skill.id}:`, e);
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

    const iconMap = await generateIconsInBatches(names, generateSkillIcons);
    const skillsWithIcons = applyIconsToNodes(framework.skills, iconMap) ?? framework.skills;

    return { ...framework, skills: skillsWithIcons };
};
