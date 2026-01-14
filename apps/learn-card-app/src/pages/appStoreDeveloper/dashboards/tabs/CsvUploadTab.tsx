/**
 * CsvUploadTab - Batch CSV Upload for Credential Issuance
 * 
 * Supports two modes:
 * 1. Multi-template mode (when master templates exist):
 *    - Uses a "boost selector" column to determine which child template per row
 *    - CSV includes shared dynamic variables across all children
 * 2. Single template mode:
 *    - User selects a specific template
 *    - CSV includes that template's dynamic variables
 */

import React, { useState, useMemo, useRef } from 'react';
import Papa from 'papaparse';
import {
    Upload,
    Download,
    FileSpreadsheet,
    Check,
    AlertCircle,
    Loader2,
    Play,
    CheckCircle2,
    XCircle,
    Users,
    FileStack,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import { useWallet } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';

import type { CredentialTemplate } from '../types';
import { 
    extractVariablesByType,
    OBv3CredentialTemplate,
} from '../../partner-onboarding/components/CredentialBuilder';
import { fieldNameToVariable } from '../../partner-onboarding/types';

interface CsvUploadTabProps {
    integration: LCNIntegration;
    templates: CredentialTemplate[];
}

interface ProcessingResult {
    row: number;
    recipient: string;
    templateName?: string;
    status: 'pending' | 'success' | 'error';
    message?: string;
    credentialUri?: string;
}

type ExtendedTemplate = CredentialTemplate & {
    obv3Template?: OBv3CredentialTemplate;
};

export const CsvUploadTab: React.FC<CsvUploadTabProps> = ({
    integration,
    templates,
}) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const csvInputRef = useRef<HTMLInputElement>(null);

    // CSV state
    const [csvFileName, setCsvFileName] = useState<string | null>(null);
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
    const [recipientColumn, setRecipientColumn] = useState<string>('');

    // Multi-template mode: boost selector column
    const [boostSelectorColumn, setBoostSelectorColumn] = useState<string>('');
    const [boostMatchType, setBoostMatchType] = useState<'id' | 'name'>('name');

    // Single template mode: selected template
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

    // Processing state
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingResults, setProcessingResults] = useState<ProcessingResult[]>([]);
    const [showResults, setShowResults] = useState(false);

    // Get master templates (have child templates)
    const masterTemplates = useMemo(() => {
        return (templates as ExtendedTemplate[]).filter(t => t.isMasterTemplate && t.childTemplates?.length);
    }, [templates]);

    // Determine if we're in multi-template mode
    const isMultiTemplateMode = masterTemplates.length > 0;

    // All child templates from master templates
    const allChildTemplates = useMemo(() => {
        const children: ExtendedTemplate[] = [];
        for (const master of masterTemplates) {
            if (master.childTemplates?.length) {
                children.push(...(master.childTemplates as ExtendedTemplate[]));
            }
        }
        return children;
    }, [masterTemplates]);

    // Collect all child template IDs
    const childTemplateIds = useMemo(() => {
        const ids = new Set<string>();
        for (const child of allChildTemplates) {
            ids.add(child.id);
        }
        return ids;
    }, [allChildTemplates]);

    // Compute issuable templates for single-template mode (exclude master templates)
    const issuableTemplates = useMemo(() => {
        const result: ExtendedTemplate[] = [];

        for (const template of templates as ExtendedTemplate[]) {
            if (template.isMasterTemplate) {
                if (template.childTemplates?.length) {
                    result.push(...(template.childTemplates as ExtendedTemplate[]));
                }
            } else if (!childTemplateIds.has(template.id)) {
                result.push(template);
            }
        }

        return result;
    }, [templates, childTemplateIds]);

    // Selected template (single-template mode only)
    const selectedTemplate = useMemo(() => {
        if (isMultiTemplateMode) return null;
        return issuableTemplates.find(t => t.id === selectedTemplateId || t.boostUri === selectedTemplateId);
    }, [issuableTemplates, selectedTemplateId, isMultiTemplateMode]);

    // Get shared dynamic variables across all child templates (multi-template mode)
    const sharedVariables = useMemo(() => {
        if (!isMultiTemplateMode || allChildTemplates.length === 0) return [];

        const allVarSets: Set<string>[] = [];

        for (const child of allChildTemplates) {
            if (child.obv3Template) {
                try {
                    const { dynamic } = extractVariablesByType(child.obv3Template as OBv3CredentialTemplate);
                    allVarSets.push(new Set(dynamic));
                } catch (e) {
                    console.warn('Failed to extract child template variables:', e);
                }
            }
        }

        if (allVarSets.length === 0) return [];

        // Intersection of all variable sets
        return [...allVarSets[0]].filter(v => allVarSets.every(set => set.has(v)));
    }, [isMultiTemplateMode, allChildTemplates]);

    // Get template variables (depends on mode)
    const templateVariables = useMemo(() => {
        if (isMultiTemplateMode) {
            return sharedVariables;
        }

        if (!selectedTemplate?.obv3Template) {
            return selectedTemplate?.fields?.map(f => f.variableName || fieldNameToVariable(f.name || '')) || [];
        }

        try {
            const { dynamic } = extractVariablesByType(selectedTemplate.obv3Template as OBv3CredentialTemplate);
            return dynamic;
        } catch (e) {
            console.warn('Failed to extract dynamic variables:', e);
            return [];
        }
    }, [isMultiTemplateMode, sharedVariables, selectedTemplate]);

    // Handle CSV file upload with intelligent column detection
    const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setCsvFileName(file.name);
        setProcessingResults([]);
        setShowResults(false);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
                const headers = result.meta.fields || [];
                const rows = result.data as Record<string, string>[];

                const cleanHeaders = headers.filter(h => h.trim() !== '');
                setCsvHeaders(cleanHeaders);
                setCsvRows(rows.filter(row => Object.values(row).some(v => v?.trim())));

                // Auto-detect recipient column by matching common patterns
                const recipientPatterns = ['recipient', 'email', 'phone', 'to', 'profileid', 'did'];
                const recipientGuess = cleanHeaders.find(h => {
                    const normalized = h.toLowerCase().replace(/[^a-z]/g, '');
                    return recipientPatterns.some(p => normalized.includes(p));
                });
                if (recipientGuess) {
                    setRecipientColumn(recipientGuess);
                }

                // Auto-detect course ID column for multi-template mode
                if (isMultiTemplateMode) {
                    const coursePatterns = ['courseid', 'course', 'template', 'boostid', 'credentialtype'];
                    const courseGuess = cleanHeaders.find(h => {
                        const normalized = h.toLowerCase().replace(/[^a-z]/g, '');
                        return coursePatterns.some(p => normalized.includes(p));
                    });
                    if (courseGuess) {
                        setBoostSelectorColumn(courseGuess);
                    }
                }
            },
        });
    };

    // Download CSV template with example rows for each template
    const handleDownloadTemplate = () => {
        // Build headers starting with recipient
        const headers: string[] = ['Recipient (email/phone/profileId)'];
        const rows: string[][] = [];

        if (isMultiTemplateMode) {
            // Multi-template mode: add boost selector column + shared variables
            headers.push('Course ID'); // Boost selector column
            const formattedVars = sharedVariables.map(v => 
                v.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
            );
            headers.push(...formattedVars);
            
            // Add example rows for each child template
            for (const child of allChildTemplates) {
                const row: string[] = [
                    'example@email.com', // Placeholder recipient
                    child.name, // Course ID - use template name for matching
                ];
                // Add placeholder values for each dynamic variable
                for (const field of formattedVars) {
                    row.push(`[${field}]`);
                }
                rows.push(row);
            }
        } else if (selectedTemplate) {
            // Single template mode: add that template's variables
            const formattedVars = templateVariables.map(v => 
                v.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
            );
            headers.push(...formattedVars);
            
            // Add one example row
            const row: string[] = ['example@email.com'];
            for (const field of formattedVars) {
                row.push(`[${field}]`);
            }
            rows.push(row);
        } else {
            presentToast('Please select a template first', { hasDismissButton: true });
            return;
        }

        // Build CSV content with headers and example rows
        const csvLines = [headers.join(',')];
        for (const row of rows) {
            // Escape values that contain commas
            csvLines.push(row.map(v => v.includes(',') ? `"${v}"` : v).join(','));
        }
        const csvContent = csvLines.join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const filename = isMultiTemplateMode 
            ? 'batch-issuance-template.csv'
            : `${selectedTemplate!.name.toLowerCase().replace(/\s+/g, '-')}-batch-template.csv`;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        presentToast('CSV template downloaded!', { hasDismissButton: true });
    };

    // Clear uploaded CSV
    const handleClearCsv = () => {
        setCsvFileName(null);
        setCsvHeaders([]);
        setCsvRows([]);
        setRecipientColumn('');
        setProcessingResults([]);
        setShowResults(false);
        if (csvInputRef.current) csvInputRef.current.value = '';
    };

    // Find template by boost selector value (multi-template mode)
    const findTemplateBySelector = (selectorValue: string): ExtendedTemplate | null => {
        if (!selectorValue) return null;
        
        const normalizedValue = selectorValue.toLowerCase().trim();
        
        for (const child of allChildTemplates) {
            if (boostMatchType === 'id') {
                // Exact match on ID or boostUri
                if (child.id === selectorValue || child.boostUri === selectorValue) {
                    return child;
                }
            } else {
                // Name-based matching (contains)
                const childName = child.name.toLowerCase();
                if (childName.includes(normalizedValue) || normalizedValue.includes(childName)) {
                    return child;
                }
            }
        }
        
        return null;
    };

    // Process CSV rows
    const handleProcessCsv = async () => {
        // Validation based on mode
        if (isMultiTemplateMode) {
            if (!boostSelectorColumn || !recipientColumn || csvRows.length === 0) {
                presentToast('Please select recipient and course ID columns', { hasDismissButton: true });
                return;
            }
        } else {
            if (!selectedTemplate?.boostUri || !recipientColumn || csvRows.length === 0) {
                presentToast('Please select a template, recipient column, and upload a CSV', { hasDismissButton: true });
                return;
            }
        }

        setIsProcessing(true);
        setShowResults(true);

        // Initialize results
        const initialResults: ProcessingResult[] = csvRows.map((row, idx) => ({
            row: idx + 1,
            recipient: row[recipientColumn] || '',
            templateName: isMultiTemplateMode ? row[boostSelectorColumn] : selectedTemplate?.name,
            status: 'pending',
        }));
        setProcessingResults(initialResults);

        try {
            const wallet = await initWallet();

            // Process each row
            for (let i = 0; i < csvRows.length; i++) {
                const row = csvRows[i];
                const recipient = row[recipientColumn]?.trim();

                if (!recipient) {
                    setProcessingResults(prev => prev.map((r, idx) => 
                        idx === i ? { ...r, status: 'error', message: 'Missing recipient' } : r
                    ));
                    continue;
                }

                // Determine which template to use
                let templateToUse: ExtendedTemplate | null = null;
                let varsToUse: string[] = templateVariables;

                if (isMultiTemplateMode) {
                    const selectorValue = row[boostSelectorColumn]?.trim();
                    templateToUse = findTemplateBySelector(selectorValue);
                    
                    if (!templateToUse) {
                        setProcessingResults(prev => prev.map((r, idx) => 
                            idx === i ? { ...r, status: 'error', message: `No template found for "${selectorValue}"` } : r
                        ));
                        continue;
                    }

                    // Get variables for this specific template
                    if (templateToUse.obv3Template) {
                        try {
                            const { dynamic } = extractVariablesByType(templateToUse.obv3Template as OBv3CredentialTemplate);
                            varsToUse = dynamic;
                        } catch (e) {
                            // Use shared variables as fallback
                        }
                    }
                } else {
                    templateToUse = selectedTemplate ?? null;
                }

                if (!templateToUse?.boostUri) {
                    setProcessingResults(prev => prev.map((r, idx) => 
                        idx === i ? { ...r, status: 'error', message: 'No template available' } : r
                    ));
                    continue;
                }

                // Build templateData from CSV columns mapped to template variables
                const templateData: Record<string, string> = {};
                for (const varName of varsToUse) {
                    // Try to find matching column (case-insensitive, handle underscores/spaces)
                    const normalizedVar = varName.toLowerCase().replace(/_/g, ' ');
                    const matchingHeader = csvHeaders.find(h => {
                        const normalizedHeader = h.toLowerCase().replace(/_/g, ' ');
                        return normalizedHeader === normalizedVar || 
                               normalizedHeader.includes(normalizedVar) ||
                               normalizedVar.includes(normalizedHeader);
                    });

                    if (matchingHeader && row[matchingHeader]) {
                        templateData[varName] = row[matchingHeader];
                    }
                }

                try {
                    const result = await wallet.invoke.send({
                        type: 'boost',
                        recipient,
                        integrationId: integration.id,
                        templateUri: templateToUse.boostUri,
                        templateData,
                    });

                    setProcessingResults(prev => prev.map((r, idx) => 
                        idx === i ? { 
                            ...r, 
                            status: 'success', 
                            message: `Sent: ${templateToUse!.name}`,
                            credentialUri: result?.credentialUri,
                        } : r
                    ));
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : 'Send failed';
                    setProcessingResults(prev => prev.map((r, idx) => 
                        idx === i ? { ...r, status: 'error', message: errorMessage } : r
                    ));
                }

                // Small delay between requests to avoid rate limiting
                if (i < csvRows.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }

            presentToast(`Processed ${csvRows.length} rows`, { 
                type: ToastTypeEnum.Success,
                hasDismissButton: true 
            });
        } catch (err) {
            console.error('CSV processing error:', err);
            presentToast('Failed to process CSV', { type: ToastTypeEnum.Error, hasDismissButton: true });
        } finally {
            setIsProcessing(false);
        }
    };

    // Stats from results
    const resultStats = useMemo(() => {
        const success = processingResults.filter(r => r.status === 'success').length;
        const error = processingResults.filter(r => r.status === 'error').length;
        const pending = processingResults.filter(r => r.status === 'pending').length;
        return { success, error, pending, total: processingResults.length };
    }, [processingResults]);

    // Validation based on mode
    const canProcess = isMultiTemplateMode
        ? (boostSelectorColumn && recipientColumn && csvRows.length > 0 && !isProcessing)
        : (selectedTemplate?.boostUri && recipientColumn && csvRows.length > 0 && !isProcessing);

    if (issuableTemplates.length === 0) {
        return (
            <div className="text-center py-12">
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-medium">No templates available</p>
                <p className="text-sm text-gray-400 mt-1">Create and save templates first to use CSV batch upload</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <FileSpreadsheet className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />

                <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Batch Credential Issuance</p>
                    <p>
                        Upload a CSV spreadsheet to issue credentials in bulk. Each row represents one credential to send.
                        The CSV must include a recipient column (email, phone, profile ID, or DID).
                    </p>
                </div>
            </div>

            {/* Step 1: Mode-specific setup */}
            {isMultiTemplateMode ? (
                // Multi-template mode: show info about course boost selection
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                            <FileStack className="w-4 h-4 text-violet-700" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800">Multi-Course Batch Mode</h3>
                            <p className="text-sm text-gray-500">
                                You have {allChildTemplates.length} course templates. 
                                Your CSV can include rows for different courses.
                            </p>
                        </div>
                    </div>

                    <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg">
                        <p className="text-xs font-medium text-violet-800 mb-2">Required CSV columns:</p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                                recipient *
                            </span>
                            <span className="px-2 py-1 bg-violet-200 text-violet-800 rounded text-xs font-medium">
                                course id *
                            </span>
                            {sharedVariables.map(v => (
                                <span key={v} className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs">
                                    {v.replace(/_/g, ' ')}
                                </span>
                            ))}
                        </div>
                        <p className="text-xs text-violet-600 mt-2">
                            The "course id" column identifies which template to use per row (matches by name).
                        </p>
                    </div>
                </div>
            ) : (
                // Single template mode: template selector
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                            <span className="text-cyan-700 font-bold text-sm">1</span>
                        </div>
                        <h3 className="font-semibold text-gray-800">Select Template</h3>
                    </div>

                    <select
                        value={selectedTemplateId}
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                        <option value="">Choose a credential template...</option>
                        {issuableTemplates.map(template => (
                            <option key={template.id} value={template.boostUri || template.id}>
                                {template.name}
                            </option>
                        ))}
                    </select>

                    {selectedTemplate && templateVariables.length > 0 && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs font-medium text-gray-600 mb-2">Required columns for this template:</p>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                                    recipient *
                                </span>
                                {templateVariables.map(v => (
                                    <span key={v} className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs">
                                        {v}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Download Template / Upload CSV */}
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                        <span className="text-cyan-700 font-bold text-sm">2</span>
                    </div>
                    <h3 className="font-semibold text-gray-800">Upload CSV</h3>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleDownloadTemplate}
                        disabled={!isMultiTemplateMode && !selectedTemplate}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Download Template
                    </button>

                    <input
                        ref={csvInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleCsvUpload}
                        className="hidden"
                    />

                    <button
                        onClick={() => csvInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <Upload className="w-4 h-4" />
                        Upload CSV
                    </button>
                </div>

                {csvFileName && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <Check className="w-5 h-5 text-emerald-600" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-emerald-800">{csvFileName}</p>
                                <p className="text-xs text-emerald-600">
                                    {csvRows.length} rows, {csvHeaders.length} columns
                                    {(recipientColumn || boostSelectorColumn) && ' • Auto-detected columns'}
                                </p>
                            </div>
                            <button
                                onClick={handleClearCsv}
                                className="text-xs text-gray-500 hover:text-gray-700"
                            >
                                Clear
                            </button>
                        </div>

                        {/* Recipient Column Selector */}
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-emerald-600" />
                                    <label className="text-sm font-medium text-emerald-800">
                                        Recipient Column <span className="text-red-500">*</span>
                                    </label>
                                </div>
                                {recipientColumn && (
                                    <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                                        ✓ Auto-detected
                                    </span>
                                )}
                            </div>

                            <select
                                value={recipientColumn}
                                onChange={(e) => setRecipientColumn(e.target.value)}
                                className="w-full px-3 py-2 border border-emerald-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                <option value="">Select recipient column...</option>
                                {csvHeaders.map(header => (
                                    <option key={header} value={header}>{header}</option>
                                ))}
                            </select>

                            {recipientColumn && (
                                <p className="text-xs text-emerald-700">
                                    Will send credentials to values in the "{recipientColumn}" column
                                </p>
                            )}
                        </div>

                        {/* Course ID Column Selector (multi-template mode only) */}
                        {isMultiTemplateMode && (
                            <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileStack className="w-4 h-4 text-violet-600" />
                                        <label className="text-sm font-medium text-violet-800">
                                            Course ID Column <span className="text-red-500">*</span>
                                        </label>
                                    </div>
                                    {boostSelectorColumn && (
                                        <span className="text-xs text-violet-600 bg-violet-100 px-2 py-0.5 rounded">
                                            ✓ Auto-detected
                                        </span>
                                    )}
                                </div>

                                <select
                                    value={boostSelectorColumn}
                                    onChange={(e) => setBoostSelectorColumn(e.target.value)}
                                    className="w-full px-3 py-2 border border-violet-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                >
                                    <option value="">Select course ID column...</option>
                                    {csvHeaders.map(header => (
                                        <option key={header} value={header}>{header}</option>
                                    ))}
                                </select>

                                {boostSelectorColumn && (
                                    <p className="text-xs text-violet-700">
                                        Will match "{boostSelectorColumn}" values to course template names
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Preview */}
                        {csvRows.length > 0 && (
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                                    <p className="text-xs font-medium text-gray-600">Preview (first 5 rows)</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-xs">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                {csvHeaders.slice(0, 6).map(header => (
                                                    <th key={header} className={`px-3 py-2 text-left font-medium border-b ${
                                                        header === recipientColumn ? 'text-emerald-700 bg-emerald-50' : 'text-gray-600'
                                                    }`}>
                                                        {header}
                                                        {header === recipientColumn && ' ✓'}
                                                    </th>
                                                ))}
                                                {csvHeaders.length > 6 && (
                                                    <th className="px-3 py-2 text-left font-medium text-gray-400 border-b">
                                                        +{csvHeaders.length - 6} more
                                                    </th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {csvRows.slice(0, 5).map((row, idx) => (
                                                <tr key={idx} className="border-b border-gray-100 last:border-0">
                                                    {csvHeaders.slice(0, 6).map(header => (
                                                        <td key={header} className={`px-3 py-2 truncate max-w-32 ${
                                                            header === recipientColumn ? 'text-emerald-700 bg-emerald-50/50' : 'text-gray-700'
                                                        }`}>
                                                            {row[header] || '-'}
                                                        </td>
                                                    ))}
                                                    {csvHeaders.length > 6 && (
                                                        <td className="px-3 py-2 text-gray-400">...</td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Step 3: Process */}
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                        <span className="text-cyan-700 font-bold text-sm">3</span>
                    </div>
                    <h3 className="font-semibold text-gray-800">Process & Send</h3>
                </div>

                <button
                    onClick={handleProcessCsv}
                    disabled={!canProcess}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing {resultStats.success + resultStats.error} / {resultStats.total}...
                        </>
                    ) : (
                        <>
                            <Play className="w-5 h-5" />
                            Send {csvRows.length} Credentials
                        </>
                    )}
                </button>

                {!canProcess && csvRows.length > 0 && !recipientColumn && (
                    <p className="text-xs text-amber-600 text-center">
                        Please select the recipient column to continue
                    </p>
                )}
            </div>

            {/* Results */}
            {showResults && processingResults.length > 0 && (
                <div className="space-y-3">
                    <button
                        onClick={() => setShowResults(!showResults)}
                        className="flex items-center gap-2 text-sm font-medium text-gray-700"
                    >
                        {showResults ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        Results
                        <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                            {resultStats.success} success
                        </span>
                        {resultStats.error > 0 && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                                {resultStats.error} failed
                            </span>
                        )}
                        {resultStats.pending > 0 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                {resultStats.pending} pending
                            </span>
                        )}
                    </button>

                    {showResults && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-medium text-gray-600 w-16">Row</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-600">Recipient</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-600 w-24">Status</th>
                                        <th className="px-3 py-2 text-left font-medium text-gray-600">Message</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processingResults.map((result) => (
                                        <tr key={result.row} className="border-t border-gray-100">
                                            <td className="px-3 py-2 text-gray-600">{result.row}</td>
                                            <td className="px-3 py-2 text-gray-800 truncate max-w-48">{result.recipient}</td>
                                            <td className="px-3 py-2">
                                                {result.status === 'pending' && (
                                                    <span className="flex items-center gap-1 text-gray-500">
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                        Pending
                                                    </span>
                                                )}
                                                {result.status === 'success' && (
                                                    <span className="flex items-center gap-1 text-emerald-600">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Success
                                                    </span>
                                                )}
                                                {result.status === 'error' && (
                                                    <span className="flex items-center gap-1 text-red-600">
                                                        <XCircle className="w-3 h-3" />
                                                        Failed
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-gray-600 text-xs truncate max-w-48">
                                                {result.message || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
