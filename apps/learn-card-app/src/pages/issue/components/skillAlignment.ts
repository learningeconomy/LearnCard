import { networkStore } from 'learn-card-base/stores/NetworkStore';

import { staticField } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import type { AlignmentTemplate } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';

export interface ResolvedSkill {
    id: string;
    frameworkId: string;
    targetName: string;
    targetDescription?: string;
    targetCode?: string;
    frameworkName?: string;
    icon?: string;
}

const getNetworkDomain = (): string => {
    try {
        return new URL(networkStore.get.networkUrl()).host;
    } catch {
        return 'network.learncard.com';
    }
};

export const buildSkillTargetUrl = (frameworkId: string, skillId: string): string =>
    `https://${getNetworkDomain()}/frameworks/${encodeURIComponent(
        frameworkId
    )}/skills/${encodeURIComponent(skillId)}`;

const SKILL_TARGET_URL_PATTERN = /\/frameworks\/[^/]+\/skills\//;

export const isSkillAlignment = (alignment: AlignmentTemplate): boolean =>
    alignment.id.includes('::') || SKILL_TARGET_URL_PATTERN.test(alignment.targetUrl?.value ?? '');

export const skillsToAlignmentTemplates = (skills: ResolvedSkill[]): AlignmentTemplate[] =>
    skills.map(skill => ({
        id: `${skill.frameworkId}::${skill.id}`,
        targetName: staticField(skill.targetName),
        targetUrl: staticField(buildSkillTargetUrl(skill.frameworkId, skill.id)),
        targetCode: staticField(skill.targetCode || skill.id),
        targetFramework: staticField(skill.frameworkName || skill.frameworkId),
        ...(skill.targetDescription
            ? { targetDescription: staticField(skill.targetDescription) }
            : {}),
    }));

export const mergeSkillAlignments = (
    existing: AlignmentTemplate[] | undefined,
    resolved: ResolvedSkill[]
): AlignmentTemplate[] => {
    const preserved = (existing ?? []).filter(a => !isSkillAlignment(a));
    return [...preserved, ...skillsToAlignmentTemplates(resolved)];
};
