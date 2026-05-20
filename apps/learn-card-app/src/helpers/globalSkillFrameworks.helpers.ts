import { useMemo } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { useQueries } from '@tanstack/react-query';

import { useWallet } from 'learn-card-base';

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

    return useMemo(
        () => normalizeGlobalSkillFrameworks(flags?.globalSkillFrameworks?.frameworks),
        [flags?.globalSkillFrameworks]
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

    const data = useMemo<SemanticSearchResult | undefined>(() => {
        if (!trimmedText || frameworkIds.length === 0) {
            return undefined;
        }

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

        return {
            records: [...recordsById.values()].sort(
                (left, right) => (right.score ?? 0) - (left.score ?? 0)
            ),
        };
    }, [frameworkIds, queryResults, shouldExcludeTiers, trimmedText]);

    return {
        data,
        isLoading,
    };
};
