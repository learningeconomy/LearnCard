import { SkillsProvider, ProviderId, Options, Framework, Skill, Obv3Alignment } from './types';
import { createDummyProvider, seedFramework, seedSkills } from './providers/dummy';
import { createNeo4jProvider } from './providers/neo4j';

let currentProvider: SkillsProvider | null = null;

export type SkillsProviderConfig = {
    providerId?: ProviderId;
    options?: Options;
};

export function getSkillsProvider(config?: SkillsProviderConfig): SkillsProvider {
    if (config || !currentProvider) {
        const providerId =
            config?.providerId || (process.env.SKILLS_PROVIDER as ProviderId) || 'neo4j';
        const options = config?.options || {
            baseUrl: process.env.SKILLS_PROVIDER_BASE_URL,
            apiKey: process.env.SKILLS_PROVIDER_API_KEY,
        };

        switch (providerId) {
            case 'neo4j':
                currentProvider = createNeo4jProvider(options);
                break;
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
