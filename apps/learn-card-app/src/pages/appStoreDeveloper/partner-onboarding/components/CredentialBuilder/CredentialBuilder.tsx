/**
 * CredentialBuilder - Main interactive OBv3 credential template builder
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    FileText,
    Code,
    Eye,
    Zap,
    ChevronDown,
    Sparkles,
    GraduationCap,
    Award,
    ScrollText,
    Shield,
    Users,
    Layers,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Loader2,
    RefreshCw,
    Undo2,
} from 'lucide-react';

import { BoostCategoryOptionsEnum, BoostPageViewMode, useWallet } from 'learn-card-base';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { BoostEarnedCard } from '../../../../../components/boost/boost-earned-card/BoostEarnedCard';

import { OBv3CredentialTemplate, SectionId } from './types';
import { templateToJson, validateTemplate, extractDynamicVariables } from './utils';
import { TEMPLATE_PRESETS, getBlankTemplate } from './presets';
import { JsonPreview } from './JsonPreview';
import {
    CredentialInfoSection,
    IssuerSection,
    AchievementSection,
    RecipientSection,
    EvidenceSection,
    DatesSection,
    CustomFieldsSection,
} from './sections';

// Icon mapping for presets
const PRESET_ICONS: Record<string, React.FC<{ className?: string }>> = {
    FileText,
    GraduationCap,
    Award,
    ScrollText,
    Sparkles,
    Shield,
    Users,
    Zap,
    Layers,
};

type TabId = 'builder' | 'preview' | 'json';

// Validation status for the credential
export type ValidationStatus = 'unknown' | 'validating' | 'valid' | 'invalid' | 'dirty';

// Analyze validation errors and suggest likely causes
const analyzeValidationError = (error: string): { summary: string; suggestions: string[] } => {
    const suggestions: string[] = [];
    let summary = error;

    // Common error patterns and their likely causes
    const errorPatterns = [
        {
            pattern: /invalid.*context|@context|undefined.*context/i,
            summary: 'Invalid JSON-LD context',
            suggestions: [
                'Check that @context includes required URLs',
                'Ensure no custom fields conflict with standard vocabulary',
            ],
        },
        {
            pattern: /invalid.*type|type.*invalid|undefined.*type/i,
            summary: 'Invalid credential type',
            suggestions: [
                'Ensure "type" array includes "VerifiableCredential"',
                'Check that credential types match the @context',
            ],
        },
        {
            pattern: /credentialSubject|subject.*required/i,
            summary: 'Invalid credential subject',
            suggestions: [
                'Ensure credentialSubject has required fields',
                'Check that recipient fields are properly configured',
            ],
        },
        {
            pattern: /achievement|OpenBadge/i,
            summary: 'Achievement validation error',
            suggestions: [
                'Verify achievement name and description are set',
                'Check that achievement criteria is valid',
            ],
        },
        {
            pattern: /issuer|did.*invalid/i,
            summary: 'Issuer configuration error',
            suggestions: [
                'Issuer DID will be auto-configured at issuance',
                'Check issuer name field is not empty',
            ],
        },
        {
            pattern: /date|validFrom|validUntil|issuance/i,
            summary: 'Date field error',
            suggestions: [
                'Ensure date fields use ISO 8601 format',
                'Check that validFrom is not in the future',
            ],
        },
        {
            pattern: /proof|signature|sign/i,
            summary: 'Signing/proof error',
            suggestions: [
                'This usually resolves itself - try validating again',
                'Check wallet connection status',
            ],
        },
        {
            pattern: /undefined|null|missing/i,
            summary: 'Missing required field',
            suggestions: [
                'Check that all required fields have values',
                'Review recently added/modified fields',
            ],
        },
    ];

    for (const { pattern, summary: patternSummary, suggestions: patternSuggestions } of errorPatterns) {
        if (pattern.test(error)) {
            summary = patternSummary;
            suggestions.push(...patternSuggestions);
            break;
        }
    }

    // If no pattern matched, provide generic suggestions
    if (suggestions.length === 0) {
        suggestions.push(
            'Review recently changed fields',
            'Check JSON tab for malformed data',
            'Try reverting to a template preset',
        );
    }

    return { summary, suggestions };
};

// Track which fields changed between two template states
interface FieldChange {
    path: string;
    label: string;
    oldValue: string;
    newValue: string;
}

const getFieldValue = (field: { value?: string; isDynamic?: boolean; variableName?: string } | undefined): string => {
    if (!field) return '';
    if (field.isDynamic && field.variableName) return `{{${field.variableName}}}`;
    return field.value || '';
};

const diffTemplates = (oldTemplate: OBv3CredentialTemplate | null, newTemplate: OBv3CredentialTemplate): FieldChange[] => {
    if (!oldTemplate) return [];
    
    const changes: FieldChange[] = [];
    
    // Helper to check and record field changes
    const checkField = (
        path: string, 
        label: string, 
        oldField: { value?: string; isDynamic?: boolean; variableName?: string } | undefined,
        newField: { value?: string; isDynamic?: boolean; variableName?: string } | undefined
    ) => {
        const oldVal = getFieldValue(oldField);
        const newVal = getFieldValue(newField);
        if (oldVal !== newVal) {
            changes.push({ path, label, oldValue: oldVal, newValue: newVal });
        }
    };
    
    // Check top-level fields
    checkField('name', 'Credential Name', oldTemplate.name, newTemplate.name);
    checkField('description', 'Description', oldTemplate.description, newTemplate.description);
    checkField('image', 'Image', oldTemplate.image, newTemplate.image);
    checkField('validFrom', 'Valid From', oldTemplate.validFrom, newTemplate.validFrom);
    checkField('validUntil', 'Valid Until', oldTemplate.validUntil, newTemplate.validUntil);
    
    // Check issuer fields
    checkField('issuer.name', 'Issuer Name', oldTemplate.issuer?.name, newTemplate.issuer?.name);
    checkField('issuer.url', 'Issuer URL', oldTemplate.issuer?.url, newTemplate.issuer?.url);
    checkField('issuer.image', 'Issuer Image', oldTemplate.issuer?.image, newTemplate.issuer?.image);
    
    // Check achievement fields
    const oldAch = oldTemplate.credentialSubject?.achievement;
    const newAch = newTemplate.credentialSubject?.achievement;
    checkField('achievement.name', 'Achievement Name', oldAch?.name, newAch?.name);
    checkField('achievement.description', 'Achievement Description', oldAch?.description, newAch?.description);
    checkField('achievement.image', 'Achievement Image', oldAch?.image, newAch?.image);
    checkField('achievement.criteria', 'Achievement Criteria', oldAch?.criteria?.narrative, newAch?.criteria?.narrative);
    checkField('achievement.humanCode', 'Human Code', oldAch?.humanCode, newAch?.humanCode);
    checkField('achievement.achievementType', 'Achievement Type', oldAch?.achievementType, newAch?.achievementType);
    checkField('achievement.fieldOfStudy', 'Field of Study', oldAch?.fieldOfStudy, newAch?.fieldOfStudy);
    checkField('achievement.specialization', 'Specialization', oldAch?.specialization, newAch?.specialization);
    checkField('achievement.creditsAvailable', 'Credits Available', oldAch?.creditsAvailable, newAch?.creditsAvailable);
    checkField('achievement.inLanguage', 'Language', oldAch?.inLanguage, newAch?.inLanguage);
    checkField('achievement.version', 'Version', oldAch?.version, newAch?.version);
    
    // Check credentialSubject fields
    const oldSubj = oldTemplate.credentialSubject;
    const newSubj = newTemplate.credentialSubject;
    checkField('credentialSubject.name', 'Recipient Name', oldSubj?.name, newSubj?.name);
    checkField('credentialSubject.activityStartDate', 'Activity Start Date', oldSubj?.activityStartDate, newSubj?.activityStartDate);
    checkField('credentialSubject.activityEndDate', 'Activity End Date', oldSubj?.activityEndDate, newSubj?.activityEndDate);
    checkField('credentialSubject.creditsEarned', 'Credits Earned', oldSubj?.creditsEarned, newSubj?.creditsEarned);
    checkField('credentialSubject.term', 'Term', oldSubj?.term, newSubj?.term);
    checkField('credentialSubject.licenseNumber', 'License Number', oldSubj?.licenseNumber, newSubj?.licenseNumber);
    checkField('credentialSubject.role', 'Role', oldSubj?.role, newSubj?.role);
    
    // Check custom fields count change
    const oldCustomCount = oldTemplate.customFields?.length || 0;
    const newCustomCount = newTemplate.customFields?.length || 0;
    if (newCustomCount > oldCustomCount) {
        const addedCount = newCustomCount - oldCustomCount;
        for (let i = oldCustomCount; i < newCustomCount; i++) {
            const field = newTemplate.customFields?.[i];
            if (field) {
                changes.push({
                    path: `customFields.${i}`,
                    label: `Custom Field: ${field.key}`,
                    oldValue: '',
                    newValue: getFieldValue(field.value),
                });
            }
        }
    }
    
    return changes;
};

interface CredentialBuilderProps {
    template: OBv3CredentialTemplate;
    onChange: (template: OBv3CredentialTemplate) => void;
    issuerName?: string;
    issuerImage?: string;
    onTestIssue?: (credential: Record<string, unknown>) => Promise<{ success: boolean; error?: string; result?: unknown }>;
    onValidationChange?: (status: ValidationStatus, error?: string) => void;
    initialValidationStatus?: ValidationStatus;
    /** When true, hides the "Dynamic" field mode option (useful for peer-to-peer badges) */
    disableDynamicFields?: boolean;
}

