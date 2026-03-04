import type { SkillsProvider, ProviderId, Options, Framework, Skill, Obv3Alignment } from './types';
import { createDummyProvider, seedFramework, seedSkills } from './providers/dummy';
import { createNeo4jProvider } from './providers/neo4j';
import { createOpenSaltProvider } from './providers/opensalt';

let currentProvider: SkillsProvider | null = null;

export type SkillsProviderConfig = {
    providerId?: ProviderId;
    options?: Options;
};

const isOpenSaltRef = (value?: string): boolean => {
    if (!value) return false;

    const normalized = value.trim().toLowerCase();
    if (!normalized) return false;

    if (normalized.includes('opensalt.')) return true;
    if (normalized.includes('/ims/case/v1p0/cfdocuments/')) return true;
    if (normalized.includes('/uri/p')) return true;
    if (normalized.includes('/uri/')) return true;

    return false;
};

const getOpenSaltOptions = (): Options => ({
    baseUrl: process.env.OPENSALT_BASE_URL || 'https://opensalt.net',
    apiKey: process.env.SKILLS_PROVIDER_API_KEY,
});

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
            case 'opensalt':
                currentProvider = createOpenSaltProvider(options);
                break;
            default:
                currentProvider = createDummyProvider(options);
                break;
        }
    }

    if (!currentProvider) {
        currentProvider = createDummyProvider();
    }

    return currentProvider;
}

export function getSkillsProviderForFramework(
    frameworkRef: string,
    sourceURI?: string
): SkillsProvider {
    if (isOpenSaltRef(sourceURI) || isOpenSaltRef(frameworkRef)) {
        return createOpenSaltProvider(getOpenSaltOptions());
    }

    if (currentProvider?.id === 'dummy') {
        return currentProvider;
    }

    return createNeo4jProvider({
        baseUrl: process.env.SKILLS_PROVIDER_BASE_URL,
        apiKey: process.env.SKILLS_PROVIDER_API_KEY,
    });
}

// Expose test helpers for the dummy provider
export const __skillsProviderTestUtils = {
    seedFramework,
    seedSkills,
};

export type { SkillsProvider, Framework, Skill, Obv3Alignment };
