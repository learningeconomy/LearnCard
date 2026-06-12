import { useMemo } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { useQueries } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { useWallet, useIsLoggedIn, useTenantConfig } from 'learn-card-base';
import type { TenantConfig } from 'learn-card-base';

export type GlobalSkillFrameworkConfig = {
    frameworkId: string;
    name: string;
    defaultSkillIds: string[];
};

type RawGlobalSkillFrameworkConfig = Partial<GlobalSkillFrameworkConfig> & {
    defaultSkillIds?: unknown;
};

type GlobalSkillFrameworkFlags = {
    globalSkillFrameworks?: {
        frameworks?: RawGlobalSkillFrameworkConfig[];
    };
};

export type SemanticSearchSkillRecord = {
    id: string;
    score?: number;
    type?: string;
    frameworkId?: string;
    statement?: string;
    icon?: string;
    targetName?: string;
    targetFramework?: string;
};

export type SemanticSearchResult = {
    records: SemanticSearchSkillRecord[];
};

const SEEDED_SKILL_FRAMEWORK_SOURCE_PREFIX = 'learncard://seed/skill-frameworks/';
const SEEDED_GLOBAL_SKILL_FRAMEWORK_ORDER = [
    'wef-global-skills-taxonomy',
    'pathsmith-durable-skills-starter-edition',
];
// These timestamp-based ids mirror the seeded JSON fixtures in brain-service.
// Keep this list in sync with the fixture copies (or derive it from them) when those fixtures change.
const SEEDED_GLOBAL_SKILL_FRAMEWORK_DEFAULT_SKILL_IDS: Record<string, string[]> = {
    'wef-global-skills-taxonomy': [
        'skill-1770752882121-4o69efqu6',
        'skill-1770752882121-6kjwahbon',
        'skill-1770752882121-7awe5ozu1',
        'skill-1770752882121-8i74t9iu9',
        'skill-1770752882121-8oup5zhkp',
        'skill-1770752882121-fxs8773lj',
        'skill-1770752882121-gspxpjkur',
        'skill-1770752882121-ijd7lrmqh',
        'skill-1770752882121-kgp1fmr19',
        'skill-1770752882121-lpy3rnsqi',
        'skill-1770752882121-ltr7aytdx',
        'skill-1770752882121-n0yqautmg',
        'skill-1770752882121-nf6c7plai',
        'skill-1770752882121-oz00jnqee',
        'skill-1770752882121-pwnwrrai6',
        'skill-1770752882121-y75tnzenk',
    ],
    'pathsmith-durable-skills-starter-edition': [
        'skill-1772824804950-8n0kmlyf2',
        'skill-1772824804950-a4g6gz6e1',
        'skill-1772824804950-d89eknulo',
        'skill-1772824804950-ebfgl4nam',
        'skill-1772824804950-kegwjzu5x',
        'skill-1772824804950-purc6ulo5',
        'skill-1772824804950-tkv7qhywf',
        'skill-1772824804950-urpvvber5',
        'skill-1772824804950-w4yyfkxzt',
        'skill-1772824804950-w96zstc5o',
    ],
};

const isProductionEnvironment = (): boolean =>
    typeof IS_PRODUCTION !== 'undefined' ? IS_PRODUCTION : process.env.NODE_ENV === 'production';

const isStagingEnvironment = (tenantConfig?: TenantConfig): boolean =>
    tenantConfig?.observability?.sentryEnv?.startsWith('staging') ?? false;

const fetchAllAvailableFrameworks = async (
    wallet: Awaited<ReturnType<typeof useWallet>>['initWallet'] extends (
        ...args: any[]
    ) => Promise<infer T>
        ? T
        : never
) => {
    const records: Array<{
        id: string;
        name: string;
        image?: string;
        description?: string;
        sourceURI?: string;
        isPublic?: boolean;
        status: string;
    }> = [];
    let cursor: string | null | undefined = null;

    for (let i = 0; i < 40; i += 1) {
        const page = (await wallet.invoke.getAllAvailableFrameworks({
            limit: 100,
            cursor,
        })) as {
            records: typeof records;
            hasMore: boolean;
            cursor?: string | null;
        };

        records.push(...page.records);

        if (!page.hasMore || !page.cursor) {
            break;
        }

        cursor = page.cursor;
    }

    return records;
};

const fetchSeededGlobalSkillFrameworks = async (
    wallet: Awaited<ReturnType<typeof useWallet>>['initWallet'] extends (
        ...args: any[]
    ) => Promise<infer T>
        ? T
        : never
): Promise<GlobalSkillFrameworkConfig[]> => {
    const availableFrameworks = await fetchAllAvailableFrameworks(wallet);
    const seededFrameworks = availableFrameworks.filter(
        framework =>
            framework.isPublic &&
            framework.sourceURI?.startsWith(SEEDED_SKILL_FRAMEWORK_SOURCE_PREFIX)
    );

    const frameworkConfigs = await Promise.all(
        seededFrameworks.map(async framework => {
            const frameworkDetails = (await wallet.invoke.getSkillFrameworkById(framework.id, {
                limit: 200,
                childrenLimit: 200,
            })) as {
                skills?: { records?: Array<{ id: string }> };
            };

            return {
                frameworkId: framework.id,
                name: framework.name,
                defaultSkillIds:
                    SEEDED_GLOBAL_SKILL_FRAMEWORK_DEFAULT_SKILL_IDS[framework.id] ??
                    frameworkDetails.skills?.records?.map(skill => skill.id) ??
                    [],
            } satisfies GlobalSkillFrameworkConfig;
        })
    );

    return frameworkConfigs.filter(framework => framework.frameworkId && framework.name);
};

