/**
 * useTemplateDetails - On-demand full template data loading
 * 
 * Used by tabs that need full credential template details (obv3Template, children, etc.)
 * Loads data only when the tab is accessed, not on initial dashboard load.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

import { useWallet } from 'learn-card-base';

import type { CredentialTemplate } from '../types';

export interface TemplateDetailsResult {
    templates: CredentialTemplate[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

/**
 * Hook to fetch full template details on-demand
 * 
 * @param integrationId - Integration ID to filter templates by
 * @param basicTemplates - Basic template info from dashboard (used for initial state)
 */
export function useTemplateDetails(
    integrationId: string,
    basicTemplates: CredentialTemplate[] = []
): TemplateDetailsResult {
    const { initWallet } = useWallet();
    const initWalletRef = useRef(initWallet);
    initWalletRef.current = initWallet;

    const [templates, setTemplates] = useState<CredentialTemplate[]>(basicTemplates);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [fetchKey, setFetchKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        const fetchTemplateDetails = async () => {
            try {
                setIsLoading(true);
                const wallet = await initWalletRef.current();

                // Fetch paginated boosts for this integration
                const boostsResult = await wallet.invoke.getPaginatedBoosts({
                    limit: 50,
                    query: { meta: { integrationId } },
                });

                if (cancelled) return;

                const boostUris = (boostsResult?.records || [])
                    .map((boost: any) => boost.uri)
                    .filter(Boolean) as string[];

                if (boostUris.length === 0) {
                    setTemplates([]);
                    setIsLoading(false);
                    return;
                }

                // PARALLEL: Fetch all boost details at once
                const boostPromises = boostUris.map(async (boostUri) => {
                    try {
                        const fullBoost = await wallet.invoke.getBoost(boostUri);
                        const meta = fullBoost?.meta as Record<string, unknown> | undefined;
                        const templateConfig = meta?.templateConfig as Record<string, unknown> | undefined;
                        const credential = fullBoost?.boost as Record<string, unknown> | undefined;

                        return {
                            id: boostUri,
                            name: fullBoost?.name || (credential?.name as string) || 'Untitled Template',
                            description: (credential?.description as string) || '',
                            achievementType: (templateConfig?.achievementType as string) || fullBoost?.type || 'Achievement',
                            fields: (templateConfig?.fields as CredentialTemplate['fields']) || [],
                            imageUrl: (fullBoost as Record<string, unknown>)?.image as string | undefined,
                            boostUri,
                            isNew: false,
                            isDirty: false,
                            obv3Template: credential,
                            isMasterTemplate: meta?.isMasterTemplate as boolean | undefined,
                        } as CredentialTemplate;
                    } catch (e) {
                        console.warn('Failed to fetch boost:', boostUri, e);
                        return null;
                    }
                });

                const allTemplatesWithNulls = await Promise.all(boostPromises);
                const allTemplates = allTemplatesWithNulls.filter((t): t is CredentialTemplate => t !== null);

                if (cancelled) return;

                // Identify master templates and fetch their children in parallel
                const masterTemplates = allTemplates.filter(t => t.isMasterTemplate && t.boostUri);

                // PARALLEL: Fetch all children for all master templates at once
                const childrenPromises = masterTemplates.map(async (master) => {
                    try {
                        const childrenResult = await wallet.invoke.getBoostChildren(master.boostUri!, { limit: 100 });
                        const childRecords = childrenResult?.records || [];

                        // PARALLEL: Fetch all child boost details at once
                        const childPromises = childRecords.map(async (childRecord) => {
                            const childUri = (childRecord as Record<string, unknown>).uri as string;
                            if (!childUri) return null;

                            try {
                                const fullChild = await wallet.invoke.getBoost(childUri);
                                const childMeta = fullChild?.meta as Record<string, unknown> | undefined;
                                const childConfig = childMeta?.templateConfig as Record<string, unknown> | undefined;
                                const childCredential = fullChild?.boost as Record<string, unknown> | undefined;

                                return {
                                    id: childUri,
                                    name: fullChild?.name || (childCredential?.name as string) || 'Untitled Template',
                                    description: (childCredential?.description as string) || '',
                                    achievementType: (childConfig?.achievementType as string) || 'Course Completion',
                                    fields: (childConfig?.fields as CredentialTemplate['fields']) || [],
                                    imageUrl: (fullChild as Record<string, unknown>)?.image as string | undefined,
                                    boostUri: childUri,
                                    isNew: false,
                                    isDirty: false,
                                    obv3Template: childCredential,
                                    parentTemplateId: master.boostUri,
                                } as CredentialTemplate;
                            } catch (e) {
                                console.warn('Failed to fetch child boost:', childUri, e);
                                return null;
                            }
                        });

                        const childrenWithNulls = await Promise.all(childPromises);
                        const children = childrenWithNulls.filter((c): c is CredentialTemplate => c !== null);

                        return { masterId: master.id, children };
                    } catch (e) {
                        console.warn('Failed to fetch boost children:', master.boostUri, e);
                        return { masterId: master.id, children: [] };
                    }
                });

                const childrenResults = await Promise.all(childrenPromises);

                if (cancelled) return;

                // Build a map of master -> children
                const masterChildrenMap = new Map<string, CredentialTemplate[]>();
                for (const result of childrenResults) {
                    masterChildrenMap.set(result.masterId, result.children);
                }

                // Attach children to master templates
                const loadedTemplates = allTemplates.map(template => {
                    if (template.isMasterTemplate) {
                        return {
                            ...template,
                            childTemplates: masterChildrenMap.get(template.id) || [],
                        };
                    }
                    return template;
                });

                setTemplates(loadedTemplates);
                setError(null);
            } catch (err) {
                if (cancelled) return;
                console.error('[useTemplateDetails] Failed to fetch templates:', err);
                setError(err instanceof Error ? err : new Error('Failed to fetch templates'));
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        fetchTemplateDetails();

        return () => {
            cancelled = true;
        };
    }, [integrationId, fetchKey]);

    const refetch = useCallback(() => {
        setFetchKey(k => k + 1);
    }, []);

    return { templates, isLoading, error, refetch };
}
