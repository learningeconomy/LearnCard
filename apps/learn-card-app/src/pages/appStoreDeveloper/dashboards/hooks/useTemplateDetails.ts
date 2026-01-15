/**
 * useTemplateManager - Full template CRUD operations
 * 
 * Used by tabs that need full credential template details (obv3Template, children, etc.)
 * and CRUD operations for managing templates linked to app listings.
 * 
 * Supports filtering by integrationId and/or listingId.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

import { useWallet } from 'learn-card-base';

import type { CredentialTemplate } from '../types';

/**
 * Extended template with app listing integration
 */
export interface ManagedTemplate extends CredentialTemplate {
    templateAlias?: string;
    credential?: Record<string, unknown>;
    variables?: string[];
    isAddedToListing?: boolean;
}

export type TemplateFeatureType = 'issue-credentials' | 'peer-badges';

export interface TemplateManagerOptions {
    integrationId?: string;
    listingId?: string;
    featureType?: TemplateFeatureType;
}

export interface TemplateManagerResult {
    templates: ManagedTemplate[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;

    // CRUD operations
    createTemplate: (
        credential: Record<string, unknown>,
        options?: {
            alias?: string;
            name?: string;
            defaultPermissions?: {
                canIssue?: boolean;
                canRevoke?: boolean;
                canManagePermissions?: boolean;
                canViewAnalytics?: boolean;
                canEdit?: boolean;
                canDelete?: boolean;
            };
        }
    ) => Promise<{ boostUri: string; templateAlias: string }>;

    updateTemplate: (
        boostUri: string,
        credential: Record<string, unknown>,
        options?: { name?: string }
    ) => Promise<void>;

    deleteTemplate: (boostUri: string) => Promise<void>;

    updateAlias: (boostUri: string, newAlias: string) => Promise<void>;
}

// Kept for backward compatibility
export interface TemplateDetailsResult {
    templates: CredentialTemplate[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

/**
 * Generate a template alias from a name
 */
function generateTemplateAlias(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50);
}

/**
 * Extract template variables ({{variable}}) from a credential
 */
function extractTemplateVariables(credential: Record<string, unknown>): string[] {
    const variables: string[] = [];
    const pattern = /\{\{(\w+)\}\}/g;

    const extractFromValue = (value: unknown) => {
        if (typeof value === 'string') {
            let match;
            while ((match = pattern.exec(value)) !== null) {
                if (!variables.includes(match[1])) {
                    variables.push(match[1]);
                }
            }
        } else if (Array.isArray(value)) {
            value.forEach(extractFromValue);
        } else if (value && typeof value === 'object') {
            Object.values(value).forEach(extractFromValue);
        }
    };

    extractFromValue(credential);
    return variables;
}

/**
 * Hook to fetch and manage templates with full CRUD operations
 * 
 * @param options - Filter options (integrationId, listingId)
 */
export function useTemplateManager(options: TemplateManagerOptions): TemplateManagerResult {
    const { integrationId, listingId, featureType } = options;

    const { initWallet } = useWallet();
    const initWalletRef = useRef(initWallet);
    initWalletRef.current = initWallet;

    const [templates, setTemplates] = useState<ManagedTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [fetchKey, setFetchKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        const fetchTemplateDetails = async () => {
            try {
                setIsLoading(true);
                const wallet = await initWalletRef.current();

                // Fetch templates based on featureType
                let allBoostInfos: Array<{ boostUri: string; templateAlias?: string }> = [];
                
                if (featureType === 'peer-badges') {
                    // For peer-badges: fetch by featureType metadata
                    if (listingId) {
                        const boostsResult = await wallet.invoke.getPaginatedBoosts({
                            limit: 50,
                            query: { meta: { appListingId: listingId, featureType: 'peer-badges' } },
                        });
                        allBoostInfos = (boostsResult?.records || [])
                            .map((boost: Record<string, unknown>) => ({
                                boostUri: boost.uri as string,
                                templateAlias: undefined,
                            }))
                            .filter(info => info.boostUri);
                    }
                } else {
                    // For issue-credentials (default): fetch from getAppBoosts (has templateAlias)
                    if (listingId) {
                        const boostLinks = await wallet.invoke.getAppBoosts(listingId) || [];
                        allBoostInfos = boostLinks.map(link => ({
                            boostUri: link.boostUri,
                            templateAlias: link.templateAlias,
                        }));
                    }
                }

                if (cancelled) return;

                if (allBoostInfos.length === 0) {
                    setTemplates([]);
                    setIsLoading(false);
                    return;
                }

                // PARALLEL: Fetch all boost details at once
                const boostPromises = allBoostInfos.map(async ({ boostUri, templateAlias }) => {
                    try {
                        const fullBoost = await wallet.invoke.getBoost(boostUri);
                        const meta = fullBoost?.meta as Record<string, unknown> | undefined;
                        const templateConfig = meta?.templateConfig as Record<string, unknown> | undefined;
                        const credential = (fullBoost?.boost as Record<string, unknown>) || {};

                        return {
                            id: boostUri,
                            name: fullBoost?.name || (credential?.name as string) || 'Untitled Template',
                            description: (credential?.description as string) || '',
                            achievementType: (templateConfig?.achievementType as string) || fullBoost?.type || 'Achievement',
                            fields: (templateConfig?.fields as CredentialTemplate['fields']) || [],
                            imageUrl: credential?.image as string | undefined,
                            boostUri,
                            isNew: false,
                            isDirty: false,
                            obv3Template: credential,
                            isMasterTemplate: meta?.isMasterTemplate as boolean | undefined,
                            // ManagedTemplate extensions
                            templateAlias,
                            credential,
                            variables: extractTemplateVariables(credential),
                            isAddedToListing: !!templateAlias,
                        } as ManagedTemplate;
                    } catch (e) {
                        console.warn('Failed to fetch boost:', boostUri, e);
                        return null;
                    }
                });

                const allTemplatesWithNulls = await Promise.all(boostPromises);
                const allTemplates = allTemplatesWithNulls.filter((t): t is ManagedTemplate => t !== null);

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
    }, [integrationId, listingId, featureType, fetchKey]);

    const refetch = useCallback(() => {
        setFetchKey(k => k + 1);
    }, []);

    // ================================================================
    // CRUD OPERATIONS
    // ================================================================

    const createTemplate = useCallback(async (
        credential: Record<string, unknown>,
        options?: {
            alias?: string;
            name?: string;
            defaultPermissions?: {
                canIssue?: boolean;
                canRevoke?: boolean;
                canManagePermissions?: boolean;
                canViewAnalytics?: boolean;
                canEdit?: boolean;
                canDelete?: boolean;
            };
        }
    ): Promise<{ boostUri: string; templateAlias: string }> => {
        if (!listingId) {
            throw new Error('listingId is required to create templates');
        }

        const wallet = await initWalletRef.current();
        const name = options?.name || (credential.name as string) || 'Untitled Template';
        
        // Generate or use provided alias
        let templateAlias = options?.alias || generateTemplateAlias(name);
        
        // Check for duplicate alias
        const existingAliases = templates.map(t => t.templateAlias).filter(Boolean);
        let counter = 1;
        const baseAlias = templateAlias;
        while (existingAliases.includes(templateAlias)) {
            templateAlias = `${baseAlias}-${counter}`;
            counter++;
        }

        // Replace system placeholders
        const issuerDid = wallet.id.did();
        const preparedCredential = {
            ...credential,
            issuer: credential.issuer === '{{issuer_did}}' ? issuerDid : credential.issuer,
            validFrom: credential.validFrom === '{{issue_date}}' ? new Date().toISOString() : credential.validFrom,
        };

        // Issue the credential
        const vc = await wallet.invoke.issueCredential(
            preparedCredential as Parameters<typeof wallet.invoke.issueCredential>[0]
        );

        // Create the boost with featureType in metadata
        const boostMetadata = {
            name,
            type: ((credential.credentialSubject as Record<string, unknown>)?.achievement as Record<string, unknown>)?.achievementType as string || 'Achievement',
            category: 'achievement',
            meta: { appListingId: listingId, integrationId, featureType },
            ...(options?.defaultPermissions && { defaultPermissions: options.defaultPermissions }),
        };
        
        const boostUri = await wallet.invoke.createBoost(
            vc,
            boostMetadata as unknown as Parameters<typeof wallet.invoke.createBoost>[1]
        );

        // For issue-credentials: add to app listing (gives it a templateAlias)
        // For peer-badges: don't add to app listing (they're queried by featureType metadata)
        if (featureType !== 'peer-badges') {
            await wallet.invoke.addBoostToApp(listingId, boostUri, templateAlias);
        }

        // Refetch to update local state
        refetch();

        return { boostUri, templateAlias };
    }, [listingId, integrationId, featureType, templates, refetch]);

    const updateTemplate = useCallback(async (
        boostUri: string,
        credential: Record<string, unknown>,
        options?: { name?: string }
    ): Promise<void> => {
        const wallet = await initWalletRef.current();
        const name = options?.name || (credential.name as string) || 'Untitled Template';

        // Replace system placeholders
        const issuerDid = wallet.id.did();
        const preparedCredential = {
            ...credential,
            issuer: credential.issuer === '{{issuer_did}}' ? issuerDid : credential.issuer,
            validFrom: credential.validFrom === '{{issue_date}}' ? new Date().toISOString() : credential.validFrom,
        };

        // Issue the updated credential
        const vc = await wallet.invoke.issueCredential(
            preparedCredential as Parameters<typeof wallet.invoke.issueCredential>[0]
        );

        // Update the boost
        const boostMetadata = {
            name,
            type: ((credential.credentialSubject as Record<string, unknown>)?.achievement as Record<string, unknown>)?.achievementType as string || 'Achievement',
            category: 'achievement',
            meta: { appListingId: listingId, integrationId },
        };

        await wallet.invoke.updateBoost(
            boostUri,
            boostMetadata as unknown as Parameters<typeof wallet.invoke.updateBoost>[1],
            vc as Parameters<typeof wallet.invoke.updateBoost>[2]
        );

        // Refetch to update local state
        refetch();
    }, [listingId, integrationId, refetch]);

    const deleteTemplate = useCallback(async (boostUri: string): Promise<void> => {
        if (!listingId) {
            throw new Error('listingId is required to delete templates');
        }

        const wallet = await initWalletRef.current();
        const template = templates.find(t => t.boostUri === boostUri);
        
        if (template?.templateAlias) {
            // Remove from app listing
            await wallet.invoke.removeBoostFromApp(listingId, template.templateAlias);
        }

        // Refetch to update local state
        refetch();
    }, [listingId, templates, refetch]);

    const updateAlias = useCallback(async (
        boostUri: string,
        newAlias: string
    ): Promise<void> => {
        if (!listingId) {
            throw new Error('listingId is required to update alias');
        }

        const wallet = await initWalletRef.current();
        const template = templates.find(t => t.boostUri === boostUri);
        if (!template?.templateAlias) {
            throw new Error('Template not found or has no alias');
        }

        const sanitizedAlias = newAlias.toLowerCase().replace(/[^a-z0-9-]/g, '');
        if (!sanitizedAlias) {
            throw new Error('Invalid alias');
        }

        // Check for duplicates
        const otherAliases = templates
            .filter(t => t.boostUri !== boostUri)
            .map(t => t.templateAlias)
            .filter(Boolean);
        
        if (otherAliases.includes(sanitizedAlias)) {
            throw new Error('Alias already in use');
        }

        // Remove old alias and add new one
        await wallet.invoke.removeBoostFromApp(listingId, template.templateAlias);
        await wallet.invoke.addBoostToApp(listingId, boostUri, sanitizedAlias);

        // Refetch to update local state
        refetch();
    }, [listingId, templates, refetch]);

    return {
        templates,
        isLoading,
        error,
        refetch,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        updateAlias,
    };
}

/**
 * Backward-compatible wrapper for existing usages
 * @deprecated Use useTemplateManager instead
 */
export function useTemplateDetails(
    integrationId: string,
    _basicTemplates: CredentialTemplate[] = []
): TemplateDetailsResult {
    const result = useTemplateManager({ integrationId });
    return {
        templates: result.templates,
        isLoading: result.isLoading,
        error: result.error,
        refetch: result.refetch,
    };
}
