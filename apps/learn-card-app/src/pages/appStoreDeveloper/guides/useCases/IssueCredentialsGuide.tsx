import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    Key,
    Shield,
    ArrowRight,
    ArrowLeft,
    Check,
    Loader2,
    Plus,
    Copy,
    Trash2,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    Send,
} from 'lucide-react';

import { useWallet, useToast, ToastTypeEnum, useConfirmation } from 'learn-card-base';
import { networkStore } from 'learn-card-base/stores/NetworkStore';
import { LEARNCARD_NETWORK_API_URL } from 'learn-card-base/constants/Networks';
import { Clipboard } from '@capacitor/clipboard';

import { StepProgress, CodeOutputPanel, StatusIndicator, GoLiveStep } from '../shared';
import { useGuideState } from '../shared/useGuideState';
import { TemplateListManager } from '../../components/TemplateListManager';
import type { ManagedTemplate } from '../../dashboards/hooks/useTemplateDetails';
import type { GuideProps } from '../GuidePage';

type AuthGrant = {
    id: string;
    name: string;
    challenge: string;
    createdAt: string;
    status: 'revoked' | 'active';
    scope: string;
    description?: string;
};

const STEPS = [
    { id: 'api-token', title: 'Create API Token' },
    { id: 'signing-authority', title: 'Set Up Signing' },
    { id: 'create-templates', title: 'Create Templates' },
    { id: 'issue', title: 'Issue & Verify' },
    { id: 'go-live', title: 'Go Live' },
];

const SCOPE_OPTIONS = [
    { label: 'Full Access', value: '*:*', description: 'Complete access to all resources' },
    { label: 'Credentials Only', value: 'credential:* presentation:*', description: 'Issue and manage credentials' },
];

