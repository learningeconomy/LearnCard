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
