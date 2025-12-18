import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import { useToast, ToastTypeEnum, useConfirmation } from 'learn-card-base';
import { Clipboard } from '@capacitor/clipboard';

import { StepProgress, CodeOutputPanel, StatusIndicator } from '../shared';
import { useGuideState } from '../shared/useGuideState';
import { useDeveloperPortal } from '../../useDeveloperPortal';

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
    credentialName: string;
    setCredentialName: (name: string) => void;
    partnerName: string;
    setPartnerName: (name: string) => void;
}> = ({ onComplete, onBack, publishableKey, credentialName, setCredentialName, partnerName, setPartnerName }) => {
    const getCode = () => {
        const name = credentialName || 'Course Completion';
        const partner = partnerName || 'Your Company';

        return `LearnCard.init({
    // Your publishable key from the Developer Portal
    publishableKey: '${publishableKey}',
    
    // Partner branding
    partnerName: '${partner}',
    
    // Where to render the claim button
    target: '#claim-target',
    
    // The credential to issue
    credential: {
        "@context": [
            "https://www.w3.org/ns/credentials/v2",
            "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
        ],
        "type": ["VerifiableCredential", "OpenBadgeCredential"],
        "name": "${name}",
        "credentialSubject": {
            "type": ["AchievementSubject"],
            "achievement": {
                "type": ["Achievement"],
                "achievementType": "Certificate",
                "name": "${name}",
                "description": "Awarded for completing the course.",
                "criteria": {
                    "narrative": "Successfully completed all course requirements."
                }
            }
        }
    },
    
    // Optional: Custom branding
    branding: {
        primaryColor: '#1F51FF',
        accentColor: '#0F3BD9',
        partnerLogoUrl: 'https://your-site.com/logo.png'
    },
    
    // Called when credential is successfully claimed
    onSuccess: ({ credentialId, consentGiven }) => {
        console.log('Claimed!', credentialId);
        // Show success message, redirect, etc.
    }
});`;
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Configure the SDK</h3>

                <p className="text-gray-600">
                    Customize the credential details and branding.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Credential Name</label>

                    <input
                        type="text"
                        value={credentialName}
                        onChange={(e) => setCredentialName(e.target.value)}
                        placeholder="e.g., Course Completion"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Partner Name</label>

                    <input
                        type="text"
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        placeholder="e.g., Your Company"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                </div>
            </div>

            <CodeOutputPanel
                title="Full Configuration"
                snippets={{ typescript: getCode() }}
            />

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <h4 className="font-medium text-amber-800 mb-2">Important Options</h4>

                <ul className="text-sm text-amber-700 space-y-1">
                    <li>• <code className="bg-amber-100 px-1 rounded">publishableKey</code> — Required for real claims</li>
                    <li>• <code className="bg-amber-100 px-1 rounded">credential.name</code> — Shown on the button and modal</li>
                    <li>• <code className="bg-amber-100 px-1 rounded">onSuccess</code> — Handle post-claim actions</li>
                    <li>• <code className="bg-amber-100 px-1 rounded">requestBackgroundIssuance</code> — Ask consent for future issuance</li>
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
    credentialName: string;
    partnerName: string;
}> = ({ onBack, publishableKey, credentialName, partnerName }) => {
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
    const [credentialName, setCredentialName] = useState('');
    const [partnerName, setPartnerName] = useState('');

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
                        credentialName={credentialName}
                        setCredentialName={setCredentialName}
                        partnerName={partnerName}
                        setPartnerName={setPartnerName}
                    />
                );

            case 4:
                return (
                    <TestStep
                        onBack={guideState.prevStep}
                        publishableKey={publishableKey}
                        credentialName={credentialName}
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