// Step 1: API Token
const ApiTokenStep: React.FC<{
    onComplete: () => void;
    onTokenCreated: (token: string) => void;
}> = ({ onComplete, onTokenCreated }) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const confirm = useConfirmation();

    const [authGrants, setAuthGrants] = useState<Partial<AuthGrant>[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newTokenName, setNewTokenName] = useState('');
    const [selectedScope, setSelectedScope] = useState('*:*');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const fetchAuthGrants = useCallback(async () => {
        try {
            const wallet = await initWallet();
            setLoading(true);
            const grants = await wallet.invoke.getAuthGrants();
            setAuthGrants(grants || []);
        } catch (err) {
            console.error('Failed to fetch auth grants:', err);
        } finally {
            setLoading(false);
        }
    }, [initWallet]);

    useEffect(() => {
        fetchAuthGrants();
    }, []);

    const createToken = async () => {
        if (!newTokenName.trim()) return;

        try {
            setCreating(true);
            const wallet = await initWallet();

            await wallet.invoke.addAuthGrant({
                name: newTokenName.trim(),
                description: 'Created from Integration Guide',
                scope: selectedScope,
            });

            presentToast('API Token created!', { hasDismissButton: true });
            setNewTokenName('');
            setShowCreateForm(false);
            fetchAuthGrants();
        } catch (err) {
            console.error('Failed to create token:', err);
            presentToast('Failed to create token', { type: ToastTypeEnum.Error, hasDismissButton: true });
        } finally {
            setCreating(false);
        }
    };

    const copyToken = async (id: string) => {
        try {
            const wallet = await initWallet();
            const token = await wallet.invoke.getAPITokenForAuthGrant(id);

            await Clipboard.write({ string: token });
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
            onTokenCreated(token);
            presentToast('Token copied!', { hasDismissButton: true });
        } catch (err) {
            console.error('Failed to copy token:', err);
            presentToast('Failed to copy token', { type: ToastTypeEnum.Error, hasDismissButton: true });
        }
    };

    const revokeToken = async (grant: Partial<AuthGrant>) => {
        const confirmed = await confirm({
            text: `Delete "${grant.name}"?`,
            onConfirm: async () => {},
            cancelButtonClassName: 'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px]',
            confirmButtonClassName: 'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
        });

        if (!confirmed) return;

        try {
            const wallet = await initWallet();

            if (grant.status === 'active') {
                await wallet.invoke.revokeAuthGrant(grant.id!);
            } else {
                await wallet.invoke.deleteAuthGrant(grant.id!);
            }

            presentToast('Token removed', { hasDismissButton: true });
            fetchAuthGrants();
        } catch (err) {
            console.error('Failed to remove token:', err);
        }
    };

    const activeGrants = authGrants.filter(g => g.status === 'active');
    const hasActiveToken = activeGrants.length > 0;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Create an API Token</h3>

                <p className="text-gray-600">
                    Your server needs an API token to authenticate with LearnCard. This token should be kept secret
                    and never exposed in client-side code.
                </p>
            </div>

            {/* Status */}
            <StatusIndicator
                status={loading ? 'loading' : hasActiveToken ? 'ready' : 'warning'}
                label={loading ? 'Checking...' : hasActiveToken ? `${activeGrants.length} token${activeGrants.length > 1 ? 's' : ''} ready` : 'No API tokens found'}
                description={hasActiveToken ? 'Copy a token to use in your code' : 'Create one to continue'}
            />

            {/* Create form */}
            {showCreateForm && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Token Name</label>

                        <input
                            type="text"
                            value={newTokenName}
                            onChange={(e) => setNewTokenName(e.target.value)}
                            placeholder="e.g., Production Server"
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>

                        <select
                            value={selectedScope}
                            onChange={(e) => setSelectedScope(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {SCOPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>

                        <p className="text-xs text-gray-500 mt-1">
                            {SCOPE_OPTIONS.find(o => o.value === selectedScope)?.description}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={createToken}
                            disabled={creating || !newTokenName.trim()}
                            className="flex-1 px-4 py-2.5 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                        >
                            {creating ? 'Creating...' : 'Create Token'}
                        </button>

                        <button
                            onClick={() => { setShowCreateForm(false); setNewTokenName(''); }}
                            className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Token list */}
            {!loading && activeGrants.length > 0 && (
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                    {activeGrants.map((grant) => (
                        <div key={grant.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800">{grant.name}</p>

                                <p className="text-sm text-gray-500">
                                    Created {new Date(grant.createdAt!).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => copyToken(grant.id!)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-cyan-50 text-cyan-700 hover:bg-cyan-100 rounded-lg transition-colors"
                                >
                                    {copiedId === grant.id ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                    Copy
                                </button>

                                <button
                                    onClick={() => revokeToken(grant)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create button */}
            {!showCreateForm && (
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 rounded-xl w-full justify-center font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Create New Token
                </button>
            )}

            {/* Security warning */}
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800">
                    <strong>Security:</strong> Never expose your API token in client-side code or commit it to version control.
                </p>
            </div>

            {/* Continue button */}
            <button
                onClick={onComplete}
                disabled={!hasActiveToken}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Continue
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );
};

// Step 2: Signing Authority
const SigningAuthorityStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
}> = ({ onComplete, onBack }) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [primarySA, setPrimarySA] = useState<{ name: string; endpoint: string } | null>(null);

    const fetchSigningAuthority = useCallback(async () => {
        try {
            setLoading(true);
            const wallet = await initWallet();
            const primary = await wallet.invoke.getPrimaryRegisteredSigningAuthority();

            if (primary?.relationship) {
                setPrimarySA({
                    name: primary.relationship.name,
                    endpoint: primary.signingAuthority?.endpoint ?? '',
                });
            } else {
                setPrimarySA(null);
            }
        } catch (err) {
            console.error('Failed to fetch signing authority:', err);
            setPrimarySA(null);
        } finally {
            setLoading(false);
        }
    }, [initWallet]);

    useEffect(() => {
        fetchSigningAuthority();
    }, []);

    const createOrReplaceSigningAuthority = async () => {
        try {
            setCreating(true);
            const wallet = await initWallet();

            const saName = `sa-${Date.now().toString(36)}`;
            const authority = await wallet.invoke.createSigningAuthority(saName);

            if (!authority) {
                throw new Error('Failed to create signing authority');
            }

            await wallet.invoke.registerSigningAuthority(
                authority.endpoint!,
                authority.name,
                authority.did!
            );

            await wallet.invoke.setPrimaryRegisteredSigningAuthority(
                authority.endpoint!,
                authority.name
            );

            presentToast('Signing authority created!', { hasDismissButton: true });
            fetchSigningAuthority();
        } catch (err) {
            console.error('Failed to create signing authority:', err);
            presentToast('Failed to create signing authority', { type: ToastTypeEnum.Error, hasDismissButton: true });
        } finally {
            setCreating(false);
        }
    };

    const hasSigningAuthority = primarySA !== null;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Set Up Signing Authority</h3>

                <p className="text-gray-600">
                    A signing authority cryptographically signs your credentials, making them verifiable.
                    This proves the credentials actually came from you.
                </p>
            </div>

            {/* Status */}
            <StatusIndicator
                status={loading ? 'loading' : hasSigningAuthority ? 'ready' : 'warning'}
                label={loading ? 'Checking...' : hasSigningAuthority ? 'Signing authority configured' : 'No signing authority found'}
                description={hasSigningAuthority ? `Using: ${primarySA?.name}` : 'Create one to sign credentials'}
            />

            {/* Create button if no SA exists */}
            {!loading && !hasSigningAuthority && (
                <button
                    onClick={createOrReplaceSigningAuthority}
                    disabled={creating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                    {creating ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        <>
                            <Shield className="w-4 h-4" />
                            Create Signing Authority
                        </>
                    )}
                </button>
            )}

            {/* Recreate button if SA exists but may be stale */}
            {!loading && hasSigningAuthority && (
                <button
                    onClick={createOrReplaceSigningAuthority}
                    disabled={creating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                    {creating ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Recreating...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="w-4 h-4" />
                            Recreate Signing Authority
                        </>
                    )}
                </button>
            )}

            {/* Info about what it does */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-medium text-blue-800 mb-2">What does this do?</h4>

                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Creates a cryptographic key pair for signing</li>
                    <li>• Registers the key with LearnCard's verification network</li>
                    <li>• Allows anyone to verify credentials you issue</li>
                </ul>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <button
                    onClick={onComplete}
                    disabled={!hasSigningAuthority}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// Step 3: Create Templates
const CreateTemplatesStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
    integrationId?: string;
    onTemplatesChange: (templates: ManagedTemplate[]) => void;
}> = ({ onComplete, onBack, integrationId, onTemplatesChange }) => {
    const [hasTemplates, setHasTemplates] = useState(false);
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Create Templates</h3>

                <p className="text-gray-600">
                    Design your credential templates using the visual builder. Each template becomes a reusable
                    Boost that you can reference by URI when issuing credentials via API.
                </p>
            </div>

            <TemplateListManager
                integrationId={integrationId}
                featureType="issue-credentials"
                showCodeSnippets={false}
                editable={true}
                onTemplateChange={(templates) => {
                    setHasTemplates(templates.length > 0);
                    onTemplatesChange(templates);
                }}
                onBuilderOpenChange={setIsBuilderOpen}
            />

            {/* Navigation */}
            <div className="space-y-2">
                <div className="flex gap-3">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    <button
                        onClick={onComplete}
                        disabled={!hasTemplates || isBuilderOpen}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Continue
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {isBuilderOpen && (
                    <p className="text-xs text-amber-600 text-center">
                        Save or cancel the template you&apos;re editing before continuing.
                    </p>
                )}
            </div>
        </div>
    );
};

// Step 4: Issue & Verify
const IssueVerifyStep: React.FC<{
    templates: ManagedTemplate[];
    apiToken: string;
    onTokenChange: (token: string) => void;
    onBack: () => void;
    onComplete: () => void;
    integrationId?: string;
    isActive?: boolean;
}> = ({ templates, apiToken, onTokenChange, onBack, onComplete, integrationId, isActive }) => {
    const [selectedTemplateUri, setSelectedTemplateUri] = useState<string>(
        templates[0]?.boostUri || ''
    );
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState('');

    // API Token selector state
    const [authGrants, setAuthGrants] = useState<Partial<AuthGrant>[]>([]);
    const [loadingGrants, setLoadingGrants] = useState(false);
    const [selectedGrantId, setSelectedGrantId] = useState<string | null>(null);
    const [showTokenSelector, setShowTokenSelector] = useState(false);

    const { initWallet } = useWallet();

    // Verification polling state
    const [isPolling, setIsPolling] = useState(false);
    const [pollResult, setPollResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);
    const pollIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const initialTimestampRef = useRef<string | null>(null);

    // Fetch auth grants on mount and when step becomes active
    useEffect(() => {
        if (isActive === false) return;
        const fetchData = async () => {
            setLoadingGrants(true);
            try {
                const wallet = await initWallet();
                const grants = await wallet.invoke.getAuthGrants() || [];
                const activeGrants = grants.filter((g: Partial<AuthGrant>) => g.status === 'active');
                setAuthGrants(activeGrants);
            } catch (err) {
                console.error('Failed to fetch grants:', err);
            } finally {
                setLoadingGrants(false);
            }
        };
        fetchData();
    }, [isActive]);

    // Capture initial activity timestamp on mount (before user runs code)
    useEffect(() => {
        const captureInitialTimestamp = async () => {
            try {
                const wallet = await initWallet();
                const activities = await wallet.invoke.getMyActivities?.({
                    limit: 1,
                    integrationId,
                });
                initialTimestampRef.current = activities?.records?.[0]?.timestamp || null;
            } catch (err) {
                console.error('Failed to capture initial timestamp:', err);
            }
        };
        captureInitialTimestamp();
    }, [initWallet, integrationId]);

    // Select a token
    const selectToken = async (grantId: string) => {
        try {
            const wallet = await initWallet();
            const token = await wallet.invoke.getAPITokenForAuthGrant(grantId);
            onTokenChange(token);
            setSelectedGrantId(grantId);
            setShowTokenSelector(false);
        } catch (err) {
            console.error('Failed to get token:', err);
        }
    };

    const selectedTemplate = templates.find(t => t.boostUri === selectedTemplateUri) || templates[0];

    // Get the current network URL
    const networkUrl = LCN_API_URL || networkStore.get.networkUrl() || LEARNCARD_NETWORK_API_URL;

    // Get selected grant name for display
    const selectedGrant = authGrants.find(g => g.id === selectedGrantId);
    const displayTokenName = selectedGrant?.name || (apiToken ? 'Selected Token' : 'No token selected');

    const templateUri = selectedTemplate?.boostUri || 'YOUR_TEMPLATE_URI';
    const templateName = selectedTemplate?.name || 'Credential';

    // Poll for sent credentials using credential activity API
    const startPolling = useCallback(async () => {
        setIsPolling(true);
        setPollResult(null);

        try {
            const wallet = await initWallet();
            const initialTimestamp = initialTimestampRef.current;

            let attempts = 0;
            const maxAttempts = 40;

            const poll = async () => {
                if (attempts >= maxAttempts) {
                    stopPolling();
                    setPollResult({
                        success: false,
                        message: 'No new credentials detected. Make sure you ran your code.',
                    });
                    return;
                }

                attempts++;

                const currentActivities = await wallet.invoke.getMyActivities?.({
                    limit: 1,
                    integrationId,
                });

                const latestTimestamp = currentActivities?.records?.[0]?.timestamp;
                const latestEvent = currentActivities?.records?.[0];

                if (latestTimestamp && latestTimestamp !== initialTimestamp) {
                    stopPolling();

                    const eventType = latestEvent?.eventType;
                    const recipientType = latestEvent?.recipientType;

                    if (eventType === 'FAILED') {
                        const errorMsg = latestEvent?.metadata?.error || 'Unknown error';
                        setPollResult({
                            success: false,
                            message: `Credential send failed: ${errorMsg}`,
                        });
                    } else {
                        const message = recipientType === 'profile'
                            ? 'Credential sent successfully to profile!'
                            : 'Credential sent successfully to email/phone recipient!';
                        setPollResult({ success: true, message });
                    }
                    return;
                }

                pollIntervalRef.current = setTimeout(poll, 3000);
            };

            poll();
        } catch (err) {
            console.error('Polling error:', err);
            stopPolling();
            setPollResult({ success: false, message: 'Failed to check credentials. Please try again.' });
        }
    }, [initWallet, integrationId]);

    const stopPolling = useCallback(() => {
        if (pollIntervalRef.current) {
            clearTimeout(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        setIsPolling(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearTimeout(pollIntervalRef.current);
            }
        };
    }, []);

    // Code snippets using templateUri
    const codeSnippet = `// Install: npm install @learncard/init

import { initLearnCard } from '@learncard/init';

// Your API token from Step 1
const API_TOKEN = '${apiToken || 'YOUR_API_TOKEN'}';

// Initialize LearnCard with your API token
const learnCard = await initLearnCard({ network: true, apiKey: API_TOKEN });

// Send credential using your template
const result = await learnCard.invoke.send({
    type: 'boost',
    templateUri: '${templateUri}',
    recipient: '${recipientEmail || 'recipient@example.com'}',
    integrationId: '${integrationId || 'YOUR_INTEGRATION_ID'}',
});

console.log('Credential URI:', result.credentialUri);
// For email/phone: result.inbox?.issuanceId, result.inbox?.status

// Verify your credential was sent:
const sent = await learnCard.invoke.getMySentInboxCredentials();
console.log('Sent credentials:', sent.records);`;

    const pythonSnippet = `# Install: pip install requests

import requests
import json

# Your API token from Step 1
API_TOKEN = "${apiToken || 'YOUR_API_TOKEN'}"

# API endpoint for unified send
API_URL = "${networkUrl}/send"

# Build the request payload using your template URI
payload = {
    "type": "boost",
    "templateUri": "${templateUri}",
    "recipient": "${recipientEmail || 'recipient@example.com'}",
    "integrationId": "${integrationId || 'YOUR_INTEGRATION_ID'}"
}

# Send credential using unified send API
response = requests.post(
    API_URL,
    headers={
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    },
    json=payload
)

if response.ok:
    data = response.json()
    print("Credential sent!")
    print(f"Credential URI: {data.get('credentialUri', 'N/A')}")
    inbox = data.get('inbox', {})
    if inbox:
        print(f"Issuance ID: {inbox.get('issuanceId', 'N/A')}")
        print(f"Status: {inbox.get('status', 'N/A')}")
else:
    print(f"Error: {response.status_code} - {response.text}")`;

    const curlSnippet = `curl -X POST ${networkUrl}/send \\
  -H "Authorization: Bearer ${apiToken || 'YOUR_API_TOKEN'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "boost",
    "templateUri": "${templateUri}",
    "recipient": "${recipientEmail || 'recipient@example.com'}",
    "integrationId": "${integrationId || 'YOUR_INTEGRATION_ID'}"
  }'`;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Issue & Verify</h3>

                <p className="text-gray-600">
                    Use your template to issue credentials via API. Select a template and recipient,
                    then run the generated code in your application.
                </p>
            </div>

            {/* Template Selector */}
            {templates.length > 0 && (
                <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                                <Send className="w-5 h-5 text-cyan-600" />
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-700">Credential Template</p>

                                <p className="text-xs text-cyan-700 font-medium">
                                    {selectedTemplate?.name || 'Untitled Template'}
                                </p>
                            </div>
                        </div>

                        {templates.length > 1 && (
                            <button
                                onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                                className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
                            >
                                {showTemplateSelector ? 'Hide' : 'Change'}
                                {showTemplateSelector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                        )}
                    </div>

                    {selectedTemplate && (
                        <p className="text-xs text-gray-500 mt-2 font-mono truncate">
                            URI: {selectedTemplate.boostUri}
                        </p>
                    )}

                    {showTemplateSelector && templates.length > 1 && (
                        <div className="mt-3 pt-3 border-t border-cyan-200 space-y-2">
                            {templates.map((template) => (
                                <button
                                    key={template.boostUri}
                                    onClick={() => {
                                        setSelectedTemplateUri(template.boostUri);
                                        setShowTemplateSelector(false);
                                    }}
                                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                        selectedTemplateUri === template.boostUri
                                            ? 'bg-cyan-100 border-cyan-300'
                                            : 'bg-white border-gray-200 hover:border-cyan-300'
                                    }`}
                                >
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-gray-700">
                                            {template.name || 'Untitled Template'}
                                        </p>

                                        <p className="text-xs text-gray-500 font-mono truncate max-w-xs">
                                            {template.boostUri}
                                        </p>
                                    </div>

                                    {selectedTemplateUri === template.boostUri && (
                                        <CheckCircle2 className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {templates.length === 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <p className="text-sm text-amber-800">
                            No templates found. <button onClick={onBack} className="text-cyan-600 hover:underline font-medium">Go back to create one</button>.
                        </p>
                    </div>
                </div>
            )}

            {/* API Token Selector */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Key className="w-5 h-5 text-indigo-600" />
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-700">API Token</p>

                            <p className="text-xs text-gray-500">
                                {apiToken ? (
                                    <span className="text-emerald-600 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        {displayTokenName}
                                    </span>
                                ) : (
                                    <span className="text-amber-600">Select a token to use</span>
                                )}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowTokenSelector(!showTokenSelector)}
                        className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
                    >
                        {showTokenSelector ? 'Hide' : 'Change'}
                        {showTokenSelector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>

                {showTokenSelector && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        {loadingGrants ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading tokens...
                            </div>
                        ) : authGrants.length === 0 ? (
                            <p className="text-sm text-gray-500">
                                No API tokens found. <button onClick={onBack} className="text-cyan-600 hover:underline">Go back to create one</button>.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {authGrants.map((grant) => (
                                    <button
                                        key={grant.id}
                                        onClick={() => selectToken(grant.id!)}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                            selectedGrantId === grant.id
                                                ? 'bg-indigo-50 border-indigo-300'
                                                : 'bg-white border-gray-200 hover:border-indigo-300'
                                        }`}
                                    >
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-gray-700">{grant.name}</p>

                                            <p className="text-xs text-gray-500">
                                                Created {new Date(grant.createdAt!).toLocaleDateString()}
                                            </p>
                                        </div>

                                        {selectedGrantId === grant.id && (
                                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Recipient email */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient
                    <span className="text-gray-400 font-normal"> (email, DID, or profile ID)</span>
                </label>

                <input
                    type="text"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="recipient@example.com"
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    style={{ colorScheme: 'light' }}
                />

                <p className="text-xs text-gray-500 mt-1">
                    Enter a recipient to see the send code. Supports email, DID, phone, or profile ID.
                </p>
            </div>

            {/* Code output */}
            <CodeOutputPanel
                title="Your Code"
                snippets={{
                    typescript: codeSnippet,
                    python: pythonSnippet,
                    curl: curlSnippet,
                }}
            />

            {/* Verification Polling Section */}
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Send className="w-5 h-5 text-indigo-600" />
                    </div>

                    <div className="flex-1">
                        <h4 className="font-medium text-gray-800 mb-1">Check for Sent Credentials</h4>

                        <p className="text-sm text-gray-600 mb-3">
                            After running your code, click below to check if the credential was sent successfully.
                        </p>

                        {!isPolling && !pollResult && (
                            <button
                                onClick={startPolling}
                                disabled={!apiToken}
                                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Check for Sent Credentials
                            </button>
                        )}

                        {isPolling && (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 text-indigo-600">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-sm font-medium">Checking for new credentials...</span>
                                </div>

                                <button
                                    onClick={stopPolling}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        {pollResult && (
                            <div className={`flex items-start gap-2 p-3 rounded-lg ${
                                pollResult.success
                                    ? 'bg-emerald-50 border border-emerald-200'
                                    : 'bg-red-50 border border-red-200'
                            }`}>
                                {pollResult.success ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                )}

                                <div>
                                    <p className={`text-sm font-medium ${
                                        pollResult.success ? 'text-emerald-800' : 'text-red-800'
                                    }`}>
                                        {pollResult.message}
                                    </p>

                                    {!pollResult.success && (
                                        <button
                                            onClick={startPolling}
                                            className="text-sm text-indigo-600 hover:underline mt-1"
                                        >
                                            Try again
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {!apiToken && (
                            <p className="text-xs text-amber-600 mt-2">
                                ⚠️ Select an API token above to enable verification.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <button
                    onClick={onComplete}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                >
                    Continue to Go Live
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// Config persisted via guideState so it survives page reloads
interface IssueCredentialsConfig {
    apiTokenGrantId?: string;
    templateUris?: string[];
}

// Main component
const IssueCredentialsGuide: React.FC<GuideProps> = ({ selectedIntegration }) => {
    const guideState = useGuideState('issue-credentials', STEPS.length, selectedIntegration);

    // Restore persisted config on mount
    const savedConfig = guideState.getConfig<IssueCredentialsConfig>('issueCredentialsConfig');

    const [apiToken, setApiToken] = useState(savedConfig?.apiTokenGrantId ?? '');
    const [templates, setTemplates] = useState<ManagedTemplate[]>([]);

    // Persist API token when it changes
    const savedConfigRef = useRef(savedConfig);
    savedConfigRef.current = savedConfig;

    useEffect(() => {
        if (apiToken) {
            guideState.updateConfig('issueCredentialsConfig', {
                ...savedConfigRef.current,
                apiTokenGrantId: apiToken,
            });
        }
    }, [apiToken]);

    // Persist template URIs when templates change
    useEffect(() => {
        const uris = templates.map(t => t.boostUri).filter(Boolean) as string[];
        if (uris.length > 0) {
            guideState.updateConfig('issueCredentialsConfig', {
                ...savedConfigRef.current,
                templateUris: uris,
            });
        }
    }, [templates]);

    // Allow navigating to current step, any completed step, or any earlier step.
    // Forward navigation requires all previous steps to be complete.
    const canNavigateToStep = useCallback((index: number) => {
        if (index === guideState.currentStep) return true;
        if (index < guideState.currentStep) return true;
        if (guideState.isStepComplete(STEPS[index].id)) return true;
        for (let i = 0; i < index; i++) {
            if (!guideState.isStepComplete(STEPS[i].id)) return false;
        }
        return true;
    }, [guideState.currentStep, guideState.isStepComplete]);

    if (!selectedIntegration) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Please select an integration from the header dropdown to continue.</p>
            </div>
        );
    }

    const handleStepComplete = (stepId: string) => {
        guideState.markStepComplete(stepId);
        guideState.nextStep();
    };

    return (
        <div className="max-w-3xl mx-auto py-4">
            {/* Progress */}
            <div className="mb-8">
                <StepProgress
                    currentStep={guideState.currentStep}
                    totalSteps={STEPS.length}
                    steps={STEPS}
                    completedSteps={guideState.state.completedSteps}
                    onStepClick={guideState.goToStep}
                    isStepNavigable={canNavigateToStep}
                />
            </div>

            {/* All steps rendered but only active one visible — prevents re-mount/re-fetch lag */}
            <div style={{ display: guideState.currentStep === 0 ? 'block' : 'none' }}>
                <ApiTokenStep
                    onComplete={() => handleStepComplete('api-token')}
                    onTokenCreated={setApiToken}
                />
            </div>
            <div style={{ display: guideState.currentStep === 1 ? 'block' : 'none' }}>
                <SigningAuthorityStep
                    onComplete={() => handleStepComplete('signing-authority')}
                    onBack={guideState.prevStep}
                />
            </div>
            <div style={{ display: guideState.currentStep === 2 ? 'block' : 'none' }}>
                <CreateTemplatesStep
                    onComplete={() => handleStepComplete('create-templates')}
                    onBack={guideState.prevStep}
                    integrationId={selectedIntegration?.id}
                    onTemplatesChange={setTemplates}
                />
            </div>
            <div style={{ display: guideState.currentStep === 3 ? 'block' : 'none' }}>
                <IssueVerifyStep
                    templates={templates}
                    apiToken={apiToken}
                    onTokenChange={setApiToken}
                    onBack={guideState.prevStep}
                    onComplete={() => handleStepComplete('issue')}
                    integrationId={selectedIntegration?.id}
                    isActive={guideState.currentStep === 3}
                />
            </div>
            <div style={{ display: guideState.currentStep === 4 ? 'block' : 'none' }}>
                <GoLiveStep
                    integration={selectedIntegration}
                    guideType="issue-credentials"
                    onBack={guideState.prevStep}
                    completedItems={[
                        'Created API token for server-side access',
                        'Configured signing authority',
                        'Created credential templates',
                        'Tested issuing and verification',
                    ]}
                    title="Ready to Issue Credentials!"
                    description="You've set up everything needed to issue verifiable credentials via API. Activate your integration to start issuing in production."
                />
            </div>
        </div>
    );
};

export default IssueCredentialsGuide;
