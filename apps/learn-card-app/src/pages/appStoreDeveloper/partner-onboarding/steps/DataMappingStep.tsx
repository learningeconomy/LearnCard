import React, { useState, useMemo, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import {
    GitMerge,
    ArrowRight,
    ArrowLeft,
    Copy,
    Check,
    RefreshCw,
    AlertCircle,
    Zap,
    FileJson,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Loader2,
    Save,
    Link2,
    Upload,
    FileSpreadsheet,
    Download,
    Table,
    Award,
    Building2,
    Webhook,
    BellOff,
    Send,
    Clock,
    CheckCircle2,
    Code,
    FileStack,
    Layers,
} from 'lucide-react';

import { Clipboard } from '@capacitor/clipboard';

import { useWallet } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';

import { IntegrationMethod, CredentialTemplate, DataMappingConfig, FieldMapping, TemplateBoostMeta, PartnerProject, fieldNameToVariable } from '../types';
import { CodeBlock } from '../../components/CodeBlock';
import { 
    extractDynamicVariables, 
    OBv3CredentialTemplate,
    jsonToTemplate,
} from '../components/CredentialBuilder';

const TEMPLATE_META_VERSION = '1.0.0';

interface DataMappingStepProps {
    integrationMethod: IntegrationMethod;
    templates: CredentialTemplate[];
    project: PartnerProject | null;
    dataMapping: DataMappingConfig | null;
    onComplete: (mapping: DataMappingConfig, updatedTemplates: CredentialTemplate[]) => void;
    onBack: () => void;
}

const SAMPLE_WEBHOOK_PAYLOAD = {
    event: 'course_completed',
    user: {
        email: 'student@example.com',
        name: 'John Doe',
        id: 'user_123',
    },
    course: {
        id: 'course_456',
        title: 'Introduction to Data Science',
        sku: 'DS101',
        credits: 3,
    },
    completion: {
        date: '2024-01-15T10:30:00Z',
        grade: 'A',
        score: 95,
    },
};

export const DataMappingStep: React.FC<DataMappingStepProps> = ({
    integrationMethod,
    templates,
    project,
    dataMapping,
    onComplete,
    onBack,
}) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const initWalletRef = useRef(initWallet);
    initWalletRef.current = initWallet;

    const [webhookUrl] = useState(dataMapping?.webhookUrl || `https://api.learncard.com/webhooks/${Date.now().toString(36)}`);
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [samplePayload, setSamplePayload] = useState<Record<string, unknown> | null>(
        dataMapping?.samplePayload || null
    );
    const [mappings, setMappings] = useState<FieldMapping[]>(dataMapping?.mappings || []);
    const [isWaiting, setIsWaiting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string>(templates[0]?.id || '');
    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

    // CSV-specific state
    const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
    const [csvPreviewRows, setCsvPreviewRows] = useState<Record<string, string>[]>([]);
    const [csvFileName, setCsvFileName] = useState<string | null>(null);
    const csvInputRef = useRef<HTMLInputElement>(null);

    // Boost selector state for master templates (webhook/CSV)
    const [boostSelectorField, setBoostSelectorField] = useState<string>(dataMapping?.boostSelectorField || '');
    const [boostSelectorMatchType, setBoostSelectorMatchType] = useState<'id' | 'name'>(
        dataMapping?.boostSelectorMatchType || 'id'
    );

    const integrationId = project?.id;

    // Compute issuable templates (exclude master templates, include their children flattened)
    const issuableTemplates = useMemo(() => {
        const result: CredentialTemplate[] = [];

        for (const template of templates) {
            if (template.isMasterTemplate) {
                // Add children instead of master
                if (template.childTemplates?.length) {
                    result.push(...template.childTemplates);
                }
            } else {
                result.push(template);
            }
        }

        return result;
    }, [templates]);

    // Get master templates for special handling
    const masterTemplates = useMemo(() => {
        return templates.filter(t => t.isMasterTemplate && t.childTemplates?.length);
    }, [templates]);

    // Check if selected template belongs to a master template
    const selectedTemplateMaster = useMemo(() => {
        const selected = issuableTemplates.find(t => t.id === selectedTemplate);
        if (!selected?.parentTemplateId) return null;

        return templates.find(t => t.id === selected.parentTemplateId);
    }, [selectedTemplate, issuableTemplates, templates]);

    // Extract all field paths from sample payload (webhook) or CSV headers
    const sourceFields = useMemo(() => {
        // For CSV, use the headers
        if (integrationMethod === 'csv' && csvHeaders.length > 0) {
            return csvHeaders;
        }

        // For webhook, extract paths from sample payload
        if (!samplePayload) return [];

        const extractPaths = (obj: Record<string, unknown>, prefix = ''): string[] => {
            const paths: string[] = [];

            for (const [key, value] of Object.entries(obj)) {
                const path = prefix ? `${prefix}.${key}` : key;

                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    paths.push(...extractPaths(value as Record<string, unknown>, path));
                } else {
                    paths.push(path);
                }
            }

            return paths;
        };

        return extractPaths(samplePayload);
    }, [samplePayload, csvHeaders, integrationMethod]);

    // Get target fields from selected template - prefer OBv3 dynamic variables
    const targetFields = useMemo(() => {
        const template = templates.find(t => t.id === selectedTemplate);
        if (!template) return [];

        // If template has OBv3 data, extract dynamic variables from it
        if (template.obv3Template) {
            try {
                const obv3 = template.obv3Template as OBv3CredentialTemplate;
                const dynamicVars = extractDynamicVariables(obv3);
                
                // Return variable names formatted nicely
                return dynamicVars.map(v => v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
            } catch (e) {
                console.warn('Failed to extract OBv3 dynamic variables:', e);
            }
        }

        // Fallback to legacy fields
        return template.fields?.map(f => f.name) || [];
    }, [templates, selectedTemplate]);

    // Get the raw variable names for templateData generation
    const targetVariableNames = useMemo(() => {
        const template = templates.find(t => t.id === selectedTemplate);
        if (!template) return [];

        // If template has OBv3 data, extract dynamic variables from it
        if (template.obv3Template) {
            try {
                const obv3 = template.obv3Template as OBv3CredentialTemplate;
                return extractDynamicVariables(obv3);
            } catch (e) {
                console.warn('Failed to extract OBv3 dynamic variables:', e);
            }
        }

        // Fallback to legacy fields
        return template.fields?.map(f => f.variableName || fieldNameToVariable(f.name)) || [];
    }, [templates, selectedTemplate]);

    const handleCopyUrl = async () => {
        await Clipboard.write({ string: webhookUrl });
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
    };

    const handleSimulateWebhook = () => {
        setIsWaiting(true);

        // Simulate receiving a webhook after 2 seconds
        setTimeout(() => {
            setSamplePayload(SAMPLE_WEBHOOK_PAYLOAD);
            setIsWaiting(false);
        }, 2000);
    };

    // Handle CSV file upload
    const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setCsvFileName(file.name);

        Papa.parse(file, {
            header: true,
            preview: 5, // Only parse first 5 rows for preview
            complete: (result) => {
                const headers = result.meta.fields || [];
                const rows = result.data as Record<string, string>[];

                setCsvHeaders(headers.filter(h => h.trim() !== ''));
                setCsvPreviewRows(rows.filter(row => Object.values(row).some(v => v?.trim())));

                // Reset mappings when new file is uploaded
                setMappings([]);
            },
            error: (error) => {
                console.error('CSV parse error:', error);
                presentToast('Failed to parse CSV file', { type: ToastTypeEnum.Error, hasDismissButton: true });
            },
        });
    };

    // Generate CSV template for download - uses OBv3 dynamic variables if available
    const handleDownloadTemplate = () => {
        const template = templates.find(t => t.id === selectedTemplate);
        if (!template) return;

        // Get headers from OBv3 template or fallback to legacy fields
        let headers: string[] = [];

        if (template.obv3Template) {
            try {
                const obv3 = template.obv3Template as OBv3CredentialTemplate;
                const dynamicVars = extractDynamicVariables(obv3);
                // Format variable names as headers
                headers = dynamicVars.map(v => v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
            } catch (e) {
                console.warn('Failed to extract OBv3 dynamic variables for CSV:', e);
            }
        }

        // Fallback to legacy fields
        if (headers.length === 0) {
            headers = template.fields?.map(f => f.name) || [];
        }

        const csvContent = headers.join(',') + '\n' + headers.map(() => '').join(',');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}-template.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Handle selecting a source field
    const handleSelectSource = (source: string) => {
        if (selectedSource === source) {
            setSelectedSource(null);
        } else {
            setSelectedSource(source);

            // If a target is already selected, create the mapping
            if (selectedTarget) {
                setMappings([...mappings, { sourceField: source, targetField: selectedTarget }]);
                setSelectedSource(null);
                setSelectedTarget(null);
            }
        }
    };

    // Handle selecting a target field
    const handleSelectTarget = (target: string) => {
        if (selectedTarget === target) {
            setSelectedTarget(null);
        } else {
            setSelectedTarget(target);

            // If a source is already selected, create the mapping
            if (selectedSource) {
                setMappings([...mappings, { sourceField: selectedSource, targetField: target }]);
                setSelectedSource(null);
                setSelectedTarget(null);
            }
        }
    };

    const handleRemoveMapping = (index: number) => {
        setMappings(mappings.filter((_, i) => i !== index));
    };

    // Apply mappings to templates' field.sourceMapping - supports both OBv3 and legacy
    const applyMappingsToTemplates = (): CredentialTemplate[] => {
        return templates.map(template => {
            if (template.id !== selectedTemplate) return template;

            // Get dynamic variables from OBv3 template if available
            let dynamicVars: string[] = [];

            if (template.obv3Template) {
                try {
                    const obv3 = template.obv3Template as OBv3CredentialTemplate;
                    dynamicVars = extractDynamicVariables(obv3);
                } catch (e) {
                    console.warn('Failed to extract OBv3 dynamic variables:', e);
                }
            }

            // Build fields array from dynamic variables or use existing
            let updatedFields = template.fields || [];

            if (dynamicVars.length > 0) {
                // Create/update fields based on dynamic variables
                updatedFields = dynamicVars.map(varName => {
                    const displayName = varName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    const existingField = template.fields?.find(f => 
                        f.variableName === varName || fieldNameToVariable(f.name) === varName
                    );
                    
                    // Find mapping by display name or variable name
                    const mapping = mappings.find(m => 
                        m.targetField === displayName || m.targetField === varName
                    );

                    return {
                        id: existingField?.id || varName,
                        name: displayName,
                        type: existingField?.type || 'text' as const,
                        required: existingField?.required || false,
                        variableName: varName,
                        sourceMapping: mapping?.sourceField || existingField?.sourceMapping,
                    };
                });
            } else {
                // Legacy mode - update existing fields
                updatedFields = template.fields?.map(field => {
                    const mapping = mappings.find(m => m.targetField === field.name);
                    return {
                        ...field,
                        sourceMapping: mapping?.sourceField || field.sourceMapping,
                    };
                }) || [];
            }

            return {
                ...template,
                isDirty: true,
                fields: updatedFields,
            };
        });
    };

    // Save templates with mappings back to boosts
    const saveTemplatesToBoosts = useCallback(async (updatedTemplates: CredentialTemplate[]) => {
        if (!integrationId) return;

        const wallet = await initWalletRef.current();

        for (const template of updatedTemplates) {
            if (!template.boostUri) continue;

            const boostMeta: TemplateBoostMeta = {
                integrationId,
                templateConfig: {
                    fields: template.fields,
                    achievementType: template.achievementType,
                    version: TEMPLATE_META_VERSION,
                },
            };

            try {
                await wallet.invoke.updateBoost(template.boostUri, {
                    meta: boostMeta,
                } as Parameters<typeof wallet.invoke.updateBoost>[1]);
            } catch (err) {
                console.error('Failed to update boost with mappings:', err);
                throw err;
            }
        }
    }, [integrationId]);

    // Handle save and continue
    const handleSaveAndContinue = async () => {
        setIsSaving(true);

        try {
            const updatedTemplates = applyMappingsToTemplates();

            // Save mappings to boosts
            await saveTemplatesToBoosts(updatedTemplates);

            presentToast('Field mappings saved!', { type: ToastTypeEnum.Success, hasDismissButton: true });

            onComplete(
                { 
                    webhookUrl, 
                    samplePayload: samplePayload || undefined, 
                    mappings,
                    boostSelectorField: masterTemplates.length > 0 ? boostSelectorField : undefined,
                    boostSelectorMatchType: masterTemplates.length > 0 ? boostSelectorMatchType : undefined,
                },
                updatedTemplates
            );
        } catch (err) {
            console.error('Failed to save mappings:', err);
            presentToast('Failed to save mappings', { type: ToastTypeEnum.Error, hasDismissButton: true });
        } finally {
            setIsSaving(false);
        }
    };

    const canProceed = integrationMethod === 'api' || 
        (integrationMethod === 'csv' && csvHeaders.length > 0 && mappings.length > 0) ||
        (integrationMethod === 'webhook' && samplePayload && mappings.length > 0);

    // API Integration state - use issuable templates (excludes master templates)
    const [apiSelectedTemplate, setApiSelectedTemplate] = useState<string>(issuableTemplates[0]?.id || '');
    const [apiRecipientEmail, setApiRecipientEmail] = useState('');
    const [apiTemplateData, setApiTemplateData] = useState<Record<string, string>>({});
    const [apiShowAdvanced, setApiShowAdvanced] = useState(false);
    const [apiAdvancedOptions, setApiAdvancedOptions] = useState({
        issuerName: '',
        issuerLogoUrl: '',
        recipientName: '',
        webhookUrl: '',
        suppressDelivery: false,
    });
    const [apiIsPolling, setApiIsPolling] = useState(false);
    const [apiPollResult, setApiPollResult] = useState<{ success: boolean; message: string } | null>(null);
    const [apiCopied, setApiCopied] = useState(false);
    const [apiCopiedUri, setApiCopiedUri] = useState<string | null>(null);
    const [apiCopiedConfig, setApiCopiedConfig] = useState(false);
    const [apiViewMode, setApiViewMode] = useState<'reference' | 'example'>('reference');

    // Generate a config object mapping template names/IDs to their boost URIs
    const generateBoostConfig = useCallback(() => {
        const config: Record<string, { uri: string; name: string; variables: string[] }> = {};

        const toKey = (name: string) => name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '');

        issuableTemplates.forEach(template => {
            if (template.boostUri) {
                const key = toKey(template.name);
                let vars: string[] = [];

                if (template.obv3Template) {
                    try {
                        vars = extractDynamicVariables(template.obv3Template as OBv3CredentialTemplate);
                    } catch (e) {
                        // fallback to fields
                    }
                }

                if (vars.length === 0 && template.fields?.length) {
                    vars = template.fields.map(f => f.variableName || fieldNameToVariable(f.name));
                }

                config[key] = {
                    uri: template.boostUri,
                    name: template.name,
                    variables: vars,
                };
            }
        });

        return config;
    }, [issuableTemplates]);

    const handleCopyUri = async (uri: string) => {
        await Clipboard.write({ string: uri });
        setApiCopiedUri(uri);
        setTimeout(() => setApiCopiedUri(null), 2000);
    };

    const handleCopyAllConfig = async () => {
        const config = generateBoostConfig();
        const configCode = `// Boost Templates Configuration
// Generated from LearnCard Partner Dashboard

const BOOST_TEMPLATES = ${JSON.stringify(config, null, 2)};

// Usage example:
// const template = BOOST_TEMPLATES['course_key'];
// await learnCard.invoke.send({ templateUri: template.uri, ... });

export default BOOST_TEMPLATES;`;

        await Clipboard.write({ string: configCode });
        setApiCopiedConfig(true);
        setTimeout(() => setApiCopiedConfig(false), 2000);
    };

    // Generate smart default value based on variable name
    const getSmartDefault = (varName: string): string => {
        const lower = varName.toLowerCase();

        if (lower.includes('date') || lower.includes('issued') || lower.includes('completed')) {
            return new Date().toISOString().split('T')[0];
        }

        if (lower.includes('expir')) {
            const future = new Date();
            future.setFullYear(future.getFullYear() + 2);
            return future.toISOString().split('T')[0];
        }

        if (lower.includes('score') || lower.includes('grade')) {
            return '95';
        }

        if (lower.includes('credits') || lower.includes('hours')) {
            return '3';
        }

        if (lower.includes('email')) {
            return 'student@example.com';
        }

        if (lower.includes('name') && lower.includes('course')) {
            return 'Introduction to Web Development';
        }

        if (lower.includes('name') && (lower.includes('student') || lower.includes('recipient') || lower.includes('learner'))) {
            return 'Jane Smith';
        }

        if (lower.includes('name')) {
            return 'Example Name';
        }

        if (lower.includes('description')) {
            return 'Successfully completed all course requirements';
        }

        if (lower.includes('url') || lower.includes('image') || lower.includes('logo')) {
            return 'https://example.com/image.png';
        }

        if (lower.includes('instructor') || lower.includes('teacher')) {
            return 'Dr. John Smith';
        }

        // Format the variable name as a readable default
        const readable = varName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `Example ${readable}`;
    };

    // Get dynamic variables for the selected API template (from issuable templates)
    const apiTemplateVariables = useMemo(() => {
        const template = issuableTemplates.find(t => t.id === apiSelectedTemplate);
        if (!template) return [];

        let vars: string[] = [];

        if (template.obv3Template) {
            try {
                const obv3 = template.obv3Template as OBv3CredentialTemplate;
                vars = extractDynamicVariables(obv3);
            } catch (e) {
                console.warn('Failed to extract OBv3 dynamic variables:', e);
            }
        }

        if (vars.length === 0 && template.fields?.length) {
            vars = template.fields.map(f => f.variableName || fieldNameToVariable(f.name));
        }

        return vars;
    }, [issuableTemplates, apiSelectedTemplate]);

    // Initialize template data with smart defaults when template changes
    React.useEffect(() => {
        if (apiTemplateVariables.length > 0) {
            const newData: Record<string, string> = {};

            apiTemplateVariables.forEach(varName => {
                // Keep existing value if present, otherwise use smart default
                newData[varName] = apiTemplateData[varName] || getSmartDefault(varName);
            });

            setApiTemplateData(newData);
        }
    }, [apiTemplateVariables]);

    const apiHasAdvancedOptions = apiAdvancedOptions.issuerName || apiAdvancedOptions.issuerLogoUrl || 
        apiAdvancedOptions.recipientName || apiAdvancedOptions.webhookUrl || apiAdvancedOptions.suppressDelivery;

    const selectedApiTemplate = issuableTemplates.find(t => t.id === apiSelectedTemplate);

    // Get the parent master template for the selected API template (if any)
    const selectedApiTemplateMaster = useMemo(() => {
        if (!selectedApiTemplate?.parentTemplateId) return null;
        return templates.find(t => t.id === selectedApiTemplate.parentTemplateId);
    }, [selectedApiTemplate, templates]);

    // Generate templateData code from template - uses user-entered values from apiTemplateData
    const generateTemplateDataCode = (template: CredentialTemplate | undefined, indent: string = '        ') => {
        if (!template) return '';

        // Use the apiTemplateVariables that we already computed
        if (apiTemplateVariables.length === 0) return '';

        const lines = apiTemplateVariables.map(varName => {
            // Use the user-entered value or smart default
            const value = apiTemplateData[varName] || getSmartDefault(varName);

            // Escape single quotes in the value
            const escapedValue = value.replace(/'/g, "\\'");

            return `${indent}${varName}: '${escapedValue}',`;
        });

        return lines.join('\n');
    };

    // Generate code snippets for API integration
    const generateApiCodeSnippet = () => {
        const template = selectedApiTemplate;
        const boostUri = template?.boostUri || 'urn:lc:boost:your_template_id';
        const apiKey = project?.apiKey || 'YOUR_API_KEY';

        // Generate templateData from fields
        const templateDataCode = generateTemplateDataCode(template);

        // Check if sending to email (Universal Inbox) or profile ID
        const isEmailRecipient = apiRecipientEmail && apiRecipientEmail.includes('@');

        if (isEmailRecipient) {
            // Email recipient - use sendCredentialViaInbox API
            // Build configuration object for delivery options
            let configCode = '';
            const configParts: string[] = [];

            if (apiAdvancedOptions.webhookUrl) {
                configParts.push(`            webhookUrl: '${apiAdvancedOptions.webhookUrl}',`);
            }

            if (apiAdvancedOptions.suppressDelivery) {
                configParts.push(`            delivery: { suppress: true },`);
            } else if (apiAdvancedOptions.issuerName || apiAdvancedOptions.issuerLogoUrl || apiAdvancedOptions.recipientName) {
                const modelParts: string[] = [];

                if (apiAdvancedOptions.issuerName || apiAdvancedOptions.issuerLogoUrl) {
                    const issuerParts: string[] = [];
                    if (apiAdvancedOptions.issuerName) issuerParts.push(`name: '${apiAdvancedOptions.issuerName}'`);
                    if (apiAdvancedOptions.issuerLogoUrl) issuerParts.push(`logoUrl: '${apiAdvancedOptions.issuerLogoUrl}'`);
                    modelParts.push(`                    issuer: { ${issuerParts.join(', ')} },`);
                }

                if (apiAdvancedOptions.recipientName) {
                    modelParts.push(`                    recipient: { name: '${apiAdvancedOptions.recipientName}' },`);
                }

                configParts.push(`            delivery: {
                template: {
                    model: {
${modelParts.join('\n')}
                    },
                },
            },`);
            }

            if (configParts.length > 0) {
                configCode = `
        configuration: {
${configParts.join('\n')}
        },`;
            }

            return `// Installation: npm install @learncard/init

import { initLearnCard } from '@learncard/init';

// Initialize with your API key (from Project Setup)
const learnCard = await initLearnCard({
    network: {
        apiToken: process.env.LEARNCARD_API_KEY, // ${apiKey.slice(0, 8)}...
    },
});

// Fetch the boost template and render with your data
const boostCredential = await learnCard.invoke.resolveFromLCN('${boostUri}');

// Apply template data using Mustache rendering
const Mustache = require('mustache');
const templateData = {
${templateDataCode}
};

const renderedCredential = JSON.parse(
    Mustache.render(JSON.stringify(boostCredential), templateData)
);

// Send to email recipient via Universal Inbox
const result = await learnCard.invoke.sendCredentialViaInbox({
    recipient: { email: '${apiRecipientEmail}' },
    credential: renderedCredential,${configCode}
});

console.log('Issuance ID:', result.issuanceId);
console.log('Status:', result.status); // 'pending' until claimed
// Recipient will receive an email with a link to claim their credential`;
        } else {
            // Profile ID recipient - use send API
            let optionsCode = '';

            if (apiHasAdvancedOptions && apiAdvancedOptions.webhookUrl) {
                optionsCode = `
    // webhookUrl: '${apiAdvancedOptions.webhookUrl}', // Note: webhooks not yet supported for direct send`;
            }

            return `// Installation: npm install @learncard/init

import { initLearnCard } from '@learncard/init';

// Initialize with your API key (from Project Setup)
const learnCard = await initLearnCard({
    network: {
        apiToken: process.env.LEARNCARD_API_KEY, // ${apiKey.slice(0, 8)}...
    },
});

// Send boost to a LearnCard user by profile ID
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'recipient-profile-id', // The recipient's LearnCard profile ID
    templateUri: '${boostUri}',
    templateData: {
${templateDataCode}
    },${optionsCode}
});

console.log('Credential URI:', result.credentialUri);
console.log('Boost URI:', result.uri);
// Credential is sent directly to the user's LearnCard wallet`;
        }
    };

    const handleCopyApiCode = async () => {
        const code = generateApiCodeSnippet();
        await Clipboard.write({ string: code });
        setApiCopied(true);
        setTimeout(() => setApiCopied(false), 2000);
    };

    const handleApiStartPolling = async () => {
        setApiIsPolling(true);
        setApiPollResult(null);

        try {
            const wallet = await initWalletRef.current();
            const initialCount = await wallet.invoke.getMySentInboxCredentials?.({ limit: 1 });
            const initialTotal = initialCount?.hasMore ? 100 : (initialCount?.records?.length || 0);

            // Poll for 30 seconds
            let attempts = 0;
            const maxAttempts = 15;

            const poll = async () => {
                if (attempts >= maxAttempts) {
                    setApiIsPolling(false);
                    setApiPollResult({ success: false, message: 'No new credentials detected. Make sure you ran your code.' });
                    return;
                }

                attempts++;
                const current = await wallet.invoke.getMySentInboxCredentials?.({ limit: 1 });
                const currentTotal = current?.hasMore ? 100 : (current?.records?.length || 0);

                if (currentTotal > initialTotal) {
                    setApiIsPolling(false);
                    setApiPollResult({ success: true, message: 'Credential sent successfully!' });
                    return;
                }

                setTimeout(poll, 2000);
            };

            setTimeout(poll, 2000);
        } catch (err) {
            console.error('Polling error:', err);
            setApiIsPolling(false);
            setApiPollResult({ success: false, message: 'Failed to check credentials. Please try again.' });
        }
    };

    // Render based on integration method
    if (integrationMethod === 'api') {
        return (
            <div className="space-y-6">
                {/* View Mode Toggle */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                    <button
                        onClick={() => setApiViewMode('reference')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            apiViewMode === 'reference'
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <FileStack className="w-4 h-4" />
                        Boost URIs Reference
                    </button>

                    <button
                        onClick={() => setApiViewMode('example')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            apiViewMode === 'example'
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Code className="w-4 h-4" />
                        Code Example
                    </button>
                </div>

                {/* Reference View - All Boost URIs */}
                {apiViewMode === 'reference' && (
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
                        <button
                            onClick={handleCopyAllConfig}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl font-medium hover:from-cyan-600 hover:to-violet-600 transition-all"
                        >
                            {apiCopiedConfig ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Copied Config!
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Copy All as Config ({issuableTemplates.filter(t => t.boostUri).length} templates)
                                </>
                            )}
                        </button>

                        {/* All Templates List */}
                        <div className="space-y-3">
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
                                                            {apiCopiedUri === child.boostUri ? (
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

                            {/* Standalone Templates */}
                            {issuableTemplates.filter(t => !t.parentTemplateId).length > 0 && (
                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    {masterTemplates.length > 0 && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 border-b border-gray-200">
                                            <Award className="w-4 h-4 text-gray-500" />
                                            <span className="font-medium text-gray-700">Other Templates</span>
                                        </div>
                                    )}

                                    <div className="divide-y divide-gray-100">
                                        {issuableTemplates.filter(t => !t.parentTemplateId).map(template => (
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
                                                            {apiCopiedUri === template.boostUri ? (
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
                        {project?.apiKey && (
                            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                <Code className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-amber-800">Your API Key</p>
                                    <p className="text-xs text-amber-700 mt-0.5">
                                        Set <code className="bg-amber-100 px-1 rounded">LEARNCARD_API_KEY</code> in your environment to: 
                                        <code className="bg-amber-100 px-1 rounded ml-1 font-mono">{project.apiKey.slice(0, 12)}...</code>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Example View - Code Generator */}
                {apiViewMode === 'example' && (
                    <>
                        <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-200 rounded-xl">
                            <Zap className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-violet-800">
                                <p className="font-medium mb-1">Code Example Generator</p>
                                <p>
                                    Select a template to generate example code. Use the Reference tab to get all URIs.
                                </p>
                            </div>
                        </div>

                        {/* Template Selector - organized by master templates */}
                        {issuableTemplates.length > 0 && (
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
                                                    onClick={() => setApiSelectedTemplate(child.id)}
                                                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                                                        apiSelectedTemplate === child.id
                                                            ? 'bg-cyan-50 border-2 border-cyan-500'
                                                            : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <Award className={`w-4 h-4 ${
                                                        apiSelectedTemplate === child.id ? 'text-cyan-600' : 'text-gray-400'
                                                    }`} />

                                                    <div className="flex-1 text-left min-w-0">
                                                        <p className={`font-medium truncate ${
                                                            apiSelectedTemplate === child.id ? 'text-cyan-800' : 'text-gray-700'
                                                        }`}>
                                                            {child.name}
                                                        </p>
                                                    </div>

                                                    {child.boostUri && (
                                                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs flex-shrink-0">
                                                            Saved
                                                        </span>
                                                    )}

                                                    {apiSelectedTemplate === child.id && (
                                                        <CheckCircle2 className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {/* Standalone Templates (not part of a master) */}
                        {issuableTemplates.filter(t => !t.parentTemplateId).length > 0 && (
                            <div className="space-y-2">
                                {masterTemplates.length > 0 && (
                                    <p className="text-xs text-gray-500 font-medium pt-2">Other Templates</p>
                                )}

                                {issuableTemplates.filter(t => !t.parentTemplateId).map(template => (
                                    <button
                                        key={template.id}
                                        onClick={() => setApiSelectedTemplate(template.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                                            apiSelectedTemplate === template.id
                                                ? 'border-cyan-500 bg-cyan-50'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                            apiSelectedTemplate === template.id ? 'bg-cyan-500' : 'bg-gray-100'
                                        }`}>
                                            <Award className={`w-5 h-5 ${
                                                apiSelectedTemplate === template.id ? 'text-white' : 'text-gray-500'
                                            }`} />
                                        </div>

                                        <div className="flex-1 text-left">
                                            <p className="font-medium text-gray-800">{template.name}</p>
                                            <p className="text-xs text-gray-500">{template.description || 'No description'}</p>
                                        </div>

                                        {template.boostUri && (
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">Saved</span>
                                        )}

                                        {apiSelectedTemplate === template.id && (
                                            <CheckCircle2 className="w-5 h-5 text-cyan-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Info about child boost - course data is baked in */}
                {selectedApiTemplateMaster && (
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
                {apiTemplateVariables.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-700">Template Data</label>

                            <span className="text-xs text-gray-500">
                                {apiTemplateVariables.length} field{apiTemplateVariables.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        <p className="text-xs text-gray-500">
                            Enter example values for your credential. These will appear in the generated code.
                        </p>

                        <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            {apiTemplateVariables.map(varName => {
                                // Format display name
                                const displayName = varName
                                    .replace(/_/g, ' ')
                                    .replace(/\b\w/g, l => l.toUpperCase());

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

                {/* Recipient Type Selection */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                        Recipient Type
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setApiRecipientEmail('')}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${
                                !apiRecipientEmail 
                                    ? 'border-cyan-500 bg-cyan-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <p className={`font-medium ${!apiRecipientEmail ? 'text-cyan-800' : 'text-gray-700'}`}>
                                Profile ID
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Send to existing LearnCard users
                            </p>
                        </button>

                        <button
                            onClick={() => setApiRecipientEmail(apiRecipientEmail || 'recipient@example.com')}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${
                                apiRecipientEmail 
                                    ? 'border-cyan-500 bg-cyan-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <p className={`font-medium ${apiRecipientEmail ? 'text-cyan-800' : 'text-gray-700'}`}>
                                Email (Universal Inbox)
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Send to anyone via email claim link
                            </p>
                        </button>
                    </div>

                    {apiRecipientEmail && (
                        <input
                            type="email"
                            value={apiRecipientEmail}
                            onChange={(e) => setApiRecipientEmail(e.target.value)}
                            placeholder="recipient@example.com"
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    )}
                </div>

                {/* API Key Reference */}
                {project?.apiKey && (
                    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <Code className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-amber-800">Your API Key</p>
                            <p className="text-xs text-amber-700 mt-0.5">
                                Set <code className="bg-amber-100 px-1 rounded">LEARNCARD_API_KEY</code> in your environment to: 
                                <code className="bg-amber-100 px-1 rounded ml-1 font-mono">{project.apiKey.slice(0, 12)}...</code>
                            </p>
                        </div>
                    </div>
                )}

                {/* Advanced Options Toggle */}
                <button
                    onClick={() => setApiShowAdvanced(!apiShowAdvanced)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                    {apiShowAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {apiShowAdvanced ? 'Hide' : 'Show'} Advanced Options
                    {apiHasAdvancedOptions && <span className="px-1.5 py-0.5 bg-cyan-100 text-cyan-700 rounded text-xs">Active</span>}
                </button>

                {/* Advanced Options Panel */}
                {apiShowAdvanced && (
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
                                        value={apiAdvancedOptions.issuerName}
                                        onChange={(e) => setApiAdvancedOptions(prev => ({ ...prev, issuerName: e.target.value }))}
                                        placeholder="Your Organization"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Logo URL</label>
                                    <input
                                        type="url"
                                        value={apiAdvancedOptions.issuerLogoUrl}
                                        onChange={(e) => setApiAdvancedOptions(prev => ({ ...prev, issuerLogoUrl: e.target.value }))}
                                        placeholder="https://example.com/logo.png"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Recipient Name</label>
                                    <input
                                        type="text"
                                        value={apiAdvancedOptions.recipientName}
                                        onChange={(e) => setApiAdvancedOptions(prev => ({ ...prev, recipientName: e.target.value }))}
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
                                    value={apiAdvancedOptions.webhookUrl}
                                    onChange={(e) => setApiAdvancedOptions(prev => ({ ...prev, webhookUrl: e.target.value }))}
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
                                    checked={apiAdvancedOptions.suppressDelivery}
                                    onChange={(e) => setApiAdvancedOptions(prev => ({ ...prev, suppressDelivery: e.target.checked }))}
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
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Code className="w-4 h-4 text-cyan-600" />
                            Your Code
                        </div>

                        <button
                            onClick={handleCopyApiCode}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        >
                            {apiCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            {apiCopied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>

                    <CodeBlock code={generateApiCodeSnippet()} />
                </div>

                {/* Verification Section */}
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Send className="w-5 h-5 text-indigo-600" />
                        </div>

                        <div className="flex-1">
                            <h4 className="font-medium text-gray-800 mb-1">Verify Your Code Worked</h4>
                            <p className="text-sm text-gray-600 mb-3">
                                Run your code, then click below to verify the credential was sent successfully.
                            </p>

                            {!apiIsPolling && !apiPollResult?.success && (
                                <button
                                    onClick={handleApiStartPolling}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Check for Sent Credentials
                                </button>
                            )}

                            {apiIsPolling && (
                                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-indigo-200">
                                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Waiting for new credentials...</p>
                                        <p className="text-xs text-gray-500">Run your code now. We'll detect when it's sent.</p>
                                    </div>
                                    <button
                                        onClick={() => setApiIsPolling(false)}
                                        className="ml-auto px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}

                            {apiPollResult && (
                                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                                    apiPollResult.success 
                                        ? 'bg-emerald-50 border border-emerald-200' 
                                        : 'bg-amber-50 border border-amber-200'
                                }`}>
                                    {apiPollResult.success ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                    ) : (
                                        <Clock className="w-5 h-5 text-amber-600" />
                                    )}

                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${apiPollResult.success ? 'text-emerald-800' : 'text-amber-800'}`}>
                                            {apiPollResult.message}
                                        </p>
                                    </div>

                                    {!apiPollResult.success && (
                                        <button
                                            onClick={handleApiStartPolling}
                                            className="px-3 py-1 text-sm bg-amber-100 text-amber-700 rounded hover:bg-amber-200"
                                        >
                                            Try Again
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                    </>
                )}

                {/* Navigation */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    <button
                        onClick={() => onComplete({ mappings: [], webhookUrl: undefined }, templates)}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                    >
                        Continue to Testing
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    if (integrationMethod === 'csv') {
        return (
            <div className="space-y-6">
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <FileSpreadsheet className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />

                    <div className="text-sm text-amber-800">
                        <p className="font-medium mb-1">CSV Upload Integration</p>
                        <p>
                            Upload a sample CSV file to map your columns to credential fields.
                            You can use your own data format or download a template.
                        </p>
                    </div>
                </div>

                {/* Template selector if multiple templates */}
                {templates.length > 1 && (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Select Template</label>
                        <select
                            value={selectedTemplate}
                            onChange={(e) => {
                                setSelectedTemplate(e.target.value);
                                setMappings([]);
                            }}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        >
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Upload or Download section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <Upload className="w-5 h-5 text-amber-600" />
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-800">Upload Sample CSV</h3>
                            <p className="text-sm text-gray-500">Upload a CSV with your column headers</p>
                        </div>
                    </div>

                    <input
                        ref={csvInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleCsvUpload}
                        className="hidden"
                    />

                    {!csvFileName ? (
                        <div className="space-y-3">
                            <div
                                onClick={() => csvInputRef.current?.click()}
                                className="p-6 border-2 border-dashed border-amber-300 rounded-xl text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors"
                            >
                                <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600 mb-1">
                                    Click to upload a CSV file
                                </p>
                                <p className="text-xs text-gray-400">
                                    We'll extract column headers for mapping
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className="text-xs text-gray-400">or</span>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>

                            <button 
                                onClick={handleDownloadTemplate}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Download CSV Template
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* File uploaded indicator */}
                            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <Check className="w-5 h-5 text-emerald-600" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-emerald-800">{csvFileName}</p>
                                    <p className="text-xs text-emerald-600">{csvHeaders.length} columns detected</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setCsvFileName(null);
                                        setCsvHeaders([]);
                                        setCsvPreviewRows([]);
                                        setMappings([]);
                                        if (csvInputRef.current) csvInputRef.current.value = '';
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-500 rounded"
                                >
                                    ×
                                </button>
                            </div>

                            {/* CSV Preview */}
                            {csvPreviewRows.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Table className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">Data Preview</span>
                                    </div>
                                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                        <table className="min-w-full text-xs">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    {csvHeaders.slice(0, 5).map(header => (
                                                        <th key={header} className="px-3 py-2 text-left font-medium text-gray-600 border-b">
                                                            {header}
                                                        </th>
                                                    ))}
                                                    {csvHeaders.length > 5 && (
                                                        <th className="px-3 py-2 text-left font-medium text-gray-400 border-b">
                                                            +{csvHeaders.length - 5} more
                                                        </th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {csvPreviewRows.slice(0, 3).map((row, idx) => (
                                                    <tr key={idx} className="border-b border-gray-100 last:border-0">
                                                        {csvHeaders.slice(0, 5).map(header => (
                                                            <td key={header} className="px-3 py-2 text-gray-700 truncate max-w-32">
                                                                {row[header] || '-'}
                                                            </td>
                                                        ))}
                                                        {csvHeaders.length > 5 && (
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

                {/* Boost Selector for Master Templates (CSV) */}
                {csvHeaders.length > 0 && masterTemplates.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                                <FileStack className="w-5 h-5 text-violet-600" />
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-800">Course Boost Selection</h3>
                                <p className="text-sm text-gray-500">
                                    You have {masterTemplates.reduce((sum, m) => sum + (m.childTemplates?.length || 0), 0)} course boosts. 
                                    Specify which column identifies the course.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-violet-800 mb-2">
                                    Which column identifies the course?
                                </label>

                                <select
                                    value={boostSelectorField}
                                    onChange={(e) => setBoostSelectorField(e.target.value)}
                                    className="w-full px-3 py-2 border border-violet-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                >
                                    <option value="">Select a column...</option>
                                    {csvHeaders.map(header => (
                                        <option key={header} value={header}>{header}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-violet-800 mb-2">
                                    How should we match courses?
                                </label>

                                <div className="space-y-2">
                                    <label className="flex items-start gap-3 p-3 bg-white rounded-lg border border-violet-200 cursor-pointer hover:border-violet-400">
                                        <input
                                            type="radio"
                                            name="csvMatchType"
                                            value="id"
                                            checked={boostSelectorMatchType === 'id'}
                                            onChange={() => setBoostSelectorMatchType('id')}
                                            className="mt-0.5"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-800">Match by Course ID</p>
                                            <p className="text-xs text-gray-500">
                                                Match exactly against boost metadata (recommended)
                                            </p>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-3 bg-white rounded-lg border border-violet-200 cursor-pointer hover:border-violet-400">
                                        <input
                                            type="radio"
                                            name="csvMatchType"
                                            value="name"
                                            checked={boostSelectorMatchType === 'name'}
                                            onChange={() => setBoostSelectorMatchType('name')}
                                            className="mt-0.5"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-800">Match by Course Name</p>
                                            <p className="text-xs text-gray-500">
                                                Find boost where name contains the course title
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {boostSelectorField && (
                                <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-emerald-800">
                                        Will use <code className="bg-emerald-100 px-1 rounded">{boostSelectorField}</code> column to 
                                        find the right course boost by {boostSelectorMatchType === 'id' ? 'exact ID match' : 'name matching'}.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Field Mapping - reuse same UI as webhook */}
                {csvHeaders.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                                <GitMerge className="w-5 h-5 text-cyan-600" />
                            </div>

                            <div>
                                <h3 className="font-semibold text-gray-800">
                                    {masterTemplates.length > 0 ? 'Map Issuance Columns' : 'Map Columns'}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {masterTemplates.length > 0 
                                        ? 'Map recipient data columns (course data is already baked in)'
                                        : 'Connect CSV columns to credential fields'}
                                </p>
                            </div>
                        </div>

                        {/* Current Mappings */}
                        {mappings.length > 0 && (
                            <div className="space-y-2">
                                {mappings.map((mapping, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg"
                                    >
                                        <code className="text-sm text-gray-700">{mapping.sourceField}</code>

                                        <ChevronRight className="w-4 h-4 text-gray-400" />

                                        <code className="text-sm text-emerald-700 font-medium">{mapping.targetField}</code>

                                        <button
                                            onClick={() => handleRemoveMapping(idx)}
                                            className="ml-auto p-1 text-gray-400 hover:text-red-500 rounded"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Instructions */}
                        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <Link2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <p className="text-xs text-blue-800">
                                <strong>How to map:</strong> Click a CSV column on the left, then click a credential field on the right to connect them.
                            </p>
                        </div>

                        {/* Two-column selection UI */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-2">
                                    CSV Columns
                                    {selectedSource && <span className="ml-2 text-cyan-600">→ Select target</span>}
                                </label>

                                <div className="space-y-1 max-h-56 overflow-y-auto border border-gray-200 rounded-lg p-2">
                                    {sourceFields
                                        .filter(f => !mappings.some(m => m.sourceField === f))
                                        .map(field => {
                                            const isSelected = selectedSource === field;
                                            return (
                                                <button
                                                    key={field}
                                                    onClick={() => handleSelectSource(field)}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${
                                                        isSelected
                                                            ? 'bg-cyan-500 text-white shadow-md'
                                                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                                    }`}
                                                >
                                                    <code className={isSelected ? 'text-white' : 'text-gray-700'}>{field}</code>
                                                </button>
                                            );
                                        })}

                                    {sourceFields.filter(f => !mappings.some(m => m.sourceField === f)).length === 0 && (
                                        <p className="text-xs text-gray-400 text-center py-2">All columns mapped</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-2">
                                    Credential Fields
                                    {selectedTarget && <span className="ml-2 text-cyan-600">← Select source</span>}
                                </label>

                                <div className="space-y-1 max-h-56 overflow-y-auto border border-gray-200 rounded-lg p-2">
                                    {targetFields
                                        .filter(f => !mappings.some(m => m.targetField === f))
                                        .map(field => {
                                            const isSelected = selectedTarget === field;
                                            return (
                                                <button
                                                    key={field}
                                                    onClick={() => handleSelectTarget(field)}
                                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${
                                                        isSelected
                                                            ? 'bg-emerald-500 text-white shadow-md'
                                                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                                                    }`}
                                                >
                                                    <code className={isSelected ? 'text-white' : 'text-emerald-700'}>{field}</code>
                                                </button>
                                            );
                                        })}

                                    {targetFields.filter(f => !mappings.some(m => m.targetField === f)).length === 0 && (
                                        <p className="text-xs text-gray-400 text-center py-2">All fields mapped</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Selection hint */}
                        {(selectedSource || selectedTarget) && (
                            <div className="flex items-center justify-center gap-2 p-2 bg-cyan-50 rounded-lg text-sm text-cyan-700">
                                {selectedSource && <code className="bg-cyan-500 text-white px-2 py-0.5 rounded">{selectedSource}</code>}
                                {selectedSource && selectedTarget && <ChevronRight className="w-4 h-4" />}
                                {selectedTarget && <code className="bg-emerald-500 text-white px-2 py-0.5 rounded">{selectedTarget}</code>}
                                {(selectedSource && !selectedTarget) && <span>Now select a credential field →</span>}
                                {(selectedTarget && !selectedSource) && <span>← Now select a CSV column</span>}
                            </div>
                        )}

                        {/* Unmapped warning */}
                        {targetFields.filter(f => !mappings.some(m => m.targetField === f)).length > 0 && mappings.length > 0 && (
                            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-800">
                                    {targetFields.filter(f => !mappings.some(m => m.targetField === f)).length} credential field(s) still need to be mapped.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Navigation */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    <button
                        onClick={handleSaveAndContinue}
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
            </div>
        );
    }

    // Webhook integration (default)
    return (
        <div className="space-y-6">
            {/* Webhook URL */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <GitMerge className="w-5 h-5 text-emerald-600" />
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-800">Your Webhook URL</h3>
                        <p className="text-sm text-gray-500">Configure this in your LMS settings</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl">
                    <code className="flex-1 text-sm text-gray-600 font-mono truncate">
                        {webhookUrl}
                    </code>

                    <button
                        onClick={handleCopyUrl}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        {copiedUrl ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Sample Payload / Simulate */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <FileJson className="w-5 h-5 text-blue-600" />
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-800">Capture Sample Event</h3>
                        <p className="text-sm text-gray-500">Send a test event from your LMS or simulate one</p>
                    </div>
                </div>

                {!samplePayload ? (
                    <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl text-center">
                        {isWaiting ? (
                            <div className="space-y-3">
                                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mx-auto" />
                                <p className="text-sm text-gray-600">Waiting for webhook event...</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-600">
                                    Send a test "course completed" event from your LMS, or click below to simulate one.
                                </p>

                                <button
                                    onClick={handleSimulateWebhook}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200 transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Simulate Test Event
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-emerald-600">
                            <Check className="w-4 h-4" />
                            Event captured successfully!
                        </div>

                        <div className="p-4 bg-gray-900 rounded-xl overflow-x-auto">
                            <pre className="text-xs text-gray-300">
                                {JSON.stringify(samplePayload, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>

            {/* Boost Selector for Master Templates */}
            {samplePayload && masterTemplates.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                            <FileStack className="w-5 h-5 text-violet-600" />
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-800">Course Boost Selection</h3>
                            <p className="text-sm text-gray-500">
                                You have {masterTemplates.reduce((sum, m) => sum + (m.childTemplates?.length || 0), 0)} course boosts. 
                                Specify which field identifies the course.
                            </p>
                        </div>
                    </div>

                    <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-violet-800 mb-2">
                                Which field identifies the course?
                            </label>

                            <select
                                value={boostSelectorField}
                                onChange={(e) => setBoostSelectorField(e.target.value)}
                                className="w-full px-3 py-2 border border-violet-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                            >
                                <option value="">Select a field...</option>
                                {sourceFields.map(field => (
                                    <option key={field} value={field}>{field}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-violet-800 mb-2">
                                How should we match courses?
                            </label>

                            <div className="space-y-2">
                                <label className="flex items-start gap-3 p-3 bg-white rounded-lg border border-violet-200 cursor-pointer hover:border-violet-400">
                                    <input
                                        type="radio"
                                        name="matchType"
                                        value="id"
                                        checked={boostSelectorMatchType === 'id'}
                                        onChange={() => setBoostSelectorMatchType('id')}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-800">Match by Course ID</p>
                                        <p className="text-xs text-gray-500">
                                            Store a unique ID in each boost and match exactly (recommended)
                                        </p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 p-3 bg-white rounded-lg border border-violet-200 cursor-pointer hover:border-violet-400">
                                    <input
                                        type="radio"
                                        name="matchType"
                                        value="name"
                                        checked={boostSelectorMatchType === 'name'}
                                        onChange={() => setBoostSelectorMatchType('name')}
                                        className="mt-0.5"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-800">Match by Course Name</p>
                                        <p className="text-xs text-gray-500">
                                            Find boost where name contains the course title (fallback)
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {boostSelectorField && (
                            <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-emerald-800">
                                    Will use <code className="bg-emerald-100 px-1 rounded">{boostSelectorField}</code> to 
                                    find the right course boost by {boostSelectorMatchType === 'id' ? 'exact ID match' : 'name matching'}.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Field Mapping */}
            {samplePayload && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                            <GitMerge className="w-5 h-5 text-cyan-600" />
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-800">Map Issuance Fields</h3>
                            <p className="text-sm text-gray-500">
                                {masterTemplates.length > 0 
                                    ? 'Map recipient data to credential fields (course data is already baked in)'
                                    : 'Connect your data to credential fields'}
                            </p>
                        </div>
                    </div>

                    {issuableTemplates.length > 1 && !masterTemplates.length && (
                        <select
                            value={selectedTemplate}
                            onChange={(e) => setSelectedTemplate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        >
                            {issuableTemplates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    )}

                    {/* Current Mappings */}
                    {mappings.length > 0 && (
                        <div className="space-y-2">
                            {mappings.map((mapping, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg"
                                >
                                    <code className="text-sm text-gray-700">{mapping.sourceField}</code>

                                    <ChevronRight className="w-4 h-4 text-gray-400" />

                                    <code className="text-sm text-emerald-700 font-medium">{mapping.targetField}</code>

                                    <button
                                        onClick={() => handleRemoveMapping(idx)}
                                        className="ml-auto p-1 text-gray-400 hover:text-red-500 rounded"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <Link2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <p className="text-xs text-blue-800">
                            <strong>How to map:</strong> Click a source field on the left, then click a target field on the right to connect them. 
                            You can select them in any order.
                        </p>
                    </div>

                    {/* Two-column selection UI */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">
                                Source Fields (Your Data)
                                {selectedSource && <span className="ml-2 text-cyan-600">→ Select target</span>}
                            </label>

                            <div className="space-y-1 max-h-56 overflow-y-auto border border-gray-200 rounded-lg p-2">
                                {sourceFields
                                    .filter(f => !mappings.some(m => m.sourceField === f))
                                    .map(field => {
                                        const isSelected = selectedSource === field;
                                        return (
                                            <button
                                                key={field}
                                                onClick={() => handleSelectSource(field)}
                                                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${
                                                    isSelected
                                                        ? 'bg-cyan-500 text-white shadow-md'
                                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                                }`}
                                            >
                                                <code className={isSelected ? 'text-white' : 'text-gray-700'}>{field}</code>
                                            </button>
                                        );
                                    })}

                                {sourceFields.filter(f => !mappings.some(m => m.sourceField === f)).length === 0 && (
                                    <p className="text-xs text-gray-400 text-center py-2">All source fields mapped</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">
                                Target Fields (Credential)
                                {selectedTarget && <span className="ml-2 text-cyan-600">← Select source</span>}
                            </label>

                            <div className="space-y-1 max-h-56 overflow-y-auto border border-gray-200 rounded-lg p-2">
                                {targetFields
                                    .filter(f => !mappings.some(m => m.targetField === f))
                                    .map(field => {
                                        const isSelected = selectedTarget === field;
                                        return (
                                            <button
                                                key={field}
                                                onClick={() => handleSelectTarget(field)}
                                                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${
                                                    isSelected
                                                        ? 'bg-emerald-500 text-white shadow-md'
                                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                                                }`}
                                            >
                                                <code className={isSelected ? 'text-white' : 'text-emerald-700'}>{field}</code>
                                            </button>
                                        );
                                    })}

                                {targetFields.filter(f => !mappings.some(m => m.targetField === f)).length === 0 && (
                                    <p className="text-xs text-gray-400 text-center py-2">All target fields mapped</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Selection hint */}
                    {(selectedSource || selectedTarget) && (
                        <div className="flex items-center justify-center gap-2 p-2 bg-cyan-50 rounded-lg text-sm text-cyan-700">
                            {selectedSource && <code className="bg-cyan-500 text-white px-2 py-0.5 rounded">{selectedSource}</code>}
                            {selectedSource && selectedTarget && <ChevronRight className="w-4 h-4" />}
                            {selectedTarget && <code className="bg-emerald-500 text-white px-2 py-0.5 rounded">{selectedTarget}</code>}
                            {(selectedSource && !selectedTarget) && <span>Now select a target field →</span>}
                            {(selectedTarget && !selectedSource) && <span>← Now select a source field</span>}
                        </div>
                    )}

                    {/* Unmapped warning */}
                    {targetFields.filter(f => !mappings.some(m => m.targetField === f)).length > 0 && mappings.length > 0 && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800">
                                {targetFields.filter(f => !mappings.some(m => m.targetField === f)).length} credential field(s) still need to be mapped.
                            </p>
                        </div>
                    )}

                    {/* Generated templateData Preview */}
                    {mappings.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                                <Code className="w-4 h-4 text-violet-600" />
                                <span className="text-sm font-medium text-gray-700">Generated templateData</span>
                            </div>

                            <p className="text-xs text-gray-500">
                                Based on your mappings, here's the <code className="bg-gray-100 px-1 rounded">templateData</code> object 
                                you'll pass when sending credentials:
                            </p>

                            <div className="p-4 bg-gray-900 rounded-xl overflow-x-auto">
                                <pre className="text-xs text-gray-300">
{`// In your webhook handler
const templateData = {
${(() => {
    const currentTemplate = templates.find(t => t.id === selectedTemplate);
    if (!currentTemplate?.fields) return '    // No fields defined';
    
    return currentTemplate.fields.map(field => {
        const varName = field.variableName || fieldNameToVariable(field.name);
        const mapping = mappings.find(m => m.targetField === field.name);
        
        if (mapping) {
            return `    ${varName}: payload.${mapping.sourceField},`;
        }
        return `    ${varName}: /* unmapped */,`;
    }).join('\n');
})()}
};

// Send with the unified API
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: payload.user.email, // or profile ID
    templateUri: '${templates.find(t => t.id === selectedTemplate)?.boostUri || 'your-boost-uri'}',
    templateData,
});`}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <button
                    onClick={handleSaveAndContinue}
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
        </div>
    );
};
