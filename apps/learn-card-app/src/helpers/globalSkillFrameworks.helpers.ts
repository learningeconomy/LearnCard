import { useMemo } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { useQueries } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { useWallet, useIsLoggedIn } from 'learn-card-base';

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

const isProductionEnvironment = (): boolean =>
    typeof IS_PRODUCTION !== 'undefined' ? IS_PRODUCTION : process.env.NODE_ENV === 'production';

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
                defaultSkillIds: frameworkDetails.skills?.records?.map(skill => skill.id) ?? [],
            } satisfies GlobalSkillFrameworkConfig;
        })
    );

    return frameworkConfigs.filter(
        framework => framework.frameworkId && framework.name && framework.defaultSkillIds
    );
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
    const useSeededFrameworks = !isProductionEnvironment();

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
                ? seededFrameworks
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
