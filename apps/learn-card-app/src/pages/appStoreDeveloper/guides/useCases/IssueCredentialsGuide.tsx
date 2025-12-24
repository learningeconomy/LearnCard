import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { 
    Key, 
    Shield, 
    FileCode, 
    Rocket, 
    ArrowRight, 
    ArrowLeft, 
    Check, 
    Loader2,
    Plus,
    Copy,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Award,
    Sparkles,
    Eye,
    ChevronDown,
    ChevronUp,
    Building2,
    Link as LinkIcon,
    BellOff,
    Webhook,
    RefreshCw,
    Send,
    Clock,
    Upload,
} from 'lucide-react';

import { useWallet, useToast, ToastTypeEnum, useConfirmation, useFilestack } from 'learn-card-base';
import { networkStore } from 'learn-card-base/stores/NetworkStore';
import { LEARNCARD_NETWORK_API_URL } from 'learn-card-base/constants/Networks';
import { Clipboard } from '@capacitor/clipboard';

import { StepProgress, CodeOutputPanel, StatusIndicator } from '../shared';
import { useGuideState } from '../shared/useGuideState';
import { OBv3CredentialBuilder } from '../../../../components/credentials/OBv3CredentialBuilder';

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
    { id: 'build-credential', title: 'Build Credential' },
    { id: 'issue', title: 'Issue & Verify' },
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

    const createSigningAuthority = async () => {
        try {
            setCreating(true);
            const wallet = await initWallet();

            const authority = await wallet.invoke.createSigningAuthority('default-sa');

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

            {/* Create button if needed */}
            {!loading && !hasSigningAuthority && (
                <button
                    onClick={createSigningAuthority}
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

// Advanced options type
interface AdvancedOptions {
    issuerName: string;
    issuerLogoUrl: string;
    recipientName: string;
    suppressDelivery: boolean;
    webhookUrl: string;
}

// Step 3: Build Credential
const BuildCredentialStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
    apiToken: string;
    onTokenChange: (token: string) => void;
}> = ({ onComplete, onBack, apiToken, onTokenChange }) => {
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState('');
    const [userDid, setUserDid] = useState<string>('');

    // API Token selector state
    const [authGrants, setAuthGrants] = useState<Partial<AuthGrant>[]>([]);
    const [loadingGrants, setLoadingGrants] = useState(false);
    const [selectedGrantId, setSelectedGrantId] = useState<string | null>(null);
    const [showTokenSelector, setShowTokenSelector] = useState(false);

    const { initWallet } = useWallet();

    // Fetch auth grants and DID on mount
    useEffect(() => {
        const fetchData = async () => {
            setLoadingGrants(true);
            try {
                const wallet = await initWallet();
                
                // Fetch grants
                const grants = await wallet.invoke.getAuthGrants() || [];
                const activeGrants = grants.filter((g: Partial<AuthGrant>) => g.status === 'active');
                setAuthGrants(activeGrants);
                
                // Fetch DID
                const did = wallet.id.did();
                setUserDid(did);
            } catch (err) {
                console.error('Failed to fetch data:', err);
            } finally {
                setLoadingGrants(false);
            }
        };
        fetchData();
    }, []);

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

    const [credential, setCredential] = useState<Record<string, unknown>>({
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        issuer: '', // Will be set from user's DID
        issuanceDate: new Date().toISOString(),
        name: 'Achievement Badge',
        credentialSubject: {
            type: ['AchievementSubject'],
            achievement: {
                id: 'urn:uuid:' + crypto.randomUUID(),
                type: ['Achievement'],
                name: 'Achievement Badge',
                description: 'Awarded for completing the course',
                achievementType: 'Achievement',
                criteria: {
                    narrative: 'Completed the required coursework and assessments.',
                },
            },
        },
    });

    // Update credential issuer when DID is fetched
    useEffect(() => {
        if (userDid && credential.issuer !== userDid) {
            setCredential(prev => ({ ...prev, issuer: userDid }));
        }
    }, [userDid, credential.issuer]);

    // Advanced options state
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [advancedOptions, setAdvancedOptions] = useState<AdvancedOptions>({
        issuerName: '',
        issuerLogoUrl: '',
        recipientName: '',
        suppressDelivery: false,
        webhookUrl: '',
    });

    // Logo upload via Filestack
    const { handleFileSelect: handleLogoUpload, isLoading: isUploadingLogo } = useFilestack({
        onUpload: (url: string) => {
            setAdvancedOptions(prev => ({ ...prev, issuerLogoUrl: url }));
        },
        fileType: 'image/*',
    });

    // Verification polling state
    const [isPolling, setIsPolling] = useState(false);
    const [pollResult, setPollResult] = useState<{
        success: boolean;
        message: string;
        count?: number;
        latestCredential?: string;
    } | null>(null);
    const [initialCount, setInitialCount] = useState<number | null>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Get the current network URL (check LCN_API_URL env var first, then store, then default)
    const networkUrl = LCN_API_URL || networkStore.get.networkUrl() || LEARNCARD_NETWORK_API_URL;

    const handleCredentialSave = (newCredential: Record<string, unknown>) => {
        setCredential(newCredential);
    };

    // Extract name, description, and image from credential for display
    const credentialName = (credential.name as string) || 'Untitled Credential';
    const credentialSubject = credential.credentialSubject as Record<string, unknown> | undefined;
    const achievement = credentialSubject?.achievement as Record<string, unknown> | undefined;
    const credentialDescription = (achievement?.description as string) || '';
    const achievementImage = (achievement?.image as { id?: string })?.id || (achievement?.image as string) || '';

    // Check if any advanced options are set
    const hasAdvancedOptions = advancedOptions.issuerName || advancedOptions.issuerLogoUrl || 
        advancedOptions.recipientName || advancedOptions.suppressDelivery || advancedOptions.webhookUrl;

    // Build configuration object for code snippets
    const buildConfigObject = () => {
        const config: Record<string, unknown> = {};

        if (advancedOptions.webhookUrl) {
            config.webhookUrl = advancedOptions.webhookUrl;
        }

        if (advancedOptions.suppressDelivery || advancedOptions.issuerName || advancedOptions.issuerLogoUrl || advancedOptions.recipientName) {
            config.delivery = {};

            if (advancedOptions.suppressDelivery) {
                (config.delivery as Record<string, unknown>).suppress = true;
            }

            if (advancedOptions.issuerName || advancedOptions.issuerLogoUrl || advancedOptions.recipientName) {
                (config.delivery as Record<string, unknown>).template = {
                    model: {
                        ...(advancedOptions.issuerName || advancedOptions.issuerLogoUrl ? {
                            issuer: {
                                ...(advancedOptions.issuerName && { name: advancedOptions.issuerName }),
                                ...(advancedOptions.issuerLogoUrl && { logoUrl: advancedOptions.issuerLogoUrl }),
                            }
                        } : {}),
                        ...(advancedOptions.recipientName ? {
                            recipient: { name: advancedOptions.recipientName }
                        } : {}),
                    }
                };
            }
        }

        return Object.keys(config).length > 0 ? config : null;
    };

    const configObject = buildConfigObject();
    const configJson = configObject ? JSON.stringify(configObject, null, 4) : null;
    const configJsonIndented = configJson ? configJson.split('\n').map((line, i) => i === 0 ? line : '    ' + line).join('\n') : '';

    // Format credential JSON for code snippets
    const credentialJson = useMemo(() => JSON.stringify(credential, null, 4), [credential]);
    const credentialJsonIndented = credentialJson.split('\n').map((line, i) => i === 0 ? line : '    ' + line).join('\n');

    // Poll for sent credentials
    const checkSentCredentials = useCallback(async () => {
        try {
            const wallet = await initWallet();
            const result = await wallet.invoke.getMySentInboxCredentials?.({ limit: 10 });

            if (result?.records) {
                const currentCount = result.records.length;

                if (initialCount === null) {
                    setInitialCount(currentCount);
                    return null;
                }

                if (currentCount > initialCount) {
                    const latestRecord = result.records[0];
                    const latestCred = latestRecord?.credential;
                    const latestName = typeof latestCred === 'object' && latestCred !== null 
                        ? ((latestCred as Record<string, unknown>).name as string) || 'Credential'
                        : 'Credential';
                    return {
                        success: true,
                        count: currentCount - initialCount,
                        latestCredential: latestName,
                    };
                }
            }

            return null;
        } catch (err) {
            console.error('Failed to check sent credentials:', err);
            return null;
        }
    }, [initWallet, initialCount]);

    const startPolling = useCallback(async () => {
        setIsPolling(true);
        setPollResult(null);

        // Get initial count
        const wallet = await initWallet();
        const result = await wallet.invoke.getMySentInboxCredentials?.({ limit: 10 });
        const count = result?.records?.length ?? 0;
        setInitialCount(count);

        // Start polling every 3 seconds
        pollIntervalRef.current = setInterval(async () => {
            const checkResult = await checkSentCredentials();

            if (checkResult?.success) {
                setPollResult({
                    success: true,
                    message: `New credential sent! "${checkResult.latestCredential}"`,
                    count: checkResult.count,
                });
                stopPolling();
            }
        }, 3000);

        // Auto-stop after 2 minutes
        setTimeout(() => {
            if (pollIntervalRef.current) {
                stopPolling();
                if (!pollResult?.success) {
                    setPollResult({
                        success: false,
                        message: 'Polling timed out. Run your code and try again.',
                    });
                }
            }
        }, 120000);
    }, [initWallet, checkSentCredentials, pollResult]);

    const stopPolling = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        setIsPolling(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

    const codeSnippet = `// Install: npm install @learncard/init

import { initLearnCard } from '@learncard/init';

// Your API token from Step 1
const API_TOKEN = '${apiToken || 'YOUR_API_TOKEN'}';

// Initialize LearnCard with your API token
const learnCard = await initLearnCard({ network: true, apiKey: API_TOKEN });

// Your credential (built with Credential Builder)
const credential = ${credentialJsonIndented};
${configObject ? `
// Configuration for custom branding, webhooks, etc.
const configuration = ${configJsonIndented};
` : ''}
// Send credential via Universal Inbox (for email recipients)${recipientEmail ? `
await learnCard.invoke.sendCredentialViaInbox({
    recipient: {
        type: 'email',
        value: '${recipientEmail}',
    },
    credential,${configObject ? `
    configuration,` : ''}
});` : `
// await learnCard.invoke.sendCredentialViaInbox({
//     recipient: {
//         type: 'email',
//         value: 'recipient@example.com',
//     },
//     credential,${configObject ? `
//     configuration,` : ''}
// });`}
${advancedOptions.suppressDelivery ? `
// Since delivery is suppressed, get the claim URL from the response:
// const { claimUrl } = await learnCard.invoke.sendCredentialViaInbox({...});
// Use claimUrl in your own UI or email system.` : ''}
// The recipient will receive an email with a link to claim their credential.
// Once claimed, the credential is signed and added to their wallet.
console.log('Credential sent to inbox!');

// Verify your credential was sent:
const sent = await learnCard.invoke.getMySentInboxCredentials();
console.log('Sent credentials:', sent.records);`;

    const pythonSnippet = `# Install: pip install requests

import requests
import json

# Your API token from Step 1
API_TOKEN = "${apiToken || 'YOUR_API_TOKEN'}"

# API endpoint
API_URL = "${networkUrl}/inbox/issue"

# Your credential (built with Credential Builder)
credential = ${credentialJsonIndented.replace(/null/g, 'None').replace(/true/g, 'True').replace(/false/g, 'False')}
${configObject ? `
# Configuration for custom branding, webhooks, etc.
configuration = ${configJsonIndented.replace(/null/g, 'None').replace(/true/g, 'True').replace(/false/g, 'False')}
` : ''}
# Build the request payload
payload = {
    "recipient": {
        "type": "email",
        "value": "${recipientEmail || 'recipient@example.com'}"
    },
    "credential": credential${configObject ? `,
    "configuration": configuration` : ''}
}

# Send credential via Universal Inbox API
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
    print("Credential sent to inbox!")
    print(f"Claim URL: {data.get('claimUrl', 'N/A')}")
else:
    print(f"Error: {response.status_code} - {response.text}")`;

    const curlSnippet = `curl -X POST ${networkUrl}/inbox/issue \\
  -H "Authorization: Bearer ${apiToken || 'YOUR_API_TOKEN'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipient": {
      "type": "email",
      "value": "${recipientEmail || 'recipient@example.com'}"
    },
    "credential": ${JSON.stringify(credential, null, 6).split('\n').map((line, i) => i === 0 ? line : '      ' + line).join('\n')}${configObject ? `,
    "configuration": ${JSON.stringify(configObject, null, 6).split('\n').map((line, i) => i === 0 ? line : '      ' + line).join('\n')}` : ''}
  }'`;

    // Get selected grant name for display
    const selectedGrant = authGrants.find(g => g.id === selectedGrantId);
    const displayTokenName = selectedGrant?.name || (apiToken ? 'Selected Token' : 'No token selected');

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Build Your Credential</h3>

                <p className="text-gray-600">
                    Design your Open Badges 3.0 credential using our visual builder. The code will update automatically.
                </p>
            </div>

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
                                No API tokens found. <a href="#" onClick={(e) => { e.preventDefault(); onBack(); }} className="text-cyan-600 hover:underline">Go back to create one</a>.
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

            {/* Credential preview card */}
            <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-2xl">
                <div className="flex items-start gap-4">
                    {/* Credential icon/image */}
                    {achievementImage ? (
                        <img
                            src={achievementImage}
                            alt={credentialName}
                            className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-gray-200"
                            onError={(e) => {
                                // Fallback to icon if image fails to load
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                    ) : null}

                    <div className={`w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 ${achievementImage ? 'hidden' : ''}`}>
                        <Award className="w-8 h-8 text-white" />
                    </div>

                    {/* Credential info */}
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 truncate">{credentialName}</h4>

                        <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">
                            {credentialDescription || 'No description set'}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded text-xs font-medium">
                                {(achievement?.achievementType as string) || 'Achievement'}
                            </span>
                        </div>
                    </div>

                    {/* Edit button */}
                    <button
                        onClick={() => setIsBuilderOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-cyan-600 border border-cyan-300 rounded-xl font-medium hover:bg-cyan-50 transition-colors"
                    >
                        <Sparkles className="w-4 h-4" />
                        Edit
                    </button>
                </div>

                {/* Open builder button if using default */}
                {credentialName === 'Achievement Badge' && (
                    <button
                        onClick={() => setIsBuilderOpen(true)}
                        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                    >
                        <Sparkles className="w-4 h-4" />
                        Customize Your Credential
                    </button>
                )}
            </div>

            {/* Credential Builder Modal */}
            <OBv3CredentialBuilder
                isOpen={isBuilderOpen}
                onClose={() => setIsBuilderOpen(false)}
                onSave={handleCredentialSave}
            />

            {/* Recipient email */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Email 
                    <span className="text-gray-400 font-normal"> (optional)</span>
                </label>

                <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="recipient@example.com"
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    style={{ colorScheme: 'light' }}
                />

                <p className="text-xs text-gray-500 mt-1">
                    Enter an email to see the send code. The recipient will get a claim link.
                </p>
            </div>

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
                        Customize branding, webhooks, and delivery options for the Universal Inbox.
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

                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={advancedOptions.issuerLogoUrl}
                                        onChange={(e) => setAdvancedOptions(prev => ({ ...prev, issuerLogoUrl: e.target.value }))}
                                        placeholder="https://example.com/logo.png"
                                        className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        disabled={isUploadingLogo}
                                        style={{ colorScheme: 'light' }}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => handleLogoUpload()}
                                        disabled={isUploadingLogo}
                                        className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                                        title="Upload image"
                                    >
                                        {isUploadingLogo ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Upload className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>

                                {advancedOptions.issuerLogoUrl && (
                                    <img
                                        src={advancedOptions.issuerLogoUrl}
                                        alt="Logo preview"
                                        className="mt-2 h-12 object-contain rounded border border-gray-200"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                )}
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
                        <h4 className="font-medium text-gray-800 mb-1">Verify Your Code Worked</h4>

                        <p className="text-sm text-gray-600 mb-3">
                            Run your code, then click below to verify the credential was sent successfully.
                        </p>

                        {!isPolling && !pollResult?.success && (
                            <button
                                onClick={startPolling}
                                disabled={!apiToken}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Check for Sent Credentials
                            </button>
                        )}

                        {isPolling && (
                            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-indigo-200">
                                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />

                                <div>
                                    <p className="text-sm font-medium text-gray-700">Waiting for new credentials...</p>
                                    <p className="text-xs text-gray-500">Run your code now. We'll detect when it's sent.</p>
                                </div>

                                <button
                                    onClick={stopPolling}
                                    className="ml-auto px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        {pollResult && (
                            <div className={`flex items-center gap-3 p-3 rounded-lg ${
                                pollResult.success 
                                    ? 'bg-emerald-50 border border-emerald-200' 
                                    : 'bg-amber-50 border border-amber-200'
                            }`}>
                                {pollResult.success ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                ) : (
                                    <Clock className="w-5 h-5 text-amber-600" />
                                )}

                                <div className="flex-1">
                                    <p className={`text-sm font-medium ${pollResult.success ? 'text-emerald-800' : 'text-amber-800'}`}>
                                        {pollResult.message}
                                    </p>
                                </div>

                                {!pollResult.success && (
                                    <button
                                        onClick={startPolling}
                                        className="px-3 py-1 text-sm bg-amber-100 text-amber-700 rounded hover:bg-amber-200"
                                    >
                                        Try Again
                                    </button>
                                )}
                            </div>
                        )}

                        {!apiToken && (
                            <p className="text-xs text-amber-600 mt-2">
                                ⚠️ Create an API token in step 1 to enable verification.
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
                    Continue
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// Step 4: Issue & Verify
const IssueVerifyStep: React.FC<{
    onBack: () => void;
}> = ({ onBack }) => {
    const [verifyInput, setVerifyInput] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string } | null>(null);

    const { initWallet } = useWallet();

    const handleVerify = async () => {
        if (!verifyInput.trim()) return;

        setVerifying(true);
        setVerifyResult(null);

        try {
            const wallet = await initWallet();
            const credential = JSON.parse(verifyInput);

            const result = await wallet.invoke.verifyCredential(credential);

            if (result.warnings.length === 0 && result.errors.length === 0) {
                setVerifyResult({ success: true, message: 'Credential is valid!' });
            } else {
                const issues = [...result.warnings, ...result.errors].join(', ');
                setVerifyResult({ success: false, message: `Issues found: ${issues}` });
            }
        } catch (err) {
            console.error('Verification failed:', err);
            setVerifyResult({ success: false, message: 'Invalid credential format' });
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Issue & Verify</h3>

                <p className="text-gray-600">
                    Run your code to issue a credential, then paste it here to verify it works correctly.
                </p>
            </div>

            {/* Success state */}
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-cyan-50 border border-emerald-200 rounded-2xl text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Rocket className="w-8 h-8 text-emerald-600" />
                </div>

                <h4 className="text-lg font-semibold text-gray-800 mb-2">You're all set!</h4>

                <p className="text-gray-600 mb-4">
                    Run the code from the previous step in your application to issue your first credential.
                </p>

                <div className="flex items-center justify-center gap-2 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>API Token ready</span>
                </div>

                <div className="flex items-center justify-center gap-2 text-emerald-700 font-medium mt-1">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Signing authority configured</span>
                </div>
            </div>

            {/* Verification tool */}
            {/* <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h4 className="font-medium text-gray-800">Test Verification</h4>

                    <p className="text-sm text-gray-500">Paste a credential to verify it</p>
                </div>

                <div className="p-4 space-y-4">
                    <textarea
                        value={verifyInput}
                        onChange={(e) => setVerifyInput(e.target.value)}
                        placeholder='{"@context": [...], "type": [...], ...}'
                        rows={6}
                        className="w-full px-4 py-3 bg-gray-900 text-gray-100 font-mono text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />

                    <button
                        onClick={handleVerify}
                        disabled={verifying || !verifyInput.trim()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                    >
                        {verifying ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            <>
                                <Shield className="w-4 h-4" />
                                Verify Credential
                            </>
                        )}
                    </button>

                    {verifyResult && (
                        <div className={`p-4 rounded-xl ${verifyResult.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                            <div className="flex items-center gap-2">
                                {verifyResult.success ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                )}

                                <span className={verifyResult.success ? 'text-emerald-800' : 'text-red-800'}>
                                    {verifyResult.message}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div> */}

            {/* Navigation */}
            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <a
                    href="https://docs.learncard.com/sdks/network-plugin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                >
                    View Full Documentation
                    <ArrowRight className="w-4 h-4" />
                </a>
            </div>
        </div>
    );
};

// Main component
const IssueCredentialsGuide: React.FC<{ selectedIntegration?: unknown; setSelectedIntegration?: unknown }> = () => {
    const guideState = useGuideState('issue-credentials', STEPS.length);

    const [apiToken, setApiToken] = useState('');

    const handleStepComplete = (stepId: string) => {
        guideState.markStepComplete(stepId);
        guideState.nextStep();
    };

    const renderStep = () => {
        switch (guideState.currentStep) {
            case 0:
                return (
                    <ApiTokenStep
                        onComplete={() => handleStepComplete('api-token')}
                        onTokenCreated={setApiToken}
                    />
                );

            case 1:
                return (
                    <SigningAuthorityStep
                        onComplete={() => handleStepComplete('signing-authority')}
                        onBack={guideState.prevStep}
                    />
                );

            case 2:
                return (
                    <BuildCredentialStep
                        onComplete={() => handleStepComplete('build-credential')}
                        onBack={guideState.prevStep}
                        apiToken={apiToken}
                        onTokenChange={setApiToken}
                    />
                );

            case 3:
                return (
                    <IssueVerifyStep
                        onBack={guideState.prevStep}
                    />
                );

            default:
                return null;
        }
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
                />
            </div>

            {/* Current step content */}
            {renderStep()}
        </div>
    );
};

export default IssueCredentialsGuide;
