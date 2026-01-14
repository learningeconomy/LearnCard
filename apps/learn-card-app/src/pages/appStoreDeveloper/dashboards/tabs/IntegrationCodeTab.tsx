/**
 * IntegrationCodeTab - Boost URI Reference + API Code Generator
 * 
 * Provides developers with:
 * - Copy-pastable boost URIs for all templates
 * - Export all URIs as a config file
 * - Interactive API code generator with template data inputs
 * - CSV template download
 * 
 * Mirrors functionality from DataMappingStep for dashboard use.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
    Copy,
    Check,
    Code,
    Download,
    FileStack,
    Award,
    Zap,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    Layers,
    Building2,
    Webhook,
    BellOff,
    FileSpreadsheet,
} from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import { Clipboard } from '@capacitor/clipboard';
import { useToast } from 'learn-card-base/hooks/useToast';

import type { CredentialTemplate } from '../types';
import { CodeOutputPanel } from '../../guides/shared/CodeOutputPanel';
import { 
    extractDynamicVariables,
    extractVariablesByType,
    OBv3CredentialTemplate,
} from '../../partner-onboarding/components/CredentialBuilder';
import { fieldNameToVariable } from '../../partner-onboarding/types';

interface IntegrationCodeTabProps {
    integration: LCNIntegration;
    templates: CredentialTemplate[];
}

type ExtendedTemplate = CredentialTemplate & {
    obv3Template?: OBv3CredentialTemplate;
    isMasterTemplate?: boolean;
    parentTemplateId?: string;
    childTemplates?: ExtendedTemplate[];
};

export const IntegrationCodeTab: React.FC<IntegrationCodeTabProps> = ({
    integration,
    templates,
}) => {
    const { presentToast } = useToast();

    const [viewMode, setViewMode] = useState<'reference' | 'example'>('reference');
    const [copiedUri, setCopiedUri] = useState<string | null>(null);
    const [copiedConfig, setCopiedConfig] = useState(false);
    const [apiCopied, setApiCopied] = useState(false);

    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [apiTemplateData, setApiTemplateData] = useState<Record<string, string>>({});
    const [apiRecipientEmail, setApiRecipientEmail] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [advancedOptions, setAdvancedOptions] = useState({
        issuerName: '',
        issuerLogoUrl: '',
        recipientName: '',
        webhookUrl: '',
        suppressDelivery: false,
    });

    // Compute issuable templates (exclude master templates, include their children flattened)
    // Get master templates for display
    const masterTemplates = useMemo(() => {
        return (templates as ExtendedTemplate[]).filter(t => t.isMasterTemplate && t.childTemplates?.length);
    }, [templates]);

    // Collect all child template IDs for filtering (computed before issuableTemplates)
    const childTemplateIds = useMemo(() => {
        const ids = new Set<string>();
        for (const master of masterTemplates) {
            master.childTemplates?.forEach(child => ids.add(child.id));
        }
        return ids;
    }, [masterTemplates]);

    // Compute issuable templates (exclude master templates, include their children flattened)
    // Also exclude standalone templates that are already children of a master
    const issuableTemplates = useMemo(() => {
        const result: ExtendedTemplate[] = [];

        for (const template of templates as ExtendedTemplate[]) {
            if (template.isMasterTemplate) {
                if (template.childTemplates?.length) {
                    result.push(...template.childTemplates);
                }
            } else if (!childTemplateIds.has(template.id)) {
                // Only include if not already a child of a master
                result.push(template);
            }
        }

        return result;
    }, [templates, childTemplateIds]);

    // Selected template for code generation
    const selectedTemplate = useMemo(() => {
        if (selectedTemplateId) {
            return issuableTemplates.find(t => t.id === selectedTemplateId);
        }
        return issuableTemplates[0];
    }, [issuableTemplates, selectedTemplateId]);

    // Get parent master template if selected is a child
    const selectedTemplateMaster = useMemo(() => {
        if (!selectedTemplate?.parentTemplateId) return null;
        return (templates as ExtendedTemplate[]).find(t => t.id === selectedTemplate.parentTemplateId);
    }, [selectedTemplate, templates]);

    // Get dynamic variables for selected template
    const templateVariables = useMemo(() => {
        if (!selectedTemplate) return [];

        if (selectedTemplate.obv3Template) {
            try {
                return extractDynamicVariables(selectedTemplate.obv3Template as OBv3CredentialTemplate);
            } catch (e) {
                console.warn('Failed to extract OBv3 dynamic variables:', e);
            }
        }

        return selectedTemplate.fields?.map(f => f.variableName || fieldNameToVariable(f.name || f.label || f.key || '')).filter((v): v is string => Boolean(v)) || [];
    }, [selectedTemplate]);

    // Generate smart default value based on variable name
    const getSmartDefault = (varName: string): string => {
        const lower = varName.toLowerCase();

        // VC v2 date fields
        if (lower === 'validfrom' || lower === 'valid_from') {
            return new Date().toISOString();
        }

        if (lower === 'validuntil' || lower === 'valid_until') {
            const future = new Date();
            future.setFullYear(future.getFullYear() + 2);
            return future.toISOString();
        }

        if (lower.includes('date') || lower.includes('issued') || lower.includes('completed')) {
            return new Date().toISOString();
        }

        if (lower.includes('expir')) {
            const future = new Date();
            future.setFullYear(future.getFullYear() + 2);
            return future.toISOString();
        }

        if (lower.includes('score') || lower.includes('grade')) return '95';
        if (lower.includes('credits') || lower.includes('hours')) return '3';
        if (lower.includes('email')) return 'student@example.com';

        if (lower.includes('name') && lower.includes('course')) {
            return 'Introduction to Web Development';
        }

        if (lower.includes('name') && (lower.includes('student') || lower.includes('recipient') || lower.includes('learner'))) {
            return 'Jane Smith';
        }

        if (lower.includes('name')) return 'Example Name';
        if (lower.includes('description')) return 'Successfully completed all course requirements';

        if (lower.includes('url') || lower.includes('image') || lower.includes('logo')) {
            return 'https://example.com/image.png';
        }

        if (lower.includes('instructor') || lower.includes('teacher')) return 'Dr. John Smith';

        const readable = varName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        return `Example ${readable}`;
    };

    // Initialize template data when template changes
    React.useEffect(() => {
        if (templateVariables.length > 0) {
            const newData: Record<string, string> = {};

            templateVariables.forEach(varName => {
                newData[varName] = apiTemplateData[varName] || getSmartDefault(varName);
            });

            setApiTemplateData(newData);
        }
    }, [templateVariables]);

    // Set initial selected template
    React.useEffect(() => {
        if (!selectedTemplateId && issuableTemplates.length > 0) {
            setSelectedTemplateId(issuableTemplates[0].id);
        }
    }, [issuableTemplates, selectedTemplateId]);

    const handleCopyUri = async (uri: string) => {
        await Clipboard.write({ string: uri });
        setCopiedUri(uri);
        setTimeout(() => setCopiedUri(null), 2000);
        presentToast('Copied!', { hasDismissButton: true });
    };

    // Generate boost config for export
    const generateBoostConfig = useCallback(() => {
        const config: Record<string, { uri: string; name: string; variables: string[]; systemVariables: string[] }> = {};

        const toKey = (name: string) => name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '');

        issuableTemplates.forEach(template => {
            if (template.boostUri) {
                const key = toKey(template.name);
                let dynamicVars: string[] = [];
                let systemVars: string[] = [];

                if (template.obv3Template) {
                    try {
                        const extracted = extractVariablesByType(template.obv3Template as OBv3CredentialTemplate);
                        dynamicVars = extracted.dynamic;
                        systemVars = extracted.system;
                    } catch (e) {
                        // fallback to fields
                    }
                }

                if (dynamicVars.length === 0 && systemVars.length === 0 && template.fields?.length) {
                    dynamicVars = template.fields.map(f => f.variableName || fieldNameToVariable(f.name || f.label || f.key || '')).filter((v): v is string => Boolean(v));
                }

                config[key] = {
                    uri: template.boostUri,
                    name: template.name,
                    variables: dynamicVars,
                    systemVariables: systemVars,
                };
            }
        });

        return config;
    }, [issuableTemplates]);

    const handleCopyAllConfig = async () => {
        const config = generateBoostConfig();
        const integrationId = integration.id;
        const configCode = `// Boost Templates Configuration
// Generated from LearnCard Partner Dashboard
// Integration ID: ${integrationId || 'YOUR_INTEGRATION_ID'}

const BOOST_TEMPLATES = ${JSON.stringify(config, null, 2)};

// Your integration ID for tracking
const INTEGRATION_ID = '${integrationId || 'YOUR_INTEGRATION_ID'}';

// Usage example:
// import { initLearnCard } from '@learncard/init';
//
// const learnCard = await initLearnCard({
//     apiToken: process.env.LEARNCARD_API_TOKEN,
//     network: true
// });
//
// const template = BOOST_TEMPLATES['course_key'];
// 
// // Build templateData from the template's variables (user-provided values)
// const templateData = {};
// for (const varName of template.variables) {
//     templateData[varName] = yourData[varName]; // Map from your data source
// }
// // Note: template.systemVariables are auto-injected (issue_date, issuer_did, etc.)
// 
// const result = await learnCard.invoke.send({
//     type: 'boost',
//     recipient: 'recipient-profile-id', // profile ID, DID, email, or phone
//     integrationId: INTEGRATION_ID, // Track activity for this integration
//     templateUri: template.uri,
//     templateData,
// });
//
// console.log('Credential URI:', result.credentialUri);
// console.log('Activity ID:', result.activityId);

export default BOOST_TEMPLATES;
export { INTEGRATION_ID };`;

        await Clipboard.write({ string: configCode });
        setCopiedConfig(true);
        setTimeout(() => setCopiedConfig(false), 2000);
        presentToast('Config copied!', { hasDismissButton: true });
    };

    // Generate templateData code
    const generateTemplateDataCode = (indent: string = '        ') => {
        if (templateVariables.length === 0) return '';

        const lines = templateVariables.map(varName => {
            const value = apiTemplateData[varName] || getSmartDefault(varName);
            const escapedValue = value.replace(/'/g, "\\'");
            return `${indent}${varName}: '${escapedValue}',`;
        });

        return lines.join('\n');
    };

    // Generate API code snippet
    const generateApiCodeSnippet = () => {
        const boostUri = selectedTemplate?.boostUri || 'urn:lc:boost:your_template_id';
        const apiKey = integration.publishableKey || 'YOUR_API_KEY';

        const templateDataCode = generateTemplateDataCode();

        let optionsCode = '';
        const optionsParts: string[] = [];

        if (advancedOptions.webhookUrl) {
            optionsParts.push(`        webhookUrl: '${advancedOptions.webhookUrl}',`);
        }

        if (advancedOptions.suppressDelivery) {
            optionsParts.push(`        suppressDelivery: true,`);
        }

        if (advancedOptions.issuerName || advancedOptions.issuerLogoUrl || advancedOptions.recipientName) {
            const brandingParts: string[] = [];
            if (advancedOptions.issuerName) brandingParts.push(`            issuerName: '${advancedOptions.issuerName}',`);
            if (advancedOptions.issuerLogoUrl) brandingParts.push(`            issuerLogoUrl: '${advancedOptions.issuerLogoUrl}',`);
            if (advancedOptions.recipientName) brandingParts.push(`            recipientName: '${advancedOptions.recipientName}',`);

            optionsParts.push(`        branding: {
${brandingParts.join('\n')}
        },`);
        }

        if (optionsParts.length > 0) {
            optionsCode = `
    options: {
${optionsParts.join('\n')}
    },`;
        }

        const recipientExample = apiRecipientEmail.trim() || 'recipient-profile-id';

        return `// Installation: npm install @learncard/init

import { initLearnCard } from '@learncard/init';

// Initialize with your API Token (get from "API Tokens" tab)
const learnCard = await initLearnCard({
    network: {
        apiToken: process.env.LEARNCARD_API_TOKEN, // Your API Token
    },
});

// Send credential using unified send() API
// Recipient type is auto-detected: profile ID, DID, email, or phone
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: '${recipientExample}', // profile ID, DID, email, or phone
    integrationId: '${integration.id}', // Track activity for this integration
    templateUri: '${boostUri}',
    templateData: {
${templateDataCode}
    },${optionsCode}
});

console.log('Credential URI:', result.credentialUri);
console.log('Boost URI:', result.uri);
console.log('Activity ID:', result.activityId); // Use to track lifecycle

// For email/phone recipients:
// result.inbox?.issuanceId - tracking ID
// result.inbox?.status - 'PENDING', 'ISSUED', or 'CLAIMED'
// result.inbox?.claimUrl - present if suppressDelivery=true`;
    };

    // Generate cURL code snippet
    const generateCurlCodeSnippet = () => {
        const boostUri = selectedTemplate?.boostUri || 'urn:lc:boost:your_template_id';
        // API Token should come from API Tokens tab
        const apiKey = 'YOUR_API_TOKEN'; // Get from API Tokens tab
        const recipientExample = apiRecipientEmail.trim() || 'recipient@example.com';

        // Build templateData object
        const templateData: Record<string, string> = {};
        templateVariables.forEach(varName => {
            templateData[varName] = apiTemplateData[varName] || getSmartDefault(varName);
        });

        // Build options object
        const options: Record<string, unknown> = {};

        if (advancedOptions.webhookUrl) {
            options.webhookUrl = advancedOptions.webhookUrl;
        }

        if (advancedOptions.suppressDelivery) {
            options.suppressDelivery = true;
        }

        if (advancedOptions.issuerName || advancedOptions.issuerLogoUrl || advancedOptions.recipientName) {
            options.branding = {};
            if (advancedOptions.issuerName) (options.branding as Record<string, string>).issuerName = advancedOptions.issuerName;
            if (advancedOptions.issuerLogoUrl) (options.branding as Record<string, string>).issuerLogoUrl = advancedOptions.issuerLogoUrl;
            if (advancedOptions.recipientName) (options.branding as Record<string, string>).recipientName = advancedOptions.recipientName;
        }

        // Build the full payload
        const payload: Record<string, unknown> = {
            type: 'boost',
            recipient: recipientExample,
            integrationId: integration.id, // Track activity for this integration
            templateUri: boostUri,
            templateData,
        };

        if (Object.keys(options).length > 0) {
            payload.options = options;
        }

        const payloadJson = JSON.stringify(payload, null, 2)
            .split('\n')
            .map((line, i) => i === 0 ? line : '  ' + line)
            .join('\n');

        return `# Send credential via LearnCard Network API
# API Documentation: https://docs.learncard.com/api
#
# Get your API Token from the "API Tokens" tab in your dashboard.
# Create a token with "Full Access" or "Credentials Only" scope.

curl -X POST "https://network.learncard.com/api/send" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '${payloadJson}'

# Response includes:
# - credentialUri: The URI of the issued credential
# - uri: The boost URI
# - inbox.issuanceId: Tracking ID for email/phone recipients
# - inbox.status: 'PENDING', 'ISSUED', or 'CLAIMED'
# - inbox.claimUrl: Present if suppressDelivery=true`;
    };

    const handleCopyApiCode = async () => {
        const code = generateApiCodeSnippet();
        await Clipboard.write({ string: code });
        setApiCopied(true);
        setTimeout(() => setApiCopied(false), 2000);
        presentToast('Code copied!', { hasDismissButton: true });
    };

    // Download CSV template for selected template
    const handleDownloadCsvTemplate = () => {
        if (!selectedTemplate) return;

        let headers: string[] = [];

        if (selectedTemplate.obv3Template) {
            try {
                const dynamicVars = extractDynamicVariables(selectedTemplate.obv3Template as OBv3CredentialTemplate);
                headers = dynamicVars.map(v => v.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()));
            } catch (e) {
                console.warn('Failed to extract OBv3 dynamic variables for CSV:', e);
            }
        }

        if (headers.length === 0) {
            headers = selectedTemplate.fields?.map(f => f.name || f.label || f.key || '').filter(Boolean) as string[] || [];
        }

        const csvContent = headers.join(',') + '\n' + headers.map(() => '').join(',');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedTemplate.name.toLowerCase().replace(/\s+/g, '-')}-template.csv`;
        a.click();
        URL.revokeObjectURL(url);

        presentToast('CSV template downloaded!', { hasDismissButton: true });
    };

    const hasAdvancedOptions = advancedOptions.issuerName || advancedOptions.issuerLogoUrl || 
        advancedOptions.recipientName || advancedOptions.webhookUrl || advancedOptions.suppressDelivery;

    const savedTemplateCount = issuableTemplates.filter(t => t.boostUri).length;

    if (issuableTemplates.length === 0) {
        return (
            <div className="text-center py-12">
                <FileStack className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-medium">No templates yet</p>
                <p className="text-sm text-gray-400 mt-1">Create templates first to get integration code</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Integration Code</h2>
                <p className="text-sm text-gray-500">Copy boost URIs and generate integration code</p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                    onClick={() => setViewMode('reference')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        viewMode === 'reference'
                            ? 'bg-white text-gray-800 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <FileStack className="w-4 h-4" />
                    Boost URIs Reference
                </button>

                <button
                    onClick={() => setViewMode('example')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        viewMode === 'example'
                            ? 'bg-white text-gray-800 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Code className="w-4 h-4" />
                    Code Example
                </button>
            </div>

            {/* Reference View - All Boost URIs */}
            {viewMode === 'reference' && (
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-200 rounded-xl">
                        <Zap className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-violet-800">
                            <p className="font-medium mb-1">Your Boost Template URIs</p>
                            <p>
                                Copy individual URIs or export all as a config file for your codebase.
                            </p>
                        </div>
                    </div>

                    {/* Copy All Config Button */}
                    {savedTemplateCount > 0 && (
                        <button
                            onClick={handleCopyAllConfig}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-violet-600 transition-all"
                        >
                            {copiedConfig ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Copied Config!
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Copy All as Config ({savedTemplateCount} templates)
                                </>
                            )}
                        </button>
                    )}

                    {/* All Templates List */}
                    <div className="space-y-3">
                        {/* Master Templates with Children */}
                        {masterTemplates.map(master => (
                            <div key={master.id} className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="flex items-center gap-3 p-3 bg-gray-50 border-b border-gray-200">
                                    <FileStack className="w-4 h-4 text-violet-600" />
                                    <span className="font-medium text-gray-700">{master.name}</span>
                                    <span className="text-xs text-gray-500">
                                        {master.childTemplates?.filter(c => c.boostUri).length} boosts
                                    </span>
                                </div>

                                <div className="divide-y divide-gray-100">
                                    {master.childTemplates?.map(child => (
                                        <div key={child.id} className="p-3 hover:bg-gray-50">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-800 truncate">{child.name}</p>
                                                    {child.boostUri ? (
                                                        <code className="text-xs text-gray-500 font-mono break-all">
                                                            {child.boostUri}
                                                        </code>
                                                    ) : (
                                                        <span className="text-xs text-amber-600">Not saved yet</span>
                                                    )}
                                                </div>

                                                {child.boostUri && (
                                                    <button
                                                        onClick={() => handleCopyUri(child.boostUri!)}
                                                        className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        {copiedUri === child.boostUri ? (
                                                            <Check className="w-4 h-4 text-emerald-500" />
                                                        ) : (
                                                            <Copy className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Standalone Templates (not masters, not children) */}
                        {issuableTemplates.filter(t => !childTemplateIds.has(t.id) && !t.isMasterTemplate).length > 0 && (
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                {masterTemplates.length > 0 && (
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 border-b border-gray-200">
                                        <Award className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium text-gray-700">Other Templates</span>
                                    </div>
                                )}

                                <div className="divide-y divide-gray-100">
                                    {issuableTemplates.filter(t => !childTemplateIds.has(t.id) && !t.isMasterTemplate).map(template => (
                                        <div key={template.id} className="p-3 hover:bg-gray-50">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-800 truncate">{template.name}</p>
                                                    {template.boostUri ? (
                                                        <code className="text-xs text-gray-500 font-mono break-all">
                                                            {template.boostUri}
                                                        </code>
                                                    ) : (
                                                        <span className="text-xs text-amber-600">Not saved yet</span>
                                                    )}
                                                </div>

                                                {template.boostUri && (
                                                    <button
                                                        onClick={() => handleCopyUri(template.boostUri!)}
                                                        className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        {copiedUri === template.boostUri ? (
                                                            <Check className="w-4 h-4 text-emerald-500" />
                                                        ) : (
                                                            <Copy className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* API Key Reference */}
                    {integration.publishableKey && (
                        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <Code className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-amber-800">Your API Key</p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                    Set <code className="bg-amber-100 px-1 rounded">LEARNCARD_API_KEY</code> in your environment to: 
                                    <code className="bg-amber-100 px-1 rounded ml-1 font-mono">{integration.publishableKey.slice(0, 12)}...</code>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Example View - Code Generator */}
            {viewMode === 'example' && (
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-200 rounded-xl">
                        <Zap className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-violet-800">
                            <p className="font-medium mb-1">Code Example Generator</p>
                            <p>
                                Select a template to generate example code. Use the Reference tab to get all URIs.
                            </p>
                        </div>
                    </div>

                    {/* Template Selector */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                            Select Template for Example
                        </label>

                        {/* Master Templates with Children */}
                        {masterTemplates.map(master => (
                            <div key={master.id} className="border-2 border-violet-200 rounded-xl overflow-hidden">
                                <div className="flex items-center gap-3 p-3 bg-violet-50">
                                    <FileStack className="w-5 h-5 text-violet-600" />
                                    <div className="flex-1">
                                        <p className="font-medium text-violet-800">{master.name}</p>
                                        <p className="text-xs text-violet-600">
                                            {master.childTemplates?.length} course boosts
                                        </p>
                                    </div>
                                </div>

                                <div className="p-2 bg-white max-h-48 overflow-y-auto space-y-1">
                                    {master.childTemplates?.map(child => (
                                        <button
                                            key={child.id}
                                            onClick={() => setSelectedTemplateId(child.id)}
                                            className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                                                selectedTemplateId === child.id
                                                    ? 'bg-cyan-50 border-2 border-cyan-500'
                                                    : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <Award className={`w-4 h-4 ${
                                                selectedTemplateId === child.id ? 'text-cyan-600' : 'text-gray-400'
                                            }`} />

                                            <div className="flex-1 text-left min-w-0">
                                                <p className={`font-medium truncate ${
                                                    selectedTemplateId === child.id ? 'text-cyan-800' : 'text-gray-700'
                                                }`}>
                                                    {child.name}
                                                </p>
                                            </div>

                                            {child.boostUri && (
                                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs flex-shrink-0">
                                                    Saved
                                                </span>
                                            )}

                                            {selectedTemplateId === child.id && (
                                                <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Standalone Templates */}
                        {issuableTemplates.filter(t => !childTemplateIds.has(t.id) && !t.isMasterTemplate).length > 0 && (
                            <div className="space-y-2">
                                {masterTemplates.length > 0 && (
                                    <p className="text-xs text-gray-500 font-medium pt-2">Other Templates</p>
                                )}

                                {issuableTemplates.filter(t => !childTemplateIds.has(t.id) && !t.isMasterTemplate).map(template => (
                                    <button
                                        key={template.id}
                                        onClick={() => setSelectedTemplateId(template.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                                            selectedTemplateId === template.id
                                                ? 'border-cyan-500 bg-cyan-50'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                            selectedTemplateId === template.id ? 'bg-cyan-500' : 'bg-gray-100'
                                        }`}>
                                            <Award className={`w-5 h-5 ${
                                                selectedTemplateId === template.id ? 'text-white' : 'text-gray-500'
                                            }`} />
                                        </div>

                                        <div className="flex-1 text-left">
                                            <p className="font-medium text-gray-800">{template.name}</p>
                                            <p className="text-xs text-gray-500">{template.description || 'No description'}</p>
                                        </div>

                                        {template.boostUri && (
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">Saved</span>
                                        )}

                                        {selectedTemplateId === template.id && (
                                            <CheckCircle2 className="w-5 h-5 text-cyan-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info about child boost - course data is baked in */}
                    {selectedTemplateMaster && (
                        <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                            <Layers className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-emerald-800">
                                <p className="font-medium">Course data is pre-filled</p>
                                <p className="text-xs text-emerald-700 mt-0.5">
                                    This boost has course-specific data (name, credits, etc.) already baked in. 
                                    You only need to provide issuance data like recipient name and date.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Template Data Inputs */}
                    {templateVariables.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-gray-700">Template Data</label>
                                <span className="text-xs text-gray-500">
                                    {templateVariables.length} field{templateVariables.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            <p className="text-xs text-gray-500">
                                Enter example values for your credential. These will appear in the generated code.
                            </p>

                            <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                {templateVariables.map(varName => {
                                    const displayName = varName
                                        .replace(/_/g, ' ')
                                        .replace(/\b\w/g, (l: string) => l.toUpperCase());

                                    return (
                                        <div key={varName}>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                {displayName}
                                                <code className="ml-2 text-gray-400 font-normal">{varName}</code>
                                            </label>

                                            <input
                                                type="text"
                                                value={apiTemplateData[varName] || ''}
                                                onChange={(e) => setApiTemplateData(prev => ({
                                                    ...prev,
                                                    [varName]: e.target.value
                                                }))}
                                                placeholder={getSmartDefault(varName)}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Recipient Input */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Recipient
                        </label>

                        <input
                            type="text"
                            value={apiRecipientEmail}
                            onChange={(e) => setApiRecipientEmail(e.target.value)}
                            placeholder="Profile ID or email address"
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />

                        <p className="text-xs text-gray-500">
                            Enter a LearnCard Profile ID or an email address
                        </p>
                    </div>

                    {/* CSV Template Download */}
                    {selectedTemplate && (
                        <button
                            onClick={handleDownloadCsvTemplate}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Download CSV Template for {selectedTemplate.name}
                        </button>
                    )}

                    {/* Advanced Options Toggle */}
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                        {hasAdvancedOptions && <span className="px-1.5 py-0.5 bg-cyan-100 text-cyan-700 rounded text-xs">Active</span>}
                    </button>

                    {/* Advanced Options Panel */}
                    {showAdvanced && (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
                            <p className="text-sm text-gray-600">
                                Customize branding, webhooks, and delivery options.
                            </p>

                            {/* Branding Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Building2 className="w-4 h-4 text-indigo-500" />
                                    Email Branding
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Issuer Name</label>
                                        <input
                                            type="text"
                                            value={advancedOptions.issuerName}
                                            onChange={(e) => setAdvancedOptions(prev => ({ ...prev, issuerName: e.target.value }))}
                                            placeholder="Your Organization"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Logo URL</label>
                                        <input
                                            type="url"
                                            value={advancedOptions.issuerLogoUrl}
                                            onChange={(e) => setAdvancedOptions(prev => ({ ...prev, issuerLogoUrl: e.target.value }))}
                                            placeholder="https://example.com/logo.png"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Recipient Name</label>
                                        <input
                                            type="text"
                                            value={advancedOptions.recipientName}
                                            onChange={(e) => setAdvancedOptions(prev => ({ ...prev, recipientName: e.target.value }))}
                                            placeholder="John Doe"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Webhook Section */}
                            <div className="space-y-3 pt-3 border-t border-gray-200">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Webhook className="w-4 h-4 text-emerald-500" />
                                    Webhook Notification
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Webhook URL</label>
                                    <input
                                        type="url"
                                        value={advancedOptions.webhookUrl}
                                        onChange={(e) => setAdvancedOptions(prev => ({ ...prev, webhookUrl: e.target.value }))}
                                        placeholder="https://your-server.com/webhook"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Receive a POST request when the credential is claimed.
                                    </p>
                                </div>
                            </div>

                            {/* Suppress Delivery */}
                            <div className="space-y-3 pt-3 border-t border-gray-200">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={advancedOptions.suppressDelivery}
                                        onChange={(e) => setAdvancedOptions(prev => ({ ...prev, suppressDelivery: e.target.checked }))}
                                        className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
                                    />
                                    <div className="flex items-center gap-2">
                                        <BellOff className="w-4 h-4 text-amber-500" />
                                        <span className="text-sm font-medium text-gray-700">Suppress Email Delivery</span>
                                    </div>
                                </label>
                                <p className="text-xs text-gray-500 ml-7">
                                    Don't send an email — get the claim URL to use in your own system.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Code Output */}
                    <CodeOutputPanel
                        title="Your Code"
                        snippets={{
                            typescript: generateApiCodeSnippet(),
                            curl: generateCurlCodeSnippet(),
                        }}
                    />
                </div>
            )}
        </div>
    );
};
