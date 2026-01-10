import React, { useState, useMemo } from 'react';
import {
    Copy,
    Check,
    Code,
    Webhook,
    FileSpreadsheet,
    Zap,
    Key,
    RefreshCw,
    Eye,
    EyeOff,
    ChevronDown,
    ChevronUp,
    Award,
    AlertCircle,
} from 'lucide-react';

import { Clipboard } from '@capacitor/clipboard';

import { CredentialTemplate, IntegrationMethod, DataMappingConfig, PartnerProject } from '../types';
import { CodeBlock } from '../../components/CodeBlock';

interface IntegrationSectionProps {
    project: PartnerProject;
    templates: CredentialTemplate[];
    integrationMethod: IntegrationMethod | null;
    dataMapping: DataMappingConfig | null;
    onUpdate: (method: IntegrationMethod, mapping: DataMappingConfig) => void;
}

export const IntegrationSection: React.FC<IntegrationSectionProps> = ({
    project,
    templates,
    integrationMethod,
    dataMapping,
}) => {
    const [selectedMethod, setSelectedMethod] = useState<IntegrationMethod>(integrationMethod || 'api');
    const [selectedTemplate, setSelectedTemplate] = useState<string>(templates[0]?.id || '');
    const [showApiKey, setShowApiKey] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [expandedSection, setExpandedSection] = useState<string | null>('code');

    const currentTemplate = templates.find(t => t.id === selectedTemplate);

    const handleCopy = async (text: string, field: string) => {
        await Clipboard.write({ string: text });
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const apiCodeSnippet = useMemo(() => {
        const boostUri = currentTemplate?.boostUri || 'urn:lc:boost:your_template_id';
        const templateName = currentTemplate?.name || 'Course Completion';

        return `import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard({ 
    seed: process.env.LEARNCARD_SEED,
    network: true 
});

// Send credential - works with profile ID, DID, email, or phone
// The recipient type is auto-detected
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: 'recipient@example.com', // or profile ID, DID, phone
    templateUri: '${boostUri}',
    templateData: {
        // Your dynamic template fields here
        recipientName: 'John Doe',
    },
    options: {
        // Branding options (for email/phone recipients)
        branding: {
            issuerName: 'Your Organization',
            recipientName: 'John Doe',
        },
    },
});

console.log('Credential URI:', result.credentialUri);
// For email/phone: result.inbox?.issuanceId, result.inbox?.status`;
    }, [currentTemplate]);

    const webhookPayloadExample = useMemo(() => {
        const fields: Record<string, string> = {};
        currentTemplate?.fields.forEach(field => {
            const key = field.name.toLowerCase().replace(/\s+/g, '_');
            switch (field.type) {
                case 'date':
                    fields[key] = '2024-01-15';
                    break;
                case 'number':
                    fields[key] = '100';
                    break;
                case 'email':
                    fields[key] = 'user@example.com';
                    break;
                case 'url':
                    fields[key] = 'https://example.com';
                    break;
                default:
                    fields[key] = `Example ${field.name}`;
            }
        });

        return JSON.stringify({
            event: 'course.completed',
            user: {
                email: 'student@example.com',
                name: 'John Doe',
            },
            data: fields,
            timestamp: new Date().toISOString(),
        }, null, 2);
    }, [currentTemplate]);

    const methods = [
        {
            id: 'api' as IntegrationMethod,
            label: 'API / SDK',
            description: 'Full programmatic control',
            icon: Zap,
            color: 'bg-violet-100 text-violet-600',
        },
        {
            id: 'webhook' as IntegrationMethod,
            label: 'Webhook',
            description: 'Event-driven issuance',
            icon: Webhook,
            color: 'bg-emerald-100 text-emerald-600',
        },
        {
            id: 'csv' as IntegrationMethod,
            label: 'CSV Upload',
            description: 'Bulk import',
            icon: FileSpreadsheet,
            color: 'bg-amber-100 text-amber-600',
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Integration Settings</h2>
                <p className="text-sm text-gray-500">Configure how you issue credentials from your application</p>
            </div>

            {/* API Credentials */}
            <div className="space-y-4">
                <button
                    onClick={() => setExpandedSection(expandedSection === 'credentials' ? null : 'credentials')}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Key className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="text-left">
                            <p className="font-medium text-gray-800">API Credentials</p>
                            <p className="text-sm text-gray-500">Your project ID and API key</p>
                        </div>
                    </div>
                    {expandedSection === 'credentials' ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                </button>

                {expandedSection === 'credentials' && (
                    <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Project ID</label>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-700 overflow-x-auto">
                                    {project.id}
                                </code>
                                <button
                                    onClick={() => handleCopy(project.id, 'projectId')}
                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    {copiedField === 'projectId' ? (
                                        <Check className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {project.apiKey && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                                <div className="flex items-center gap-2">
                                    <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-700 overflow-x-auto">
                                        {showApiKey ? project.apiKey : '••••••••••••••••••••••••'}
                                    </code>
                                    <button
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => handleCopy(project.apiKey!, 'apiKey')}
                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        {copiedField === 'apiKey' ? (
                                            <Check className="w-4 h-4 text-emerald-500" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800">
                                Keep your API key secure. Never expose it in client-side code or public repositories.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Integration Method Selection */}
            <div className="space-y-4">
                <h3 className="font-medium text-gray-700">Integration Method</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {methods.map(method => (
                        <button
                            key={method.id}
                            onClick={() => setSelectedMethod(method.id)}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                                selectedMethod === method.id
                                    ? 'border-cyan-500 bg-cyan-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${method.color}`}>
                                <method.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-800">{method.label}</p>
                                <p className="text-xs text-gray-500">{method.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Template Selection */}
            {templates.length > 1 && (
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Select Template</label>
                    <div className="flex flex-wrap gap-2">
                        {templates.map(template => (
                            <button
                                key={template.id}
                                onClick={() => setSelectedTemplate(template.id)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                                    selectedTemplate === template.id
                                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <Award className="w-4 h-4" />
                                {template.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Code Snippets */}
            <div className="space-y-4">
                <button
                    onClick={() => setExpandedSection(expandedSection === 'code' ? null : 'code')}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                            <Code className="w-5 h-5 text-cyan-600" />
                        </div>
                        <div className="text-left">
                            <p className="font-medium text-gray-800">Integration Code</p>
                            <p className="text-sm text-gray-500">Copy-paste code for your application</p>
                        </div>
                    </div>
                    {expandedSection === 'code' ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                </button>

                {expandedSection === 'code' && (
                    <div className="space-y-4">
                        {selectedMethod === 'api' && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">TypeScript / JavaScript</span>
                                    <button
                                        onClick={() => handleCopy(apiCodeSnippet, 'code')}
                                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                    >
                                        {copiedField === 'code' ? (
                                            <>
                                                <Check className="w-3 h-3 text-emerald-500" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3 h-3" />
                                                Copy
                                            </>
                                        )}
                                    </button>
                                </div>
                                <CodeBlock code={apiCodeSnippet} />
                            </div>
                        )}

                        {selectedMethod === 'webhook' && (
                            <div className="space-y-4">
                                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                    <h4 className="font-medium text-emerald-800 mb-2">Webhook Endpoint</h4>
                                    <p className="text-sm text-emerald-700 mb-3">
                                        Send POST requests to your webhook URL when events occur in your system.
                                    </p>
                                    <code className="block px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm font-mono text-gray-700">
                                        {dataMapping?.webhookUrl || 'https://api.learncard.com/webhooks/your-endpoint'}
                                    </code>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-sm font-medium text-gray-700">Example Payload</span>
                                    <CodeBlock code={webhookPayloadExample} />
                                </div>
                            </div>
                        )}

                        {selectedMethod === 'csv' && (
                            <div className="space-y-4">
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                    <h4 className="font-medium text-amber-800 mb-2">CSV Upload</h4>
                                    <p className="text-sm text-amber-700">
                                        Upload a CSV file with recipient data to issue credentials in bulk.
                                        Your CSV should include columns that match your template fields.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <span className="text-sm font-medium text-gray-700">Required Columns</span>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <code className="text-sm text-gray-700">
                                            {currentTemplate?.fields.map(f => 
                                                f.name.toLowerCase().replace(/\s+/g, '_')
                                            ).join(', ') || 'recipient_email, recipient_name, issue_date'}
                                        </code>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Field Mappings (for webhook) */}
            {selectedMethod === 'webhook' && dataMapping?.mappings && dataMapping.mappings.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-medium text-gray-700">Field Mappings</h3>

                    <div className="space-y-2">
                        {dataMapping.mappings.map((mapping, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <code className="text-sm text-gray-600">{mapping.sourceField}</code>
                                <span className="text-gray-400">→</span>
                                <code className="text-sm text-emerald-600 font-medium">{mapping.targetField}</code>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
