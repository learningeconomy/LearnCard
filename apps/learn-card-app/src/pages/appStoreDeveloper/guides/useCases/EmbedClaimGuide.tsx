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
    Loader2,
    Building2,
    ChevronDown,
    ChevronUp,
    Upload,
    Palette,
} from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import { useToast, useFilestack } from 'learn-card-base';
import { Clipboard } from '@capacitor/clipboard';

import { StepProgress, CodeOutputPanel, StatusIndicator, GoLiveStep } from '../shared';
import { useGuideState } from '../shared/useGuideState';
import { useDeveloperPortal } from '../../useDeveloperPortal';
import { TemplateListManager } from '../../components/TemplateListManager';
import type { ManagedTemplate } from '../../dashboards/hooks/useTemplateDetails';
import type { GuideProps } from '../GuidePage';

const STEPS = [
    { id: 'publishable-key', title: 'Get Publishable Key' },
    { id: 'add-target', title: 'Add HTML Target' },
    { id: 'load-sdk', title: 'Load SDK' },
    { id: 'configure', title: 'Configure' },
    { id: 'test', title: 'Test It' },
    { id: 'go-live', title: 'Go Live' },
];

// Step 1: Publishable Key (shows key from selected integration)
const PublishableKeyStep: React.FC<{
    onComplete: () => void;
    selectedIntegration: LCNIntegration | null;
}> = ({ onComplete, selectedIntegration }) => {
    const { presentToast } = useToast();
    const [copied, setCopied] = useState(false);

    const publishableKey = selectedIntegration?.publishableKey || '';

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
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Your Publishable Key</h3>

                <p className="text-gray-600">
                    Use this publishable key to authenticate credential claims from your website.
                    It's safe to expose in client-side code.
                </p>
            </div>

            {/* Status */}
            <StatusIndicator
                status={selectedIntegration ? 'ready' : 'warning'}
                label={selectedIntegration ? `Using "${selectedIntegration.name}"` : 'No project selected'}
                description={selectedIntegration ? 'Your publishable key is ready to use' : 'Select a project from the header dropdown'}
            />

            {/* Selected Key Display */}
            {selectedIntegration ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-emerald-800">Publishable Key</label>

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
                        This key can only be used to claim credentials. Keep your secret key secure on your server.
                    </p>
                </div>
            ) : (
                <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <Building2 className="w-10 h-10 text-amber-400 mx-auto mb-3" />

                    <p className="text-amber-800 font-medium mb-1">No Project Selected</p>

                    <p className="text-sm text-amber-700">
                        Select or create a project using the dropdown in the header to continue.
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
<!-- TODO: Verify CDN deployment URL is live before shipping -->
<script src="https://cdn.learncard.com/embed-sdk/v1/learncard.js" defer></script>

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
    selectedIntegration: LCNIntegration | null;
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
    onTemplatesChange: (templates: ManagedTemplate[]) => void;
    templates: ManagedTemplate[];
}> = ({
    onComplete,
    onBack,
    publishableKey,
    selectedIntegration,
    partnerName,
    setPartnerName,
    branding,
    setBranding,
    requestBackgroundIssuance,
    setRequestBackgroundIssuance,
    onTemplatesChange,
    templates,
}) => {
    const { presentToast } = useToast();
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [hasTemplates, setHasTemplates] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [keyCopied, setKeyCopied] = useState(false);

    // Logo upload via Filestack
    const { handleFileSelect: handleLogoUpload, isLoading: isUploadingLogo } = useFilestack({
        onUpload: (url: string) => {
            setBranding({ ...branding, partnerLogoUrl: url });
        },
        fileType: 'image/*',
    });

    // Check if branding is set
    const hasBranding = branding.primaryColor !== '#1F51FF' || branding.partnerLogoUrl;

    // Format branding object for code
    const brandingCode = `{
        primaryColor: '${branding.primaryColor}',
        accentColor: '${branding.accentColor}',${branding.partnerLogoUrl ? `
        partnerLogoUrl: '${branding.partnerLogoUrl}'` : ''}
    }`;

    const getCode = () => {
        const partner = partnerName || 'Your Company';
        const boostUri = templates[0]?.boostUri || '<your-boost-uri>';
        const credName = templates[0]?.name || 'My Credential';

        return `LearnCard.init({
    // Where to render the claim button
    target: '#claim-target',

    // The credential to issue (created via Template Builder above)
    credential: {
        name: '${credName}',
        boostUri: '${boostUri}',
    },

    // Your publishable key from the Developer Portal
    publishableKey: '${publishableKey}',

    // Partner branding
    partnerName: '${partner}',

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
    },

    // apiBaseUrl: 'https://network.learncard.com/api', // Override API base URL if needed
});`;
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Configure the SDK</h3>

                <p className="text-gray-600">
                    Create your credential template and customize branding for the claim experience.
                    Templates persist as reusable Boosts that you can reference by URI.
                </p>
            </div>

            {/* Publishable Key Display */}
            {publishableKey ? (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Key className="w-4 h-4 text-indigo-600" />
                            <label className="text-sm font-medium text-indigo-800">Publishable Key</label>
                        </div>

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

                    <p className="text-xs text-indigo-600 mt-2">
                        Change your project using the dropdown in the header.
                    </p>
                </div>
            ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Key className="w-5 h-5 text-amber-600" />
                        </div>

                        <div className="flex-1">
                            <h4 className="font-medium text-amber-800 mb-1">No Project Selected</h4>

                            <p className="text-sm text-amber-700">
                                Select or create a project using the dropdown in the header to continue.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Template Builder */}
            <TemplateListManager
                integrationId={selectedIntegration?.id}
                featureType="issue-credentials"
                showCodeSnippets={false}
                editable={true}
                onTemplateChange={(newTemplates) => {
                    setHasTemplates(newTemplates.length > 0);
                    onTemplatesChange(newTemplates);
                }}
                onBuilderOpenChange={setIsBuilderOpen}
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
                            Claim Credential
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
                    <li>• <code className="bg-amber-100 px-1 rounded">target</code> — CSS selector or HTMLElement for the claim button</li>
                    <li>• <code className="bg-amber-100 px-1 rounded">credential</code> — Credential config with name and boost URI</li>
                    <li>• <code className="bg-amber-100 px-1 rounded">publishableKey</code> — Required for real claims</li>
                    <li>• <code className="bg-amber-100 px-1 rounded">branding</code> — Customize the claim modal appearance</li>
                    <li>• <code className="bg-amber-100 px-1 rounded">requestBackgroundIssuance</code> — Ask consent for future issuance</li>
                    <li>• <code className="bg-amber-100 px-1 rounded">onSuccess</code> — Handle post-claim actions</li>
                </ul>
            </div>

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

// Step 5: Test
const TestStep: React.FC<{
    onBack: () => void;
    onComplete: () => void;
    publishableKey: string;
    templates: ManagedTemplate[];
    partnerName: string;
}> = ({ onBack, onComplete, publishableKey, templates, partnerName }) => {
    const hasTemplates = templates.length > 0;
    const firstTemplateName = hasTemplates ? templates[0]?.name || 'Untitled Template' : 'No template';
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
                        <CheckCircle2 className={`w-4 h-4 ${hasTemplates ? 'text-emerald-600' : 'text-gray-300'}`} />
                        <span className={hasTemplates ? 'text-gray-800' : 'text-gray-400'}>
                            {hasTemplates ? `Template created: ${firstTemplateName}` : 'No template created'}
                        </span>
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

// Main component
const EmbedClaimGuide: React.FC<GuideProps> = ({ selectedIntegration, setSelectedIntegration }) => {
    const { useUpdateIntegration } = useDeveloperPortal();
    const updateIntegrationMutation = useUpdateIntegration();

    // Ensure guideType is set to 'embed-claim' when entering this guide
    useEffect(() => {
        if (selectedIntegration && selectedIntegration.guideType !== 'embed-claim') {
            updateIntegrationMutation.mutate({
                id: selectedIntegration.id,
                updates: { guideType: 'embed-claim' },
            });
        }
    }, [selectedIntegration?.id, selectedIntegration?.guideType]);

    const guideState = useGuideState('embed-claim', STEPS.length, selectedIntegration);

    // Derive publishable key from selected integration
    const publishableKey = selectedIntegration?.publishableKey || '';

    const [templates, setTemplates] = useState<ManagedTemplate[]>([]);
    const [partnerName, setPartnerName] = useState('');
    const [branding, setBranding] = useState({
        primaryColor: '#1F51FF',
        accentColor: '#0F3BD9',
        partnerLogoUrl: '',
    });
    const [requestBackgroundIssuance, setRequestBackgroundIssuance] = useState(false);

    // Integration selection guard — placed after all hooks to respect Rules of Hooks
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

    const renderStep = () => {
        switch (guideState.currentStep) {
            case 0:
                return (
                    <PublishableKeyStep
                        onComplete={() => handleStepComplete('publishable-key')}
                        selectedIntegration={selectedIntegration}
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
                        selectedIntegration={selectedIntegration}
                        partnerName={partnerName}
                        setPartnerName={setPartnerName}
                        branding={branding}
                        setBranding={setBranding}
                        requestBackgroundIssuance={requestBackgroundIssuance}
                        setRequestBackgroundIssuance={setRequestBackgroundIssuance}
                        onTemplatesChange={setTemplates}
                        templates={templates}
                    />
                );

            case 4:
                return (
                    <TestStep
                        onBack={guideState.prevStep}
                        onComplete={() => handleStepComplete('test')}
                        publishableKey={publishableKey}
                        templates={templates}
                        partnerName={partnerName}
                    />
                );

            case 5:
                return (
                    <GoLiveStep
                        integration={selectedIntegration}
                        guideType="embed-claim"
                        onBack={guideState.prevStep}
                        completedItems={[
                            'Retrieved publishable key',
                            'Added HTML target element',
                            'Loaded the SDK',
                            'Configured claim settings',
                            'Tested the embed flow',
                        ]}
                        title="Ready to Embed!"
                        description="You've set up everything needed to embed claim buttons on your website. Activate your integration to start accepting claims in production."
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