export const normalizeGlobalSkillFrameworks = (
    frameworks?: RawGlobalSkillFrameworkConfig[]
): GlobalSkillFrameworkConfig[] => {
    if (!Array.isArray(frameworks)) {
        return [];
    }

    return frameworks
        .map((framework): GlobalSkillFrameworkConfig | null => {
            const frameworkId = framework?.frameworkId?.trim();
            const name = framework?.name?.trim();
            const defaultSkillIds = Array.isArray(framework?.defaultSkillIds)
                ? framework.defaultSkillIds
                      .map(skillId => (typeof skillId === 'string' ? skillId.trim() : ''))
                      .filter(Boolean)
                : [];

            if (!frameworkId || !name) {
                return null;
            }

            return {
                frameworkId,
                name,
                defaultSkillIds,
            };
        })
        .filter((framework): framework is GlobalSkillFrameworkConfig => Boolean(framework));
};

export const useGlobalSkillFrameworks = (): GlobalSkillFrameworkConfig[] => {
    const flags = useFlags<GlobalSkillFrameworkFlags>();
    const { initWallet } = useWallet();
    const isLoggedIn = useIsLoggedIn();
    const tenantConfig = useTenantConfig();
    const useSeededFrameworks = false;
    //!isProductionEnvironment() || isStagingEnvironment(tenantConfig);

    const { data: seededFrameworks = [] } = useQuery({
        queryKey: ['seededGlobalSkillFrameworks', isLoggedIn],
        queryFn: async () => {
            try {
                const wallet = await initWallet();
                return fetchSeededGlobalSkillFrameworks(wallet);
            } catch {
                return [];
            }
        },
        enabled: useSeededFrameworks && isLoggedIn,
    });

    return useMemo(
        () =>
            useSeededFrameworks
                ? // Sort WEF Global Skills Taxonomy before Pathsmith
                  [...seededFrameworks].sort((left, right) => {
                      const leftIndex = SEEDED_GLOBAL_SKILL_FRAMEWORK_ORDER.indexOf(
                          left.frameworkId
                      );
                      const rightIndex = SEEDED_GLOBAL_SKILL_FRAMEWORK_ORDER.indexOf(
                          right.frameworkId
                      );

                      if (leftIndex === -1 && rightIndex === -1) {
                          return left.name.localeCompare(right.name);
                      }

                      if (leftIndex === -1) {
                          return 1;
                      }

                      if (rightIndex === -1) {
                          return -1;
                      }

                      return leftIndex - rightIndex;
                  })
                : normalizeGlobalSkillFrameworks(flags?.globalSkillFrameworks?.frameworks),
        [flags?.globalSkillFrameworks, seededFrameworks, useSeededFrameworks]
    );
};

export const useGlobalSemanticSearchSkills = (
    text: string,
    frameworkIds: string[],
    options?: { limit?: number; excludeTiers?: boolean }
) => {
    const { initWallet } = useWallet();
    const trimmedText = text.trim();
    const shouldExcludeTiers = options?.excludeTiers ?? true;
    const limit = options?.limit ?? 50;

    const queryResults = useQueries({
        queries: frameworkIds.map(frameworkId => ({
            queryKey: ['semanticSearchSkills', trimmedText, frameworkId, limit, shouldExcludeTiers],
            queryFn: async () => {
                const wallet = await initWallet();
                return wallet.invoke.semanticSearchSkills({
                    text: trimmedText,
                    limit,
                    frameworkId,
                });
            },
            enabled: Boolean(trimmedText) && Boolean(frameworkId),
        })),
    });

    const isLoading = queryResults.some(query => query.isLoading);
    let data: SemanticSearchResult | undefined;

    if (trimmedText && frameworkIds.length > 0) {
        const recordsById = new Map<string, SemanticSearchSkillRecord>();

        queryResults.forEach((queryResult, index) => {
            const frameworkId = frameworkIds[index];
            const records = (queryResult.data?.records ?? []) as SemanticSearchSkillRecord[];

            records.forEach(record => {
                if (shouldExcludeTiers && record.type === 'container') {
                    return;
                }

                const resolvedFrameworkId = record.frameworkId ?? frameworkId;
                const key = `${resolvedFrameworkId}::${record.id}`;
                if (!recordsById.has(key)) {
                    recordsById.set(key, {
                        ...record,
                        frameworkId: resolvedFrameworkId,
                    });
                }
            });
        });

        data = {
            records: [...recordsById.values()].sort(
                (left, right) => (right.score ?? 0) - (left.score ?? 0)
            ),
        };
    }

    return {
        data,
        isLoading,
    };
};
