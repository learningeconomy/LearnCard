import React, { useState, useCallback, useEffect } from 'react';
import { 
    Globe, 
    Package, 
    Code, 
    Rocket, 
    ArrowRight, 
    ArrowLeft, 
    ExternalLink,
    CheckCircle2,
    Plus,
    FolderOpen,
    Sparkles,
    Terminal,
    FileCode,
    Layers,
    Loader2,
    XCircle,
    AlertCircle,
    Search,
    Lock,
    Shield,
    Monitor,
    User,
    Send,
    Navigation,
    FileSearch,
    Key,
    ClipboardCheck,
    FileText,
    Copy,
    Check,
    ChevronRight,
    Info,
    Zap,
    Award,
    Trash2,
    RefreshCw,
    Eye,
    MoreVertical,
    Edit3,
    Link as LinkIcon,
    FileJson,
    ChevronDown,
    Server,
} from 'lucide-react';

import type { LCNIntegration, AppStoreListing } from '@learncard/types';

import { StepProgress, CodeOutputPanel } from '../shared';
import { useGuideState } from '../shared/useGuideState';
import { useWallet, useToast, ToastTypeEnum } from 'learn-card-base';
import OBv3CredentialBuilder from '../../../../components/credentials/OBv3CredentialBuilder';
import { useDeveloperPortal } from '../../useDeveloperPortal';
import { ConsentFlowContractSelector } from '../../components/ConsentFlowContractSelector';
import { CodeBlock } from '../../components/CodeBlock';
import type { GuideProps } from '../GuidePage';

// URL Check types and helper
interface UrlCheckResult {
    id: string;
    label: string;
    status: 'pending' | 'checking' | 'pass' | 'fail' | 'warn';
    message?: string;
}

const checkUrl = async (url: string): Promise<UrlCheckResult[]> => {
    const results: UrlCheckResult[] = [
        { id: 'https', label: 'HTTPS', status: 'pending' },
        { id: 'reachable', label: 'Reachable', status: 'pending' },
        { id: 'cors', label: 'CORS Headers', status: 'pending' },
    ];

    // Check 1: HTTPS
    try {
        const parsed = new URL(url);

        if (parsed.protocol === 'https:') {
            results[0] = { ...results[0], status: 'pass', message: 'Using secure HTTPS' };
        } else if (parsed.protocol === 'http:') {
            if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
                results[0] = { ...results[0], status: 'warn', message: 'HTTP allowed for localhost' };
            } else {
                results[0] = { ...results[0], status: 'fail', message: 'HTTPS required for production' };
            }
        } else {
            results[0] = { ...results[0], status: 'fail', message: 'Invalid protocol' };
        }
    } catch {
        results[0] = { ...results[0], status: 'fail', message: 'Invalid URL format' };
        results[1] = { ...results[1], status: 'fail', message: 'Cannot check - invalid URL' };
        results[2] = { ...results[2], status: 'fail', message: 'Cannot check - invalid URL' };
        return results;
    }

    // Check 2 & 3: Reachability and CORS
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
            method: 'HEAD',
            mode: 'cors',
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Reachable
        results[1] = { ...results[1], status: 'pass', message: `Status ${response.status}` };

        // Check CORS headers
        const corsHeader = response.headers.get('Access-Control-Allow-Origin');

        if (corsHeader === '*' || corsHeader) {
            results[2] = { ...results[2], status: 'pass', message: `CORS: ${corsHeader}` };
        } else {
            results[2] = { ...results[2], status: 'warn', message: 'CORS header not visible (may still work)' };
        }
    } catch (err) {
        if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
            // CORS block or network error
            results[1] = { ...results[1], status: 'warn', message: 'Blocked by CORS or unreachable' };
            results[2] = { ...results[2], status: 'fail', message: 'CORS not configured or blocking' };
        } else if (err instanceof DOMException && err.name === 'AbortError') {
            results[1] = { ...results[1], status: 'fail', message: 'Request timed out (10s)' };
            results[2] = { ...results[2], status: 'pending', message: 'Could not check' };
        } else {
            results[1] = { ...results[1], status: 'fail', message: 'Network error' };
            results[2] = { ...results[2], status: 'pending', message: 'Could not check' };
        }
    }

    return results;
};

// URL Check Results Component
const UrlCheckResults: React.FC<{ results: UrlCheckResult[]; isChecking: boolean }> = ({ results, isChecking }) => {
    const getIcon = (status: UrlCheckResult['status']) => {
        switch (status) {
            case 'checking':
                return <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />;
            case 'pass':
                return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case 'fail':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'warn':
                return <AlertCircle className="w-4 h-4 text-amber-500" />;
            default:
                return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
        }
    };

    const getCheckIcon = (id: string) => {
        switch (id) {
            case 'https':
                return <Lock className="w-4 h-4 text-gray-400" />;
            case 'reachable':
                return <Monitor className="w-4 h-4 text-gray-400" />;
            case 'cors':
                return <Shield className="w-4 h-4 text-gray-400" />;
            default:
                return null;
        }
    };

    const allPassed = results.every(r => r.status === 'pass' || r.status === 'warn');
    const hasFailed = results.some(r => r.status === 'fail');

    return (
        <div className={`p-4 rounded-xl border ${
            isChecking ? 'bg-gray-50 border-gray-200' :
            allPassed ? 'bg-emerald-50 border-emerald-200' :
            hasFailed ? 'bg-red-50 border-red-200' :
            'bg-gray-50 border-gray-200'
        }`}>
            <div className="flex items-center gap-2 mb-3">
                {isChecking ? (
                    <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
                ) : allPassed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : hasFailed ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                ) : (
                    <Search className="w-5 h-5 text-gray-400" />
                )}

                <h4 className={`font-medium ${
                    isChecking ? 'text-gray-700' :
                    allPassed ? 'text-emerald-800' :
                    hasFailed ? 'text-red-800' :
                    'text-gray-700'
                }`}>
                    {isChecking ? 'Checking your URL...' :
                     allPassed ? 'Looking good!' :
                     hasFailed ? 'Some issues found' :
                     'URL Check Results'}
                </h4>
            </div>

            <div className="space-y-2">
                {results.map(result => (
                    <div key={result.id} className="flex items-center gap-3">
                        {getCheckIcon(result.id)}

                        <div className="flex-1">
                            <span className="text-sm font-medium text-gray-700">{result.label}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            {result.message && (
                                <span className={`text-xs ${
                                    result.status === 'pass' ? 'text-emerald-600' :
                                    result.status === 'fail' ? 'text-red-600' :
                                    result.status === 'warn' ? 'text-amber-600' :
                                    'text-gray-500'
                                }`}>
                                    {result.message}
                                </span>
                            )}

                            {getIcon(isChecking && result.status === 'pending' ? 'checking' : result.status)}
                        </div>
                    </div>
                ))}
            </div>

            {!isChecking && hasFailed && (
                <p className="mt-3 text-xs text-red-600">
                    Fix the issues above before continuing. See the header examples below.
                </p>
            )}

            {!isChecking && allPassed && (
                <p className="mt-3 text-xs text-emerald-600">
                    Your URL passed basic checks. You may still need to configure iframe headers (X-Frame-Options).
                </p>
            )}
        </div>
    );
};

type AppType = 'existing' | 'new' | null;

// Feature definitions
interface Feature {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    requiresSetup: boolean;
    setupDescription?: string;
    color: string;
}

const FEATURES: Feature[] = [
    {
        id: 'issue-credentials',
        title: 'Issue Credentials',
        description: 'Award badges, certificates, or achievements to your users when they complete actions in your app.',
        icon: <Award className="w-6 h-6" />,
        requiresSetup: true,
        setupDescription: 'Create Templates, Consent Flow',
        color: 'cyan',
    },
    {
        id: 'peer-badges',
        title: 'Peer-to-Peer Badges',
        description: 'Let users send badges to each other within your app using your credential templates.',
        icon: <Send className="w-6 h-6" />,
        requiresSetup: true,
        setupDescription: 'Create Boost Templates',
        color: 'violet',
    },
    {
        id: 'open-wallet',
        title: 'Open Wallet',
        description: 'Let users view their credential wallet directly from your app.',
        icon: <FolderOpen className="w-6 h-6" />,
        requiresSetup: false,
        color: 'purple',
    },
    {
        id: 'claim-credentials',
        title: 'Claim Credentials',
        description: 'Create shareable claim links that let users claim pre-defined credentials.',
        icon: <Sparkles className="w-6 h-6" />,
        requiresSetup: true,
        setupDescription: 'Create Claim Links',
        color: 'emerald',
    },
    {
        id: 'request-credentials',
        title: 'Request Credentials',
        description: 'Ask users to share credentials with your app for verification or gated access.',
        icon: <FileSearch className="w-6 h-6" />,
        requiresSetup: true,
        setupDescription: 'Configure Search Query',
        color: 'amber',
    },
];

const STEPS = [
    { id: 'getting-started', title: 'Getting Started' },
    { id: 'choose-features', title: 'Choose Features' },
    { id: 'feature-setup', title: 'Feature Setup' },
    { id: 'your-app', title: 'Your App' },
];

