import { SkillsProvider, ProviderId, Options, Framework, Skill, Obv3Alignment } from './types';
import { createDummyProvider, seedFramework, seedSkills } from './providers/dummy';

let currentProvider: SkillsProvider | null = null;

export type SkillsProviderConfig = {
    providerId?: ProviderId;
    options?: Options;
};

export function getSkillsProvider(config?: SkillsProviderConfig): SkillsProvider {
    if (config || !currentProvider) {
        const providerId =
            config?.providerId || (process.env.SKILLS_PROVIDER as ProviderId) || 'dummy';
        const options = config?.options || {
            baseUrl: process.env.SKILLS_PROVIDER_BASE_URL,
            apiKey: process.env.SKILLS_PROVIDER_API_KEY,
        };

        switch (providerId) {
            case 'dummy':
            default:
                currentProvider = createDummyProvider(options);
                break;
        }
    }

    return currentProvider!;
}

// Expose test helpers for the dummy provider
export const __skillsProviderTestUtils = {
    seedFramework,
    seedSkills,
};

export type { SkillsProvider, Framework, Skill, Obv3Alignment };