export const CredentialBuilder: React.FC<CredentialBuilderProps> = ({
    template,
    onChange,
    issuerName,
    onTestIssue,
    issuerImage,
    onValidationChange,
    initialValidationStatus = 'unknown',
    disableDynamicFields = false,
}) => {
    const { initWallet } = useWallet();
    const [userDid, setUserDid] = useState<string>('did:web:preview');
    const [activeTab, setActiveTab] = useState<TabId>('builder');
    const [validationStatus, setValidationStatus] = useState<ValidationStatus>(initialValidationStatus);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Track last valid/baseline template and field changes for debugging
    // Initialize with the starting template so we can track changes from the beginning
    const [lastValidTemplate, setLastValidTemplate] = useState<OBv3CredentialTemplate>(() => 
        JSON.parse(JSON.stringify(template))
    );
    const [changedFields, setChangedFields] = useState<FieldChange[]>([]);

    // Update validation status and notify parent
    const updateValidationStatus = useCallback((status: ValidationStatus, error?: string) => {
        setValidationStatus(status);
        setValidationError(error || null);
        onValidationChange?.(status, error);
    }, [onValidationChange]);

    // Auto-validate function
    const runValidation = useCallback(async () => {
        if (!onTestIssue) return;

        updateValidationStatus('validating');

        try {
            const json = templateToJson(template);
            const result = await onTestIssue(json);

            if (result.success) {
                updateValidationStatus('valid');
                // Store this as the last known good template
                setLastValidTemplate(JSON.parse(JSON.stringify(template)));
                setChangedFields([]);
            } else {
                // Track what changed since last valid state
                const changes = diffTemplates(lastValidTemplate, template);
                console.log("Changes", changes)
                setChangedFields(changes);
                updateValidationStatus('invalid', result.error || 'Validation failed');
            }
        } catch (e) {
            const changes = diffTemplates(lastValidTemplate, template);
            setChangedFields(changes);
            updateValidationStatus('invalid', (e as Error).message);
        }
    }, [template, onTestIssue, updateValidationStatus, lastValidTemplate]);

    // Debounced auto-validation when template changes
    const templateRef = React.useRef(template);
    const validationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Skip initial render
        if (templateRef.current === template) return;
        templateRef.current = template;

        // Mark dirty if we were previously valid
        if (validationStatus === 'valid') {
            setValidationStatus('dirty');
            onValidationChange?.('dirty');
        }

        // Clear any pending validation
        if (validationTimeoutRef.current) {
            clearTimeout(validationTimeoutRef.current);
        }

        // Debounced auto-validation (2 second delay after changes stop)
        if (onTestIssue && validationStatus !== 'validating') {
            validationTimeoutRef.current = setTimeout(() => {
                runValidation();
            }, 2000);
        }

        return () => {
            if (validationTimeoutRef.current) {
                clearTimeout(validationTimeoutRef.current);
            }
        };
    }, [template, onTestIssue, runValidation, validationStatus, onValidationChange]);

    // Analyze validation error for display
    const analyzedError = useMemo(() => {
        if (validationError) {
            return analyzeValidationError(validationError);
        }
        return null;
    }, [validationError]);

    // Revert to last valid template
    const revertToLastValid = useCallback(() => {
        if (lastValidTemplate) {
            onChange(JSON.parse(JSON.stringify(lastValidTemplate)));
            setChangedFields([]);
            setValidationStatus('valid');
            setValidationError(null);
            onValidationChange?.('valid');
        }
    }, [lastValidTemplate, onChange, onValidationChange]);

    // Fetch user's DID from wallet
    useEffect(() => {
        const fetchDid = async () => {
            try {
                const wallet = await initWallet();
                const did = wallet.id.did();

                if (did) setUserDid(did);
            } catch (e) {
                // Keep default preview DID
            }
        };

        fetchDid();
    }, [initWallet]);
    const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(
        new Set(['achievement'])
    );

    // Auto-sync credential-level fields from achievement fields
    // This simplifies the UX by hiding the redundant CredentialInfoSection
    useEffect(() => {
        const achievement = template.credentialSubject?.achievement;
        if (!achievement) return;

        let needsUpdate = false;
        const updates: Partial<OBv3CredentialTemplate> = {};

        // Sync name: achievement.name -> credential.name
        if (achievement.name?.value && template.name?.value !== achievement.name.value) {
            updates.name = { ...achievement.name };
            needsUpdate = true;
        }

        // Sync description: achievement.description -> credential.description  
        if (achievement.description?.value && template.description?.value !== achievement.description?.value) {
            updates.description = { ...achievement.description };
            needsUpdate = true;
        }

        // Sync image: achievement.image -> credential.image
        if (achievement.image?.value && template.image?.value !== achievement.image?.value) {
            updates.image = { ...achievement.image };
            needsUpdate = true;
        }

        if (needsUpdate) {
            onChange({ ...template, ...updates });
        }
    }, [
        template.credentialSubject?.achievement?.name?.value,
        template.credentialSubject?.achievement?.description?.value,
        template.credentialSubject?.achievement?.image?.value,
    ]);
    const [showPresetSelector, setShowPresetSelector] = useState(false);

    // Toggle section expansion
    const toggleSection = useCallback((section: SectionId) => {
        setExpandedSections(prev => {
            const next = new Set(prev);

            if (next.has(section)) {
                next.delete(section);
            } else {
                next.add(section);
            }

            return next;
        });
    }, []);

    // Apply a preset template
    const applyPreset = useCallback((presetId: string) => {
        const preset = TEMPLATE_PRESETS.find(p => p.id === presetId);

        if (preset) {
            // Deep clone the template to avoid mutation
            const newTemplate = JSON.parse(JSON.stringify(preset.template)) as OBv3CredentialTemplate;

            // Apply issuer defaults if provided
            if (issuerName && !newTemplate.issuer.name.isDynamic) {
                newTemplate.issuer.name.value = issuerName;
            }

            if (issuerImage && !newTemplate.issuer.image?.isDynamic) {
                newTemplate.issuer.image = { value: issuerImage, isDynamic: false, variableName: '' };
            }

            onChange(newTemplate);
            setShowPresetSelector(false);

            // Expand relevant sections
            setExpandedSections(new Set(['credential', 'achievement', 'issuer']));
        }
    }, [onChange, issuerName, issuerImage]);

    // Validation
    const validationErrors = useMemo(() => validateTemplate(template), [template]);
    const dynamicVariables = useMemo(() => extractDynamicVariables(template), [template]);

    // Build preview credential with sample values filled in
    const previewCredential = useMemo(() => {
        const json = templateToJson(template);

        // Replace dynamic variables with sample values (same logic as test issuance)
        const replaceDynamicVariables = (obj: unknown): unknown => {
            if (typeof obj === 'string') {
                return obj.replace(/\{\{(\w+)\}\}/g, (_match, varName) => {
                    const lowerVar = varName.toLowerCase();

                    if (lowerVar.includes('date') || lowerVar.includes('time')) {
                        return new Date().toISOString();
                    }

                    const humanized = varName.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                    return `[${humanized}]`;
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

        const rendered = replaceDynamicVariables(json) as Record<string, unknown>;

        // Add preview issuer info
        return {
            ...rendered,
            issuer: userDid,
            validFrom: new Date().toISOString(),
        };
    }, [template, userDid]);

    return (
        <div className="h-full flex flex-col">
            {/* Tab Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
                <div className="flex gap-1">
                    <button
                        type="button"
                        onClick={() => setActiveTab('builder')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            activeTab === 'builder'
                                ? 'bg-cyan-100 text-cyan-700'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        Builder
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('preview')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            activeTab === 'preview'
                                ? 'bg-cyan-100 text-cyan-700'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <Eye className="w-4 h-4" />
                        Preview
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('json')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            activeTab === 'json'
                                ? 'bg-cyan-100 text-cyan-700'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <Code className="w-4 h-4" />
                        JSON
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {/* Validation status badge */}
                    {onTestIssue && (
                        <button
                            type="button"
                            onClick={runValidation}
                            disabled={validationStatus === 'validating'}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                                validationStatus === 'valid'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : validationStatus === 'invalid'
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : validationStatus === 'dirty'
                                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                    : validationStatus === 'validating'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            title={
                                validationStatus === 'valid'
                                    ? 'Credential is valid'
                                    : validationStatus === 'invalid' && analyzedError
                                    ? `${analyzedError.summary}\n\nSuggestions:\n• ${analyzedError.suggestions.join('\n• ')}`
                                    : validationStatus === 'invalid'
                                    ? `Validation failed: ${validationError}`
                                    : validationStatus === 'dirty'
                                    ? 'Changes made - validating automatically...'
                                    : validationStatus === 'validating'
                                    ? 'Validating...'
                                    : 'Click to validate credential'
                            }
                        >
                            {validationStatus === 'validating' ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : validationStatus === 'valid' ? (
                                <CheckCircle className="w-3 h-3" />
                            ) : validationStatus === 'invalid' ? (
                                <XCircle className="w-3 h-3" />
                            ) : validationStatus === 'dirty' ? (
                                <AlertTriangle className="w-3 h-3" />
                            ) : (
                                <CheckCircle className="w-3 h-3" />
                            )}
                            <span className="text-xs font-medium">
                                {validationStatus === 'validating'
                                    ? 'Validating'
                                    : validationStatus === 'valid'
                                    ? 'Valid'
                                    : validationStatus === 'invalid'
                                    ? 'Invalid'
                                    : validationStatus === 'dirty'
                                    ? 'Changed'
                                    : 'Validate'}
                            </span>
                        </button>
                    )}

                    {/* Dynamic variables badge */}
                    {dynamicVariables.length > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-violet-100 rounded-lg">
                            <Zap className="w-3 h-3 text-violet-600" />
                            <span className="text-xs font-medium text-violet-700">
                                {dynamicVariables.length} dynamic
                            </span>
                        </div>
                    )}

                    {/* Preset selector */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowPresetSelector(!showPresetSelector)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <Sparkles className="w-4 h-4" />
                            Templates
                            <ChevronDown className={`w-4 h-4 transition-transform ${showPresetSelector ? 'rotate-180' : ''}`} />
                        </button>

                        {showPresetSelector && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowPresetSelector(false)}
                                />

                                <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden">
                                    <div className="p-2 border-b border-gray-100">
                                        <p className="text-xs text-gray-500">Choose a template to start with</p>
                                    </div>

                                    <div className="max-h-80 overflow-y-auto p-2">
                                        {TEMPLATE_PRESETS.map(preset => {
                                            const IconComponent = PRESET_ICONS[preset.icon] || FileText;

                                            return (
                                                <button
                                                    key={preset.id}
                                                    type="button"
                                                    onClick={() => applyPreset(preset.id)}
                                                    className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                                >
                                                    <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <IconComponent className="w-4 h-4 text-cyan-600" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-800">
                                                            {preset.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {preset.description}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Schema Warning */}
            {template.schemaType && template.schemaType !== 'obv3' && (
                <div className="px-4 py-3 bg-violet-50 border-b border-violet-200">
                    <p className="text-sm text-violet-800">
                        <strong>Custom Credential Schema</strong>
                    </p>
                    <p className="text-xs text-violet-600 mt-1">
                        This credential uses a {template.schemaType === 'clr2' ? 'CLR 2.0' : 'custom'} schema. 
                        The Builder UI is not available for this credential type. Use the <strong>JSON</strong> tab to edit directly.
                    </p>
                </div>
            )}

            {/* Validation Errors */}
            {validationErrors.length > 0 && activeTab === 'builder' && template.schemaType === 'obv3' && (
                <div className="px-4 py-2 bg-amber-50 border-b border-amber-200">
                    <p className="text-xs text-amber-700">
                        <strong>Missing required fields:</strong> {validationErrors.join(', ')}
                    </p>
                </div>
            )}

            {/* Issuance Validation Error Panel */}
            {validationStatus === 'invalid' && analyzedError && (
                <div className="px-4 py-3 bg-red-50 border-b border-red-200">
                    <div className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-red-800">
                                {analyzedError.summary}
                            </p>

                            {/* Show changed fields as likely candidates */}
                            {changedFields.length > 0 && (
                                <div className="mt-2 p-2 bg-red-100 rounded-lg">
                                    <p className="text-xs font-medium text-red-800 mb-1">
                                        Likely culprit{changedFields.length > 1 ? 's' : ''} (changed since last valid):
                                    </p>
                                    <ul className="space-y-1">
                                        {changedFields.map((change, i) => (
                                            <li key={i} className="text-xs text-red-700 flex items-center gap-2">
                                                <span className="font-medium">{change.label}</span>
                                                <span className="text-red-500">
                                                    {change.oldValue ? `"${change.oldValue.slice(0, 20)}${change.oldValue.length > 20 ? '...' : ''}"` : '(empty)'}
                                                    {' → '}
                                                    {change.newValue ? `"${change.newValue.slice(0, 20)}${change.newValue.length > 20 ? '...' : ''}"` : '(empty)'}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {changedFields.length === 0 && (
                                <ul className="mt-1 space-y-0.5">
                                    {analyzedError.suggestions.map((suggestion, i) => (
                                        <li key={i} className="text-xs text-red-700 flex items-start gap-1">
                                            <span className="text-red-400">•</span>
                                            {suggestion}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {validationError && validationError !== analyzedError.summary && (
                                <p className="mt-2 text-xs text-red-600 font-mono bg-red-100 px-2 py-1 rounded overflow-x-auto">
                                    {validationError}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={runValidation}
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 transition-colors"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Retry
                            </button>

                            {lastValidTemplate && changedFields.length > 0 && (
                                <button
                                    type="button"
                                    onClick={revertToLastValid}
                                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                                >
                                    <Undo2 className="w-3 h-3" />
                                    Revert
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'builder' && template.schemaType !== 'obv3' && template.schemaType ? (
                    <div className="h-full flex items-center justify-center p-8">
                        <div className="text-center max-w-md">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-100 flex items-center justify-center">
                                <Code className="w-8 h-8 text-violet-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-800 mb-2">
                                JSON-Only Mode
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                This credential uses a {template.schemaType === 'clr2' ? 'CLR 2.0' : 'custom'} schema 
                                that doesn't map to the OBv3 builder fields. Switch to the JSON tab to edit this credential directly.
                            </p>
                            <button
                                type="button"
                                onClick={() => setActiveTab('json')}
                                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                            >
                                Open JSON Editor
                            </button>
                        </div>
                    </div>
                ) : activeTab === 'builder' ? (
                    <div className="h-full overflow-y-auto p-4 space-y-3">
                        {/* CredentialInfoSection hidden - fields auto-populated from Achievement */}

                        <IssuerSection
                            isExpanded={expandedSections.has('issuer')}
                            onToggle={() => toggleSection('issuer')}
                        />

                        <RecipientSection
                            template={template}
                            onChange={onChange}
                            isExpanded={expandedSections.has('recipient')}
                            onToggle={() => toggleSection('recipient')}
                            disableDynamicFields={disableDynamicFields}
                        />

                        <AchievementSection
                            template={template}
                            onChange={onChange}
                            isExpanded={expandedSections.has('achievement')}
                            onToggle={() => toggleSection('achievement')}
                            disableDynamicFields={disableDynamicFields}
                        />

                        <EvidenceSection
                            template={template}
                            onChange={onChange}
                            isExpanded={expandedSections.has('evidence')}
                            onToggle={() => toggleSection('evidence')}
                            disableDynamicFields={disableDynamicFields}
                        />

                        <DatesSection
                            template={template}
                            onChange={onChange}
                            isExpanded={expandedSections.has('dates')}
                            onToggle={() => toggleSection('dates')}
                            disableDynamicFields={disableDynamicFields}
                        />

                    </div>
                ) : activeTab === 'preview' ? (
                    <div className="h-full overflow-y-auto p-6">
                        <div className="space-y-6">
                            <p className="text-sm text-gray-600 text-center">
                                This is how your credential will appear to recipients:
                            </p>

                            {/* Credential Card Preview */}
                            <div className="flex justify-center py-4">
                                <div className="w-[180px]">
                                    <BoostEarnedCard
                                        credential={previewCredential as any}
                                        categoryType={getDefaultCategoryForCredential(previewCredential as any) || BoostCategoryOptionsEnum.achievement}
                                        boostPageViewMode={BoostPageViewMode.Card}
                                        useWrapper={false}
                                        verifierState={false}
                                        className="shadow-lg"
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                                <p className="text-xs text-cyan-800 text-center">
                                    <strong>Tip:</strong> Click the credential card above to open the full detail view,
                                    just like recipients will see it in their wallet.
                                </p>
                            </div>

                            {!template.image?.value && !template.credentialSubject.achievement?.image?.value && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-xs text-amber-800 text-center">
                                        <strong>Note:</strong> Add an image to make your credential more visually distinctive!
                                    </p>
                                </div>
                            )}

                            {dynamicVariables.length > 0 && (
                                <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg">
                                    <p className="text-xs text-violet-800 text-center">
                                        <strong>Dynamic fields:</strong> This preview shows placeholder values.
                                        The actual credential will use data from your API.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <JsonPreview
                        template={template}
                        onChange={onChange}
                        isEditable
                        onTestIssue={onTestIssue}
                        onValidate={runValidation}
                    />
                )}
            </div>
        </div>
    );
};

export default CredentialBuilder;