// Step 0: Getting Started (combined setup step - single scrollable page)
const GettingStartedStep: React.FC<{
    onComplete: () => void;
    selectedIntegration: LCNIntegration | null;
    selectedListing: AppStoreListing | null;
    setSelectedListing: (listing: AppStoreListing | null) => void;
}> = ({ onComplete, selectedIntegration, selectedListing, setSelectedListing }) => {
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Listing management
    const { useListingsForIntegration, useCreateListing } = useDeveloperPortal();
    const { data: listings, isLoading: isLoadingListings, refetch: refetchListings } = useListingsForIntegration(selectedIntegration?.id || null);
    const createListingMutation = useCreateListing();
    const [isCreatingListing, setIsCreatingListing] = useState(false);
    const [newListingName, setNewListingName] = useState('');

    // Auto-select first listing when integration changes
    useEffect(() => {
        if (listings && listings.length > 0 && !selectedListing) {
            setSelectedListing(listings[0]);
        }
    }, [listings, selectedListing, setSelectedListing]);

    // Clear listing when integration changes
    useEffect(() => {
        setSelectedListing(null);
    }, [selectedIntegration?.id]);

    const handleCreateListing = async () => {
        if (!newListingName.trim() || !selectedIntegration) return;

        try {
            await createListingMutation.mutateAsync({
                integrationId: selectedIntegration.id,
                listing: {
                    display_name: newListingName.trim(),
                    tagline: `${newListingName.trim()} - An embedded LearnCard app`,
                    full_description: `${newListingName.trim()} is an embedded application that integrates with the LearnCard wallet.`,
                    icon_url: 'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb',
                    launch_type: 'EMBEDDED_IFRAME',
                    launch_config_json: JSON.stringify({ url: '' }),
                },
            });

            await refetchListings();
            setNewListingName('');
            setIsCreatingListing(false);
        } catch (err) {
            console.error('Failed to create listing:', err);
        }
    };

    const handleCopy = async (code: string, id: string) => {
        await navigator.clipboard.writeText(code);
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const installCode = `npm install @learncard/partner-connect`;

    const initCode = `import { createPartnerConnect } from '@learncard/partner-connect';

const learnCard = createPartnerConnect({
    hostOrigin: 'https://learncard.app'
});

// Get user identity (SSO - no login needed!)
const identity = await learnCard.requestIdentity();
console.log('User:', identity.profile.displayName);`;

    const isReady = !!selectedIntegration && !!selectedListing;

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Getting Started</h3>

                <p className="text-gray-600">
                    Set up the Partner Connect SDK in your web app. This takes about 2 minutes.
                </p>
            </div>

            {/* Section 1: Select/Create App */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-100 text-cyan-700 rounded-lg flex items-center justify-center font-semibold text-sm">
                        1
                    </div>

                    <h4 className="font-semibold text-gray-800">Select or Create Your App</h4>
                </div>

                <div className="ml-11 space-y-3">
                    <p className="text-sm text-gray-500">
                        Your app listing is what users see in the LearnCard app store.
                    </p>

                    {!selectedIntegration ? (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <p className="text-sm text-amber-700">
                                Select a project from the header dropdown first.
                            </p>
                        </div>
                    ) : isLoadingListings ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {listings && listings.length > 0 && (
                                <div className="space-y-2">
                                    {listings.map((listing) => (
                                        <button
                                            key={listing.listing_id}
                                            onClick={() => setSelectedListing(listing)}
                                            className={`w-full flex items-center justify-between p-3 border-2 rounded-xl transition-all ${
                                                selectedListing?.listing_id === listing.listing_id
                                                    ? 'border-cyan-500 bg-cyan-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <span className="font-medium text-gray-800">{listing.display_name}</span>

                                            {selectedListing?.listing_id === listing.listing_id && (
                                                <CheckCircle2 className="w-5 h-5 text-cyan-500" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {isCreatingListing ? (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newListingName}
                                        onChange={(e) => setNewListingName(e.target.value)}
                                        placeholder="App name..."
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleCreateListing();
                                            if (e.key === 'Escape') setIsCreatingListing(false);
                                        }}
                                    />

                                    <button
                                        onClick={handleCreateListing}
                                        disabled={!newListingName.trim() || createListingMutation.isPending}
                                        className="px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 disabled:opacity-50 transition-colors"
                                    >
                                        {createListingMutation.isPending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            'Create'
                                        )}
                                    </button>

                                    <button
                                        onClick={() => setIsCreatingListing(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsCreatingListing(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 text-gray-600 rounded-xl hover:border-cyan-400 hover:text-cyan-600 hover:bg-cyan-50/50 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create New App
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Section 2: Install SDK */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-100 text-cyan-700 rounded-lg flex items-center justify-center font-semibold text-sm">
                        2
                    </div>

                    <h4 className="font-semibold text-gray-800">Install the SDK</h4>
                </div>

                <div className="ml-11 space-y-3">
                    <CodeBlock code={installCode} />

                    <p className="text-xs text-gray-500">
                        Also works with <code className="bg-gray-100 px-1 rounded">yarn add</code> or <code className="bg-gray-100 px-1 rounded">pnpm add</code>
                    </p>
                </div>
            </div>

            {/* Section 3: Initialize */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cyan-100 text-cyan-700 rounded-lg flex items-center justify-center font-semibold text-sm">
                        3
                    </div>

                    <h4 className="font-semibold text-gray-800">Initialize</h4>
                </div>

                <div className="ml-11 space-y-3">
                    <CodeBlock code={initCode} />

                    <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl">
                        <p className="text-sm text-cyan-800">
                            <strong>That's it!</strong> Users are already logged in when inside the wallet, so <code className="bg-cyan-100 px-1 rounded">requestIdentity()</code> returns instantly with their profile.
                        </p>
                    </div>
                </div>
            </div>

            {/* Continue button */}
            <button
                onClick={onComplete}
                disabled={!isReady}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isReady ? (
                    <>
                        Choose What to Build
                        <ArrowRight className="w-4 h-4" />
                    </>
                ) : (
                    'Select an app above to continue'
                )}
            </button>
        </div>
    );
};

// Step 1: Choose Features (the hub)
const ChooseFeaturesStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
    selectedFeatures: string[];
    setSelectedFeatures: (features: string[]) => void;
}> = ({ onComplete, onBack, selectedFeatures, setSelectedFeatures }) => {
    const toggleFeature = (featureId: string) => {
        if (selectedFeatures.includes(featureId)) {
            setSelectedFeatures(selectedFeatures.filter(f => f !== featureId));
        } else {
            setSelectedFeatures([...selectedFeatures, featureId]);
        }
    };

    const getColorClasses = (color: string, isSelected: boolean) => {
        const colors: Record<string, { border: string; bg: string; icon: string }> = {
            cyan: { border: 'border-cyan-500', bg: 'bg-cyan-50', icon: 'text-cyan-600 bg-cyan-100' },
            violet: { border: 'border-violet-500', bg: 'bg-violet-50', icon: 'text-violet-600 bg-violet-100' },
            purple: { border: 'border-purple-500', bg: 'bg-purple-50', icon: 'text-purple-600 bg-purple-100' },
            emerald: { border: 'border-emerald-500', bg: 'bg-emerald-50', icon: 'text-emerald-600 bg-emerald-100' },
            amber: { border: 'border-amber-500', bg: 'bg-amber-50', icon: 'text-amber-600 bg-amber-100' },
        };

        const c = colors[color] || colors.cyan;

        return isSelected
            ? { border: c.border, bg: c.bg, icon: c.icon }
            : { border: 'border-gray-200', bg: 'bg-white', icon: 'text-gray-500 bg-gray-100' };
    };

    const hasFeatureWithSetup = selectedFeatures.some(id => 
        FEATURES.find(f => f.id === id)?.requiresSetup
    );

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">What do you want to build?</h3>

                <p className="text-gray-600">
                    Select the features you want to add to your app. You can always add more later.
                </p>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FEATURES.map(feature => {
                    const isSelected = selectedFeatures.includes(feature.id);
                    const colors = getColorClasses(feature.color, isSelected);

                    return (
                        <button
                            key={feature.id}
                            onClick={() => toggleFeature(feature.id)}
                            className={`flex flex-col items-start p-5 border-2 rounded-2xl text-left transition-all ${colors.border} ${colors.bg}`}
                        >
                            <div className="w-full flex items-start justify-between mb-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.icon}`}>
                                    {feature.icon}
                                </div>

                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                    isSelected ? 'border-current bg-current' : 'border-gray-300'
                                }`}>
                                    {isSelected && <Check className="w-4 h-4 text-white" />}
                                </div>
                            </div>

                            <h4 className="font-semibold text-gray-800 mb-1">{feature.title}</h4>

                            <p className="text-sm text-gray-600 mb-3">{feature.description}</p>

                            {feature.requiresSetup && (
                                <div className="flex items-center gap-1.5 mt-auto">
                                    <Layers className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-xs text-gray-500">Requires: {feature.setupDescription}</span>
                                </div>
                            )}

                            {!feature.requiresSetup && (
                                <div className="flex items-center gap-1.5 mt-auto">
                                    <Zap className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-xs text-emerald-600 font-medium">Ready to use</span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Selection summary */}
            {selectedFeatures.length > 0 && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <h4 className="font-medium text-gray-800 mb-2">
                        Selected: {selectedFeatures.length} feature{selectedFeatures.length !== 1 ? 's' : ''}
                    </h4>

                    <div className="flex flex-wrap gap-2">
                        {selectedFeatures.map(id => {
                            const feature = FEATURES.find(f => f.id === id);

                            return feature ? (
                                <span key={id} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700">
                                    {feature.title}
                                </span>
                            ) : null;
                        })}
                    </div>

                    {hasFeatureWithSetup && (
                        <p className="mt-3 text-sm text-gray-500">
                            Some features require additional setup. We'll guide you through it.
                        </p>
                    )}
                </div>
            )}

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
                    disabled={selectedFeatures.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {hasFeatureWithSetup ? 'Continue to Setup' : 'See Your Code'}
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// Legacy step components below (keeping for reference, not used in new flow)
// TODO: Remove these in a future cleanup

const SetupWebsiteStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
    appUrl: string;
    setAppUrl: (url: string) => void;
    appType: AppType;
    selectedFramework: string;
    setSelectedFramework: (framework: string) => void;
}> = ({ onComplete, onBack, appUrl, setAppUrl, appType, selectedFramework, setSelectedFramework }) => {
    const frameworks = [
        { id: 'react', name: 'React', icon: '⚛️', cmd: 'npx create-react-app my-learncard-app' },
        { id: 'next', name: 'Next.js', icon: '▲', cmd: 'npx create-next-app@latest my-learncard-app' },
        { id: 'vite', name: 'Vite', icon: '⚡', cmd: 'npm create vite@latest my-learncard-app' },
        { id: 'vue', name: 'Vue', icon: '💚', cmd: 'npm create vue@latest my-learncard-app' },
    ];

    // New app path
    if (appType === 'new') {
        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Create Your App</h3>

                    <p className="text-gray-600">
                        Choose a framework and we'll give you the commands to get started with a pre-configured setup.
                    </p>
                </div>

                {/* Framework selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Choose a framework</label>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {frameworks.map(fw => (
                            <button
                                key={fw.id}
                                onClick={() => setSelectedFramework(fw.id)}
                                className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all ${
                                    selectedFramework === fw.id
                                        ? 'border-violet-500 bg-violet-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <span className="text-2xl mb-1">{fw.icon}</span>
                                <span className="text-sm font-medium text-gray-800">{fw.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Commands based on selection */}
                {selectedFramework && (
                    <div className="space-y-4">
                        <CodeOutputPanel
                            title="1. Create your project"
                            snippets={{
                                typescript: `# Create a new ${frameworks.find(f => f.id === selectedFramework)?.name} project
${frameworks.find(f => f.id === selectedFramework)?.cmd}

cd my-learncard-app`,
                            }}
                        />

                        <CodeOutputPanel
                            title="2. Install Partner Connect SDK"
                            snippets={{
                                typescript: `npm install @learncard/partner-connect`,
                            }}
                        />

                        {selectedFramework === 'next' && (
                            <CodeOutputPanel
                                title="3. Configure headers (next.config.js)"
                                snippets={{
                                    typescript: `/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Frame-Options', value: 'ALLOWALL' },
                    { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
                ],
            },
        ];
    },
};

module.exports = nextConfig;`,
                                }}
                            />
                        )}

                        {selectedFramework === 'vite' && (
                            <CodeOutputPanel
                                title="3. Configure headers (vite.config.ts)"
                                snippets={{
                                    typescript: `import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        headers: {
            'X-Frame-Options': 'ALLOWALL',
            'Content-Security-Policy': 'frame-ancestors *',
        },
    },
});`,
                                }}
                            />
                        )}

                        {(selectedFramework === 'react' || selectedFramework === 'vue') && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <h4 className="font-medium text-amber-800 mb-2">Configure headers on your server</h4>

                                <p className="text-sm text-amber-700">
                                    When you deploy, you'll need to configure your hosting provider to add these headers.
                                    Most providers (Vercel, Netlify, etc.) support this in their config files.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* App name input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">App Name (for reference)</label>

                    <input
                        type="text"
                        value={appUrl}
                        onChange={(e) => setAppUrl(e.target.value)}
                        placeholder="My LearnCard App"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
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
                        disabled={!selectedFramework}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Continue
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    // Existing app path - state for URL checking
    const [isChecking, setIsChecking] = useState(false);
    const [checkResults, setCheckResults] = useState<UrlCheckResult[] | null>(null);

    const handleCheckUrl = useCallback(async () => {
        if (!appUrl.trim()) return;

        setIsChecking(true);
        setCheckResults([
            { id: 'https', label: 'HTTPS', status: 'pending' },
            { id: 'reachable', label: 'Reachable', status: 'pending' },
            { id: 'cors', label: 'CORS Headers', status: 'pending' },
        ]);

        const results = await checkUrl(appUrl.trim());
        setCheckResults(results);
        setIsChecking(false);
    }, [appUrl]);

    // Auto-check when URL looks complete
    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUrl = e.target.value;
        setAppUrl(newUrl);

        // Reset results when URL changes
        if (checkResults) {
            setCheckResults(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Configure Your Existing App</h3>

                <p className="text-gray-600">
                    Your app will run inside an iframe in the LearnCard wallet. Enter your URL and we'll 
                    check if it's ready for embedding.
                </p>
            </div>

            {/* URL input with check button */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your App URL</label>

                <div className="flex gap-2">
                    <input
                        type="url"
                        value={appUrl}
                        onChange={handleUrlChange}
                        placeholder="https://your-app.com"
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && appUrl.trim()) {
                                handleCheckUrl();
                            }
                        }}
                    />

                    <button
                        onClick={handleCheckUrl}
                        disabled={!appUrl.trim() || isChecking}
                        className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isChecking ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Search className="w-4 h-4" />
                        )}
                        Check
                    </button>
                </div>

                <p className="text-xs text-gray-500 mt-1">
                    Enter your URL and click Check to verify requirements
                </p>
            </div>

            {/* URL Check Results */}
            {checkResults && (
                <UrlCheckResults results={checkResults} isChecking={isChecking} />
            )}

            {/* Required headers */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <h4 className="font-medium text-amber-800 mb-2">Required Response Headers</h4>

                <p className="text-sm text-amber-700 mb-3">
                    Your server must return these headers to allow iframe embedding:
                </p>

                <CodeOutputPanel
                    title="Server Headers"
                    snippets={{
                        typescript: `// Express.js example
app.use((req, res, next) => {
    // Allow iframe embedding from any origin
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Content-Security-Policy', "frame-ancestors *");
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    next();
});`,
                        curl: `# Nginx configuration
location / {
    add_header X-Frame-Options "ALLOWALL";
    add_header Content-Security-Policy "frame-ancestors *";
    add_header Access-Control-Allow-Origin "*";
}`,
                        python: `# Flask example
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.after_request
def add_headers(response):
    response.headers['X-Frame-Options'] = 'ALLOWALL'
    response.headers['Content-Security-Policy'] = 'frame-ancestors *'
    return response`,
                    }}
                    defaultLanguage="typescript"
                />
            </div>

            {/* Common issues */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <h4 className="font-medium text-gray-800 mb-2">Common Issues</h4>

                <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold">!</span>
                        <div>
                            <strong className="text-gray-700">Blank iframe?</strong>
                            <span className="text-gray-600"> — Check your X-Frame-Options header isn't set to DENY or SAMEORIGIN</span>
                        </div>
                    </div>

                    <div className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold">!</span>
                        <div>
                            <strong className="text-gray-700">Mixed content error?</strong>
                            <span className="text-gray-600"> — Make sure your app uses HTTPS</span>
                        </div>
                    </div>

                    <div className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold">!</span>
                        <div>
                            <strong className="text-gray-700">CORS errors?</strong>
                            <span className="text-gray-600"> — Add Access-Control-Allow-Origin header</span>
                        </div>
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

// Step 2: Install SDK
const InstallSdkStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
}> = ({ onComplete, onBack }) => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Install the SDK</h3>

                <p className="text-gray-600">
                    The Partner Connect SDK lets your embedded app communicate with the LearnCard wallet.
                </p>
            </div>

            <CodeOutputPanel
                title="Installation"
                snippets={{
                    typescript: `# npm
npm install @learncard/partner-connect

# yarn
yarn add @learncard/partner-connect

# pnpm
pnpm add @learncard/partner-connect`,
                }}
            />

            {/* What you get */}
            <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
                <h4 className="font-medium text-cyan-800 mb-3">What's included</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-cyan-800">Single Sign-On</p>
                            <p className="text-xs text-cyan-600">Get user identity instantly</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-cyan-800">Send Credentials</p>
                            <p className="text-xs text-cyan-600">Issue VCs to the wallet</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-cyan-800">Request Credentials</p>
                            <p className="text-xs text-cyan-600">Search user's wallet</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-cyan-800">Navigation</p>
                            <p className="text-xs text-cyan-600">Launch wallet features</p>
                        </div>
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

// Step 3: Initialize
const InitializeStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
}> = ({ onComplete, onBack }) => {
    const initCode = `import { createPartnerConnect } from '@learncard/partner-connect';

// Initialize the SDK
const learnCard = createPartnerConnect({
    hostOrigin: 'https://learncard.app'
});

// Request user identity (like SSO)
const identity = await learnCard.requestIdentity();

console.log('User DID:', identity.did);
console.log('User Profile:', identity.profile);
// profile contains: displayName, profileId, image, etc.`;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Initialize the SDK</h3>

                <p className="text-gray-600">
                    Set up the SDK when your app loads. You can immediately request the user's identity — 
                    no login required since they're already in the wallet.
                </p>
            </div>

            <CodeOutputPanel
                title="Initialization Code"
                snippets={{ typescript: initCode }}
            />

            {/* Identity response example */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <h4 className="font-medium text-gray-800 mb-2">Example Response</h4>

                <CodeBlock code={`{
  "did": "did:web:network.learncard.com:users:abc123",
  "profile": {
    "displayName": "John Doe",
    "profileId": "johndoe",
    "image": "https://..."
  }
}`} />
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

// Boost Template type
interface BoostTemplate {
    uri: string;
    name: string;
    description?: string;
    type?: string;
    category?: string;
    image?: string;
    createdAt?: string;
}

// Template Manager Component - supports both initiateTemplateIssue and send() styles
type TemplateCodeStyle = 'initiateTemplateIssue' | 'send';

const TemplateManager: React.FC<{
    appListingId?: string;
    appName?: string;
    codeStyle?: TemplateCodeStyle;
    contractUri?: string;
}> = ({ appListingId, appName, codeStyle = 'initiateTemplateIssue', contractUri }) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();

    const [templates, setTemplates] = useState<BoostTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [showCredentialBuilder, setShowCredentialBuilder] = useState(false);
    const [copiedUri, setCopiedUri] = useState<string | null>(null);
    const [deletingUri, setDeletingUri] = useState<string | null>(null);
    const [copiedJson, setCopiedJson] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Store initWallet in a ref to avoid dependency issues
    const initWalletRef = React.useRef(initWallet);
    initWalletRef.current = initWallet;

    // Helper to fetch templates
    const fetchTemplatesForListing = async (listingId: string): Promise<BoostTemplate[]> => {
        const wallet = await initWalletRef.current();
        const result = await wallet.invoke.getPaginatedBoosts({ 
            limit: 100,
            query: { meta: { appListingId: listingId } }
        });

        return (result?.records || [])
            .map((boost: Record<string, unknown>) => ({
                uri: boost.uri as string,
                name: boost.name as string || 'Untitled Template',
                description: boost.description as string,
                type: boost.type as string,
                category: boost.category as string,
                image: boost.image as string,
                createdAt: boost.createdAt as string,
            }));
    };

    // Fetch templates when appListingId changes
    useEffect(() => {
        let cancelled = false;

        if (!appListingId) {
            setTemplates([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        fetchTemplatesForListing(appListingId)
            .then((boostTemplates) => {
                if (!cancelled) {
                    setTemplates(boostTemplates);
                }
            })
            .catch((err) => {
                console.error('Failed to fetch templates:', err);
                if (!cancelled) {
                    setTemplates([]);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [appListingId]);

    // Manual refresh function
    const refreshTemplates = async () => {
        if (!appListingId) return;

        setIsLoading(true);

        try {
            const boostTemplates = await fetchTemplatesForListing(appListingId);
            setTemplates(boostTemplates);
        } catch (err) {
            console.error('Failed to refresh templates:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Create a new boost template from credential
    const handleCreateTemplate = async (credential: Record<string, unknown>) => {
        if (!appListingId) {
            presentToast('No app listing selected', { type: ToastTypeEnum.Error });
            return;
        }

        setIsCreating(true);

        try {
            const wallet = await initWallet();

            // The OBv3CredentialBuilder now outputs properly structured credentials
            // Just issue it directly
            const vc = await wallet.invoke.issueCredential(credential as Parameters<typeof wallet.invoke.issueCredential>[0]);
            console.log("Issued credential:", vc);
            // Create the boost with public issuance permission
            const boostMetadata = {
                name: (credential.name as string) || 'Template',
                type: ((credential.credentialSubject as Record<string, unknown>)?.achievement as Record<string, unknown>)?.achievementType as string || 'Achievement',
                category: 'achievement',
                meta: { appListingId }, // Store app listing ID in metadata for filtering
                defaultPermissions: {
                    canIssue: true, // Public template - anyone can issue
                },
            };
            const boostUri = await wallet.invoke.createBoost(vc, boostMetadata as unknown as Parameters<typeof wallet.invoke.createBoost>[1]);

            presentToast('Template created successfully!', { type: ToastTypeEnum.Success });

            // Refresh the list
            await refreshTemplates();

            setShowCredentialBuilder(false);
        } catch (err) {
            console.error('Failed to create template:', err);
            presentToast('Failed to create template', { type: ToastTypeEnum.Error });
        } finally {
            setIsCreating(false);
        }
    };

    // Delete a template
    const handleDeleteTemplate = async (uri: string) => {
        setDeletingUri(uri);

        try {
            const wallet = await initWallet();
            await wallet.invoke.deleteBoost(uri);
            presentToast('Template deleted', { type: ToastTypeEnum.Success });
            await refreshTemplates();
        } catch (err) {
            console.error('Failed to delete template:', err);
            presentToast('Failed to delete template', { type: ToastTypeEnum.Error });
        } finally {
            setDeletingUri(null);
        }
    };

    // Copy URI to clipboard
    const handleCopyUri = async (uri: string) => {
        await navigator.clipboard.writeText(uri);
        setCopiedUri(uri);
        setTimeout(() => setCopiedUri(null), 2000);
    };

    // Generate code example for a template based on code style
    const getCodeExample = (uri: string) => {
        if (codeStyle === 'send') {
            return `// Send credential to user's wallet (after consent)
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: recipientDid, // From requestIdentity()
    templateUri: '${uri}',
    contractUri: '${contractUri || 'YOUR_CONTRACT_URI'}',
});

console.log('Credential synced:', result);`;
        }

        // Default: initiateTemplateIssue style
        return `// Issue from your template
const result = await learnCard.initiateTemplateIssue({
    templateUri: '${uri}'
});

if (result.success) {
    console.log('Credential issued to user!');
}`;
    };

    // Generate JSON summary of all templates
    const getJsonSummary = () => JSON.stringify(
        templates.map(t => ({
            boostUri: t.uri,
            name: t.name,
            description: t.description || '',
            image: t.image || '',
        })),
        null,
        2
    );

    // Copy JSON summary
    const handleCopyJson = async () => {
        await navigator.clipboard.writeText(getJsonSummary());
        setCopiedJson(true);
        setTimeout(() => setCopiedJson(false), 2000);
    };

    // Server-side code example
    const getServerSideCode = () => `// Server-side: Retrieve all boost templates for your app
import { initLearnCard } from '@learncard/init';

async function getAppBoostTemplates(appListingId: string) {
    // Initialize LearnCard with your credentials
    const learnCard = await initLearnCard({
        // Your authentication config
    });

    // Fetch boosts filtered by appListingId in meta
    const result = await learnCard.invoke.getPaginatedBoosts({ 
        limit: 100,
        query: { meta: { appListingId } }
    });

    // Map to your desired format
    const templates = (result?.records || []).map(boost => ({
        boostUri: boost.uri,
        name: boost.name,
        description: boost.description || '',
        image: boost.image || '',
        type: boost.type,
    }));

    return templates;
}

// Usage
const templates = await getAppBoostTemplates('${appListingId}');
console.log('Available templates:', templates);`;

    if (!appListingId) {
        return (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />

                    <div>
                        <h4 className="font-medium text-amber-800 mb-1">App Listing Required</h4>

                        <p className="text-sm text-amber-700">
                            To create and manage boost templates, select an integration and app listing above.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-semibold text-gray-800">Your Boost Templates</h4>

                    <p className="text-sm text-gray-500">
                        Create credential templates that your embedded app can issue to users
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {templates.length > 0 && (
                        <button
                            onClick={handleCopyJson}
                            className="flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                            title="Copy JSON summary of all templates"
                        >
                            {copiedJson ? (
                                <>
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span className="text-emerald-600">Copied!</span>
                                </>
                            ) : (
                                <>
                                    <FileJson className="w-4 h-4" />
                                    <span>Copy JSON</span>
                                </>
                            )}
                        </button>
                    )}

                    <button
                        onClick={refreshTemplates}
                        disabled={isLoading}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                        onClick={() => setShowCredentialBuilder(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Template
                    </button>
                </div>
            </div>

            {/* Loading state */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
                </div>
            )}

            {/* Empty state */}
            {!isLoading && templates.length === 0 && (
                <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-6 h-6 text-gray-400" />
                    </div>

                    <h4 className="font-medium text-gray-700 mb-1">No templates yet</h4>

                    <p className="text-sm text-gray-500 mb-4">
                        Create your first boost template to start issuing credentials from your app
                    </p>

                    <button
                        onClick={() => setShowCredentialBuilder(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Create Template
                    </button>
                </div>
            )}

            {/* Template list */}
            {!isLoading && templates.length > 0 && (
                <div className="space-y-3">
                    {templates.map(template => (
                        <div
                            key={template.uri}
                            className="p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                        >
                            <div className="flex items-start gap-4">
                                {/* Template image */}
                                <div className="w-12 h-12 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {template.image ? (
                                        <img 
                                            src={template.image} 
                                            alt={template.name} 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Award className="w-6 h-6 text-cyan-600" />
                                    )}
                                </div>

                                {/* Template info */}
                                <div className="flex-1 min-w-0">
                                    <h5 className="font-medium text-gray-800 truncate">
                                        {template.name}
                                    </h5>

                                    <div className="flex items-center gap-2 mt-1">
                                        {template.type && (
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                                {template.type}
                                            </span>
                                        )}

                                        <span className="text-xs text-gray-400 truncate font-mono">
                                            {template.uri.slice(0, 30)}...
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                        onClick={() => handleCopyUri(template.uri)}
                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Copy URI"
                                    >
                                        {copiedUri === template.uri ? (
                                            <Check className="w-4 h-4 text-emerald-500" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>

                                    <button
                                        onClick={() => handleDeleteTemplate(template.uri)}
                                        disabled={deletingUri === template.uri}
                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        {deletingUri === template.uri ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Code example (collapsed by default, could expand) */}
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="mb-2">
                                    <span className="text-xs font-medium text-gray-500">Use in your app:</span>
                                </div>

                                <CodeBlock code={getCodeExample(template.uri)} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Advanced Section - Server-side code */}
            {templates.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Server className="w-5 h-5 text-gray-500" />
                            <div className="text-left">
                                <h5 className="font-medium text-gray-700">Advanced: Server-Side Integration</h5>
                                <p className="text-xs text-gray-500">Retrieve templates programmatically from your backend</p>
                            </div>
                        </div>

                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                    </button>

                    {showAdvanced && (
                        <div className="p-4 border-t border-gray-200 bg-white space-y-4">
                            <p className="text-sm text-gray-600">
                                Use this server-side function to dynamically retrieve all boost templates for your app listing.
                                This is useful for building template pickers or syncing templates to your database.
                            </p>

                            <div>
                                <div className="mb-2">
                                    <span className="text-xs font-medium text-gray-500">Server-side code (Node.js/TypeScript):</span>
                                </div>

                                <CodeBlock code={getServerSideCode()} maxHeight="max-h-80" />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Credential Builder Modal */}
            <OBv3CredentialBuilder
                isOpen={showCredentialBuilder}
                onClose={() => setShowCredentialBuilder(false)}
                onSave={handleCreateTemplate}
            />

            {/* Creating overlay */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl p-6 flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
                        <span className="text-gray-700">Creating template...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// API Method types
interface ApiMethod {
    id: string;
    name: string;
    category: 'auth' | 'credentials' | 'navigation' | 'consent';
    icon: React.ReactNode;
    shortDescription: string;
    description: string;
    parameters: Array<{
        name: string;
        type: string;
        required: boolean;
        description: string;
    }>;
    returns: {
        type: string;
        description: string;
        example: string;
    };
    code: string;
    tips?: string[];
}

// Step 4: Use API - Stripe-docs style
const UseApiStep: React.FC<{
    onBack: () => void;
}> = ({ onBack }) => {
    const [selectedMethodId, setSelectedMethodId] = useState('requestIdentity');
    const [showTemplateManager, setShowTemplateManager] = useState(false);

    // Integration and App Listing state for template management
    const [selectedIntegration, setSelectedIntegration] = useState<LCNIntegration | null>(null);
    const [selectedListing, setSelectedListing] = useState<AppStoreListing | null>(null);
    const [isCreatingIntegration, setIsCreatingIntegration] = useState(false);
    const [isCreatingListing, setIsCreatingListing] = useState(false);
    const [newIntegrationName, setNewIntegrationName] = useState('');
    const [newListingName, setNewListingName] = useState('');

    // Developer portal hooks
    const { 
        useIntegrations, 
        useCreateIntegration, 
        useListingsForIntegration,
        useCreateListing,
    } = useDeveloperPortal();
    const { data: integrations, isLoading: isLoadingIntegrations, refetch: refetchIntegrations } = useIntegrations();
    const createIntegrationMutation = useCreateIntegration();
    const { data: listings, isLoading: isLoadingListings, refetch: refetchListings } = useListingsForIntegration(selectedIntegration?.id || null);
    const createListingMutation = useCreateListing();

    // Auto-select first integration
    useEffect(() => {
        if (integrations && integrations.length > 0 && !selectedIntegration) {
            setSelectedIntegration(integrations[0]);
        }
    }, [integrations, selectedIntegration]);

    // Auto-select first listing when integration changes
    useEffect(() => {
        if (listings && listings.length > 0 && !selectedListing) {
            setSelectedListing(listings[0]);
        } else if (!listings || listings.length === 0) {
            setSelectedListing(null);
        }
    }, [listings, selectedListing, selectedIntegration]);

    const handleCreateIntegration = async () => {
        if (!newIntegrationName.trim()) return;
        try {
            await createIntegrationMutation.mutateAsync(newIntegrationName.trim());
            setNewIntegrationName('');
            setIsCreatingIntegration(false);
            refetchIntegrations();
        } catch (err) {
            console.error('Failed to create integration:', err);
        }
    };

    const handleCreateListing = async () => {
        if (!newListingName.trim() || !selectedIntegration) return;
        try {
            await createListingMutation.mutateAsync({
                integrationId: selectedIntegration.id,
                listing: {
                    display_name: newListingName.trim(),
                    tagline: `${newListingName.trim()} - An embedded LearnCard app`,
                    full_description: `${newListingName.trim()} is an embedded application that integrates with the LearnCard wallet.`,
                    icon_url: 'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb', // Default LearnCard icon
                    launch_type: 'EMBEDDED_IFRAME',
                    launch_config_json: JSON.stringify({ url: '' }),
                },
            });
            setNewListingName('');
            setIsCreatingListing(false);
            refetchListings();
        } catch (err) {
            console.error('Failed to create listing:', err);
        }
    };

    const categories = [
        { id: 'auth', name: 'Authentication', icon: <User className="w-4 h-4" /> },
        { id: 'credentials', name: 'Credentials', icon: <Award className="w-4 h-4" /> },
        { id: 'navigation', name: 'Navigation', icon: <Navigation className="w-4 h-4" /> },
        { id: 'consent', name: 'Consent', icon: <ClipboardCheck className="w-4 h-4" /> },
    ];

    const methods: ApiMethod[] = [
        // Authentication
        {
            id: 'requestIdentity',
            name: 'requestIdentity',
            category: 'auth',
            icon: <User className="w-4 h-4" />,
            shortDescription: 'SSO authentication',
            description: 'Request the user\'s identity for single sign-on. Since the user is already authenticated in the LearnCard wallet, this instantly returns their DID and profile information — no login flow required.',
            parameters: [],
            returns: {
                type: 'Promise<Identity>',
                description: 'User identity object with DID and profile',
                example: `{
  "did": "did:web:network.learncard.com:users:abc123",
  "profile": {
    "displayName": "Jane Smith",
    "profileId": "janesmith",
    "image": "https://cdn.learncard.com/avatars/abc123.png",
    "email": "jane@example.com"
  }
}`,
            },
            code: `import { createPartnerConnect } from '@learncard/partner-connect';

const learnCard = createPartnerConnect({
    hostOrigin: 'https://learncard.app'
});

// Get the authenticated user's identity
const identity = await learnCard.requestIdentity();

// Use the identity in your app
console.log('Welcome,', identity.profile.displayName);
console.log('User DID:', identity.did);

// You can use the DID as a unique user identifier
const userId = identity.did;`,
            tips: [
                'Call this on app load to immediately identify the user',
                'The DID is a unique, cryptographic identifier for the user',
                'Profile data may be partial depending on user privacy settings',
            ],
        },
        // Credentials
        {
            id: 'sendCredential',
            name: 'sendCredential',
            category: 'credentials',
            icon: <Send className="w-4 h-4" />,
            shortDescription: 'Issue a credential',
            description: 'Send a Verifiable Credential directly to the user\'s wallet. The user will see a prompt to accept the credential. Use this for course completions, achievements, certificates, and more.',
            parameters: [
                {
                    name: 'credential',
                    type: 'VerifiableCredential',
                    required: true,
                    description: 'The W3C Verifiable Credential object to send',
                },
            ],
            returns: {
                type: 'Promise<{ success: boolean }>',
                description: 'Whether the credential was accepted',
                example: `{ "success": true }`,
            },
            code: `// Issue a credential when user completes something
const credential = {
    "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
    ],
    "type": ["VerifiableCredential", "OpenBadgeCredential"],
    "name": "JavaScript Fundamentals",
    "issuer": {
        "id": "did:web:your-app.com",
        "name": "Your App Name"
    },
    "credentialSubject": {
        "achievement": {
            "type": ["Achievement"],
            "name": "JavaScript Fundamentals",
            "description": "Completed the JavaScript fundamentals course",
            "achievementType": "Certificate"
        }
    }
};

const result = await learnCard.sendCredential({ credential });

if (result.success) {
    showSuccessMessage('Credential added to your wallet!');
}`,
            tips: [
                'Use Open Badges 3.0 format for maximum compatibility',
                'Include your issuer DID for credential verification',
                'The user can decline — always handle the rejection case',
            ],
        },
        {
            id: 'askCredentialSearch',
            name: 'askCredentialSearch',
            category: 'credentials',
            icon: <FileSearch className="w-4 h-4" />,
            shortDescription: 'Query user credentials',
            description: 'Request access to search the user\'s credential wallet. The user will see a consent prompt and can choose which credentials to share. Great for verification flows or importing existing credentials.',
            parameters: [
                {
                    name: 'query',
                    type: 'CredentialQuery',
                    required: false,
                    description: 'Optional filter criteria for credential types',
                },
            ],
            returns: {
                type: 'Promise<{ credentials: VerifiableCredential[] }>',
                description: 'Array of credentials the user chose to share',
                example: `{
  "credentials": [
    {
      "@context": [...],
      "type": ["VerifiableCredential", "OpenBadgeCredential"],
      "name": "Python Developer Certificate",
      ...
    }
  ]
}`,
            },
            code: `// Search for specific credential types
const result = await learnCard.askCredentialSearch({
    type: ['OpenBadgeCredential']
});

// User selects which credentials to share
if (result.credentials.length > 0) {
    console.log('User shared', result.credentials.length, 'credentials');
    
    // Process the shared credentials
    for (const cred of result.credentials) {
        console.log('Credential:', cred.name);
        // Verify, display, or store the credential
    }
} else {
    console.log('User declined or has no matching credentials');
}`,
            tips: [
                'Users control what they share — respect their privacy',
                'Filter by type to only request relevant credentials',
                'Credentials are cryptographically verifiable',
            ],
        },
        {
            id: 'askCredentialSpecific',
            name: 'askCredentialSpecific',
            category: 'credentials',
            icon: <Key className="w-4 h-4" />,
            shortDescription: 'Get credential by ID',
            description: 'Request a specific credential by its ID. Useful when you know exactly which credential you need, such as re-verifying a previously shared credential.',
            parameters: [
                {
                    name: 'credentialId',
                    type: 'string',
                    required: true,
                    description: 'The unique ID of the credential to request',
                },
            ],
            returns: {
                type: 'Promise<{ credential: VerifiableCredential | null }>',
                description: 'The requested credential if user approves',
                example: `{
  "credential": {
    "@context": [...],
    "id": "urn:uuid:abc123...",
    "type": ["VerifiableCredential"],
    ...
  }
}`,
            },
            code: `// Request a specific credential by ID
const credentialId = 'urn:uuid:abc123-def456-...';

const result = await learnCard.askCredentialSpecific(credentialId);

if (result.credential) {
    console.log('Got credential:', result.credential.name);
    
    // Verify the credential is still valid
    const isValid = await verifyCredential(result.credential);
    
    if (isValid) {
        grantAccess();
    }
} else {
    console.log('User declined or credential not found');
}`,
            tips: [
                'Store credential IDs to re-verify later',
                'User must still approve sharing the credential',
                'Returns null if credential doesn\'t exist in user\'s wallet',
            ],
        },
        {
            id: 'initiateTemplateIssue',
            name: 'initiateTemplateIssue',
            category: 'credentials',
            icon: <FileText className="w-4 h-4" />,
            shortDescription: 'Issue from template',
            description: 'Issue a credential using a pre-defined boost template. Templates are configured in the LearnCard dashboard and ensure consistent credential formatting. Best for recurring credential types.',
            parameters: [
                {
                    name: 'templateUri',
                    type: 'string',
                    required: true,
                    description: 'The URI of the boost/template to issue from',
                },
                {
                    name: 'recipientDid',
                    type: 'string',
                    required: false,
                    description: 'DID of the recipient (defaults to current user)',
                },
            ],
            returns: {
                type: 'Promise<{ success: boolean, credentialId?: string }>',
                description: 'Result of the issuance',
                example: `{
  "success": true,
  "credentialId": "urn:uuid:new-cred-123..."
}`,
            },
            code: `// Issue from a pre-configured template
const templateUri = 'lc:boost:your-org:course-completion-template';

const result = await learnCard.initiateTemplateIssue({
    templateUri,
    // Optionally specify recipient (defaults to current user)
    // recipientDid: 'did:web:...'
});

if (result.success) {
    console.log('Credential issued:', result.credentialId);
    showSuccess('Achievement unlocked!');
}`,
            tips: [
                'Create templates in the LearnCard dashboard first',
                'Templates ensure consistent branding and fields',
                'Great for gamification with pre-defined achievements',
            ],
        },
        // Navigation
        {
            id: 'launchFeature',
            name: 'launchFeature',
            category: 'navigation',
            icon: <Navigation className="w-4 h-4" />,
            shortDescription: 'Navigate host app',
            description: 'Navigate the LearnCard wallet to a specific feature or page. This allows your app to integrate with wallet features like viewing credentials, managing contacts, or accessing settings.',
            parameters: [
                {
                    name: 'path',
                    type: 'string',
                    required: true,
                    description: 'The wallet path to navigate to',
                },
                {
                    name: 'description',
                    type: 'string',
                    required: false,
                    description: 'Optional description shown during navigation',
                },
            ],
            returns: {
                type: 'Promise<void>',
                description: 'Resolves when navigation completes',
                example: `// No return value`,
            },
            code: `// Navigate to the user's credential wallet
await learnCard.launchFeature('/wallet', 'View your credentials');

// Open the contacts/connections page
await learnCard.launchFeature('/contacts', 'Find and connect with others');

// Open settings
await learnCard.launchFeature('/settings', 'Manage your preferences');

// Open a specific credential detail
await learnCard.launchFeature('/credential/abc123', 'View credential details');

// Available paths:
// /wallet     - Credential wallet
// /contacts   - Connections & contacts
// /settings   - User settings
// /profile    - User profile
// /activity   - Activity feed`,
            tips: [
                'Use this to complement your app\'s features with wallet features',
                'The description appears as a toast or transition message',
                'Navigation happens within the wallet, not your iframe',
            ],
        },
        // Consent
        {
            id: 'requestConsent',
            name: 'requestConsent',
            category: 'consent',
            icon: <ClipboardCheck className="w-4 h-4" />,
            shortDescription: 'Request permissions',
            description: 'Request user consent for specific permissions or data access. Consent is tied to a contract URI that defines what access is being granted. Use this for ongoing data access agreements.',
            parameters: [
                {
                    name: 'contractUri',
                    type: 'string',
                    required: true,
                    description: 'The URI of the consent contract',
                },
                {
                    name: 'options',
                    type: 'ConsentOptions',
                    required: false,
                    description: 'Additional options like scope and duration',
                },
            ],
            returns: {
                type: 'Promise<{ granted: boolean, consentId?: string }>',
                description: 'Whether consent was granted',
                example: `{
  "granted": true,
  "consentId": "consent:abc123..."
}`,
            },
            code: `// Request consent for a data sharing agreement
const result = await learnCard.requestConsent('lc:contract:your-app:data-access', {
    scope: ['profile', 'credentials'],
    duration: '30d' // 30 days
});

if (result.granted) {
    console.log('Consent granted! ID:', result.consentId);
    
    // Store the consent ID for future reference
    await saveUserConsent(userId, result.consentId);
    
    // Now you can access data per the contract terms
    enablePremiumFeatures();
} else {
    console.log('User declined consent');
    showLimitedFeatures();
}`,
            tips: [
                'Be clear about what access you\'re requesting',
                'Users can revoke consent at any time',
                'Store consent IDs to track active agreements',
            ],
        },
    ];

    const selectedMethod = methods.find(m => m.id === selectedMethodId) || methods[0];

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'auth': return 'text-violet-600 bg-violet-100';
            case 'credentials': return 'text-cyan-600 bg-cyan-100';
            case 'navigation': return 'text-amber-600 bg-amber-100';
            case 'consent': return 'text-emerald-600 bg-emerald-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Partner Connect API Reference</h3>

                <p className="text-gray-600">
                    Complete API for communicating with the LearnCard wallet. Select a method to see detailed documentation and code examples.
                </p>
            </div>

            {/* Split-screen layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left: Method navigation */}
                <div className="md:col-span-4 space-y-4">
                    {categories.map(category => {
                        const categoryMethods = methods.filter(m => m.category === category.id);

                        return (
                            <div key={category.id}>
                                <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    {category.icon}
                                    {category.name}
                                </div>

                                <div className="space-y-1">
                                    {categoryMethods.map(method => (
                                        <button
                                            key={method.id}
                                            onClick={() => setSelectedMethodId(method.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                                                selectedMethodId === method.id
                                                    ? 'bg-cyan-50 border border-cyan-200 text-cyan-700'
                                                    : 'hover:bg-gray-50 text-gray-700'
                                            }`}
                                        >
                                            <span className={`p-1.5 rounded-md ${getCategoryColor(method.category)}`}>
                                                {method.icon}
                                            </span>

                                            <div className="flex-1 min-w-0">
                                                <div className="font-mono text-sm font-medium truncate">
                                                    {method.name}()
                                                </div>

                                                <div className="text-xs text-gray-500 truncate">
                                                    {method.shortDescription}
                                                </div>
                                            </div>

                                            {selectedMethodId === method.id && (
                                                <ChevronRight className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Right: Method details */}
                <div className="md:col-span-8 space-y-6">
                    {/* Method header */}
                    <div className="p-5 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl">
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${getCategoryColor(selectedMethod.category)}`}>
                                {selectedMethod.icon}
                            </div>

                            <div className="flex-1">
                                <h4 className="text-lg font-mono font-semibold text-gray-800">
                                    learnCard.{selectedMethod.name}()
                                </h4>

                                <p className="mt-2 text-gray-600 text-sm leading-relaxed">
                                    {selectedMethod.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Parameters */}
                    {selectedMethod.parameters.length > 0 && (
                        <div>
                            <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <Code className="w-4 h-4 text-gray-500" />
                                Parameters
                            </h5>

                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                {selectedMethod.parameters.map((param, idx) => (
                                    <div 
                                        key={param.name}
                                        className={`p-4 ${idx > 0 ? 'border-t border-gray-200' : ''}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-gray-800">
                                                {param.name}
                                            </code>

                                            <code className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                                {param.type}
                                            </code>

                                            {param.required && (
                                                <span className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium">
                                                    required
                                                </span>
                                            )}
                                        </div>

                                        <p className="mt-2 text-sm text-gray-600">
                                            {param.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Returns */}
                    <div>
                        <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <ArrowRight className="w-4 h-4 text-gray-500" />
                            Returns
                        </h5>

                        <div className="p-4 border border-gray-200 rounded-xl">
                            <code className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-sm">
                                {selectedMethod.returns.type}
                            </code>

                            <p className="mt-2 text-sm text-gray-600">
                                {selectedMethod.returns.description}
                            </p>

                            <div className="mt-3">
                                <CodeBlock code={selectedMethod.returns.example} />
                            </div>
                        </div>
                    </div>

                    {/* Code example */}
                    <div>
                        <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-gray-500" />
                            Example
                        </h5>

                        <CodeBlock code={selectedMethod.code} />
                    </div>

                    {/* Tips */}
                    {selectedMethod.tips && selectedMethod.tips.length > 0 && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <h5 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                Pro Tips
                            </h5>

                            <ul className="space-y-1.5">
                                {selectedMethod.tips.map((tip, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-amber-700">
                                        <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Template Manager for initiateTemplateIssue */}
                    {selectedMethodId === 'initiateTemplateIssue' && (
                        <div className="p-5 bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-cyan-600" />
                                        Template Builder
                                    </h5>

                                    <p className="text-sm text-gray-600 mt-1">
                                        Create and manage credential templates for your embedded app
                                    </p>
                                </div>

                                <button
                                    onClick={() => setShowTemplateManager(!showTemplateManager)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        showTemplateManager 
                                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                                            : 'bg-cyan-500 text-white hover:bg-cyan-600'
                                    }`}
                                >
                                    {showTemplateManager ? 'Hide Builder' : 'Open Builder'}
                                </button>
                            </div>

                            {showTemplateManager && (
                                <>
                                    {/* Step 1: Integration Selection */}
                                    <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-gray-700">
                                                1. Select Integration
                                            </label>
                                            <button
                                                onClick={() => refetchIntegrations()}
                                                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                            >
                                                <RefreshCw className={`w-3 h-3 ${isLoadingIntegrations ? 'animate-spin' : ''}`} />
                                                Refresh
                                            </button>
                                        </div>

                                        {isLoadingIntegrations ? (
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span className="text-sm">Loading integrations...</span>
                                            </div>
                                        ) : integrations && integrations.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {integrations.map((integration) => (
                                                    <button
                                                        key={integration.id}
                                                        onClick={() => {
                                                            setSelectedIntegration(integration);
                                                            setSelectedListing(null);
                                                        }}
                                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                            selectedIntegration?.id === integration.id
                                                                ? 'bg-cyan-500 text-white'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {integration.name}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">No integrations found</p>
                                        )}

                                        {/* Create new integration */}
                                        {isCreatingIntegration ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newIntegrationName}
                                                    onChange={(e) => setNewIntegrationName(e.target.value)}
                                                    placeholder="Integration name"
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleCreateIntegration();
                                                        if (e.key === 'Escape') setIsCreatingIntegration(false);
                                                    }}
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={handleCreateIntegration}
                                                    disabled={!newIntegrationName.trim() || createIntegrationMutation.isPending}
                                                    className="px-3 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600 disabled:opacity-50"
                                                >
                                                    {createIntegrationMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                                                </button>
                                                <button
                                                    onClick={() => setIsCreatingIntegration(false)}
                                                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setIsCreatingIntegration(true)}
                                                className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                New Integration
                                            </button>
                                        )}
                                    </div>

                                    {/* Step 2: App Listing Selection */}
                                    {selectedIntegration && (
                                        <div className="p-4 bg-white rounded-lg border border-gray-200 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-medium text-gray-700">
                                                    2. Select App Listing
                                                </label>
                                                <button
                                                    onClick={() => refetchListings()}
                                                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                                >
                                                    <RefreshCw className={`w-3 h-3 ${isLoadingListings ? 'animate-spin' : ''}`} />
                                                    Refresh
                                                </button>
                                            </div>

                                            {isLoadingListings ? (
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span className="text-sm">Loading app listings...</span>
                                                </div>
                                            ) : listings && listings.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {listings.map((listing) => (
                                                        <button
                                                            key={listing.listing_id}
                                                            onClick={() => setSelectedListing(listing)}
                                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                                                selectedListing?.listing_id === listing.listing_id
                                                                    ? 'bg-cyan-500 text-white'
                                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                            }`}
                                                        >
                                                            {listing.icon_url && (
                                                                <img src={listing.icon_url} alt="" className="w-5 h-5 rounded" />
                                                            )}
                                                            {listing.display_name}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500">No app listings for this integration</p>
                                            )}

                                            {/* Create new listing */}
                                            {isCreatingListing ? (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={newListingName}
                                                        onChange={(e) => setNewListingName(e.target.value)}
                                                        placeholder="App name"
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleCreateListing();
                                                            if (e.key === 'Escape') setIsCreatingListing(false);
                                                        }}
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={handleCreateListing}
                                                        disabled={!newListingName.trim() || createListingMutation.isPending}
                                                        className="px-3 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600 disabled:opacity-50"
                                                    >
                                                        {createListingMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                                                    </button>
                                                    <button
                                                        onClick={() => setIsCreatingListing(false)}
                                                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setIsCreatingListing(true)}
                                                    className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    New App Listing
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Selected Status */}
                                    {selectedIntegration && selectedListing && (
                                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                            <p className="text-sm text-emerald-700">
                                                <CheckCircle2 className="w-4 h-4 inline mr-1" />
                                                Managing templates for <strong>{selectedListing.display_name}</strong>
                                            </p>
                                        </div>
                                    )}

                                    {/* Template Manager */}
                                    <TemplateManager 
                                        appListingId={selectedListing?.listing_id} 
                                        appName={selectedListing?.display_name} 
                                    />
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Success state / Next steps */}
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-cyan-50 border border-emerald-200 rounded-2xl">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Rocket className="w-6 h-6 text-emerald-600" />
                    </div>

                    <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-800 mb-1">Ready to build!</h4>

                        <p className="text-gray-600 text-sm mb-4">
                            You now have everything you need to build a powerful embedded LearnCard app. 
                            Check out the full documentation for advanced features and best practices.
                        </p>

                        <div className="flex flex-wrap gap-3">
                            <a
                                href="https://www.npmjs.com/package/@learncard/partner-connect"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                <Package className="w-4 h-4" />
                                NPM Package
                                <ExternalLink className="w-3 h-3" />
                            </a>

                            <a
                                href="https://docs.learncard.com/sdks/partner-connect"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600 transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                Full Documentation
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
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
            </div>
        </div>
    );
};

// Step 2: Feature Setup (dynamic per-feature setup)
const FeatureSetupStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
    selectedFeatures: string[];
    currentFeatureIndex: number;
    setCurrentFeatureIndex: (index: number) => void;
    featureSetupState: Record<string, Record<string, unknown>>;
    setFeatureSetupState: (state: Record<string, Record<string, unknown>>) => void;
    selectedListing: AppStoreListing | null;
}> = ({ onComplete, onBack, selectedFeatures, currentFeatureIndex, setCurrentFeatureIndex, featureSetupState, setFeatureSetupState, selectedListing }) => {
    // Get features that require setup
    const featuresNeedingSetup = selectedFeatures
        .map(id => FEATURES.find(f => f.id === id))
        .filter((f): f is Feature => f !== undefined && f.requiresSetup);

    // If no features need setup, skip to complete
    useEffect(() => {
        if (featuresNeedingSetup.length === 0) {
            onComplete();
        }
    }, [featuresNeedingSetup.length, onComplete]);

    if (featuresNeedingSetup.length === 0) {
        return null;
    }

    const currentFeature = featuresNeedingSetup[currentFeatureIndex];
    const isLastFeature = currentFeatureIndex === featuresNeedingSetup.length - 1;

    const handleFeatureComplete = () => {
        if (isLastFeature) {
            onComplete();
        } else {
            setCurrentFeatureIndex(currentFeatureIndex + 1);
        }
    };

    const handleFeatureBack = () => {
        if (currentFeatureIndex === 0) {
            onBack();
        } else {
            setCurrentFeatureIndex(currentFeatureIndex - 1);
        }
    };

    // Render feature-specific setup
    const renderFeatureSetup = () => {
        if (!currentFeature) return null;

        switch (currentFeature.id) {
            case 'issue-credentials':
                return (
                    <IssueCredentialsSetup
                        onComplete={handleFeatureComplete}
                        onBack={handleFeatureBack}
                        isLastFeature={isLastFeature}
                        selectedListing={selectedListing}
                        featureSetupState={featureSetupState}
                        setFeatureSetupState={setFeatureSetupState}
                    />
                );

            case 'peer-badges':
                return (
                    <PeerBadgesSetup
                        onComplete={handleFeatureComplete}
                        onBack={handleFeatureBack}
                        isLastFeature={isLastFeature}
                        selectedListing={selectedListing}
                    />
                );

            case 'claim-credentials':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Set Up Claim Credentials</h3>

                            <p className="text-gray-600">
                                Create shareable claim links for your credentials. Coming soon!
                            </p>
                        </div>

                        <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
                            <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-3" />

                            <p className="text-amber-800">
                                This feature setup is coming soon. For now, you can skip this step.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={handleFeatureBack} className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </button>

                            <button onClick={handleFeatureComplete} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors">
                                {isLastFeature ? 'See Your Code' : 'Next Feature'}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                );

            case 'request-credentials':
                return (
                    <RequestCredentialsSetup
                        onComplete={handleFeatureComplete}
                        onBack={handleFeatureBack}
                        isLastFeature={isLastFeature}
                        featureSetupState={featureSetupState}
                        setFeatureSetupState={setFeatureSetupState}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Feature progress */}
            {featuresNeedingSetup.length > 1 && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                    {featuresNeedingSetup.map((feature, index) => (
                        <React.Fragment key={feature.id}>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                                index === currentFeatureIndex
                                    ? 'bg-cyan-100 text-cyan-700'
                                    : index < currentFeatureIndex
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'text-gray-400'
                            }`}>
                                {index < currentFeatureIndex ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                    feature.icon
                                )}
                                <span className="hidden sm:inline">{feature.title}</span>
                            </div>

                            {index < featuresNeedingSetup.length - 1 && (
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            )}

            {renderFeatureSetup()}
        </div>
    );
};

// Issue Credentials Setup - Two modes: Prompt to Claim vs Sync to Wallet
type IssueMode = 'prompt-claim' | 'sync-wallet';

const IssueCredentialsSetup: React.FC<{
    onComplete: () => void;
    onBack: () => void;
    isLastFeature: boolean;
    selectedListing: AppStoreListing | null;
    featureSetupState: Record<string, Record<string, unknown>>;
    setFeatureSetupState: (state: Record<string, Record<string, unknown>>) => void;
}> = ({ onComplete, onBack, isLastFeature, selectedListing, featureSetupState, setFeatureSetupState }) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();

    // Get saved mode from feature state or default
    const savedState = featureSetupState['issue-credentials'] || {};
    const [mode, setMode] = useState<IssueMode>((savedState.mode as IssueMode) || 'prompt-claim');

    // Prompt to Claim state
    const [showCredentialBuilder, setShowCredentialBuilder] = useState(false);
    const [credential, setCredential] = useState<Record<string, unknown> | null>(
        (savedState.credential as Record<string, unknown>) || null
    );
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Sync to Wallet state
    const [signingAuthorityLoading, setSigningAuthorityLoading] = useState(false);
    const [signingAuthorityFetched, setSigningAuthorityFetched] = useState(false);
    const [signingAuthorityCreating, setSigningAuthorityCreating] = useState(false);
    const [primarySA, setPrimarySA] = useState<{ name: string; endpoint: string } | null>(null);
    const [contractUri, setContractUri] = useState<string>((savedState.contractUri as string) || '');

    // Save state when it changes
    useEffect(() => {
        setFeatureSetupState({
            ...featureSetupState,
            'issue-credentials': {
                mode,
                credential,
                contractUri,
            },
        });
    }, [mode, credential, contractUri]);

    // Fetch signing authority when switching to sync-wallet mode
    useEffect(() => {
        if (mode !== 'sync-wallet') return;
        if (signingAuthorityFetched) return;

        const fetchSigningAuthority = async () => {
            try {
                setSigningAuthorityLoading(true);
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
                setSigningAuthorityLoading(false);
                setSigningAuthorityFetched(true);
            }
        };

        fetchSigningAuthority();
    }, [mode, signingAuthorityFetched, initWallet]);

    const createSigningAuthority = async () => {
        try {
            setSigningAuthorityCreating(true);
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

            setPrimarySA({
                name: authority.name,
                endpoint: authority.endpoint!,
            });

            presentToast('Signing authority created!', { hasDismissButton: true });
        } catch (err) {
            console.error('Failed to create signing authority:', err);
            presentToast('Failed to create signing authority', { type: ToastTypeEnum.Error, hasDismissButton: true });
        } finally {
            setSigningAuthorityCreating(false);
        }
    };

    const handleCopy = async (code: string, id: string) => {
        await navigator.clipboard.writeText(code);
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleSaveCredential = (credentialData: Record<string, unknown>) => {
        setCredential(credentialData);
        setShowCredentialBuilder(false);
        presentToast('Credential template saved!', { hasDismissButton: true });
    };

    // Code snippets
    const promptClaimCode = `// 1. Get the user's identity
const identity = await learnCard.requestIdentity();
const recipientDid = identity.did;

// 2. Build the credential with recipient's DID
const credential = {
    "@context": [
        "https://www.w3.org/ns/credentials/v2",
        "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
    ],
    "type": ["VerifiableCredential", "OpenBadgeCredential"],
    "name": "${credential ? (credential as Record<string, unknown>).name || 'Your Credential' : 'Your Credential'}",
    "issuer": {
        "id": "YOUR_ISSUER_DID", // Your organization's DID
        "name": "Your Organization"
    },
    "credentialSubject": {
        "id": recipientDid, // Inject the user's DID here
        "type": ["AchievementSubject"],
        "achievement": {
            "type": ["Achievement"],
            "name": "${credential ? (credential as Record<string, unknown>).name || 'Achievement Name' : 'Achievement Name'}",
            "description": "Description of the achievement"
        }
    }
};

// 3. Issue the credential server-side (with your API key)
// POST to your backend, which calls:
//   const wallet = await initLearnCard({ seed: YOUR_SEED });
//   const vc = await wallet.invoke.issueCredential(credential);

// 4. Prompt user to claim the issued credential
const result = await learnCard.sendCredential({ credential: issuedVC });

if (result.success) {
    console.log('Credential claimed!');
}`;

    const syncWalletCode = `// 1. Request consent for writing credentials
const consentResult = await learnCard.requestConsent({
    contractUri: '${contractUri || 'YOUR_CONTRACT_URI'}',
});

if (!consentResult.accepted) {
    console.log('User declined consent');
    return;
}

// 2. Get the user's identity
const identity = await learnCard.requestIdentity();
const recipientDid = identity.did;

// 3. Send credentials using the send() method
// This uses your consent flow contract for seamless delivery
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: recipientDid,
    templateUri: 'YOUR_BOOST_TEMPLATE_URI', // From Template Manager below
    contractUri: '${contractUri || 'YOUR_CONTRACT_URI'}',
});

console.log('Credential synced:', result);`;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Issue Credentials</h3>

                <p className="text-gray-600">
                    Choose how you want to deliver credentials to users in your embedded app.
                </p>
            </div>

            {/* Mode Toggle */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => setMode('prompt-claim')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                        mode === 'prompt-claim'
                            ? 'border-cyan-500 bg-cyan-50'
                            : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Send className="w-5 h-5 text-cyan-600" />
                        <span className="font-semibold text-gray-800">Prompt User to Claim</span>
                    </div>

                    <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Good for issuing a few credentials</li>
                        <li>• User accepts each one individually</li>
                        <li>• Limited built-in tracking</li>
                    </ul>
                </button>

                <button
                    onClick={() => setMode('sync-wallet')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                        mode === 'sync-wallet'
                            ? 'border-violet-500 bg-violet-50'
                            : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <RefreshCw className="w-5 h-5 text-violet-600" />
                        <span className="font-semibold text-gray-800">Sync to Wallet</span>
                    </div>

                    <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Good for any number of credentials</li>
                        <li>• Seamless sync after consent</li>
                        <li>• Full tracking and analytics</li>
                    </ul>
                </button>
            </div>

            {/* Prompt to Claim Mode */}
            {mode === 'prompt-claim' && (
                <div className="space-y-6">
                    {/* Step 1: Build Credential */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-cyan-100 text-cyan-700 rounded-lg flex items-center justify-center font-semibold text-sm">
                                1
                            </div>
                            <h4 className="font-semibold text-gray-800">Build Your Credential</h4>
                        </div>

                        <div className="ml-10">
                            {credential ? (
                                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                            <span className="font-medium text-emerald-800">
                                                {(credential as Record<string, unknown>).name as string || 'Credential Ready'}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => setShowCredentialBuilder(true)}
                                            className="text-sm text-emerald-700 hover:text-emerald-800"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowCredentialBuilder(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-cyan-300 text-cyan-600 rounded-xl hover:bg-cyan-50 transition-colors"
                                >
                                    <Award className="w-5 h-5" />
                                    Design Your Credential
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Step 2: Integration Code */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-cyan-100 text-cyan-700 rounded-lg flex items-center justify-center font-semibold text-sm">
                                2
                            </div>
                            <h4 className="font-semibold text-gray-800">Integration Code</h4>
                        </div>

                        <div className="ml-10 space-y-3">
                            <CodeBlock code={promptClaimCode} maxHeight="max-h-80" />

                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                <p className="text-sm text-amber-800">
                                    <strong>Important:</strong> Step 3 (issuing) must happen on your server with your API key to sign the credential properly.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sync to Wallet Mode */}
            {mode === 'sync-wallet' && (
                <div className="space-y-6">
                    {/* Step 1: Signing Authority */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-violet-100 text-violet-700 rounded-lg flex items-center justify-center font-semibold text-sm">
                                1
                            </div>
                            <h4 className="font-semibold text-gray-800">Signing Authority</h4>
                        </div>

                        <div className="ml-10">
                            {(signingAuthorityLoading || !signingAuthorityFetched) ? (
                                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl">
                                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                                    <span className="text-sm text-gray-500">Checking signing authority...</span>
                                </div>
                            ) : primarySA ? (
                                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        <div>
                                            <p className="font-medium text-emerald-800">Signing authority ready</p>
                                            <p className="text-xs text-emerald-600">Using: {primarySA.name}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                        <p className="text-sm text-amber-800 mb-3">
                                            A signing authority is needed to cryptographically sign credentials.
                                        </p>

                                        <button
                                            onClick={createSigningAuthority}
                                            disabled={signingAuthorityCreating}
                                            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
                                        >
                                            {signingAuthorityCreating ? (
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
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Step 2: Consent Flow Contract */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-violet-100 text-violet-700 rounded-lg flex items-center justify-center font-semibold text-sm">
                                2
                            </div>
                            <h4 className="font-semibold text-gray-800">Consent Flow Contract</h4>
                        </div>

                        <div className="ml-10 space-y-3">
                            <p className="text-sm text-gray-600">
                                Create a consent contract that requests &apos;write&apos; permission to sync credentials to the user&apos;s wallet.
                            </p>

                            <ConsentFlowContractSelector
                                value={contractUri}
                                onChange={setContractUri}
                            />

                            {contractUri && (
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        <span className="text-sm text-emerald-800">Contract selected</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Step 3: Credential Templates */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-violet-100 text-violet-700 rounded-lg flex items-center justify-center font-semibold text-sm">
                                3
                            </div>
                            <h4 className="font-semibold text-gray-800">Credential Templates (Boosts)</h4>
                        </div>

                        <div className="ml-10">
                            {selectedListing ? (
                                <TemplateManager
                                    appListingId={selectedListing.listing_id}
                                    appName={selectedListing.display_name}
                                    codeStyle="send"
                                    contractUri={contractUri}
                                />
                            ) : (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                    <p className="text-sm text-amber-800">
                                        Select an app in Step 1 to create credential templates.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Step 4: Integration Code */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-violet-100 text-violet-700 rounded-lg flex items-center justify-center font-semibold text-sm">
                                4
                            </div>
                            <h4 className="font-semibold text-gray-800">Integration Code</h4>
                        </div>

                        <div className="ml-10">
                            <CodeBlock code={syncWalletCode} maxHeight="max-h-80" />
                        </div>
                    </div>
                </div>
            )}

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
                    {isLastFeature ? 'See Your Code' : 'Next Feature'}
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            {/* Credential Builder Modal */}
            <OBv3CredentialBuilder
                isOpen={showCredentialBuilder}
                onClose={() => setShowCredentialBuilder(false)}
                onSave={handleSaveCredential}
                initialData={credential as Record<string, unknown> | undefined}
            />
        </div>
    );
};

// Request Credentials Setup - Two modes: Query vs Specific
type RequestMode = 'query' | 'specific';

const RequestCredentialsSetup: React.FC<{
    onComplete: () => void;
    onBack: () => void;
    isLastFeature: boolean;
    featureSetupState: Record<string, Record<string, unknown>>;
    setFeatureSetupState: (state: Record<string, Record<string, unknown>>) => void;
}> = ({ onComplete, onBack, isLastFeature, featureSetupState, setFeatureSetupState }) => {
    // Get saved state
    const savedState = featureSetupState['request-credentials'] || {};
    const [mode, setMode] = useState<RequestMode>((savedState.mode as RequestMode) || 'query');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Query mode state
    const [queryTitle, setQueryTitle] = useState<string>((savedState.queryTitle as string) || '');
    const [queryReason, setQueryReason] = useState<string>((savedState.queryReason as string) || '');

    // Save state when it changes
    useEffect(() => {
        setFeatureSetupState({
            ...featureSetupState,
            'request-credentials': {
                mode,
                queryTitle,
                queryReason,
            },
        });
    }, [mode, queryTitle, queryReason]);

    const handleCopy = async (code: string, id: string) => {
        await navigator.clipboard.writeText(code);
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // Code for Query mode
    const queryCode = `// Search for credentials matching your criteria
const response = await learnCard.askCredentialSearch({
    query: [
        {
            type: 'QueryByTitle',
            credentialQuery: {
                reason: "${queryReason || 'Please share your credential for verification'}",
                title: "${queryTitle || 'Certificate'}"
            }
        }
    ],
    challenge: \`challenge-\${Date.now()}-\${Math.random().toString(36).substring(2, 9)}\`,
    domain: window.location.hostname
});

if (response?.verifiablePresentation) {
    // User shared credentials in a signed Verifiable Presentation
    const vp = response.verifiablePresentation;
    const credentials = vp.verifiableCredential || [];

    console.log(\`User shared \${credentials.length} credential(s)\`);

    // Process each credential
    for (const credential of credentials) {
        console.log('Credential:', credential.name);
        // Verify and use the credential
    }
} else {
    console.log('User declined to share credentials');
}`;

    // Code for Specific mode
    const specificCode = `// Request a specific credential by its ID
// You would typically store the credential ID from a previous interaction
const credentialId = 'urn:credential:abc123'; // The ID you stored earlier

try {
    const response = await learnCard.askCredentialSpecific(credentialId);

    if (response.credential) {
        console.log('Received credential:', response.credential);

        // The credential is now available for verification
        const credType = response.credential.type?.join(', ') || 'Unknown';
        console.log('Credential type:', credType);
    } else {
        console.log('Credential not returned');
    }
} catch (error) {
    if (error.code === 'CREDENTIAL_NOT_FOUND') {
        console.log('Credential not found in user wallet');
    } else if (error.code === 'USER_REJECTED') {
        console.log('User declined to share');
    } else {
        console.error('Error:', error.message);
    }
}`;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Request Credentials</h3>

                <p className="text-gray-600">
                    Choose how you want to request credentials from users in your app.
                </p>
            </div>

            {/* Mode Toggle */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => setMode('query')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                        mode === 'query'
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <FileSearch className="w-5 h-5 text-amber-600" />
                        <span className="font-semibold text-gray-800">Search Credentials</span>
                    </div>

                    <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Find by title or type</li>
                        <li>• User chooses which to share</li>
                        <li>• Returns multiple matches</li>
                    </ul>
                </button>

                <button
                    onClick={() => setMode('specific')}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                        mode === 'specific'
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Key className="w-5 h-5 text-orange-600" />
                        <span className="font-semibold text-gray-800">Request by ID</span>
                    </div>

                    <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Request exact credential</li>
                        <li>• User accepts or declines</li>
                        <li>• Returns single credential</li>
                    </ul>
                </button>
            </div>

            {/* Query Mode */}
            {mode === 'query' && (
                <div className="space-y-6">
                    {/* Step 1: Configure Search */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center font-semibold text-sm">
                                1
                            </div>
                            <h4 className="font-semibold text-gray-800">Configure Your Search</h4>
                        </div>

                        <div className="ml-10 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    What credential are you looking for?
                                </label>

                                <input
                                    type="text"
                                    value={queryTitle}
                                    onChange={(e) => setQueryTitle(e.target.value)}
                                    placeholder="e.g., Certificate, Badge, Diploma"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />

                                <p className="text-xs text-gray-500 mt-1">
                                    This searches credential titles for matches
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Why do you need it? (shown to user)
                                </label>

                                <input
                                    type="text"
                                    value={queryReason}
                                    onChange={(e) => setQueryReason(e.target.value)}
                                    placeholder="e.g., To verify your qualifications for this role"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />

                                <p className="text-xs text-gray-500 mt-1">
                                    A clear reason builds trust and improves sharing rates
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Integration Code */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center font-semibold text-sm">
                                2
                            </div>
                            <h4 className="font-semibold text-gray-800">Integration Code</h4>
                        </div>

                        <div className="ml-10">
                            <CodeBlock code={queryCode} maxHeight="max-h-80" />
                        </div>
                    </div>

                    {/* How it works */}
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <h4 className="font-medium text-amber-800 mb-2">How it works</h4>

                        <ol className="text-sm text-amber-700 space-y-1">
                            <li><strong>1.</strong> Your app requests credentials matching the title</li>
                            <li><strong>2.</strong> User sees which credentials match and selects which to share</li>
                            <li><strong>3.</strong> You receive a signed Verifiable Presentation with the credentials</li>
                            <li><strong>4.</strong> Verify the presentation to confirm authenticity</li>
                        </ol>
                    </div>
                </div>
            )}

            {/* Specific Mode */}
            {mode === 'specific' && (
                <div className="space-y-6">
                    {/* Explanation */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-orange-100 text-orange-700 rounded-lg flex items-center justify-center font-semibold text-sm">
                                1
                            </div>
                            <h4 className="font-semibold text-gray-800">How to Use</h4>
                        </div>

                        <div className="ml-10 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                            <p className="text-sm text-gray-700 mb-3">
                                Request a specific credential when you already know its ID from a previous interaction:
                            </p>

                            <ul className="text-sm text-gray-600 space-y-2">
                                <li className="flex items-start gap-2">
                                    <span className="font-medium text-orange-600">•</span>
                                    <span><strong>Re-verification:</strong> Ask for the same credential again</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-medium text-orange-600">•</span>
                                    <span><strong>Saved reference:</strong> You stored the ID when they first shared it</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-medium text-orange-600">•</span>
                                    <span><strong>Deep linking:</strong> They clicked a link with a specific credential</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Integration Code */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 bg-orange-100 text-orange-700 rounded-lg flex items-center justify-center font-semibold text-sm">
                                2
                            </div>
                            <h4 className="font-semibold text-gray-800">Integration Code</h4>
                        </div>

                        <div className="ml-10">
                            <CodeBlock code={specificCode} maxHeight="max-h-80" />
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                        <h4 className="font-medium text-orange-800 mb-2">Tips</h4>

                        <ul className="text-sm text-orange-700 space-y-1">
                            <li>• Store credential IDs securely when users first share them</li>
                            <li>• Handle the case where the user no longer has the credential</li>
                            <li>• Provide a fallback to search if the specific credential isn&apos;t available</li>
                        </ul>
                    </div>
                </div>
            )}

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
                    {isLastFeature ? 'See Your Code' : 'Next Feature'}
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// Peer-to-Peer Badges Setup (for initiateTemplateIssuance)
const PeerBadgesSetup: React.FC<{
    onComplete: () => void;
    onBack: () => void;
    isLastFeature: boolean;
    selectedListing: AppStoreListing | null;
}> = ({ onComplete, onBack, isLastFeature, selectedListing }) => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Set Up Peer-to-Peer Badges</h3>

                <p className="text-gray-600">
                    Create badge templates that users can send to each other using <code className="bg-gray-100 px-1 rounded">initiateTemplateIssuance</code>.
                </p>
            </div>

            {/* Show selected app */}
            {selectedListing && (
                <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-violet-600" />
                        <div>
                            <p className="text-sm font-medium text-violet-800">Creating templates for: {selectedListing.display_name}</p>
                            <p className="text-xs text-violet-600">You selected this app in Step 1</p>
                        </div>
                    </div>
                </div>
            )}

            {/* How it works */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <h4 className="font-medium text-gray-800 mb-2">How Peer-to-Peer Badges Work</h4>

                <ol className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                        <span className="font-medium text-violet-600">1.</span>
                        <span>You create badge templates below (e.g., "Thank You", "Great Job", "Team Player")</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="font-medium text-violet-600">2.</span>
                        <span>In your app, call <code className="bg-gray-100 px-1 rounded">initiateTemplateIssuance</code> with a template URI</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="font-medium text-violet-600">3.</span>
                        <span>Users pick a recipient and send the badge — you control the UX!</span>
                    </li>
                </ol>
            </div>

            {/* Template Manager */}
            {selectedListing ? (
                <TemplateManager
                    appListingId={selectedListing.listing_id}
                    appName={selectedListing.display_name}
                />
            ) : (
                <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                    <p className="text-amber-800">
                        Please go back to Step 1 and select an app listing first.
                    </p>
                </div>
            )}

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
                    disabled={!selectedListing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 transition-colors"
                >
                    {isLastFeature ? 'See Your Code' : 'Next Feature'}
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// Step 3: Your App (summary with code)
const YourAppStep: React.FC<{
    onBack: () => void;
    selectedFeatures: string[];
    selectedListing: AppStoreListing | null;
}> = ({ onBack, selectedFeatures, selectedListing }) => {
    const [copiedCode, setCopiedCode] = useState(false);

    // Generate code based on selected features
    const generateCode = () => {
        const codeLines: string[] = [
            `import { createPartnerConnect } from '@learncard/partner-connect';`,
            ``,
            `// Initialize the SDK`,
            `const learnCard = createPartnerConnect({`,
            `    hostOrigin: 'https://learncard.app'`,
            `});`,
            ``,
            `// Get user identity`,
            `const identity = await learnCard.requestIdentity();`,
            `console.log('Welcome,', identity.profile.displayName);`,
        ];

        // Add feature-specific code
        if (selectedFeatures.includes('issue-credentials')) {
            codeLines.push(``);
            codeLines.push(`// Issue a credential to the user`);
            codeLines.push(`// Replace BOOST_URI with your template URI from the setup`);
            codeLines.push(`await learnCard.initiateTemplateIssue({`);
            codeLines.push(`    boostUri: 'BOOST_URI', // Your template URI`);
            if (selectedListing) {
                codeLines.push(`    // App: ${selectedListing.display_name}`);
            }
            codeLines.push(`});`);
        }

        if (selectedFeatures.includes('peer-badges')) {
            codeLines.push(``);
            codeLines.push(`// Let user send a peer-to-peer badge`);
            codeLines.push(`// The user will pick a recipient in the LearnCard UI`);
            codeLines.push(`await learnCard.initiateTemplateIssuance({`);
            codeLines.push(`    boostUri: 'BOOST_URI', // Your badge template URI`);
            if (selectedListing) {
                codeLines.push(`    // App: ${selectedListing.display_name}`);
            }
            codeLines.push(`});`);
        }

        if (selectedFeatures.includes('open-wallet')) {
            codeLines.push(``);
            codeLines.push(`// Open user's wallet`);
            codeLines.push(`await learnCard.openWallet();`);
        }

        if (selectedFeatures.includes('claim-credentials')) {
            codeLines.push(``);
            codeLines.push(`// Navigate to claim a credential`);
            codeLines.push(`await learnCard.navigateTo('/claim/CLAIM_ID');`);
        }

        if (selectedFeatures.includes('request-credentials')) {
            codeLines.push(``);
            codeLines.push(`// Request credentials from user`);
            codeLines.push(`const presentation = await learnCard.requestPresentation({`);
            codeLines.push(`    // Define what credentials you're requesting`);
            codeLines.push(`});`);
        }

        return codeLines.join('\n');
    };

    const code = generateCode();

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Your App is Ready! 🎉</h3>

                <p className="text-gray-600">
                    Here's the code for your embedded app with {selectedFeatures.length} feature{selectedFeatures.length !== 1 ? 's' : ''}.
                </p>
            </div>

            {/* Selected features summary */}
            <div className="flex flex-wrap gap-2">
                {selectedFeatures.map(id => {
                    const feature = FEATURES.find(f => f.id === id);

                    return feature ? (
                        <span key={id} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-sm text-emerald-700">
                            <CheckCircle2 className="w-4 h-4" />
                            {feature.title}
                        </span>
                    ) : null;
                })}
            </div>

            {/* Code output */}
            <div>
                <div className="mb-2">
                    <span className="text-sm font-medium text-gray-700">Your Integration Code</span>
                </div>

                <CodeBlock code={code} />
            </div>

            {/* Next steps */}
            <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
                <h4 className="font-medium text-cyan-800 mb-3">Next Steps</h4>

                <ul className="space-y-2 text-sm text-cyan-700">
                    <li className="flex items-start gap-2">
                        <span className="text-cyan-500 mt-0.5">1.</span>
                        <span>Copy this code into your app</span>
                    </li>

                    <li className="flex items-start gap-2">
                        <span className="text-cyan-500 mt-0.5">2.</span>
                        <span>Configure your server headers for iframe embedding</span>
                    </li>

                    <li className="flex items-start gap-2">
                        <span className="text-cyan-500 mt-0.5">3.</span>
                        <span>Submit your app listing for review</span>
                    </li>

                    <li className="flex items-start gap-2">
                        <span className="text-cyan-500 mt-0.5">4.</span>
                        <span>Test in the LearnCard wallet!</span>
                    </li>
                </ul>
            </div>

            {/* Resources */}
            <div className="flex flex-wrap gap-3">
                <a
                    href="https://docs.learncard.com/sdks/partner-connect"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                    <FileText className="w-4 h-4" />
                    Full Documentation
                    <ExternalLink className="w-3 h-3" />
                </a>

                <a
                    href="https://github.com/learningeconomy/LearnCard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                    <Code className="w-4 h-4" />
                    GitHub Examples
                    <ExternalLink className="w-3 h-3" />
                </a>
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
            </div>
        </div>
    );
};

// Main component
const EmbedAppGuide: React.FC<GuideProps> = ({ selectedIntegration, setSelectedIntegration }) => {
    const guideState = useGuideState('embed-app', STEPS.length);

    // Guide-wide state (persists across all steps)
    const [selectedListing, setSelectedListing] = useState<AppStoreListing | null>(null);
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
    const [featureSetupState, setFeatureSetupState] = useState<Record<string, Record<string, unknown>>>({});

    // Reset guide if step is out of bounds (e.g., after changing step count)
    useEffect(() => {
        if (guideState.currentStep >= STEPS.length) {
            guideState.goToStep(0);
        }
    }, [guideState.currentStep]);

    const handleStepComplete = (stepId: string) => {
        guideState.markStepComplete(stepId);
        guideState.nextStep();
    };

    // Check if we should skip feature setup step
    const featuresNeedingSetup = selectedFeatures.filter(id => 
        FEATURES.find(f => f.id === id)?.requiresSetup
    );

    const handleChooseFeaturesComplete = () => {
        if (featuresNeedingSetup.length === 0) {
            // Skip feature setup, go directly to your app
            guideState.markStepComplete('choose-features');
            guideState.markStepComplete('feature-setup');
            guideState.goToStep(3);
        } else {
            handleStepComplete('choose-features');
        }
    };

    const renderStep = () => {
        switch (guideState.currentStep) {
            case 0:
                return (
                    <GettingStartedStep
                        onComplete={() => handleStepComplete('getting-started')}
                        selectedIntegration={selectedIntegration}
                        selectedListing={selectedListing}
                        setSelectedListing={setSelectedListing}
                    />
                );

            case 1:
                return (
                    <ChooseFeaturesStep
                        onComplete={handleChooseFeaturesComplete}
                        onBack={guideState.prevStep}
                        selectedFeatures={selectedFeatures}
                        setSelectedFeatures={setSelectedFeatures}
                    />
                );

            case 2:
                return (
                    <FeatureSetupStep
                        onComplete={() => handleStepComplete('feature-setup')}
                        onBack={guideState.prevStep}
                        selectedFeatures={selectedFeatures}
                        currentFeatureIndex={currentFeatureIndex}
                        setCurrentFeatureIndex={setCurrentFeatureIndex}
                        featureSetupState={featureSetupState}
                        setFeatureSetupState={setFeatureSetupState}
                        selectedListing={selectedListing}
                    />
                );

            case 3:
                return (
                    <YourAppStep
                        onBack={guideState.prevStep}
                        selectedFeatures={selectedFeatures}
                        selectedListing={selectedListing}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="mx-auto py-4 max-w-3xl">
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

export default EmbedAppGuide;
