import React, { useState, useEffect, useMemo } from 'react';
import { 
    Key, 
    Code, 
    Package, 
    Settings, 
    Play, 
    ArrowRight, 
    ArrowLeft, 
    ExternalLink,
    CheckCircle2,
    Copy,
    Check,
    Plus,
    Loader2,
    Building2,
    Trash2,
    RefreshCw,
    Sparkles,
    Award,
    ChevronDown,
    ChevronUp,
    Upload,
    Palette,
} from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import { useToast, ToastTypeEnum, useConfirmation, useFilestack, useWallet } from 'learn-card-base';
import { Clipboard } from '@capacitor/clipboard';

import { StepProgress, CodeOutputPanel, StatusIndicator } from '../shared';
import { useGuideState } from '../shared/useGuideState';
import { useDeveloperPortal } from '../../useDeveloperPortal';
import { OBv3CredentialBuilder } from '../../../../components/credentials/OBv3CredentialBuilder';

const STEPS = [
    { id: 'publishable-key', title: 'Get API Key' },
    { id: 'add-target', title: 'Add HTML Target' },
    { id: 'load-sdk', title: 'Load SDK' },
    { id: 'configure', title: 'Configure' },
    { id: 'test', title: 'Test It' },
];

// Step 1: Publishable Key (Integration Management)
const PublishableKeyStep: React.FC<{
    onComplete: () => void;
    publishableKey: string;
    setPublishableKey: (key: string) => void;
    selectedIntegration: LCNIntegration | null;
    setSelectedIntegration: (integration: LCNIntegration | null) => void;
}> = ({ onComplete, publishableKey, setPublishableKey, selectedIntegration, setSelectedIntegration }) => {
    const { presentToast } = useToast();
    const [copied, setCopied] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');

    const { useIntegrations, useCreateIntegration } = useDeveloperPortal();
    const { data: integrations, isLoading, refetch } = useIntegrations();
    const createMutation = useCreateIntegration();

    // Auto-select first integration if none selected
    useEffect(() => {
        if (integrations && integrations.length > 0 && !selectedIntegration) {
            const first = integrations[0];
            setSelectedIntegration(first);
            setPublishableKey(first.publishableKey);
        }
    }, [integrations, selectedIntegration, setSelectedIntegration, setPublishableKey]);

    const handleSelectIntegration = (integration: LCNIntegration) => {
        setSelectedIntegration(integration);
        setPublishableKey(integration.publishableKey);
    };

    const handleCreateIntegration = async () => {
        if (!newName.trim()) return;

        try {
            await createMutation.mutateAsync(newName.trim());
            setNewName('');
            setIsCreating(false);
            presentToast('Integration created!', { hasDismissButton: true });
            refetch();
        } catch (err) {
            console.error('Failed to create integration:', err);
            presentToast('Failed to create integration', { type: ToastTypeEnum.Error, hasDismissButton: true });
        }
    };

    const copyKey = async () => {
        if (!publishableKey) return;

        await Clipboard.write({ string: publishableKey });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        presentToast('Key copied!', { hasDismissButton: true });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Get Your Publishable Key</h3>

                <p className="text-gray-600">
                    You need a publishable key to authenticate credential claims from your website.
                    Each integration has its own publishable key that is safe to expose in client-side code.
                </p>
            </div>

            {/* Status */}
            <StatusIndicator
                status={isLoading ? 'loading' : (integrations && integrations.length > 0) ? 'ready' : 'warning'}
                label={isLoading ? 'Loading integrations...' : (integrations && integrations.length > 0) ? `${integrations.length} integration${integrations.length > 1 ? 's' : ''} found` : 'No integrations found'}
                description={selectedIntegration ? `Using "${selectedIntegration.name}"` : 'Create or select an integration to get started'}
            />

            {/* Integration List */}
            {!isLoading && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Your Integrations</label>

                        <button
                            onClick={() => refetch()}
                            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                        >
                            <RefreshCw className="w-3 h-3" />
                            Refresh
                        </button>
                    </div>

                    {integrations && integrations.length > 0 ? (
                        <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                            {integrations.map((integration) => (
                                <button
                                    key={integration.id}
                                    onClick={() => handleSelectIntegration(integration)}
                                    className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
                                        selectedIntegration?.id === integration.id
                                            ? 'bg-cyan-50 border-l-4 border-l-cyan-500'
                                            : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                            selectedIntegration?.id === integration.id
                                                ? 'bg-cyan-100'
                                                : 'bg-gray-100'
                                        }`}>
                                            <Building2 className={`w-5 h-5 ${
                                                selectedIntegration?.id === integration.id
                                                    ? 'text-cyan-600'
                                                    : 'text-gray-500'
                                            }`} />
                                        </div>

                                        <div>
                                            <p className="font-medium text-gray-800">{integration.name}</p>

                                            <p className="text-xs text-gray-500 font-mono">
                                                {integration.publishableKey.substring(0, 20)}...
                                            </p>
                                        </div>
                                    </div>

                                    {selectedIntegration?.id === integration.id && (
                                        <CheckCircle2 className="w-5 h-5 text-cyan-600" />
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl text-center">
                            <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />

                            <p className="text-gray-600 mb-1">No integrations yet</p>

                            <p className="text-sm text-gray-500">
                                Create your first integration to get a publishable key
                            </p>
                        </div>
                    )}

                    {/* Create New Integration */}
                    {isCreating ? (
                        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
                            <label className="block text-sm font-medium text-indigo-800">New Integration Name</label>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g., My Website, Course Platform"
                                    className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreateIntegration();
                                        if (e.key === 'Escape') {
                                            setIsCreating(false);
                                            setNewName('');
                                        }
                                    }}
                                />

                                <button
                                    onClick={handleCreateIntegration}
                                    disabled={!newName.trim() || createMutation.isPending}
                                    className="px-4 py-2.5 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {createMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        'Create'
                                    )}
                                </button>

                                <button
                                    onClick={() => { setIsCreating(false); setNewName(''); }}
                                    className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Create New Integration
                        </button>
                    )}
                </div>
            )}

            {/* Selected Key Display */}
            {selectedIntegration && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-emerald-800">Your Publishable Key</label>

                        <button
                            onClick={copyKey}
                            className="text-xs text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>

                    <div className="px-3 py-2 bg-white border border-emerald-200 rounded-lg font-mono text-sm text-gray-700 break-all">
                        {publishableKey}
                    </div>

                    <p className="text-xs text-emerald-700 mt-2">
                        This key is safe to use in client-side code. It can only be used to claim credentials.
                    </p>
                </div>
            )}

            <button
                onClick={onComplete}
                disabled={!publishableKey}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Continue
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );
};

// Step 2: Add Target
const AddTargetStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
}> = ({ onComplete, onBack }) => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Add HTML Target Element</h3>

                <p className="text-gray-600">
                    Add a container element to your page where the "Claim Credential" button will appear.
                </p>
            </div>

            <CodeOutputPanel
                title="HTML"
                snippets={{
                    typescript: `<!-- Add this where you want the claim button -->
<div id="claim-target"></div>

<!-- Example: Course completion page -->
<div class="completion-card">
    <h2>Congratulations!</h2>
    <p>You completed the course. Claim your credential below.</p>
    
    <!-- The SDK will render a button here -->
    <div id="claim-target"></div>
</div>`,
                }}
            />

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <h4 className="font-medium text-gray-800 mb-2">What gets rendered</h4>

                <p className="text-sm text-gray-600 mb-3">
                    The SDK replaces the target element with a styled button. When clicked, it opens a modal
                    for the user to verify their email and claim the credential.
                </p>

                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg">
                        Claim "Course Completion"
                    </div>

                    <span className="text-xs text-gray-500">← Example button</span>
                </div>
            </div>

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

// Step 3: Load SDK
const LoadSdkStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
}> = ({ onComplete, onBack }) => {
    const [method, setMethod] = useState<'cdn' | 'npm'>('cdn');

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Load the Embed SDK</h3>

                <p className="text-gray-600">
                    Choose how to load the SDK in your project.
                </p>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => setMethod('cdn')}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        method === 'cdn'
                            ? 'bg-cyan-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    CDN (Easiest)
                </button>

                <button
                    onClick={() => setMethod('npm')}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        method === 'npm'
                            ? 'bg-cyan-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    npm Package
                </button>
            </div>

            {method === 'cdn' ? (
                <CodeOutputPanel
                    title="CDN Script Tag"
                    snippets={{
                        typescript: `<!-- Add before closing </body> tag -->
<script src="https://cdn.learncard.com/sdk/v1/learncard.js" defer></script>

<!-- Then initialize after page loads -->
<script>
    window.addEventListener('DOMContentLoaded', function() {
        LearnCard.init({
            // ... configuration (see next step)
        });
    });
</script>`,
                    }}
                />
            ) : (
                <CodeOutputPanel
                    title="npm Installation"
                    snippets={{
                        typescript: `# Install the package
npm install @learncard/embed-sdk

# Then import and use
import { init } from '@learncard/embed-sdk';

// Initialize after DOM is ready
init({
    // ... configuration (see next step)
});`,
                    }}
                />
            )}

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <h4 className="font-medium text-emerald-800 mb-2">Zero dependencies</h4>

                <p className="text-sm text-emerald-700">
                    The SDK is a single optimized file (~15KB gzipped) with no external dependencies.
                    It works on any website — no React, Vue, or framework required.
                </p>
            </div>

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

// Step 4: Configure
const ConfigureStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
    publishableKey: string;
    setPublishableKey: (key: string) => void;
    selectedIntegration: LCNIntegration | null;
    setSelectedIntegration: (integration: LCNIntegration | null) => void;
    credential: Record<string, unknown>;
    setCredential: (cred: Record<string, unknown>) => void;
    partnerName: string;
    setPartnerName: (name: string) => void;
    branding: {
        primaryColor: string;
        accentColor: string;
        partnerLogoUrl: string;
    };
    setBranding: (branding: { primaryColor: string; accentColor: string; partnerLogoUrl: string }) => void;
    requestBackgroundIssuance: boolean;
    setRequestBackgroundIssuance: (value: boolean) => void;
}> = ({ 
    onComplete, 
    onBack, 
    publishableKey, 
    setPublishableKey,
    selectedIntegration,
    setSelectedIntegration,
    credential, 
    setCredential, 
    partnerName, 
    setPartnerName,
    branding,
    setBranding,
    requestBackgroundIssuance,
    setRequestBackgroundIssuance,
}) => {
    const { presentToast } = useToast();
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showKeySelector, setShowKeySelector] = useState(false);
    const [keyCopied, setKeyCopied] = useState(false);
    const { initWallet } = useWallet();
    const [userDid, setUserDid] = useState<string>('');

    // Fetch integrations for the key selector
    const { useIntegrations } = useDeveloperPortal();
    const { data: integrations } = useIntegrations();

    // Fetch user's DID on mount
    useEffect(() => {
        const fetchDid = async () => {
            try {
                const wallet = await initWallet();
                const did = wallet.id.did();
                setUserDid(did);
            } catch (err) {
                console.error('Failed to get DID:', err);
            }
        };
        fetchDid();
    }, []);

    // Logo upload via Filestack
    const { handleFileSelect: handleLogoUpload, isLoading: isUploadingLogo } = useFilestack({
        onUpload: (url: string) => {
            setBranding({ ...branding, partnerLogoUrl: url });
        },
        fileType: 'image/*',
    });

    const handleCredentialSave = (newCredential: Record<string, unknown>) => {
        // Add issuer if we have the DID
        if (userDid) {
            newCredential.issuer = userDid;
        }
        setCredential(newCredential);
    };

    // Extract display info from credential
    const credentialName = (credential.name as string) || 'Untitled Credential';
    const credentialSubject = credential.credentialSubject as Record<string, unknown> | undefined;
    const achievement = credentialSubject?.achievement as Record<string, unknown> | undefined;
    const credentialDescription = (achievement?.description as string) || '';
    const achievementImage = (achievement?.image as { id?: string })?.id || (achievement?.image as string) || '';

    // Check if branding is set
    const hasBranding = branding.primaryColor !== '#1F51FF' || branding.partnerLogoUrl;

    // Format credential JSON for code snippets
    const credentialJson = useMemo(() => JSON.stringify(credential, null, 4), [credential]);
    const credentialJsonIndented = credentialJson.split('\n').map((line, i) => i === 0 ? line : '        ' + line).join('\n');

    // Format branding object for code
    const brandingCode = `{
        primaryColor: '${branding.primaryColor}',
        accentColor: '${branding.accentColor}',${branding.partnerLogoUrl ? `
        partnerLogoUrl: '${branding.partnerLogoUrl}'` : ''}
    }`;

    const getCode = () => {
        const partner = partnerName || 'Your Company';

        return `LearnCard.init({
    // Your publishable key from the Developer Portal
    publishableKey: '${publishableKey}',
    
    // Partner branding
    partnerName: '${partner}',
    
    // Where to render the claim button
    target: '#claim-target',
    
    // The credential to issue (built with Credential Builder)
    credential: ${credentialJsonIndented},
    
    // Custom branding for the claim modal
    branding: ${brandingCode},
    ${requestBackgroundIssuance ? `
    // Request consent for future credential issuance
    requestBackgroundIssuance: true,
    ` : ''}
    // Called when credential is successfully claimed
    onSuccess: ({ credentialId, consentGiven }) => {
        console.log('Claimed!', credentialId);${requestBackgroundIssuance ? `
        if (consentGiven) {
            console.log('User consented to future issuance!');
        }` : ''}
        // Show success message, redirect, etc.
    }
});`;
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Configure the SDK</h3>

                <p className="text-gray-600">
                    Build your credential and customize branding for the claim experience.
                </p>
            </div>

            {/* Publishable Key Selector */}
            {publishableKey ? (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Key className="w-4 h-4 text-indigo-600" />
                            <label className="text-sm font-medium text-indigo-800">Publishable Key</label>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={async () => {
                                    await Clipboard.write({ string: publishableKey });
                                    setKeyCopied(true);
                                    setTimeout(() => setKeyCopied(false), 2000);
                                    presentToast('Key copied!', { hasDismissButton: true });
                                }}
                                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                            >
                                {keyCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {keyCopied ? 'Copied!' : 'Copy'}
                            </button>

                            <button
                                onClick={() => setShowKeySelector(!showKeySelector)}
                                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                            >
                                {showKeySelector ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                Change
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedIntegration && (
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                                {selectedIntegration.name}
                            </span>
                        )}

                        <code className="flex-1 px-3 py-2 bg-white border border-indigo-200 rounded-lg font-mono text-xs text-gray-700 truncate">
                            {publishableKey}
                        </code>
                    </div>

                    {/* Integration selector dropdown */}
                    {showKeySelector && integrations && integrations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-indigo-200">
                            <p className="text-xs text-indigo-700 mb-2">Select a different integration:</p>

                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                {integrations.map((integration) => (
                                    <button
                                        key={integration.id}
                                        onClick={() => {
                                            setSelectedIntegration(integration);
                                            setPublishableKey(integration.publishableKey);
                                            setShowKeySelector(false);
                                        }}
                                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-sm transition-colors ${
                                            selectedIntegration?.id === integration.id
                                                ? 'bg-indigo-100 text-indigo-800'
                                                : 'hover:bg-indigo-100/50 text-gray-700'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-indigo-500" />
                                            <span className="font-medium">{integration.name}</span>
                                        </div>

                                        {selectedIntegration?.id === integration.id && (
                                            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Key className="w-5 h-5 text-amber-600" />
                        </div>

                        <div className="flex-1">
                            <h4 className="font-medium text-amber-800 mb-1">No Publishable Key Selected</h4>

                            <p className="text-sm text-amber-700 mb-3">
                                You need a publishable key to enable credential claims. Go back to Step 1 to create or select an integration.
                            </p>

                            {integrations && integrations.length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-xs text-amber-600 font-medium">Or select one now:</p>

                                    <div className="space-y-1">
                                        {integrations.slice(0, 3).map((integration) => (
                                            <button
                                                key={integration.id}
                                                onClick={() => {
                                                    setSelectedIntegration(integration);
                                                    setPublishableKey(integration.publishableKey);
                                                }}
                                                className="w-full flex items-center gap-2 p-2 bg-white border border-amber-200 rounded-lg text-left text-sm hover:bg-amber-50 transition-colors"
                                            >
                                                <Building2 className="w-4 h-4 text-amber-500" />
                                                <span className="font-medium text-gray-700">{integration.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={onBack}
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-800 rounded-lg text-sm font-medium hover:bg-amber-200 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Go to Step 1
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

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

            {/* Partner Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Partner Name</label>

                <input
                    type="text"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="e.g., Your Company"
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    style={{ colorScheme: 'light' }}
                />

                <p className="text-xs text-gray-500 mt-1">
                    Shown in the claim modal as the issuing organization
                </p>
            </div>

            {/* Advanced Options Toggle */}
            <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showAdvanced ? 'Hide' : 'Show'} Branding & Advanced Options
                {hasBranding && <span className="px-1.5 py-0.5 bg-cyan-100 text-cyan-700 rounded text-xs">Active</span>}
            </button>

            {/* Advanced Options Panel */}
            {showAdvanced && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
                    {/* Branding Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Palette className="w-4 h-4 text-indigo-500" />
                            Modal Branding
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Primary Color</label>

                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={branding.primaryColor}
                                        onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                                        className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                                    />

                                    <input
                                        type="text"
                                        value={branding.primaryColor}
                                        onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                                        placeholder="#1F51FF"
                                        className="flex-1 px-3 py-2 text-sm font-mono bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Accent Color</label>

                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={branding.accentColor}
                                        onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                                        className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                                    />

                                    <input
                                        type="text"
                                        value={branding.accentColor}
                                        onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                                        placeholder="#0F3BD9"
                                        className="flex-1 px-3 py-2 text-sm font-mono bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Partner Logo URL</label>

                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={branding.partnerLogoUrl}
                                        onChange={(e) => setBranding({ ...branding, partnerLogoUrl: e.target.value })}
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

                                {branding.partnerLogoUrl && (
                                    <img
                                        src={branding.partnerLogoUrl}
                                        alt="Logo preview"
                                        className="mt-2 h-12 object-contain rounded border border-gray-200"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Background Issuance Section */}
                    <div className="space-y-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Settings className="w-4 h-4 text-emerald-500" />
                            Advanced Settings
                        </div>

                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={requestBackgroundIssuance}
                                onChange={(e) => setRequestBackgroundIssuance(e.target.checked)}
                                className="mt-1 w-4 h-4 text-cyan-500 border-gray-300 rounded focus:ring-cyan-500"
                            />

                            <div>
                                <span className="text-sm font-medium text-gray-700">Request Background Issuance Consent</span>

                                <p className="text-xs text-gray-500 mt-0.5">
                                    Ask the user for permission to issue future credentials without requiring email verification each time.
                                </p>
                            </div>
                        </label>
                    </div>

                    {/* Color Preview */}
                    <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs font-medium text-gray-600 mb-2">Button Preview</p>

                        <div 
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium"
                            style={{ 
                                background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)` 
                            }}
                        >
                            Claim "{credentialName}"
                        </div>
                    </div>
                </div>
            )}

            <CodeOutputPanel
                title="Full Configuration"
                snippets={{ typescript: getCode() }}
            />

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <h4 className="font-medium text-amber-800 mb-2">Important Options</h4>

                <ul className="text-sm text-amber-700 space-y-1">
                    <li>• <code className="bg-amber-100 px-1 rounded">publishableKey</code> — Required for real claims</li>
                    <li>• <code className="bg-amber-100 px-1 rounded">credential</code> — Built using the Credential Builder above</li>
                    <li>• <code className="bg-amber-100 px-1 rounded">branding</code> — Customize the claim modal appearance</li>
                    <li>• <code className="bg-amber-100 px-1 rounded">requestBackgroundIssuance</code> — Ask consent for future issuance</li>
                    <li>• <code className="bg-amber-100 px-1 rounded">onSuccess</code> — Handle post-claim actions</li>
                </ul>
            </div>

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

// Step 5: Test
const TestStep: React.FC<{
    onBack: () => void;
    publishableKey: string;
    credential: Record<string, unknown>;
    partnerName: string;
}> = ({ onBack, publishableKey, credential, partnerName }) => {
    const credentialName = (credential.name as string) || 'Untitled Credential';
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Test Your Integration</h3>

                <p className="text-gray-600">
                    Here's a checklist and the user flow to verify everything works.
                </p>
            </div>

            {/* Checklist */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <h4 className="font-medium text-gray-800 mb-3">Pre-flight checklist</h4>

                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-4 h-4 ${publishableKey ? 'text-emerald-600' : 'text-gray-300'}`} />
                        <span className={publishableKey ? 'text-gray-800' : 'text-gray-400'}>Publishable key configured</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-4 h-4 ${credentialName ? 'text-emerald-600' : 'text-gray-300'}`} />
                        <span className={credentialName ? 'text-gray-800' : 'text-gray-400'}>Credential name set</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-gray-800">SDK loaded on page</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-gray-800">Target element exists</span>
                    </div>
                </div>
            </div>

            {/* User flow */}
            <div className="p-4 border border-gray-200 rounded-xl">
                <h4 className="font-medium text-gray-800 mb-3">User Experience Flow</h4>

                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 text-xs font-medium flex items-center justify-center shrink-0">1</div>

                        <div>
                            <p className="font-medium text-gray-800">User clicks the claim button</p>
                            <p className="text-sm text-gray-500">Opens a branded modal</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 text-xs font-medium flex items-center justify-center shrink-0">2</div>

                        <div>
                            <p className="font-medium text-gray-800">User enters their email</p>
                            <p className="text-sm text-gray-500">A 6-digit code is sent to verify</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 text-xs font-medium flex items-center justify-center shrink-0">3</div>

                        <div>
                            <p className="font-medium text-gray-800">User enters the OTP code</p>
                            <p className="text-sm text-gray-500">Credential is issued to their wallet</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium flex items-center justify-center shrink-0">✓</div>

                        <div>
                            <p className="font-medium text-gray-800">Success!</p>
                            <p className="text-sm text-gray-500">LearnCard wallet opens, <code>onSuccess</code> is called</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Returning users */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-medium text-blue-800 mb-2">Returning Users</h4>

                <p className="text-sm text-blue-700">
                    The SDK remembers logged-in users via localStorage. On their next visit, they'll see an 
                    "Accept Credential" button instead of entering email/OTP again.
                </p>
            </div>

            {/* Success */}
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-cyan-50 border border-emerald-200 rounded-2xl text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Play className="w-8 h-8 text-emerald-600" />
                </div>

                <h4 className="text-lg font-semibold text-gray-800 mb-2">Ready to go live!</h4>

                <p className="text-gray-600 mb-4">
                    Users can now claim credentials directly from your website.
                </p>

                <a
                    href="https://github.com/learningeconomy/LearnCard/tree/main/examples/embed-example"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                >
                    View full example on GitHub
                    <ExternalLink className="w-3.5 h-3.5" />
                </a>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <a
                    href="https://docs.learncard.com/sdks/embed-sdk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                >
                    Full Documentation
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>
        </div>
    );
};

// Main component
const EmbedClaimGuide: React.FC = () => {
    const guideState = useGuideState('embed-claim', STEPS.length);

    const [publishableKey, setPublishableKey] = useState('');
    const [selectedIntegration, setSelectedIntegration] = useState<LCNIntegration | null>(null);
    const [credential, setCredential] = useState<Record<string, unknown>>({
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        name: 'Achievement Badge',
        credentialSubject: {
            type: ['AchievementSubject'],
            achievement: {
                type: ['Achievement'],
                name: 'Achievement Badge',
                description: 'Awarded for completing the course',
                achievementType: 'Achievement',
            },
        },
    });
    const [partnerName, setPartnerName] = useState('');
    const [branding, setBranding] = useState({
        primaryColor: '#1F51FF',
        accentColor: '#0F3BD9',
        partnerLogoUrl: '',
    });
    const [requestBackgroundIssuance, setRequestBackgroundIssuance] = useState(false);

    const handleStepComplete = (stepId: string) => {
        guideState.markStepComplete(stepId);
        guideState.nextStep();
    };

    const renderStep = () => {
        switch (guideState.currentStep) {
            case 0:
                return (
                    <PublishableKeyStep
                        onComplete={() => handleStepComplete('publishable-key')}
                        publishableKey={publishableKey}
                        setPublishableKey={setPublishableKey}
                        selectedIntegration={selectedIntegration}
                        setSelectedIntegration={setSelectedIntegration}
                    />
                );

            case 1:
                return (
                    <AddTargetStep
                        onComplete={() => handleStepComplete('add-target')}
                        onBack={guideState.prevStep}
                    />
                );

            case 2:
                return (
                    <LoadSdkStep
                        onComplete={() => handleStepComplete('load-sdk')}
                        onBack={guideState.prevStep}
                    />
                );

            case 3:
                return (
                    <ConfigureStep
                        onComplete={() => handleStepComplete('configure')}
                        onBack={guideState.prevStep}
                        publishableKey={publishableKey}
                        setPublishableKey={setPublishableKey}
                        selectedIntegration={selectedIntegration}
                        setSelectedIntegration={setSelectedIntegration}
                        credential={credential}
                        setCredential={setCredential}
                        partnerName={partnerName}
                        setPartnerName={setPartnerName}
                        branding={branding}
                        setBranding={setBranding}
                        requestBackgroundIssuance={requestBackgroundIssuance}
                        setRequestBackgroundIssuance={setRequestBackgroundIssuance}
                    />
                );

            case 4:
                return (
                    <TestStep
                        onBack={guideState.prevStep}
                        publishableKey={publishableKey}
                        credential={credential}
                        partnerName={partnerName}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-4">
            <div className="mb-8">
                <StepProgress
                    currentStep={guideState.currentStep}
                    totalSteps={STEPS.length}
                    steps={STEPS}
                    completedSteps={guideState.state.completedSteps}
                    onStepClick={guideState.goToStep}
                />
            </div>

            {renderStep()}
        </div>
    );
};

export default EmbedClaimGuide;
