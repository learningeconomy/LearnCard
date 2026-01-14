/**
 * TemplateBuilderStep - Interactive OBv3 credential template builder
 * 
 * Uses the CredentialBuilder component for a full-featured, schema-driven
 * credential template editor with live JSON preview and bidirectional editing.
 * 
 * Performance optimizations:
 * - Constants and utils extracted to separate files for better code splitting
 * - API calls parallelized for faster loading
 * - Modals lazy loaded to reduce initial bundle size
 * - Expensive computations memoized
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from 'react';
import Papa from 'papaparse';
import {
    FileStack,
    FileSpreadsheet,
    Plus,
    Trash2,
    ArrowRight,
    ArrowLeft,
    ArrowDown,
    Award,
    ChevronDown,
    Loader2,
    Save,
    AlertCircle,
    Upload,
    Check,
    CheckCircle,
    CheckCircle2,
    XCircle,
    Pencil,
    X,
    Image as ImageIcon,
} from 'lucide-react';

import { useWallet, useFilestack } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';

import { CredentialTemplate, BrandingConfig, TemplateBoostMeta, PartnerProject } from '../types';
import { 
    CredentialBuilder,
    OBv3CredentialTemplate, 
    templateToJson, 
    jsonToTemplate,
    extractDynamicVariables,
} from '../components/CredentialBuilder';

// Extracted constants and utilities for better code splitting
import { 
    DEFAULT_FIELDS, 
    ISSUANCE_FIELDS, 
    ISSUANCE_FIELD_MAP,
    FIELD_GROUPS,
    CATALOG_FIELD_OPTIONS,
    suggestCatalogFieldMapping,
    TEMPLATE_META_VERSION,
} from './templateBuilderConstants';
import { 
    ExtendedTemplate, 
    ValidationStatus,
    legacyToOBv3, 
    obv3ToLegacy,
    generateMasterTemplate,
    generateChildBoostForCourse,
    createBoostMeta,
} from './templateBuilderUtils';
import { TemplateEditor } from './TemplateEditor';

// Lazy load heavy modal components
const CsvImportModal = lazy(() => import('./CsvImportModal'));
const ChildEditModal = lazy(() => import('./ChildEditModal'));

// Loading fallback for lazy-loaded modals
const ModalLoadingFallback = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto" />
        </div>
    </div>
);

interface TemplateBuilderStepProps {
    templates: CredentialTemplate[];
    branding: BrandingConfig | null;
    project: PartnerProject | null;
    onComplete: (templates: CredentialTemplate[]) => void;
    onBack: () => void;
}

export const TemplateBuilderStep: React.FC<TemplateBuilderStepProps> = ({
    templates,
    branding,
    project,
    onComplete,
    onBack,
}) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const initWalletRef = useRef(initWallet);
    initWalletRef.current = initWallet;

    const [localTemplates, setLocalTemplates] = useState<ExtendedTemplate[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [pendingDeletes, setPendingDeletes] = useState<string[]>([]);

    // Validation status tracking for each template (ValidationStatus type imported from templateBuilderUtils)
    const [validationStatuses, setValidationStatuses] = useState<Record<string, { status: ValidationStatus; error?: string }>>({});

    // Handle validation status changes from TemplateEditor
    const handleValidationChange = useCallback((templateId: string, status: ValidationStatus, error?: string) => {
        setValidationStatuses(prev => ({
            ...prev,
            [templateId]: { status, error },
        }));
    }, []);

    // Child template editing modal state
    const [editingChild, setEditingChild] = useState<{
        masterId: string;
        childId: string;
        template: OBv3CredentialTemplate;
    } | null>(null);

    // Child template validation state
    const [childValidationStatus, setChildValidationStatus] = useState<ValidationStatus>('unknown');
    const [childValidationError, setChildValidationError] = useState<string | null>(null);

    // CSV Catalog Import state
    const [showImportModal, setShowImportModal] = useState(false);
    const [csvColumns, setCsvColumns] = useState<string[]>([]);
    const [csvAllRows, setCsvAllRows] = useState<Record<string, string>[]>([]);
    const [csvSampleRows, setCsvSampleRows] = useState<Record<string, string>[]>([]);
    const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
    const [issuanceFieldsIncluded, setIssuanceFieldsIncluded] = useState<Record<string, boolean>>({});
    const [templateNamePattern, setTemplateNamePattern] = useState('{{course_name}} Completion');
    const [defaultImage, setDefaultImage] = useState<string>('');
    const csvInputRef = useRef<HTMLInputElement>(null);

    // Filestack for default image upload
    const { handleFileSelect: handleImageSelect, isLoading: isUploadingImage } = useFilestack({
        onUpload: (url: string) => setDefaultImage(url),
        fileType: 'image/*',
    });

    const integrationId = project?.id;

    // Fetch existing templates (boosts) for this integration
    // OPTIMIZED: Uses parallel API calls instead of sequential for much faster loading
    const fetchTemplates = useCallback(async () => {
        if (!integrationId) {
            setLocalTemplates((templates.length > 0 ? templates : []) as ExtendedTemplate[]);
            setIsLoading(false);
            return;
        }

        try {
            const wallet = await initWalletRef.current();
            const result = await wallet.invoke.getPaginatedBoosts({
                limit: 100,
                query: { meta: { integrationId } },
            });

            const boostRecords = result?.records || [];
            
            // PARALLEL: Fetch all boost details at once instead of sequentially
            const boostPromises = boostRecords.map(async (boostRecord) => {
                const boostUri = (boostRecord as Record<string, unknown>).uri as string;
                try {
                    const fullBoost = await wallet.invoke.getBoost(boostUri);
                    const meta = fullBoost.meta as TemplateBoostMeta | undefined;
                    const templateConfig = meta?.templateConfig;
                    const credential = fullBoost.boost as Record<string, unknown> | undefined;

                    let obv3Template: OBv3CredentialTemplate | undefined;
                    if (credential) {
                        try {
                            obv3Template = jsonToTemplate(credential);
                        } catch (e) {
                            console.warn('Failed to parse credential as OBv3:', e);
                        }
                    }

                    const credentialName = credential?.name as string | undefined;
                    const credentialDesc = credential?.description as string | undefined;

                    return {
                        id: boostUri,
                        boostUri,
                        name: fullBoost.name || credentialName || 'Untitled Template',
                        description: credentialDesc || '',
                        achievementType: templateConfig?.achievementType || 'Course Completion',
                        fields: templateConfig?.fields || [],
                        isNew: false,
                        isDirty: false,
                        obv3Template,
                        isMasterTemplate: meta?.isMasterTemplate,
                    } as ExtendedTemplate;
                } catch (e) {
                    console.warn('Failed to fetch boost:', boostUri, e);
                    return null;
                }
            });

            const allTemplatesWithNulls = await Promise.all(boostPromises);
            const allTemplates = allTemplatesWithNulls.filter((t): t is ExtendedTemplate => t !== null);

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
                        try {
                            const fullChild = await wallet.invoke.getBoost(childUri);
                            const childMeta = fullChild.meta as TemplateBoostMeta | undefined;
                            const childConfig = childMeta?.templateConfig;
                            const childCredential = fullChild.boost as Record<string, unknown> | undefined;

                            let childObv3Template: OBv3CredentialTemplate | undefined;
                            if (childCredential) {
                                try {
                                    childObv3Template = jsonToTemplate(childCredential);
                                } catch (e) {
                                    console.warn('Failed to parse child credential as OBv3:', e);
                                }
                            }

                            const credentialName = childCredential?.name as string | undefined;
                            const credentialDesc = childCredential?.description as string | undefined;

                            return {
                                id: childUri,
                                boostUri: childUri,
                                name: fullChild.name || credentialName || 'Untitled',
                                description: credentialDesc || '',
                                achievementType: childConfig?.achievementType || 'Course Completion',
                                fields: childConfig?.fields || [],
                                isNew: false,
                                isDirty: false,
                                obv3Template: childObv3Template,
                                parentTemplateId: master.id,
                            } as ExtendedTemplate;
                        } catch (e) {
                            console.warn('Failed to fetch child boost:', childUri, e);
                            return null;
                        }
                    });

                    const childrenWithNulls = await Promise.all(childPromises);
                    const children = childrenWithNulls.filter((c): c is ExtendedTemplate => c !== null);
                    const childUris = childRecords.map(r => (r as Record<string, unknown>).uri as string);
                    
                    return { masterId: master.id, children, childUris };
                } catch (e) {
                    console.warn('Failed to fetch children for master template:', e);
                    return { masterId: master.id, children: [], childUris: [] };
                }
            });

            const childrenResults = await Promise.all(childrenPromises);
            
            // Build a map of master -> children and collect all child URIs
            const masterChildrenMap = new Map<string, ExtendedTemplate[]>();
            const allChildUris = new Set<string>();
            
            for (const result of childrenResults) {
                masterChildrenMap.set(result.masterId, result.children);
                result.childUris.forEach(uri => allChildUris.add(uri));
            }

            // Build final template list
            const fetchedTemplates: ExtendedTemplate[] = [];
            
            for (const template of allTemplates) {
                if (template.isMasterTemplate) {
                    fetchedTemplates.push({
                        ...template,
                        childTemplates: masterChildrenMap.get(template.id) || [],
                    });
                } else if (!allChildUris.has(template.boostUri || '')) {
                    // Only add non-master templates that aren't children
                    fetchedTemplates.push(template);
                }
            }

            setLocalTemplates(fetchedTemplates.length > 0 ? fetchedTemplates : templates as ExtendedTemplate[]);
        } catch (err) {
            console.error('Failed to fetch templates:', err);
            setLocalTemplates((templates.length > 0 ? templates : []) as ExtendedTemplate[]);
        } finally {
            setIsLoading(false);
        }
    }, [integrationId, templates]);

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    // Save a single template as a boost (create or update)
    const saveTemplateAsBoost = async (template: ExtendedTemplate): Promise<string | null> => {
        if (!integrationId) return null;

        try {
            const wallet = await initWalletRef.current();

            // Get OBv3 template or convert from legacy
            const obv3Template = template.obv3Template || legacyToOBv3(template, branding?.displayName, branding?.image);

            // Convert to JSON credential
            const credential = templateToJson(obv3Template);

            // Extract dynamic variables for storage
            const dynamicVars = extractDynamicVariables(obv3Template);

            const boostMeta: TemplateBoostMeta = {
                integrationId,
                templateConfig: {
                    fields: dynamicVars.map(varName => ({
                        id: varName,
                        name: varName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        type: 'text' as const,
                        required: false,
                        variableName: varName,
                    })),
                    achievementType: obv3Template.credentialSubject.achievement.achievementType?.value || 'Achievement',
                    version: TEMPLATE_META_VERSION,
                },
                isMasterTemplate: template.isMasterTemplate,
            };

            const boostMetadata = {
                name: template.name,
                description: template.description,
                type: template.achievementType,
                category: 'achievement',
                meta: boostMeta,
                status: 'PROVISIONAL'
            };

            // If updating existing boost, use updateBoost to preserve children
            if (template.boostUri) {
                await wallet.invoke.updateBoost(
                    template.boostUri,
                    boostMetadata as unknown as Parameters<typeof wallet.invoke.updateBoost>[1],
                    credential as Parameters<typeof wallet.invoke.updateBoost>[2]
                );

                return template.boostUri;
            }

            // Otherwise create a new boost
            const boostUri = await wallet.invoke.createBoost(
                credential as Parameters<typeof wallet.invoke.createBoost>[0],
                boostMetadata as unknown as Parameters<typeof wallet.invoke.createBoost>[1]
            );

            return boostUri;
        } catch (err) {
            console.error('Failed to save template as boost:', err);
            throw err;
        }
    };

    // Delete a boost
    const deleteBoost = async (boostUri: string) => {
        try {
            const wallet = await initWalletRef.current();
            await wallet.invoke.deleteBoost(boostUri);
        } catch (err) {
            console.error('Failed to delete boost:', err);
            throw err;
        }
    };

    // Save a child template as a child boost linked to parent
    const saveChildTemplateAsBoost = async (
        template: ExtendedTemplate, 
        parentBoostUri: string
    ): Promise<string | null> => {
        try {
            const wallet = await initWalletRef.current();

            // Use OBv3 template if available, otherwise convert
            const obv3Template = template.obv3Template || legacyToOBv3(
                template,
                branding?.displayName,
                branding?.image
            );

            const credential = templateToJson(obv3Template);

            const boostMeta: TemplateBoostMeta = {
                integrationId: integrationId!,
                templateConfig: {
                    version: TEMPLATE_META_VERSION,
                    achievementType: template.achievementType,
                    fields: template.fields,
                },
            };

            const boostMetadata = {
                name: template.name,
                description: template.description,
                type: template.achievementType,
                category: 'achievement',
                meta: boostMeta,
                status: 'PROVISIONAL',
            };

            // If updating existing child boost, use updateBoost
            if (template.boostUri) {
                await wallet.invoke.updateBoost(
                    template.boostUri,
                    boostMetadata as unknown as Parameters<typeof wallet.invoke.updateBoost>[1],
                    credential as Parameters<typeof wallet.invoke.updateBoost>[2]
                );

                return template.boostUri;
            }

            // Otherwise create as new child boost linked to parent
            const boostUri = await wallet.invoke.createChildBoost(
                parentBoostUri,
                credential as Parameters<typeof wallet.invoke.createChildBoost>[1],
                boostMetadata as unknown as Parameters<typeof wallet.invoke.createChildBoost>[2]
            );

            return boostUri;
        } catch (err) {
            console.error('Failed to save child template as boost:', err);
            throw err;
        }
    };

    // Save all templates
    const handleSaveAll = async () => {
        if (!integrationId) {
            presentToast('No project selected', { type: ToastTypeEnum.Error, hasDismissButton: true });
            return;
        }

        setIsSaving(true);

        try {
            // Delete pending deletes
            for (const uri of pendingDeletes) {
                await deleteBoost(uri);
            }

            setPendingDeletes([]);

            // Save all templates that are new or dirty
            const savedTemplates: CredentialTemplate[] = [];

            for (const template of localTemplates) {
                // Check if any children need saving (for master templates)
                const hasChildUpdates = template.isMasterTemplate && 
                    template.childTemplates?.some(c => c.isNew || c.isDirty || !c.boostUri);

                if (template.isNew || template.isDirty || !template.boostUri || hasChildUpdates) {
                    // Handle master templates with children
                    if (template.isMasterTemplate && template.childTemplates?.length) {
                        // First, save the master template
                        const parentBoostUri = await saveTemplateAsBoost(template);

                        if (parentBoostUri) {
                            // Save each child that needs saving
                            const savedChildren: ExtendedTemplate[] = [];

                            for (const child of template.childTemplates) {
                                // Only save children that are new, dirty, or don't have a boostUri
                                if (child.isNew || child.isDirty || !child.boostUri) {
                                    try {
                                        const childBoostUri = await saveChildTemplateAsBoost(child, parentBoostUri);

                                        savedChildren.push({
                                            ...child,
                                            id: childBoostUri || child.id,
                                            boostUri: childBoostUri || undefined,
                                            isNew: false,
                                            isDirty: false,
                                        });
                                    } catch (e) {
                                        console.error('Failed to save child boost:', e);
                                        // Keep the original child on error
                                        savedChildren.push(child);
                                    }
                                } else {
                                    // Child doesn't need saving, keep as-is
                                    savedChildren.push(child);
                                }
                            }

                            savedTemplates.push({
                                ...template,
                                id: parentBoostUri,
                                boostUri: parentBoostUri,
                                isNew: false,
                                isDirty: false,
                                childTemplates: savedChildren,
                            } as ExtendedTemplate);
                        }
                    } else {
                        // Regular template - save as standalone boost
                        const boostUri = await saveTemplateAsBoost(template);

                        savedTemplates.push({
                            ...template,
                            id: boostUri || template.id,
                            boostUri: boostUri || undefined,
                            isNew: false,
                            isDirty: false,
                        });
                    }
                } else {
                    savedTemplates.push(template);
                }
            }

            setLocalTemplates(savedTemplates as ExtendedTemplate[]);
            presentToast('Templates saved successfully!', { type: ToastTypeEnum.Success, hasDismissButton: true });
            onComplete(savedTemplates);
        } catch (err) {
            console.error('Failed to save templates:', err);
            presentToast('Failed to save templates', { type: ToastTypeEnum.Error, hasDismissButton: true });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddTemplate = () => {
        const newTemplate: CredentialTemplate = {
            id: `template_${Date.now()}`,
            name: '',
            description: '',
            achievementType: 'Course Completion',
            fields: [...DEFAULT_FIELDS],
            isNew: true,
            isDirty: true,
        };

        setLocalTemplates([...localTemplates, newTemplate as ExtendedTemplate]);
        setExpandedId(newTemplate.id);
    };

    // Handle CSV file upload for catalog import
    const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            complete: (results) => {
                const headers = results.meta.fields || [];
                const allRows = (results.data as Record<string, string>[]).filter(
                    row => Object.values(row).some(v => v?.trim())
                );

                setCsvColumns(headers);
                setCsvAllRows(allRows);
                setCsvSampleRows(allRows.slice(0, 3));

                // Auto-suggest mappings for each column (catalog-level fields)
                const suggestions: Record<string, string> = {};
                headers.forEach(col => {
                    suggestions[col] = suggestCatalogFieldMapping(col);
                });
                setColumnMappings(suggestions);

                // Initialize issuance fields with defaults
                const issuanceDefaults: Record<string, boolean> = {};
                ISSUANCE_FIELDS.forEach(field => {
                    issuanceDefaults[field.id] = field.defaultIncluded;
                });
                setIssuanceFieldsIncluded(issuanceDefaults);

                // Find the achievement name column to set pattern
                const nameCol = headers.find(h => suggestCatalogFieldMapping(h) === 'achievement_name');
                if (nameCol) {
                    const varName = nameCol.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
                    setTemplateNamePattern(`{{${varName}}} Completion`);
                } else {
                    setTemplateNamePattern('Course Completion Certificate');
                }

                setShowImportModal(true);
            },
            error: (error) => {
                console.error('CSV parse error:', error);
                presentToast('Failed to parse CSV file', { type: ToastTypeEnum.Error, hasDismissButton: true });
            },
        });

        // Reset file input
        if (csvInputRef.current) {
            csvInputRef.current.value = '';
        }
    };

    // Handle import confirmation - generate master template + child boosts
    const handleImportConfirm = () => {
        // Generate master template first (using imported utility)
        const masterTemplate = generateMasterTemplate(columnMappings, issuanceFieldsIncluded, branding);

        // Generate child boosts for each course, linked to master (using imported utility)
        const childTemplates = csvAllRows.map(row => 
            generateChildBoostForCourse(row, masterTemplate.id, columnMappings, issuanceFieldsIncluded, branding, defaultImage)
        );

        // Attach children to master for UI display
        masterTemplate.childTemplates = childTemplates;

        // Add master template (children are nested within it for display)
        setLocalTemplates([...localTemplates, masterTemplate]);
        setExpandedId(masterTemplate.id);
        setShowImportModal(false);
        
        presentToast(`Created master template + ${childTemplates.length} course boosts!`, { 
            type: ToastTypeEnum.Success, 
            hasDismissButton: true 
        });

        // Reset import state
        setCsvColumns([]);
        setCsvAllRows([]);
        setCsvSampleRows([]);
        setColumnMappings({});
        setIssuanceFieldsIncluded({});
        setDefaultImage('');
    };

    // Close import modal
    const handleImportCancel = () => {
        setShowImportModal(false);
        setCsvColumns([]);
        setCsvSampleRows([]);
        setColumnMappings({});
        setDefaultImage('');
    };

    const handleUpdateTemplate = (id: string, updated: ExtendedTemplate) => {
        setLocalTemplates(localTemplates.map(t =>
            t.id === id ? { ...updated, isDirty: true } as ExtendedTemplate : t
        ));
    };

    const handleDeleteTemplate = (id: string) => {
        const template = localTemplates.find(t => t.id === id);

        if (template) {
            const urisToDelete: string[] = [];

            // For master templates, queue children for deletion first
            if (template.isMasterTemplate && template.childTemplates?.length) {
                for (const child of template.childTemplates) {
                    if (child.boostUri) {
                        urisToDelete.push(child.boostUri);
                    }
                }
            }

            // Then queue the master/parent template itself
            if (template.boostUri) {
                urisToDelete.push(template.boostUri);
            }

            if (urisToDelete.length > 0) {
                setPendingDeletes([...pendingDeletes, ...urisToDelete]);
            }
        }

        setLocalTemplates(localTemplates.filter(t => t.id !== id));

        if (expandedId === id) setExpandedId(null);
    };

    // Open edit modal for a child template
    const handleEditChild = (masterId: string, child: ExtendedTemplate) => {
        // Get or create OBv3 template for the child
        const obv3Template = child.obv3Template || legacyToOBv3(child, branding?.displayName, branding?.image);

        setEditingChild({
            masterId,
            childId: child.id,
            template: JSON.parse(JSON.stringify(obv3Template)), // Deep clone
        });
    };

    // Save edited child template
    const handleSaveChildEdit = () => {
        if (!editingChild) return;

        setLocalTemplates(prev => prev.map(master => {
            if (master.id !== editingChild.masterId) return master;

            const updatedChildren = master.childTemplates?.map(child => {
                if (child.id !== editingChild.childId) return child;

                // Convert OBv3 back to legacy format
                const updatedChild = obv3ToLegacy(editingChild.template, child) as ExtendedTemplate;
                updatedChild.obv3Template = editingChild.template;
                updatedChild.isDirty = true;

                return updatedChild;
            }) as ExtendedTemplate[] | undefined;

            return {
                ...master,
                childTemplates: updatedChildren,
                isDirty: true,
            } as ExtendedTemplate;
        }));

        setEditingChild(null);
        presentToast('Child template updated', { type: ToastTypeEnum.Success });
    };

    // Cancel child edit
    const handleCancelChildEdit = () => {
        setEditingChild(null);
        setChildValidationStatus('unknown');
        setChildValidationError(null);
    };

    // Handle child template validation status changes
    const handleChildValidationChange = useCallback((status: ValidationStatus, error?: string) => {
        setChildValidationStatus(status);
        setChildValidationError(error || null);
    }, []);

    // Update the template being edited in the modal
    const handleChildTemplateChange = (newTemplate: OBv3CredentialTemplate) => {
        if (!editingChild) return;

        setEditingChild({
            ...editingChild,
            template: newTemplate,
        });
    };

    // Test issue handler - tests if a credential can be issued
    const handleTestIssue = useCallback(async (credential: Record<string, unknown>): Promise<{ success: boolean; error?: string; result?: unknown }> => {
        try {
            const wallet = await initWalletRef.current();

            // Replace dynamic variables with sample values
            const replaceDynamicVariables = (obj: unknown): unknown => {
                if (typeof obj === 'string') {
                    // Replace {{variable_name}} with sample values
                    return obj.replace(/\{\{(\w+)\}\}/g, (_match, varName) => {
                        // Special handling for date fields - use actual ISO dates
                        const lowerVar = varName.toLowerCase();
                        if (lowerVar.includes('date') || lowerVar.includes('time')) {
                            return new Date().toISOString();
                        }

                        // Use humanized variable name as sample value for other fields
                        const humanized = varName.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                        return `[Sample ${humanized}]`;
                    });
                }

                if (Array.isArray(obj)) {
                    return obj.map(replaceDynamicVariables);
                }

                if (obj && typeof obj === 'object') {
                    const result: Record<string, unknown> = {};
                    for (const [key, value] of Object.entries(obj)) {
                        result[key] = replaceDynamicVariables(value);
                    }
                    return result;
                }

                return obj;
            };

            const renderedCredential = replaceDynamicVariables(credential) as Record<string, unknown>;

            // Ensure required array fields are present and non-empty
            const contexts = renderedCredential['@context'];
            const types = renderedCredential['type'];

            const testCredential = {
                ...renderedCredential,
                '@context': Array.isArray(contexts) && contexts.length > 0 
                    ? contexts 
                    : ['https://www.w3.org/ns/credentials/v2'],
                type: Array.isArray(types) && types.length > 0 
                    ? types 
                    : ['VerifiableCredential'],
                issuer: wallet.id.did(),
                validFrom: new Date().toISOString(),
                credentialSubject: {
                    ...(renderedCredential.credentialSubject as Record<string, unknown> || {}),
                    id: wallet.id.did(),
                },
            };

            console.log('Test issuing credential:', testCredential);

            const result = await wallet.invoke.issueCredential?.(testCredential as Parameters<typeof wallet.invoke.issueCredential>[0]);

            if (result) {
                return { success: true, result };
            } else {
                return { success: false, error: 'issueCredential returned undefined' };
            }
        } catch (e) {
            return { success: false, error: (e as Error).message };
        }
    }, []);

    const hasUnsavedChanges = localTemplates.some(t => t.isNew || t.isDirty) || pendingDeletes.length > 0;

    // Check if any templates have invalid validation status
    const hasInvalidTemplates = localTemplates.some(t => validationStatuses[t.id]?.status === 'invalid');
    const hasUnvalidatedTemplates = localTemplates.some(t => {
        const status = validationStatuses[t.id]?.status;
        return !status || status === 'unknown' || status === 'dirty';
    });

    const canProceed = localTemplates.length > 0 && 
        localTemplates.every(t => t.name.trim()) && 
        !hasInvalidTemplates;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Info */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <FileStack className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />

                <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Create Credential Templates</p>
                    <p>
                        Templates define the structure of credentials you'll issue. Each template is saved 
                        as a reusable boost that can be issued to recipients.
                    </p>
                </div>
            </div>

            {/* Unsaved Changes Warning */}
            {hasUnsavedChanges && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>You have unsaved changes. Click "Save & Continue" to save your templates.</span>
                </div>
            )}

            {/* Validation Warnings */}
            {hasInvalidTemplates && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                    <span>
                        <strong>Validation failed:</strong> One or more templates failed validation. 
                        Expand the template and click the validation badge to see details.
                    </span>
                </div>
            )}

            {!hasInvalidTemplates && hasUnvalidatedTemplates && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-sm">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>
                        <strong>Tip:</strong> Click the "Validate" button in each template to verify your credentials 
                        will issue correctly before saving.
                    </span>
                </div>
            )}

            {/* Templates */}
            <div className="space-y-4">
                {localTemplates.map((template) => (
                    <div key={template.id}>
                        {/* Master Template with Children */}
                        {template.isMasterTemplate ? (
                            <div className="border-2 border-violet-200 rounded-xl overflow-hidden">
                                {/* Master Template Header */}
                                <div 
                                    className="flex items-center gap-3 p-4 bg-violet-50 cursor-pointer"
                                    onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                                >
                                    <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                                        <FileStack className="w-5 h-5 text-violet-600" />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-800">{template.name}</span>
                                            <span className="px-2 py-0.5 bg-violet-200 text-violet-700 text-xs font-medium rounded-full">
                                                Master Template
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-500">
                                            {template.childTemplates?.length || 0} course boosts • {template.fields?.length || 0} dynamic fields
                                        </p>
                                    </div>

                                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                                        expandedId === template.id ? 'rotate-180' : ''
                                    }`} />
                                </div>

                                {/* Expanded: Show Children */}
                                {expandedId === template.id && (
                                    <div className="p-4 bg-white border-t border-violet-200">
                                        {/* Master Template Info */}
                                        <div className="mb-4 p-3 bg-violet-50 rounded-lg space-y-2">
                                            {(() => {
                                                const issuanceFieldMap = ISSUANCE_FIELDS.reduce(
                                                    (acc, f) => ({ ...acc, [f.id]: f }),
                                                    {} as Record<string, typeof ISSUANCE_FIELDS[0]>
                                                );

                                                const dynamicVars = template.fields?.filter(
                                                    f => issuanceFieldMap[f.id]?.type === 'dynamic'
                                                ) || [];

                                                const systemVars = template.fields?.filter(
                                                    f => issuanceFieldMap[f.id]?.type === 'system'
                                                ) || [];

                                                return (
                                                    <>
                                                        {dynamicVars.length > 0 && (
                                                            <p className="text-sm text-violet-800">
                                                                <strong>User-provided at issuance:</strong>{' '}
                                                                {dynamicVars.map(f => `{{${f.variableName}}}`).join(', ')}
                                                            </p>
                                                        )}

                                                        {systemVars.length > 0 && (
                                                            <p className="text-sm text-violet-600">
                                                                <strong>Auto-injected:</strong>{' '}
                                                                {systemVars.map(f => `{{${f.variableName}}}`).join(', ')}
                                                            </p>
                                                        )}

                                                        {dynamicVars.length === 0 && systemVars.length === 0 && (
                                                            <p className="text-sm text-violet-600">No dynamic variables</p>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        {/* Child Templates List */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                                <span className="font-medium">Course Boosts ({template.childTemplates?.length})</span>
                                            </div>

                                            <div className="max-h-64 overflow-y-auto space-y-2">
                                                {template.childTemplates?.map((child, idx) => (
                                                    <div 
                                                        key={child.id}
                                                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 group"
                                                    >
                                                        <span className="w-6 h-6 bg-gray-200 rounded text-xs flex items-center justify-center text-gray-600 font-medium">
                                                            {idx + 1}
                                                        </span>

                                                        <Award className="w-4 h-4 text-cyan-500" />

                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-gray-800 truncate">{child.name}</p>
                                                            <p className="text-xs text-gray-500 truncate">{child.description || 'No description'}</p>
                                                        </div>

                                                        <span className="text-xs text-gray-400">
                                                            {child.fields?.length || 0} fields
                                                        </span>

                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditChild(template.id, child as ExtendedTemplate);
                                                            }}
                                                            className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Customize this boost"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Delete Master Template Button */}
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <button
                                                onClick={() => handleDeleteTemplate(template.id)}
                                                className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete Master Template & All Course Boosts
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Regular Template */
                            <TemplateEditor
                                template={template}
                                branding={branding}
                                onChange={(updated) => handleUpdateTemplate(template.id, updated)}
                                onDelete={() => handleDeleteTemplate(template.id)}
                                isExpanded={expandedId === template.id}
                                onToggle={() => setExpandedId(expandedId === template.id ? null : template.id)}
                                onTestIssue={handleTestIssue}
                                onValidationChange={handleValidationChange}
                                validationStatus={validationStatuses[template.id]?.status || 'unknown'}
                            />
                        )}
                    </div>
                ))}

                {/* Add Template Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleAddTemplate}
                        disabled={isSaving}
                        className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors disabled:opacity-50"
                    >
                        <Plus className="w-5 h-5" />
                        Add Blank Template
                    </button>

                    <label className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50 transition-colors cursor-pointer">
                        <Upload className="w-5 h-5" />
                        Import from Catalog
                        <input
                            ref={csvInputRef}
                            type="file"
                            accept=".csv,.tsv,.txt"
                            onChange={handleCsvUpload}
                            className="hidden"
                        />
                    </label>
                </div>

                <p className="text-xs text-center text-gray-500">
                    Upload a CSV of your courses to auto-generate a template with dynamic fields
                </p>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                    onClick={onBack}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <button
                    onClick={handleSaveAll}
                    disabled={!canProceed || isSaving}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save & Continue
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>

            {/* Import from Catalog Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-800">Import Course Catalog</h3>
                                    <p className="text-sm text-gray-500">
                                        {csvAllRows.length} courses found • {csvColumns.length} columns
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleImportCancel}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-auto p-4 space-y-6">
                            {/* Explanation */}
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
                                <p className="font-medium mb-1">How this works:</p>
                                <p>
                                    We'll create <strong>{csvAllRows.length} separate boosts</strong> — one for each course. 
                                    Course data (name, credits, etc.) will be <strong>baked in</strong>. 
                                    Recipient data (name, date) stays <strong>dynamic</strong> for issuance.
                                </p>
                            </div>

                            {/* Default Image Section */}
                            <div>
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Default Credential Image
                                    </label>
                                    <p className="text-xs text-gray-500">
                                        This image will be used for all credentials unless overridden by a CSV column
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    {defaultImage ? (
                                        <div className="relative group">
                                            <img
                                                src={defaultImage}
                                                alt="Default credential"
                                                className="w-20 h-20 rounded-xl object-cover border border-gray-200"
                                            />

                                            <button
                                                onClick={() => setDefaultImage('')}
                                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                                            <ImageIcon className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}

                                    <button
                                        onClick={handleImageSelect}
                                        disabled={isUploadingImage}
                                        className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    >
                                        {isUploadingImage ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4" />
                                                {defaultImage ? 'Change Image' : 'Upload Image'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Catalog Fields Section */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Catalog Fields (Baked into each boost)
                                        </label>
                                        <p className="text-xs text-gray-500">These values come from your CSV</p>
                                    </div>

                                    <span className="text-xs text-gray-500">
                                        {Object.values(columnMappings).filter(v => v !== 'skip').length} mapped
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {csvColumns.map(column => {
                                        const mapping = columnMappings[column] || 'skip';
                                        const sampleValue = csvSampleRows[0]?.[column] || '';

                                        return (
                                            <div
                                                key={column}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                                                    mapping === 'skip'
                                                        ? 'border-gray-200 bg-gray-50'
                                                        : 'border-emerald-200 bg-emerald-50'
                                                }`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-gray-800 truncate">{column}</div>

                                                    {sampleValue && (
                                                        <div className="text-xs text-gray-500 truncate">
                                                            e.g., "{sampleValue}"
                                                        </div>
                                                    )}
                                                </div>

                                                <ArrowDown className={`w-4 h-4 flex-shrink-0 ${
                                                    mapping === 'skip' ? 'text-gray-300' : 'text-emerald-500'
                                                }`} />

                                                <select
                                                    value={mapping}
                                                    onChange={(e) => setColumnMappings(prev => ({
                                                        ...prev,
                                                        [column]: e.target.value
                                                    }))}
                                                    className={`px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                                                        mapping === 'skip'
                                                            ? 'border-gray-300 bg-white'
                                                            : 'border-emerald-300 bg-white'
                                                    }`}
                                                >
                                                    {/* Skip option */}
                                                    <option value="skip">— Skip this column —</option>

                                                    {/* Group options by category */}
                                                    {Object.entries(FIELD_GROUPS)
                                                        .filter(([key]) => key !== 'skip')
                                                        .map(([groupKey, groupLabel]) => {
                                                            const groupOptions = CATALOG_FIELD_OPTIONS.filter(o => o.group === groupKey);

                                                            if (groupOptions.length === 0) return null;

                                                            return (
                                                                <optgroup key={groupKey} label={groupLabel}>
                                                                    {groupOptions.map(option => (
                                                                        <option key={option.id} value={option.id}>{option.label}</option>
                                                                    ))}
                                                                </optgroup>
                                                            );
                                                        })}
                                                </select>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Issuance Fields Section */}
                            <div>
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Issuance Fields
                                    </label>
                                    <p className="text-xs text-gray-500">
                                        <span className="text-violet-600 font-medium">Dynamic</span> = you provide at issuance time
                                    </p>
                                </div>

                                {/* Dynamic fields - user can toggle */}
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {ISSUANCE_FIELDS.filter(f => f.type === 'dynamic').map(field => {
                                        const isIncluded = issuanceFieldsIncluded[field.id] ?? field.defaultIncluded;

                                        return (
                                            <label
                                                key={field.id}
                                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                                    isIncluded
                                                        ? 'border-violet-200 bg-violet-50'
                                                        : 'border-gray-200 bg-gray-50'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isIncluded}
                                                    onChange={(e) => setIssuanceFieldsIncluded(prev => ({
                                                        ...prev,
                                                        [field.id]: e.target.checked
                                                    }))}
                                                    className="w-4 h-4 rounded border-gray-300 text-violet-500 focus:ring-2 focus:ring-violet-500"
                                                />

                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-gray-800 text-sm">{field.label}</span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-violet-100 text-violet-700">
                                                            Dynamic
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500">{field.description}</div>
                                                </div>

                                                {isIncluded && (
                                                    <code className="text-xs text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded">
                                                        {`{{${field.id}}}`}
                                                    </code>
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>

                                {/* System fields - informational only */}
                                <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-cyan-100 text-cyan-700">
                                            System
                                        </span>
                                        <span className="text-xs text-cyan-700 font-medium">Auto-injected at issuance</span>
                                    </div>
                                    <div className="space-y-1">
                                        {ISSUANCE_FIELDS.filter(f => f.type === 'system').map(field => (
                                            <div key={field.id} className="flex items-center gap-2 text-xs text-cyan-800">
                                                <CheckCircle2 className="w-3 h-3 text-cyan-600" />
                                                <span className="font-medium">{field.label}</span>
                                                <span className="text-cyan-600">— {field.description}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                    Preview: First 3 Boosts to Create
                                </h4>

                                <div className="space-y-2">
                                    {csvSampleRows.slice(0, 3).map((row, idx) => {
                                        const nameCol = Object.entries(columnMappings).find(([_, type]) => type === 'achievement.name')?.[0];
                                        const name = nameCol ? row[nameCol] : `Course ${idx + 1}`;

                                        return (
                                            <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                                                <Award className="w-4 h-4 text-cyan-500" />
                                                <span className="font-medium text-gray-800">{name} Completion</span>
                                                <span className="text-xs text-gray-500">
                                                    + {Object.values(issuanceFieldsIncluded).filter(Boolean).length} dynamic fields
                                                </span>
                                            </div>
                                        );
                                    })}

                                    {csvAllRows.length > 3 && (
                                        <div className="text-xs text-gray-500 text-center py-1">
                                            ...and {csvAllRows.length - 3} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between p-4 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                                Will create <strong>{csvAllRows.length}</strong> course boosts
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleImportCancel}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleImportConfirm}
                                    disabled={Object.values(columnMappings).every(v => v === 'skip')}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Check className="w-4 h-4" />
                                    Create {csvAllRows.length} Boosts
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Child Template Modal */}
            {editingChild && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                                    <Pencil className="w-5 h-5 text-violet-600" />
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-800">
                                        Customize Boost
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {editingChild.template.name?.value || 'Untitled'}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleCancelChildEdit}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body - CredentialBuilder */}
                        <div className="flex-1 min-h-0 overflow-auto" style={{ height: '600px' }}>
                            <CredentialBuilder
                                template={editingChild.template}
                                onChange={handleChildTemplateChange}
                                issuerName={branding?.displayName}
                                issuerImage={branding?.image}
                                onTestIssue={handleTestIssue}
                                onValidationChange={handleChildValidationChange}
                                initialValidationStatus={childValidationStatus}
                            />
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between gap-3 p-4 border-t border-gray-200 bg-gray-50">
                            {/* Validation status hint */}
                            <div className="flex-1">
                                {childValidationStatus === 'invalid' && childValidationError && (
                                    <div className="flex items-start gap-2 text-sm text-red-700">
                                        <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <span className="line-clamp-2">{childValidationError}</span>
                                    </div>
                                )}
                                {childValidationStatus === 'unknown' && (
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>Click "Validate" in the builder to verify before saving</span>
                                    </div>
                                )}
                                {childValidationStatus === 'valid' && (
                                    <div className="flex items-center gap-2 text-sm text-emerald-600">
                                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>Credential validated successfully</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleCancelChildEdit}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleSaveChildEdit}
                                    disabled={childValidationStatus === 'invalid'}
                                    className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-xl font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title={childValidationStatus === 'invalid' ? 'Fix validation errors before saving' : undefined}
                                >
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
