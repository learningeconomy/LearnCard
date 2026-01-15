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
    ShieldCheck,
    Play,
    Map,
    Bot,
    Layout,
} from 'lucide-react';

import type { LCNIntegration, AppStoreListing } from '@learncard/types';

import { StepProgress, CodeOutputPanel, GoLiveStep, StatusIndicator } from '../shared';
import { useGuideState } from '../shared/useGuideState';
import { useWallet, useToast, ToastTypeEnum, useModal, ModalTypes } from 'learn-card-base';
import OBv3CredentialBuilder from '../../../../components/credentials/OBv3CredentialBuilder';
import {
    CredentialBuilder,
    getBlankTemplate,
    templateToJson,
    jsonToTemplate,
    type OBv3CredentialTemplate,
} from '../../partner-onboarding/components/CredentialBuilder';
import { useDeveloperPortal } from '../../useDeveloperPortal';
import { ConsentFlowContractSelector } from '../../components/ConsentFlowContractSelector';
import { CodeBlock } from '../../components/CodeBlock';
import { TemplateListManager } from '../../components/TemplateListManager';
import { PERMISSION_OPTIONS } from '../../types';
import type { AppPermission, LaunchConfig, ExtendedAppStoreListing } from '../../types';
import { AppPreviewModal } from '../../components/AppPreviewModal';
import type { GuideProps } from '../GuidePage';
import type { EmbedAppGuideConfig, EmbedAppFeatureConfig, LLMIntegrationMetadata, TemplateMetadata } from '../types';

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
    comingSoon?: boolean;
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
        id: 'request-credentials',
        title: 'Request Credentials',
        description: 'Ask users to share credentials with your app for verification or gated access.',
        icon: <FileSearch className="w-6 h-6" />,
        requiresSetup: true,
        setupDescription: 'Configure Search Query',
        color: 'amber',
    },
    {
        id: 'request-data-consent',
        title: 'Request Data Consent',
        description: 'Ask users for permission to access specific data fields or write data back to their profile via a ConsentFlow contract.',
        icon: <ShieldCheck className="w-6 h-6" />,
        requiresSetup: true,
        setupDescription: 'Define Consent Contract',
        color: 'emerald',
    },
    {
        id: 'launch-feature',
        title: 'Launch Feature',
        description: 'Trigger native LearnCard tools directly from your app. Open the QR scanner, start an AI session, or display the profile card.',
        icon: <Play className="w-6 h-6" />,
        requiresSetup: true,
        setupDescription: 'Configure Feature Settings',
        color: 'purple',
    },
    {
        id: 'display-pathways',
        title: 'Display Pathways',
        description: 'Visualize a user\'s journey. Show completed steps and what credentials they need to reach a goal.',
        icon: <Map className="w-6 h-6" />,
        requiresSetup: true,
        setupDescription: 'Define Pathway/Map Structure',
        color: 'rose',
        comingSoon: true,
    },
    {
        id: 'launch-ai-assistant',
        title: 'Launch AI Assistant',
        description: 'Embed a custom AI chat or tutor experience. Configure preset prompts and context for "Math Tutor" or "Career Coach" style interactions.',
        icon: <Bot className="w-6 h-6" />,
        requiresSetup: true,
        setupDescription: 'Define AI Prompt & Context',
        color: 'indigo',
        comingSoon: true,
    },
];

const STEPS = [
    { id: 'getting-started', title: 'Getting Started' },
    { id: 'signing-authority', title: 'Set Up Signing' },
    { id: 'choose-features', title: 'Choose Features' },
    { id: 'feature-setup', title: 'Feature Setup' },
    { id: 'your-app', title: 'Your App' },
    { id: 'go-live', title: 'Go Live' },
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
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* App Listings */}
                            {listings && listings.length > 0 && (
                                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                                    {listings.map((listing) => {
                                        const isSelected = selectedListing?.listing_id === listing.listing_id;

                                        return (
                                            <button
                                                key={listing.listing_id}
                                                onClick={() => setSelectedListing(listing)}
                                                className={`w-full flex items-center gap-4 p-4 text-left transition-all ${
                                                    isSelected
                                                        ? 'bg-cyan-50'
                                                        : 'hover:bg-gray-50'
                                                }`}
                                            >
                                                {/* App Icon */}
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                                    isSelected ? 'bg-cyan-100' : 'bg-gray-100'
                                                }`}>
                                                    {listing.icon_url ? (
                                                        <img
                                                            src={listing.icon_url}
                                                            alt={listing.display_name}
                                                            className="w-10 h-10 rounded-lg object-cover"
                                                        />
                                                    ) : (
                                                        <Layout className={`w-6 h-6 ${isSelected ? 'text-cyan-600' : 'text-gray-400'}`} />
                                                    )}
                                                </div>

                                                {/* App Details */}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-semibold truncate ${isSelected ? 'text-cyan-700' : 'text-gray-800'}`}>
                                                        {listing.display_name}
                                                    </p>

                                                    <p className="text-xs text-gray-500 truncate">
                                                        {listing.tagline || 'No tagline set'}
                                                    </p>

                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                            listing.app_listing_status === 'LISTED' 
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : listing.app_listing_status === 'PENDING_REVIEW'
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {listing.app_listing_status === 'LISTED' ? 'Live' : listing.app_listing_status === 'PENDING_REVIEW' ? 'In Review' : 'Draft'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Selection Indicator */}
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                    isSelected
                                                        ? 'border-cyan-500 bg-cyan-500'
                                                        : 'border-gray-300'
                                                }`}>
                                                    {isSelected && (
                                                        <Check className="w-4 h-4 text-white" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Empty State */}
                            {(!listings || listings.length === 0) && !isCreatingListing && (
                                <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl text-center">
                                    <Layout className="w-10 h-10 text-gray-300 mx-auto mb-3" />

                                    <p className="text-gray-600 font-medium mb-1">No apps yet</p>

                                    <p className="text-sm text-gray-500">
                                        Create your first app to get started
                                    </p>
                                </div>
                            )}

                            {/* Create New App Form */}
                            {isCreatingListing ? (
                                <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            App Name
                                        </label>

                                        <input
                                            type="text"
                                            value={newListingName}
                                            onChange={(e) => setNewListingName(e.target.value)}
                                            placeholder="My Awesome App"
                                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleCreateListing();
                                                if (e.key === 'Escape') setIsCreatingListing(false);
                                            }}
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCreateListing}
                                            disabled={!newListingName.trim() || createListingMutation.isPending}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 transition-colors"
                                        >
                                            {createListingMutation.isPending ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Plus className="w-4 h-4" />
                                                    Create App
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => { setIsCreatingListing(false); setNewListingName(''); }}
                                            className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsCreatingListing(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-xl hover:border-cyan-400 hover:text-cyan-600 hover:bg-cyan-50/50 transition-colors font-medium"
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

// Step 1: Signing Authority
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

// Step 2: Choose Features (the hub)
const ChooseFeaturesStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
    selectedFeatures: string[];
    setSelectedFeatures: (features: string[]) => void;
}> = ({ onComplete, onBack, selectedFeatures, setSelectedFeatures }) => {
    const toggleFeature = (featureId: string) => {
        const feature = FEATURES.find(f => f.id === featureId);

        if (feature?.comingSoon) return; // Don't allow selection of coming soon features

        if (selectedFeatures.includes(featureId)) {
            setSelectedFeatures(selectedFeatures.filter(f => f !== featureId));
        } else {
            setSelectedFeatures([...selectedFeatures, featureId]);
        }
    };

    const getColorClasses = (color: string, isSelected: boolean, isComingSoon: boolean = false) => {
        const colors: Record<string, { border: string; bg: string; icon: string }> = {
            cyan: { border: 'border-cyan-500', bg: 'bg-cyan-50', icon: 'text-cyan-600 bg-cyan-100' },
            violet: { border: 'border-violet-500', bg: 'bg-violet-50', icon: 'text-violet-600 bg-violet-100' },
            purple: { border: 'border-purple-500', bg: 'bg-purple-50', icon: 'text-purple-600 bg-purple-100' },
            emerald: { border: 'border-emerald-500', bg: 'bg-emerald-50', icon: 'text-emerald-600 bg-emerald-100' },
            amber: { border: 'border-amber-500', bg: 'bg-amber-50', icon: 'text-amber-600 bg-amber-100' },
            rose: { border: 'border-rose-500', bg: 'bg-rose-50', icon: 'text-rose-600 bg-rose-100' },
            indigo: { border: 'border-indigo-500', bg: 'bg-indigo-50', icon: 'text-indigo-600 bg-indigo-100' },
        };

        const c = colors[color] || colors.cyan;

        if (isComingSoon) {
            return { border: 'border-gray-200 border-dashed', bg: 'bg-gray-50', icon: 'text-gray-400 bg-gray-100' };
        }

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
                    const isComingSoon = feature.comingSoon === true;
                    const colors = getColorClasses(feature.color, isSelected, isComingSoon);

                    return (
                        <button
                            key={feature.id}
                            onClick={() => toggleFeature(feature.id)}
                            disabled={isComingSoon}
                            className={`flex flex-col items-start p-5 border-2 rounded-2xl text-left transition-all ${colors.border} ${colors.bg} ${isComingSoon ? 'cursor-not-allowed opacity-75' : 'hover:shadow-md'}`}
                        >
                            <div className="w-full flex items-start justify-between mb-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.icon}`}>
                                    {feature.icon}
                                </div>

                                {isComingSoon ? (
                                    <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
                                        Coming Soon
                                    </span>
                                ) : (
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                        isSelected ? 'border-current bg-current' : 'border-gray-300'
                                    }`}>
                                        {isSelected && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                )}
                            </div>

                            <h4 className={`font-semibold mb-1 ${isComingSoon ? 'text-gray-500' : 'text-gray-800'}`}>{feature.title}</h4>

                            <p className={`text-sm mb-3 ${isComingSoon ? 'text-gray-400' : 'text-gray-600'}`}>{feature.description}</p>

                            {feature.requiresSetup && !isComingSoon && (
                                <div className="flex items-center gap-1.5 mt-auto">
                                    <Layers className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-xs text-gray-500">Requires: {feature.setupDescription}</span>
                                </div>
                            )}

                            {!feature.requiresSetup && !isComingSoon && (
                                <div className="flex items-center gap-1.5 mt-auto">
                                    <Zap className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-xs text-emerald-600 font-medium">Ready to use</span>
                                </div>
                            )}

                            {isComingSoon && (
                                <div className="flex items-center gap-1.5 mt-auto">
                                    <Sparkles className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-xs text-gray-400">Requires: {feature.setupDescription}</span>
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

// Managed Template type for prompt-claim-template mode
interface ManagedTemplate {
    boostUri: string;
    name: string;
    templateAlias: string;
    aliasEdited: boolean;
    variables: string[];
    isAddedToListing: boolean;
    credential: Record<string, unknown>;
    image?: string;
}

// Helper: Generate templateAlias from name
const generateTemplateAlias = (name: string): string => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 50)
        .replace(/^-|-$/g, '');
};

// Helper: Extract template variables ({{varName}}) from credential
const extractTemplateVariables = (credential: Record<string, unknown>): string[] => {
    const jsonStr = JSON.stringify(credential);
    const matches = jsonStr.match(/\{\{([^}]+)\}\}/g) || [];
    const uniqueVars = [...new Set(matches.map(m => m.replace(/[{}]/g, '')))];
    return uniqueVars;
};

// Template Manager Component - supports both initiateTemplateIssue and send() styles
type TemplateCodeStyle = 'initiateTemplateIssue' | 'send';

const TemplateManager: React.FC<{
    appListingId?: string;
    appName?: string;
    codeStyle?: TemplateCodeStyle;
    contractUri?: string;
    integrationId?: string;
}> = ({ appListingId, appName, codeStyle = 'initiateTemplateIssue', contractUri, integrationId }) => {
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
                meta: { appListingId, integrationId }, // Store both app listing ID and integration ID for filtering
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

    // No auto-selection of integration - user selects via header dropdown

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
                                        integrationId={selectedIntegration?.id}
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
    integrationId?: string;
}> = ({ onComplete, onBack, selectedFeatures, currentFeatureIndex, setCurrentFeatureIndex, featureSetupState, setFeatureSetupState, selectedListing, integrationId }) => {
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
                        integrationId={integrationId}
                    />
                );

            case 'peer-badges':
                return (
                    <PeerBadgesSetup
                        onComplete={handleFeatureComplete}
                        onBack={handleFeatureBack}
                        isLastFeature={isLastFeature}
                        selectedListing={selectedListing}
                        integrationId={integrationId}
                    />
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

            case 'request-data-consent':
                return (
                    <RequestDataConsentSetup
                        onComplete={handleFeatureComplete}
                        onBack={handleFeatureBack}
                        isLastFeature={isLastFeature}
                        featureSetupState={featureSetupState}
                        setFeatureSetupState={setFeatureSetupState}
                    />
                );

            case 'launch-feature':
                return (
                    <LaunchFeatureSetup
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

// Issue Credentials Setup - Three modes
type IssueMode = 'prompt-claim' | 'prompt-claim-template' | 'sync-wallet';

const IssueCredentialsSetup: React.FC<{
    onComplete: () => void;
    onBack: () => void;
    isLastFeature: boolean;
    selectedListing: AppStoreListing | null;
    featureSetupState: Record<string, Record<string, unknown>>;
    setFeatureSetupState: (state: Record<string, Record<string, unknown>>) => void;
    integrationId?: string;
}> = ({ onComplete, onBack, isLastFeature, selectedListing, featureSetupState, setFeatureSetupState, integrationId }) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();

    // Get saved mode from feature state or default to 'prompt-claim-template' (recommended)
    const savedState = featureSetupState['issue-credentials'] || {};
    const [mode, setMode] = useState<IssueMode>((savedState.mode as IssueMode) || 'prompt-claim-template');

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
            <div className="grid grid-cols-3 gap-3">
                <button
                    onClick={() => setMode('prompt-claim-template')}
                    className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                        mode === 'prompt-claim-template'
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                    <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-emerald-500 text-white text-xs font-medium rounded-full">
                        Recommended
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-emerald-600" />
                        <span className="font-semibold text-gray-800">Use Templates</span>
                    </div>

                    <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Easiest to set up</li>
                        <li>• Simple SDK integration</li>
                        <li>• Auto-generated aliases</li>
                    </ul>
                </button>

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
                        <span className="font-semibold text-gray-800">Manual Build</span>
                    </div>

                    <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Full control over VC</li>
                        <li>• Build credentials in code</li>
                        <li>• More complex setup</li>
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
                        <li>• Consent flow required</li>
                        <li>• Seamless sync</li>
                        <li>• Full analytics</li>
                    </ul>
                </button>
            </div>

            {/* Prompt to Claim Template Mode (Recommended) */}
            {mode === 'prompt-claim-template' && (
                <div className="space-y-6">
                    {/* Info Banner */}
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex gap-3">
                        <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />

                        <div className="text-sm text-emerald-700">
                            <p className="font-medium mb-1">How Template-Based Issuance Works</p>

                            <p>
                                Create credential templates here, and we&apos;ll automatically generate a <code className="px-1 py-0.5 bg-emerald-100 rounded text-xs">templateAlias</code> for each one.
                                Then use <code className="px-1 py-0.5 bg-emerald-100 rounded text-xs">sendCredential({"{"} templateAlias {"}"})</code> in your app to issue credentials.
                            </p>
                        </div>
                    </div>

                    {/* App Listing Check */}
                    {!selectedListing ? (
                        <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />

                                <div>
                                    <h4 className="font-medium text-amber-800 mb-1">App Listing Required</h4>

                                    <p className="text-sm text-amber-700">
                                        Please select an app listing in Step 1 (Getting Started) before creating templates.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <TemplateListManager
                            listingId={selectedListing.listing_id}
                            integrationId={integrationId}
                            featureType="issue-credentials"
                            showCodeSnippets={true}
                            editable={true}
                        />
                    )}
                </div>
            )}

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
                                    integrationId={integrationId}
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

            {/* Credential Builder Modal (for prompt-claim mode) */}
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

// Request Data Consent Setup
const RequestDataConsentSetup: React.FC<{
    onComplete: () => void;
    onBack: () => void;
    isLastFeature: boolean;
    featureSetupState: Record<string, Record<string, unknown>>;
    setFeatureSetupState: React.Dispatch<React.SetStateAction<Record<string, Record<string, unknown>>>>;
}> = ({ onComplete, onBack, isLastFeature, featureSetupState, setFeatureSetupState }) => {
    // Get saved state
    const savedState = featureSetupState['request-data-consent'] || {};
    const [contractUri, setContractUri] = useState<string>((savedState.contractUri as string) || '');

    // Save state when contractUri changes
    useEffect(() => {
        setFeatureSetupState(prev => ({
            ...prev,
            'request-data-consent': { ...prev['request-data-consent'], contractUri }
        }));
    }, [contractUri, setFeatureSetupState]);

    // Client-side: Request consent from user
    const clientCode = `// In your embedded app (client-side)
// Request consent from the user
const result = await learnCard.requestConsent({
    contractUri: '${contractUri || 'urn:lc:contract:your-contract-uri'}',
});

if (result.granted) {
    console.log('User granted consent!');
    
    // Send the consent confirmation to your server
    await fetch('/api/consent-granted', {
        method: 'POST',
        body: JSON.stringify({ 
            userId: result.userId,
            contractUri: '${contractUri || 'urn:lc:contract:your-contract-uri'}'
        })
    });
} else {
    console.log('User declined consent');
}`;

    // Server-side: Read and write data using consent
    const serverCode = `// On your server (Node.js)
import { initLearnCard } from '@learncard/init';

// Initialize with your API key (recommended) or seed phrase
const learnCard = await initLearnCard({
    network: true,
    apiKey: process.env.LEARNCARD_API_KEY, // Your API key
    // Or use a seed: seed: process.env.LEARNCARD_SEED
});

const contractUri = '${contractUri || 'urn:lc:contract:your-contract-uri'}';
const recipientProfileId = 'user-profile-id';

// READING: Get credentials the user has shared via consent
const credentials = await learnCard.invoke.getCredentialsForContract(
    contractUri,
    { limit: 50 }
);
console.log('User shared credentials:', credentials.records);

// WRITING: Send a credential to the user via consent
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: recipientProfileId,
    templateUri: 'urn:lc:boost:your-template-uri',
    contractUri: contractUri, // Routes via consent terms
});
console.log('Credential sent:', result);`;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Request Data Consent</h3>

                <p className="text-gray-600">
                    Ask users for permission to access specific data fields or write data back to their profile via a ConsentFlow contract.
                </p>
            </div>

            {/* Step 1: Select Consent Contract */}
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-semibold text-sm">
                        1
                    </div>

                    <h4 className="font-semibold text-gray-800">Select or Create a Consent Contract</h4>
                </div>

                <div className="ml-10">
                    <ConsentFlowContractSelector
                        value={contractUri}
                        onChange={setContractUri}
                    />
                </div>
            </div>

            {/* Step 2: Client-side Code */}
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-semibold text-sm">
                        2
                    </div>

                    <h4 className="font-semibold text-gray-800">Request Consent (Client-Side)</h4>
                </div>

                <div className="ml-10">
                    <p className="text-sm text-gray-600 mb-3">
                        Use the Partner SDK to prompt the user for consent in your embedded app.
                    </p>

                    <CodeBlock code={clientCode} maxHeight="max-h-64" />
                </div>
            </div>

            {/* Step 3: Server-side Code */}
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-semibold text-sm">
                        3
                    </div>

                    <h4 className="font-semibold text-gray-800">Read & Write Data (Server-Side)</h4>
                </div>

                <div className="ml-10">
                    <p className="text-sm text-gray-600 mb-3">
                        On your server, initialize with your API key to read shared credentials and send new ones.
                    </p>

                    <CodeBlock code={serverCode} maxHeight="max-h-96" />
                </div>
            </div>

            {/* How it works */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <h4 className="font-medium text-emerald-800 mb-2">How ConsentFlow Works</h4>

                <ol className="text-sm text-emerald-700 space-y-1">
                    <li><strong>1.</strong> You define a contract specifying what data you need access to</li>
                    <li><strong>2.</strong> User reviews and approves (or declines) the request</li>
                    <li><strong>3.</strong> You receive a consent ID for future data operations</li>
                    <li><strong>4.</strong> Use the consent ID to read/write data per contract terms</li>
                </ol>
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
                    {isLastFeature ? 'See Your Code' : 'Next Feature'}
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// Launch Feature Setup - Comprehensive Feature Builder
interface LaunchableFeature {
    id: string;
    path: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    params?: { name: string; description: string; placeholder: string }[];
}

interface FeatureCategory {
    id: string;
    title: string;
    icon: React.ReactNode;
    color: string;
    features: LaunchableFeature[];
}

const LAUNCHABLE_FEATURES: FeatureCategory[] = [
    {
        id: 'core',
        title: 'Core Navigation',
        icon: <Navigation className="w-4 h-4" />,
        color: 'blue',
        features: [
            { id: 'passport', path: '/passport', title: 'Wallet / Passport', description: 'Main credential wallet view', icon: <FolderOpen className="w-4 h-4" /> },
            { id: 'boost', path: '/boost', title: 'Boost Manager', description: 'Badge/boost management', icon: <Award className="w-4 h-4" /> },
            { id: 'launchpad', path: '/launchpad', title: 'App Launchpad', description: 'App discovery hub', icon: <Rocket className="w-4 h-4" /> },
        ],
    },
    {
        id: 'profile',
        title: 'Profile & Identity',
        icon: <User className="w-4 h-4" />,
        color: 'violet',
        features: [
            { id: 'ids', path: '/ids', title: 'IDs & DIDs', description: 'User identity management', icon: <Key className="w-4 h-4" /> },
            { id: 'connect', path: '/connect', title: 'Connect', description: 'Connect with others', icon: <LinkIcon className="w-4 h-4" /> },
            { 
                id: 'connect-profile', 
                path: '/connect/:profileId', 
                title: 'Connect with User', 
                description: 'Connect with a specific user',
                icon: <User className="w-4 h-4" />,
                params: [{ name: 'profileId', description: 'Profile ID to connect with', placeholder: 'user-profile-id' }]
            },
            { id: 'contacts', path: '/contacts', title: 'Address Book', description: 'All contacts', icon: <FileText className="w-4 h-4" /> },
            { id: 'contacts-search', path: '/contacts/search', title: 'Search Contacts', description: 'Search for contacts', icon: <Search className="w-4 h-4" /> },
        ],
    },
    {
        id: 'credentials',
        title: 'Credentials & Achievements',
        icon: <Award className="w-4 h-4" />,
        color: 'amber',
        features: [
            { id: 'achievements', path: '/achievements', title: 'Achievements', description: 'View achievements', icon: <Award className="w-4 h-4" /> },
            { id: 'accomplishments', path: '/accomplishments', title: 'Accomplishments', description: 'View accomplishments', icon: <CheckCircle2 className="w-4 h-4" /> },
            { id: 'skills', path: '/skills', title: 'Skills', description: 'Skills inventory', icon: <Zap className="w-4 h-4" /> },
            { id: 'learninghistory', path: '/learninghistory', title: 'Learning History', description: 'Educational timeline', icon: <FileText className="w-4 h-4" /> },
            { id: 'workhistory', path: '/workhistory', title: 'Work History', description: 'Employment records', icon: <FileText className="w-4 h-4" /> },
            { id: 'memberships', path: '/memberships', title: 'Memberships', description: 'Organization memberships', icon: <User className="w-4 h-4" /> },
            { 
                id: 'claim-boost', 
                path: '/claim/boost', 
                title: 'Claim Boost', 
                description: 'Claim a boost by URI',
                icon: <Sparkles className="w-4 h-4" />,
                params: [{ name: 'uri', description: 'Boost URI to claim', placeholder: 'urn:lc:boost:abc123' }]
            },
        ],
    },
    {
        id: 'ai',
        title: 'AI Features',
        icon: <Bot className="w-4 h-4" />,
        color: 'emerald',
        features: [
            { id: 'chats', path: '/chats', title: 'AI Chat', description: 'Open AI chat interface', icon: <Bot className="w-4 h-4" /> },
            { id: 'ai-insights', path: '/ai/insights', title: 'AI Insights', description: 'AI-powered insights', icon: <Zap className="w-4 h-4" /> },
            { id: 'ai-topics', path: '/ai/topics', title: 'AI Topics', description: 'Browse AI session topics', icon: <Layers className="w-4 h-4" /> },
            { id: 'ai-sessions', path: '/ai/sessions', title: 'AI Sessions', description: 'View AI session history', icon: <FileText className="w-4 h-4" /> },
        ],
    },
    {
        id: 'apps',
        title: 'Apps & Launchpad',
        icon: <Rocket className="w-4 h-4" />,
        color: 'cyan',
        features: [
            { id: 'launchpad-main', path: '/launchpad', title: 'App Launchpad', description: 'Browse all apps', icon: <Rocket className="w-4 h-4" /> },
            { 
                id: 'app-embed', 
                path: '/apps/:appId', 
                title: 'Open App', 
                description: 'Launch an embedded app fullscreen',
                icon: <Monitor className="w-4 h-4" />,
                params: [{ name: 'appId', description: 'App ID to launch', placeholder: 'my-app-id' }]
            },
            { 
                id: 'app-listing', 
                path: '/app/:listingId', 
                title: 'App Details', 
                description: 'View app listing page',
                icon: <FileText className="w-4 h-4" />,
                params: [{ name: 'listingId', description: 'Listing ID', placeholder: 'listing-123' }]
            },
        ],
    },
    {
        id: 'notifications',
        title: 'Notifications',
        icon: <AlertCircle className="w-4 h-4" />,
        color: 'rose',
        features: [
            { id: 'notifications', path: '/notifications', title: 'Notifications', description: 'View all notifications', icon: <AlertCircle className="w-4 h-4" /> },
        ],
    },
    {
        id: 'admin',
        title: 'Admin Tools',
        icon: <Shield className="w-4 h-4" />,
        color: 'gray',
        features: [
            { id: 'admin-tools', path: '/admin-tools', title: 'Admin Dashboard', description: 'Admin tools home', icon: <Shield className="w-4 h-4" /> },
            { id: 'managed-boosts', path: '/admin-tools/view-managed-boosts', title: 'Managed Boosts', description: 'View all managed boosts', icon: <Award className="w-4 h-4" /> },
            { id: 'bulk-import', path: '/admin-tools/bulk-import', title: 'Bulk Import', description: 'Bulk boost import', icon: <Layers className="w-4 h-4" /> },
            { id: 'service-profiles', path: '/admin-tools/service-profiles', title: 'Service Profiles', description: 'Manage service profiles', icon: <User className="w-4 h-4" /> },
            { id: 'manage-contracts', path: '/admin-tools/manage-contracts', title: 'Consent Contracts', description: 'Manage consent contracts', icon: <FileText className="w-4 h-4" /> },
            { id: 'signing-authorities', path: '/admin-tools/signing-authorities', title: 'Signing Authorities', description: 'Manage signing authorities', icon: <Key className="w-4 h-4" /> },
            { id: 'api-tokens', path: '/admin-tools/api-tokens', title: 'API Tokens', description: 'Manage API tokens', icon: <Lock className="w-4 h-4" /> },
        ],
    },
    {
        id: 'family',
        title: 'Family',
        icon: <User className="w-4 h-4" />,
        color: 'pink',
        features: [
            { id: 'families', path: '/families', title: 'Family Management', description: 'Manage family members', icon: <User className="w-4 h-4" /> },
        ],
    },
];

const LaunchFeatureSetup: React.FC<{
    onComplete: () => void;
    onBack: () => void;
    isLastFeature: boolean;
    featureSetupState: Record<string, Record<string, unknown>>;
    setFeatureSetupState: React.Dispatch<React.SetStateAction<Record<string, Record<string, unknown>>>>;
}> = ({ onComplete, onBack, isLastFeature, featureSetupState, setFeatureSetupState }) => {
    // Get saved state
    const savedState = featureSetupState['launch-feature'] || {};
    const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>(
        (savedState.selectedFeatureIds as string[]) || []
    );
    const [expandedCategories, setExpandedCategories] = useState<string[]>(
        (savedState.expandedCategories as string[]) || ['core']
    );
    const [paramValues, setParamValues] = useState<Record<string, Record<string, string>>>(
        (savedState.paramValues as Record<string, Record<string, string>>) || {}
    );

    // Get all selected features
    const selectedFeatures = LAUNCHABLE_FEATURES
        .flatMap(cat => cat.features)
        .filter(f => selectedFeatureIds.includes(f.id));

    // Toggle feature selection
    const toggleFeature = (featureId: string) => {
        setSelectedFeatureIds(prev => 
            prev.includes(featureId) 
                ? prev.filter(id => id !== featureId)
                : [...prev, featureId]
        );
    };

    // Toggle category expansion
    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    // Save state when values change
    useEffect(() => {
        setFeatureSetupState(prev => ({
            ...prev,
            'launch-feature': { 
                ...prev['launch-feature'], 
                selectedFeatureIds,
                expandedCategories,
                paramValues
            }
        }));
    }, [selectedFeatureIds, expandedCategories, paramValues, setFeatureSetupState]);

    // Generate code for all selected features
    const generateCode = () => {
        if (selectedFeatures.length === 0) {
            return `// Select features above to see example code`;
        }

        const codeBlocks = selectedFeatures.map(feature => {
            let path = feature.path;
            const featureParams = paramValues[feature.id] || {};

            // Replace path params
            if (feature.params) {
                feature.params.forEach(param => {
                    const value = featureParams[param.name] || param.placeholder;
                    path = path.replace(`:${param.name}`, value);
                });
            }

            return `// Launch ${feature.title}
await learnCard.launchFeature('${path}');`;
        });

        return codeBlocks.join('\n\n');
    };

    const getCategoryColorClasses = (color: string, isExpanded: boolean) => {
        const colors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
            blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'text-blue-600' },
            violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800', icon: 'text-violet-600' },
            amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: 'text-amber-600' },
            emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: 'text-emerald-600' },
            cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800', icon: 'text-cyan-600' },
            rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', icon: 'text-rose-600' },
            gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', icon: 'text-gray-600' },
            pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800', icon: 'text-pink-600' },
        };

        return colors[color] || colors.gray;
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Launch Native Features</h3>

                <p className="text-gray-600">
                    Navigate users to any LearnCard screen directly from your app. Select a category and feature to configure.
                </p>
            </div>

            {/* Step 1: Category & Feature Selection */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center font-semibold text-sm">
                            1
                        </div>

                        <h4 className="font-semibold text-gray-800">Select Features</h4>
                    </div>

                    {selectedFeatureIds.length > 0 && (
                        <span className="text-sm text-purple-600 font-medium">
                            {selectedFeatureIds.length} selected
                        </span>
                    )}
                </div>

                <div className="ml-10 space-y-2 max-h-96 overflow-y-auto pr-2">
                    {LAUNCHABLE_FEATURES.map(category => {
                        const isExpanded = expandedCategories.includes(category.id);
                        const colors = getCategoryColorClasses(category.color, isExpanded);
                        const selectedCount = category.features.filter(f => selectedFeatureIds.includes(f.id)).length;

                        return (
                            <div key={category.id} className="border border-gray-200 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => toggleCategory(category.id)}
                                    className={`w-full flex items-center justify-between p-3 text-left transition-colors ${
                                        isExpanded || selectedCount > 0 ? colors.bg : 'bg-white hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                            isExpanded || selectedCount > 0 ? colors.bg : 'bg-gray-100'
                                        } ${colors.icon}`}>
                                            {category.icon}
                                        </div>

                                        <div>
                                            <span className={`font-medium ${isExpanded || selectedCount > 0 ? colors.text : 'text-gray-700'}`}>
                                                {category.title}
                                            </span>

                                            <span className="text-xs text-gray-400 ml-2">
                                                {selectedCount > 0 ? (
                                                    <span className={colors.text}>{selectedCount} selected</span>
                                                ) : (
                                                    `${category.features.length} available`
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>

                                {isExpanded && (
                                    <div className="border-t border-gray-100 p-2 bg-white">
                                        <div className="space-y-1">
                                            {category.features.map(feature => {
                                                const isSelected = selectedFeatureIds.includes(feature.id);

                                                return (
                                                    <label
                                                        key={feature.id}
                                                        className={`flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                                                            isSelected
                                                                ? `${colors.bg} ${colors.border} border`
                                                                : 'border border-transparent hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleFeature(feature.id)}
                                                            className={`w-4 h-4 mt-0.5 rounded ${colors.text}`}
                                                        />

                                                        <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${
                                                            isSelected ? colors.icon + ' ' + colors.bg : 'text-gray-400 bg-gray-100'
                                                        }`}>
                                                            {feature.icon}
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <p className={`text-sm font-medium ${isSelected ? colors.text : 'text-gray-700'}`}>
                                                                {feature.title}
                                                            </p>

                                                            <p className="text-xs text-gray-400">{feature.description}</p>

                                                            {feature.params && (
                                                                <span className="inline-flex items-center gap-1 mt-1 text-xs text-gray-400">
                                                                    <Code className="w-3 h-3" />
                                                                    {feature.params.length} param{feature.params.length !== 1 ? 's' : ''}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step 2: Configure Parameters for selected features with params */}
            {selectedFeatures.some(f => f.params && f.params.length > 0) && (
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center font-semibold text-sm">
                            2
                        </div>

                        <h4 className="font-semibold text-gray-800">Configure Parameters</h4>
                    </div>

                    <div className="ml-10 space-y-4">
                        {selectedFeatures.filter(f => f.params && f.params.length > 0).map(feature => (
                            <div key={feature.id} className="p-3 bg-gray-50 rounded-lg space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    {feature.icon}
                                    {feature.title}
                                </div>

                                {feature.params?.map(param => (
                                    <div key={param.name}>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            {param.name}
                                            <span className="font-normal text-gray-400 ml-1">— {param.description}</span>
                                        </label>

                                        <input
                                            type="text"
                                            value={paramValues[feature.id]?.[param.name] || ''}
                                            onChange={(e) => setParamValues(prev => ({ 
                                                ...prev, 
                                                [feature.id]: { 
                                                    ...prev[feature.id], 
                                                    [param.name]: e.target.value 
                                                } 
                                            }))}
                                            placeholder={param.placeholder}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 3: Integration Code */}
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center font-semibold text-sm">
                        {selectedFeatures.some(f => f.params?.length) ? '3' : '2'}
                    </div>

                    <h4 className="font-semibold text-gray-800">Integration Code</h4>
                </div>

                <div className="ml-10">
                    {selectedFeatures.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                            {selectedFeatures.map(feature => (
                                <span 
                                    key={feature.id}
                                    className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-700"
                                >
                                    {feature.icon}
                                    {feature.title}
                                </span>
                            ))}
                        </div>
                    )}

                    <CodeBlock code={generateCode()} maxHeight="max-h-64" />
                </div>
            </div>

            {/* Tips */}
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                <h4 className="font-medium text-purple-800 mb-2">Tips</h4>

                <ul className="text-sm text-purple-700 space-y-1">
                    <li>• <code className="bg-purple-100 px-1 rounded">launchFeature</code> navigates users to any LearnCard screen</li>
                    <li>• Parameters are passed as URL params or path segments</li>
                    <li>• Admin tools are only accessible to users with admin permissions</li>
                    <li>• Results indicate success/failure of the navigation</li>
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
    integrationId?: string;
}> = ({ onComplete, onBack, isLastFeature, selectedListing, integrationId }) => {
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
                <TemplateListManager
                    listingId={selectedListing.listing_id}
                    integrationId={integrationId}
                    featureType="peer-badges"
                    showCodeSnippets={true}
                    editable={true}
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
    onComplete: () => void;
    selectedFeatures: string[];
    selectedListing: AppStoreListing | null;
    featureSetupState: Record<string, Record<string, unknown>>;
    integrationId?: string;
}> = ({ onBack, onComplete, selectedFeatures, selectedListing, featureSetupState, integrationId }) => {
    const { useUpdateListing } = useDeveloperPortal();
    const updateMutation = useUpdateListing();
    const { presentToast } = useToast();
    const { newModal } = useModal();
    const { initWallet } = useWallet();

    const [copiedCode, setCopiedCode] = useState(false);
    const [showConfigEditor, setShowConfigEditor] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showConfigMismatchPrompt, setShowConfigMismatchPrompt] = useState(false);
    const [hasCheckedConfig, setHasCheckedConfig] = useState(false);
    const [peerBadgeTemplates, setPeerBadgeTemplates] = useState<BoostTemplate[]>([]);
    const [issueCredentialTemplates, setIssueCredentialTemplates] = useState<BoostTemplate[]>([]);

    // ============================================================
    // FETCH ALL TEMPLATES - by both appListingId AND integrationId
    // ============================================================
    useEffect(() => {
        const needsPeerBadges = selectedFeatures.includes('peer-badges');
        const needsIssueCredentials = selectedFeatures.includes('issue-credentials');

        if (!needsPeerBadges && !needsIssueCredentials) {
            setPeerBadgeTemplates([]);
            setIssueCredentialTemplates([]);
            return;
        }

        let cancelled = false;

        const fetchAllTemplates = async () => {
            try {
                const wallet = await initWallet();
                const allTemplates: BoostTemplate[] = [];
                const seenUris = new Set<string>();

                // Helper to add templates without duplicates
                const addTemplates = (records: Record<string, unknown>[]) => {
                    for (const boost of records) {
                        const uri = boost.uri as string;

                        if (!seenUris.has(uri)) {
                            seenUris.add(uri);
                            allTemplates.push({
                                uri,
                                name: boost.name as string || 'Untitled Template',
                                description: boost.description as string,
                                type: boost.type as string,
                                category: boost.category as string,
                                image: boost.image as string,
                                createdAt: boost.createdAt as string,
                            });
                        }
                    }
                };

                // Fetch by appListingId
                if (selectedListing?.listing_id) {
                    const byListing = await wallet.invoke.getPaginatedBoosts({
                        limit: 100,
                        query: { meta: { appListingId: selectedListing.listing_id } }
                    });
                    addTemplates(byListing?.records || []);
                }

                // Fetch by integrationId
                if (integrationId) {
                    const byIntegration = await wallet.invoke.getPaginatedBoosts({
                        limit: 100,
                        query: { meta: { integrationId } }
                    });
                    addTemplates(byIntegration?.records || []);
                }

                if (!cancelled) {
                    // All templates can be used for peer badges
                    setPeerBadgeTemplates(allTemplates);
                    // All templates can also be used for issue-credentials sync mode
                    setIssueCredentialTemplates(allTemplates);
                }
            } catch (err) {
                console.error('Failed to fetch templates:', err);

                if (!cancelled) {
                    setPeerBadgeTemplates([]);
                    setIssueCredentialTemplates([]);
                }
            }
        };

        fetchAllTemplates();

        return () => {
            cancelled = true;
        };
    }, [selectedListing?.listing_id, integrationId, selectedFeatures, initWallet]);

    // Extract configured values from feature setup state
    const issueCredentialsState = featureSetupState['issue-credentials'] || {};
    const requestCredentialsState = featureSetupState['request-credentials'] || {};
    const requestDataConsentState = featureSetupState['request-data-consent'] || {};
    const launchFeatureState = featureSetupState['launch-feature'] || {};

    // Parse existing launch config from listing
    const existingConfig: LaunchConfig = (() => {
        try {
            return selectedListing?.launch_config_json 
                ? JSON.parse(selectedListing.launch_config_json) 
                : {};
        } catch {
            return {};
        }
    })();

    // App config state
    const [embedUrl, setEmbedUrl] = useState(existingConfig.url || '');
    const [selectedPermissions, setSelectedPermissions] = useState<AppPermission[]>(
        existingConfig.permissions || []
    );
    const [contractUri, setContractUri] = useState(existingConfig.contractUri || '');

    // Compute required permissions based on selected features
    const computeRequiredPermissions = useCallback((): AppPermission[] => {
        const permissions = new Set<AppPermission>();

        // Always need identity
        permissions.add('request_identity');

        if (selectedFeatures.includes('issue-credentials')) {
            permissions.add('send_credential');
        }

        if (selectedFeatures.includes('peer-badges')) {
            permissions.add('template_issuance');
        }

        if (selectedFeatures.includes('request-credentials')) {
            const mode = requestCredentialsState.mode as string || 'query';
            if (mode === 'query') {
                permissions.add('credential_search');
            } else {
                permissions.add('credential_by_id');
            }
        }

        if (selectedFeatures.includes('request-data-consent')) {
            permissions.add('request_consent');
        }

        if (selectedFeatures.includes('launch-feature')) {
            permissions.add('launch_feature');
        }

        return Array.from(permissions);
    }, [selectedFeatures, requestCredentialsState.mode]);

    // Auto-compute permissions when features change
    useEffect(() => {
        const required = computeRequiredPermissions();
        setSelectedPermissions(prev => {
            // Merge required with existing, keeping any extras
            const merged = new Set([...prev, ...required]);
            return Array.from(merged);
        });
    }, [computeRequiredPermissions]);

    // Auto-set contract URI if using request-data-consent
    useEffect(() => {
        if (selectedFeatures.includes('request-data-consent')) {
            const consentContractUri = requestDataConsentState.contractUri as string;
            if (consentContractUri && !contractUri) {
                setContractUri(consentContractUri);
            }
        }
    }, [selectedFeatures, requestDataConsentState.contractUri, contractUri]);

    // Compute the new config based on user selections
    const computeNewConfig = useCallback((): LaunchConfig => {
        const requiredPermissions = computeRequiredPermissions();
        const consentContractUri = selectedFeatures.includes('request-data-consent')
            ? (requestDataConsentState.contractUri as string) || ''
            : '';

        return {
            url: existingConfig.url || '', // Keep existing URL
            permissions: requiredPermissions,
            contractUri: consentContractUri || undefined,
        };
    }, [computeRequiredPermissions, selectedFeatures, requestDataConsentState.contractUri, existingConfig.url]);

    // Check for config mismatch on mount
    useEffect(() => {
        if (hasCheckedConfig || !selectedListing) return;

        const newConfig = computeNewConfig();
        const existingPermissions = existingConfig.permissions || [];
        const existingContractUri = existingConfig.contractUri || '';

        // Check if permissions are different
        const permissionsDifferent = 
            newConfig.permissions?.length !== existingPermissions.length ||
            newConfig.permissions?.some(p => !existingPermissions.includes(p)) ||
            existingPermissions.some(p => !newConfig.permissions?.includes(p));

        // Check if contract URI is different
        const contractDifferent = (newConfig.contractUri || '') !== existingContractUri;

        if (permissionsDifferent || contractDifferent) {
            setShowConfigMismatchPrompt(true);
        }

        setHasCheckedConfig(true);
    }, [hasCheckedConfig, selectedListing, computeNewConfig, existingConfig]);

    // Handle accepting the config update
    const handleAcceptConfigUpdate = async () => {
        if (!selectedListing) return;

        setIsSaving(true);
        try {
            const newConfig = computeNewConfig();
            // Preserve the existing URL if set, otherwise use the computed one
            newConfig.url = embedUrl || existingConfig.url || '';

            await updateMutation.mutateAsync({
                listingId: selectedListing.listing_id,
                updates: {
                    launch_config_json: JSON.stringify(newConfig, null, 2),
                },
            });

            // Update local state to match
            setSelectedPermissions(newConfig.permissions || []);
            if (newConfig.contractUri) {
                setContractUri(newConfig.contractUri);
            }

            presentToast('App configuration updated!', { hasDismissButton: true });
            setShowConfigMismatchPrompt(false);
        } catch (error) {
            console.error('Failed to update config:', error);
            presentToast('Failed to update configuration', { 
                type: ToastTypeEnum.Error, 
                hasDismissButton: true 
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Save config to listing
    const handleSaveConfig = async () => {
        if (!selectedListing) return;

        setIsSaving(true);
        try {
            const newConfig: LaunchConfig = {
                url: embedUrl,
                permissions: selectedPermissions,
                contractUri: contractUri || undefined,
            };

            await updateMutation.mutateAsync({
                listingId: selectedListing.listing_id,
                updates: {
                    launch_config_json: JSON.stringify(newConfig, null, 2),
                },
            });

            presentToast('App configuration saved!', { hasDismissButton: true });
            setShowConfigEditor(false);
        } catch (error) {
            console.error('Failed to save config:', error);
            presentToast('Failed to save configuration', { 
                type: ToastTypeEnum.Error, 
                hasDismissButton: true 
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Toggle permission
    const togglePermission = (permission: AppPermission) => {
        setSelectedPermissions(prev =>
            prev.includes(permission)
                ? prev.filter(p => p !== permission)
                : [...prev, permission]
        );
    };

    // Create mock listing and open preview modal
    const openPreviewModal = () => {
        if (!selectedListing) return;

        // Build launch config with current values
        const launchConfig: LaunchConfig = {
            url: embedUrl,
            permissions: selectedPermissions,
            contractUri: contractUri || undefined,
        };

        const mockListing: ExtendedAppStoreListing = {
            listing_id: selectedListing.listing_id,
            display_name: selectedListing.display_name,
            tagline: selectedListing.tagline || '',
            full_description: selectedListing.full_description || '',
            icon_url: selectedListing.icon_url || 'https://placehold.co/128x128/e2e8f0/64748b?text=Preview',
            launch_type: 'EMBEDDED_IFRAME',
            launch_config_json: JSON.stringify(launchConfig),
            app_listing_status: 'DRAFT',
            category: (selectedListing as ExtendedAppStoreListing).category,
            promo_video_url: (selectedListing as ExtendedAppStoreListing).promo_video_url,
            privacy_policy_url: (selectedListing as ExtendedAppStoreListing).privacy_policy_url,
            terms_url: (selectedListing as ExtendedAppStoreListing).terms_url,
            ios_app_store_id: (selectedListing as ExtendedAppStoreListing).ios_app_store_id,
            android_app_store_id: (selectedListing as ExtendedAppStoreListing).android_app_store_id,
            highlights: (selectedListing as ExtendedAppStoreListing).highlights,
            screenshots: (selectedListing as ExtendedAppStoreListing).screenshots,
            hero_background_color: (selectedListing as ExtendedAppStoreListing).hero_background_color,
        };

        newModal(
            <AppPreviewModal listing={mockListing} />,
            { hideButton: true },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    // Generate comprehensive code based on selected features and their configuration
    const generateCode = () => {
        const sections: string[] = [];

        // Build LLM-friendly metadata object
        const dataConsentContractUri = (requestDataConsentState.contractUri as string) || null;
        const issueContractUri = (issueCredentialsState.contractUri as string) || null;

        const llmMetadata: LLMIntegrationMetadata = {
            app: {
                name: selectedListing?.display_name || 'Your App Name',
                listingId: selectedListing?.listing_id || '',
                integrationId: integrationId || '',
            },
            features: selectedFeatures,
            templates: {
                peerBadges: peerBadgeTemplates.map(t => ({
                    uri: t.uri,
                    name: t.name,
                    description: t.description,
                    type: t.type,
                })),
                issueCredentials: issueCredentialTemplates.map(t => ({
                    uri: t.uri,
                    name: t.name,
                    description: t.description,
                    type: t.type,
                })),
            },
            contracts: {
                dataConsent: dataConsentContractUri,
                issueCredentials: issueContractUri,
            },
            permissions: computeRequiredPermissions(),
            generatedAt: new Date().toISOString(),
        };

        // ===================
        // HEADER / METADATA (LLM-OPTIMIZED)
        // ===================
        sections.push(`/**
 * ================================================================
 * LEARNCARD EMBEDDED APP INTEGRATION
 * ================================================================
 * 
 * App: ${selectedListing?.display_name || 'Your App Name'}
 * Listing ID: ${selectedListing?.listing_id || 'NOT_SET'}
 * Integration ID: ${integrationId || 'NOT_SET'}
 * Generated: ${new Date().toISOString()}
 * 
 * Features configured:
 * ${selectedFeatures.map(id => `  - ${FEATURES.find(f => f.id === id)?.title || id}`).join('\n * ')}
 * 
 * ================================================================
 * LLM INTEGRATION METADATA
 * ================================================================
 * The following JSON contains all configured URIs and settings.
 * Use these values directly - no placeholders to replace!
 * 
 * @llm-config
${JSON.stringify(llmMetadata, null, 2).split('\n').map(line => ' * ' + line).join('\n')}
 * 
 * ================================================================
 * QUICK REFERENCE
 * ================================================================
 * ${peerBadgeTemplates.length > 0 ? `Peer Badge Templates: ${peerBadgeTemplates.length} available` : 'Peer Badge Templates: None configured'}
 * ${dataConsentContractUri ? `Data Consent Contract: ${dataConsentContractUri}` : 'Data Consent Contract: Not configured'}
 * ${issueContractUri ? `Issue Credentials Contract: ${issueContractUri}` : 'Issue Credentials Contract: Not configured'}
 * 
 * Prerequisites:
 *   1. Install the SDK: npm install @learncard/partner-connect
 *   2. Your app must be served in an iframe within LearnCard
 *   3. Configure CORS headers to allow iframe embedding
 * 
 * Documentation: https://docs.learncard.com/sdks/partner-connect
 */`);

        // ===================
        // IMPORTS
        // ===================
        sections.push(`
// ============================================================
// IMPORTS
// ============================================================
import { createPartnerConnect } from '@learncard/partner-connect';`);

        // ===================
        // SDK INITIALIZATION
        // ===================
        sections.push(`
// ============================================================
// SDK INITIALIZATION
// ============================================================
// Create the partner connection to communicate with LearnCard
const learnCard = createPartnerConnect({
    hostOrigin: 'https://learncard.app', // LearnCard app origin
});`);

        // ===================
        // USER IDENTITY
        // ===================
        sections.push(`
// ============================================================
// USER IDENTITY
// ============================================================
// Request the user's identity - this is typically called on app load
// Returns the user's DID, profile info, and display name
async function getUserIdentity() {
    try {
        const identity = await learnCard.requestIdentity();
        
        console.log('User DID:', identity.did);
        console.log('Display Name:', identity.profile.displayName);
        console.log('Profile ID:', identity.profile.profileId);
        
        return identity;
    } catch (error) {
        console.error('Failed to get user identity:', error);
        throw error;
    }
}`);

        // ===================
        // ISSUE CREDENTIALS
        // ===================
        if (selectedFeatures.includes('issue-credentials')) {
            const mode = issueCredentialsState.mode as string || 'prompt-claim';
            const credential = issueCredentialsState.credential as Record<string, unknown> | null;
            const credentialName = credential?.name as string || 'Your Credential';
            const contractUri = issueCredentialsState.contractUri as string || '';

            if (mode === 'prompt-claim') {
                sections.push(`
// ============================================================
// ISSUE CREDENTIALS - Prompt to Claim
// ============================================================
// Mode: Build a credential and prompt user to claim it
// 
// How it works:
//   1. Get the user's DID to include in the credential
//   2. Build the credential with their DID as the subject
//   3. Issue the credential server-side (with your signing authority)
//   4. Send the issued VC to the user to claim

async function issueCredentialToUser() {
    // 1. Get the user's identity
    const identity = await learnCard.requestIdentity();
    const recipientDid = identity.did;

    // 2. Build the credential with recipient's DID
    const credential = {
        "@context": [
            "https://www.w3.org/ns/credentials/v2",
            "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
        ],
        "type": ["VerifiableCredential", "OpenBadgeCredential"],
        "name": "${credentialName}",
        "issuer": {
            "id": "YOUR_ISSUER_DID", // TODO: Replace with your organization's DID
            "name": "Your Organization"
        },
        "credentialSubject": {
            "id": recipientDid, // Inject the user's DID here
            "type": ["AchievementSubject"],
            "achievement": {
                "type": ["Achievement"],
                "name": "${credentialName}",
                "description": "Description of the achievement"
            }
        }
    };

    // 3. Issue the credential server-side (with your API key)
    // POST to your backend, which calls:
    //   const wallet = await initLearnCard({ seed: YOUR_SEED });
    //   const issuedVC = await wallet.invoke.issueCredential(credential);
    const response = await fetch('/api/issue-credential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
    });
    const { issuedVC } = await response.json();

    // 4. Prompt user to claim the issued credential
    const result = await learnCard.sendCredential({ credential: issuedVC });

    if (result.success) {
        console.log('Credential claimed!');
    }
}`);
            } else {
                // sync-wallet mode - use actual template URIs if available
                const firstTemplate = issueCredentialTemplates[0];
                const templateUri = firstTemplate?.uri || 'urn:lc:boost:YOUR_TEMPLATE_URI';
                const templateNote = firstTemplate 
                    ? `Using template: "${firstTemplate.name}" (${templateUri})`
                    : 'No templates configured - create one in the setup step';

                // Generate template list for server-side code
                const templateListJson = issueCredentialTemplates.length > 0
                    ? JSON.stringify(issueCredentialTemplates.map(t => ({
                        uri: t.uri,
                        name: t.name,
                        description: t.description || '',
                    })), null, 4)
                    : '[]';

                sections.push(`
// ============================================================
// ISSUE CREDENTIALS - Sync to Wallet (Server-Side)
// ============================================================
// Mode: Silently sync credentials to user's wallet via consent
// 
// How it works:
//   1. User grants consent via ConsentFlow contract
//   2. Your SERVER issues credentials using your signing authority
//   3. Credentials appear in user's wallet automatically
//
// Contract URI: ${contractUri || 'NOT_CONFIGURED'}
// ${templateNote}
//
// IMPORTANT: This requires server-side code with your signing authority

// Available credential templates for issuance:
const CREDENTIAL_TEMPLATES = ${templateListJson};

// --- CLIENT-SIDE: Request consent from user ---
async function requestUserConsent() {
    const result = await learnCard.requestConsent({
        contractUri: '${contractUri || 'urn:lc:contract:YOUR_CONTRACT_URI'}',
    });
    
    if (result.granted) {
        // Notify your server that consent was granted
        await fetch('/api/consent-granted', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: result.userId,
                contractUri: '${contractUri || 'urn:lc:contract:YOUR_CONTRACT_URI'}'
            })
        });
        return true;
    }
    return false;
}

// --- SERVER-SIDE CODE (Node.js) ---
// This code runs on YOUR server, not in the embedded app
/*
import { initLearnCard } from '@learncard/init';

// Initialize LearnCard with your signing authority
const learnCard = await initLearnCard({
    network: true,
    seed: process.env.LEARNCARD_SEED, // Your secure seed phrase
});

// Issue credential to user via consent contract
async function issueCredentialViaConsent(recipientProfileId: string, templateUri?: string) {
    const result = await learnCard.invoke.send({
        type: 'boost',
        recipient: recipientProfileId,
        templateUri: templateUri || '${templateUri}',
        contractUri: '${contractUri || 'urn:lc:contract:YOUR_CONTRACT_URI'}',
    });
    
    console.log('Credential issued:', result);
    return result;
}

// Example: Issue credential using first available template
// await issueCredentialViaConsent('user-profile-id', CREDENTIAL_TEMPLATES[0]?.uri);
*/`);
            }
        }

        // ===================
        // PEER BADGES
        // ===================
        if (selectedFeatures.includes('peer-badges')) {
            // Generate template configuration from actual templates
            const templateConfigJson = peerBadgeTemplates.length > 0
                ? JSON.stringify(
                    peerBadgeTemplates.map(t => ({
                        id: t.uri.split(':').pop() || t.uri, // Extract short ID for easier reference
                        uri: t.uri,
                        name: t.name,
                        description: t.description || '',
                        type: t.type || 'achievement',
                    })),
                    null,
                    4
                )
                : `[
    {
        "id": "example-badge",
        "uri": "urn:lc:boost:YOUR_TEMPLATE_URI",
        "name": "Example Badge",
        "description": "Create templates in the Peer Badges setup step",
        "type": "achievement"
    }
]`;

            sections.push(`
// ============================================================
// PEER-TO-PEER BADGES - Template Configuration
// ============================================================
// Your available badge templates that users can send to each other.
// Each template has a unique URI that you pass to initiateTemplateIssuance.
//
// LLM INTEGRATION NOTE: Use these template URIs when calling sendPeerBadge().
// Match the badge type to the user's intent (e.g., "thank you" -> gratitude badge).

const PEER_BADGE_TEMPLATES = ${templateConfigJson};

// Helper to find a template by name or type
function findTemplate(query: string) {
    const q = query.toLowerCase();
    return PEER_BADGE_TEMPLATES.find(t => 
        t.name.toLowerCase().includes(q) || 
        t.description.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q)
    );
}

// ============================================================
// PEER-TO-PEER BADGES - Send Functions
// ============================================================
// Let users send badges to each other within your app
// 
// How it works:
//   1. Your app calls initiateTemplateIssuance with a template URI
//   2. User selects a recipient from their contacts
//   3. Badge is sent from your app on behalf of the user

/**
 * Send a peer badge using a specific template
 * @param templateUri - The URI of the badge template (from PEER_BADGE_TEMPLATES)
 */
async function sendPeerBadge(templateUri: string) {
    try {
        await learnCard.initiateTemplateIssuance({
            boostUri: templateUri,
        });
        
        console.log('Peer badge flow initiated with template:', templateUri);
    } catch (error) {
        console.error('Failed to initiate peer badge:', error);
        throw error;
    }
}

/**
 * Send a peer badge by searching for a matching template
 * @param searchQuery - Search term to find a matching template (e.g., "thank you", "great job")
 */
async function sendPeerBadgeByName(searchQuery: string) {
    const template = findTemplate(searchQuery);
    
    if (!template) {
        throw new Error(\`No template found matching: \${searchQuery}. Available: \${PEER_BADGE_TEMPLATES.map(t => t.name).join(', ')}\`);
    }
    
    return sendPeerBadge(template.uri);
}

// Example usage:
// sendPeerBadge(PEER_BADGE_TEMPLATES[0].uri);  // Send first template
// sendPeerBadgeByName('thank you');             // Find and send by name`);
        }

        // ===================
        // REQUEST CREDENTIALS
        // ===================
        if (selectedFeatures.includes('request-credentials')) {
            const mode = requestCredentialsState.mode as string || 'query';
            const queryTitle = requestCredentialsState.queryTitle as string || 'Certificate';
            const queryReason = requestCredentialsState.queryReason as string || 'To verify your qualifications';

            if (mode === 'query') {
                sections.push(`
// ============================================================
// REQUEST CREDENTIALS - Search by Title
// ============================================================
// Search user's wallet for credentials matching a title
// User selects which credential(s) to share
//
// Configure your search:
//   - Title: "${queryTitle}"
//   - Reason: "${queryReason}"

async function requestCredentialsBySearch() {
    try {
        const response = await learnCard.askCredentialSearch({
            query: [
                {
                    type: 'QueryByTitle',
                    credentialQuery: {
                        reason: "${queryReason}",
                        title: "${queryTitle}"
                    }
                }
            ],
            challenge: crypto.randomUUID(), // Unique challenge for verification
        });

        if (response.presentation) {
            // User shared credentials - verify the presentation
            console.log('Received presentation:', response.presentation);
            
            // Extract credentials from the presentation
            const credentials = response.presentation.verifiableCredential || [];
            console.log('Shared credentials:', credentials.length);
            
            // TODO: Send to your server for verification
            // await verifyPresentation(response.presentation);
            
            return credentials;
        } else {
            console.log('User did not share any credentials');
            return [];
        }
    } catch (error) {
        if (error.code === 'USER_REJECTED') {
            console.log('User declined to share credentials');
        } else {
            console.error('Error requesting credentials:', error);
        }
        throw error;
    }
}`);
            } else {
                sections.push(`
// ============================================================
// REQUEST CREDENTIALS - Request by ID
// ============================================================
// Request a specific credential by its ID
// User accepts or declines sharing that exact credential

async function requestCredentialById(credentialId: string) {
    try {
        const response = await learnCard.askCredentialById({
            id: credentialId,
            reason: "${queryReason || 'Please share this credential for verification'}",
            challenge: crypto.randomUUID(),
        });

        if (response.credential) {
            console.log('Received credential:', response.credential);
            
            // TODO: Send to your server for verification
            // await verifyCredential(response.credential);
            
            return response.credential;
        } else {
            console.log('Credential not returned');
            return null;
        }
    } catch (error) {
        if (error.code === 'CREDENTIAL_NOT_FOUND') {
            console.log('Credential not found in user wallet');
        } else if (error.code === 'USER_REJECTED') {
            console.log('User declined to share');
        } else {
            console.error('Error:', error);
        }
        throw error;
    }
}`);
            }
        }

        // ===================
        // REQUEST DATA CONSENT
        // ===================
        if (selectedFeatures.includes('request-data-consent')) {
            const contractUri = requestDataConsentState.contractUri as string || '';
            
            sections.push(`
// ============================================================
// REQUEST DATA CONSENT
// ============================================================
// Ask users for permission to access specific data or write back
// Uses ConsentFlow contracts for OAuth-style consent
//
// Contract URI: ${contractUri || 'NOT_CONFIGURED - Create one in Admin Tools'}
//
// How it works:
//   1. Client requests consent from user
//   2. User reviews and grants/denies permissions
//   3. Your server can then read/write data per contract terms

// --- CLIENT-SIDE: Request consent ---
async function requestDataConsent() {
    try {
        const result = await learnCard.requestConsent({
            contractUri: '${contractUri || 'urn:lc:contract:YOUR_CONTRACT_URI'}',
        });

        if (result.granted) {
            console.log('User granted consent!');
            console.log('User ID:', result.userId);
            
            // Notify your server that consent was granted
            await fetch('/api/consent-granted', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: result.userId,
                    contractUri: '${contractUri || 'urn:lc:contract:YOUR_CONTRACT_URI'}'
                })
            });
            
            return true;
        } else {
            console.log('User declined consent');
            return false;
        }
    } catch (error) {
        console.error('Failed to request consent:', error);
        throw error;
    }
}

// --- SERVER-SIDE CODE (Node.js) ---
// Use these on YOUR server to read/write consented data
/*
import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard({
    network: true,
    apiKey: process.env.LEARNCARD_API_KEY, // Or use seed
});

const CONTRACT_URI = '${contractUri || 'urn:lc:contract:YOUR_CONTRACT_URI'}';

// Read credentials user shared via consent
async function readConsentedCredentials() {
    const credentials = await learnCard.invoke.getCredentialsForContract(
        CONTRACT_URI,
        { limit: 50 }
    );
    return credentials.records;
}

// Write credential to user via consent
async function writeCredentialViaConsent(recipientProfileId: string) {
    return await learnCard.invoke.send({
        type: 'boost',
        recipient: recipientProfileId,
        templateUri: 'urn:lc:boost:YOUR_TEMPLATE_URI',
        contractUri: CONTRACT_URI,
    });
}
*/`);
        }

        // ===================
        // LAUNCH FEATURE
        // ===================
        if (selectedFeatures.includes('launch-feature')) {
            const selectedFeatureIds = launchFeatureState.selectedFeatureIds as string[] || [];
            const paramValues = launchFeatureState.paramValues as Record<string, Record<string, string>> || {};
            
            // Get all selected launchable features
            const selectedLaunchFeatures = LAUNCHABLE_FEATURES
                .flatMap(cat => cat.features)
                .filter(f => selectedFeatureIds.includes(f.id));

            // Generate code for each selected feature
            const featureFunctions = selectedLaunchFeatures.map(feature => {
                let featurePath = feature.path;
                const featureParams = paramValues[feature.id] || {};

                // Replace path params with configured values
                if (feature.params) {
                    feature.params.forEach(param => {
                        const value = featureParams[param.name] || param.placeholder;
                        featurePath = featurePath.replace(`:${param.name}`, value);
                    });
                }

                const funcName = `launch${feature.title.replace(/[^a-zA-Z0-9]/g, '')}`;

                return `// Launch ${feature.title}
async function ${funcName}() {
    await learnCard.launchFeature('${featurePath}');
}`;
            });

            const featureList = selectedLaunchFeatures.length > 0
                ? selectedLaunchFeatures.map(f => `//   - ${f.title} (${f.path})`).join('\n')
                : '//   No features selected';

            sections.push(`
// ============================================================
// LAUNCH FEATURE
// ============================================================
// Trigger native LearnCard features from your app
// 
// Selected features:
${featureList}

${featureFunctions.join('\n\n')}

// Additional launch examples:
// await learnCard.launchFeature('/passport');        // Open wallet
// await learnCard.launchFeature('/chats');           // Open AI chat
// await learnCard.launchFeature('/notifications');   // Open notifications
// await learnCard.launchFeature('/connect');         // Open connections`);
        }

        // ===================
        // EXAMPLE USAGE
        // ===================
        sections.push(`
// ============================================================
// EXAMPLE: Main App Initialization
// ============================================================
async function initializeApp() {
    try {
        // 1. Get user identity on app load
        const identity = await getUserIdentity();
        console.log('App initialized for user:', identity.profile.displayName);
        
        // 2. Your app logic here...
        // Call the feature functions above based on user actions
        
    } catch (error) {
        console.error('App initialization failed:', error);
    }
}

// Initialize when the app loads
initializeApp();`);

        return sections.join('\n');
    };

    const code = generateCode();

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    // Compute config differences for display
    const configDifferences = (() => {
        const newConfig = computeNewConfig();
        const existingPermissions = existingConfig.permissions || [];
        const differences: { type: string; label: string; from: string; to: string }[] = [];

        // Find new permissions
        const newPerms = newConfig.permissions?.filter(p => !existingPermissions.includes(p)) || [];
        if (newPerms.length > 0) {
            differences.push({
                type: 'permissions_added',
                label: 'New permissions required',
                from: existingPermissions.length > 0 ? existingPermissions.map(p => PERMISSION_OPTIONS.find(o => o.value === p)?.label || p).join(', ') : 'None',
                to: newPerms.map(p => PERMISSION_OPTIONS.find(o => o.value === p)?.label || p).join(', '),
            });
        }

        // Check consent contract
        const newContractUri = newConfig.contractUri || '';
        const existingContractUri = existingConfig.contractUri || '';
        if (newContractUri !== existingContractUri && newContractUri) {
            differences.push({
                type: 'contract',
                label: 'Consent contract',
                from: existingContractUri || 'Not set',
                to: newContractUri,
            });
        }

        return differences;
    })();

    return (
        <div className="space-y-6">
            {/* Config Mismatch Modal */}
            {showConfigMismatchPrompt && configDifferences.length > 0 && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="w-5 h-5 text-amber-600" />
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Update App Configuration?</h3>

                                <p className="text-sm text-gray-600 mt-1">
                                    Your selected features require different permissions than your app currently has configured.
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Changes needed:</p>

                            {configDifferences.map((diff, idx) => (
                                <div key={idx} className="text-sm">
                                    <p className="font-medium text-gray-700">{diff.label}</p>

                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-gray-400 line-through text-xs">{diff.from}</span>
                                        <ArrowRight className="w-3 h-3 text-gray-400" />
                                        <span className="text-emerald-600 font-medium text-xs">{diff.to}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfigMismatchPrompt(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                            >
                                Keep Current
                            </button>

                            <button
                                onClick={handleAcceptConfigUpdate}
                                disabled={isSaving}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 transition-colors"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                Update Config
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Your Integration Code</h3>

                <p className="text-gray-600">
                    Here&apos;s your complete integration code with {selectedFeatures.length} feature{selectedFeatures.length !== 1 ? 's' : ''} configured.
                    Copy this code to get started or share with your development team.
                </p>
            </div>

            {/* App Summary */}
            {selectedListing && (
                <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            {selectedListing.icon_url ? (
                                <img
                                    src={selectedListing.icon_url}
                                    alt={selectedListing.display_name}
                                    className="w-10 h-10 rounded-lg object-cover"
                                />
                            ) : (
                                <Layout className="w-6 h-6 text-cyan-600" />
                            )}
                        </div>

                        <div>
                            <p className="font-semibold text-gray-800">{selectedListing.display_name}</p>
                            <p className="text-sm text-gray-500">App ID: {selectedListing.listing_id}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Selected features summary */}
            <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Configured Features</p>

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
            </div>

            {/* App Configuration Section */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                    onClick={() => setShowConfigEditor(!showConfigEditor)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                            <Terminal className="w-5 h-5 text-cyan-600" />
                        </div>

                        <div className="text-left">
                            <p className="font-medium text-gray-800">App Configuration</p>
                            <p className="text-xs text-gray-500">
                                {embedUrl ? 'Configured' : 'Set embed URL, permissions & consent'}
                            </p>
                        </div>
                    </div>

                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showConfigEditor ? 'rotate-180' : ''}`} />
                </button>

                {showConfigEditor && (
                    <div className="p-4 border-t border-gray-200 space-y-5">
                        {/* Embed URL */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Embed URL</label>

                            <input
                                type="url"
                                value={embedUrl}
                                onChange={e => setEmbedUrl(e.target.value)}
                                placeholder="https://yourapp.com/embed"
                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                            />

                            <p className="text-xs text-gray-400 mt-1">
                                The URL that will be loaded in the iframe when users open your app
                            </p>
                        </div>

                        {/* Permissions */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                Permissions Needed
                            </label>

                            <p className="text-xs text-gray-400 mb-2">
                                Based on your selected features, these permissions are required. You can add more if needed.
                            </p>

                            <div className="space-y-2">
                                {PERMISSION_OPTIONS.map(permission => {
                                    const isRequired = computeRequiredPermissions().includes(permission.value);
                                    const isSelected = selectedPermissions.includes(permission.value);

                                    return (
                                        <label
                                            key={permission.value}
                                            className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                                                isSelected ? 'bg-cyan-50 border border-cyan-200' : 'bg-gray-50 hover:bg-gray-100'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => togglePermission(permission.value)}
                                                className="w-4 h-4 text-cyan-600 rounded mt-0.5"
                                            />

                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {permission.label}
                                                    </span>

                                                    {isRequired && (
                                                        <span className="px-1.5 py-0.5 bg-cyan-100 text-cyan-700 rounded text-xs font-medium">
                                                            Required
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {permission.description}
                                                </p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Consent Flow Contract */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                Consent Flow Contract <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>

                            <p className="text-xs text-gray-400 mb-2">
                                Request data sharing permissions when users install your app.
                                {selectedFeatures.includes('request-data-consent') && (requestDataConsentState.contractUri as string) && (
                                    <span className="text-cyan-600"> Auto-filled from your Request Data Consent setup.</span>
                                )}
                            </p>

                            <ConsentFlowContractSelector
                                value={contractUri}
                                onChange={setContractUri}
                            />
                        </div>

                        {/* Save Button */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-500">
                                Changes will be saved to your app listing
                            </p>

                            <button
                                onClick={handleSaveConfig}
                                disabled={isSaving || !selectedListing}
                                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600 disabled:opacity-50 transition-colors"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                Save Configuration
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Preview App Button */}
            {selectedListing && embedUrl && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium text-indigo-800">Test Your Integration</h4>

                            <p className="text-xs text-indigo-600 mt-0.5">
                                Preview your app and validate partner-connect API calls
                            </p>
                        </div>

                        <button
                            onClick={openPreviewModal}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors"
                        >
                            <Play className="w-4 h-4" />
                            Preview App
                        </button>
                    </div>
                </div>
            )}

            {/* Code output */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Complete Integration Code</span>

                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        {copiedCode ? (
                            <>
                                <Check className="w-4 h-4 text-emerald-500" />
                                <span className="text-emerald-600">Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4" />
                                Copy All
                            </>
                        )}
                    </button>
                </div>

                <CodeBlock code={code} maxHeight="max-h-[500px]" />
            </div>

            {/* Tips */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Integration Tips
                </h4>

                <ul className="space-y-1 text-sm text-amber-700">
                    <li>• Replace all <code className="bg-amber-100 px-1 rounded">TODO</code> placeholders with your actual values</li>
                    <li>• Server-side code (in comments) should run on YOUR server, not in the embedded app</li>
                    <li>• Store sensitive values (seeds, API keys) in environment variables</li>
                    <li>• Test in the LearnCard sandbox before going live</li>
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
                    SDK Documentation
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
            <div className="flex justify-between gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <button
                    onClick={onComplete}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg shadow-emerald-200"
                >
                    <Rocket className="w-5 h-5" />
                    Continue to Go Live
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// Main component
const EmbedAppGuide: React.FC<GuideProps> = ({ selectedIntegration, setSelectedIntegration }) => {
    const guideState = useGuideState('embed-app', STEPS.length, selectedIntegration);
    const { useListingsForIntegration } = useDeveloperPortal();
    const { data: listings } = useListingsForIntegration(selectedIntegration?.id || null);

    // Guide-wide state (persists across all steps)
    const [selectedListing, setSelectedListing] = useState<AppStoreListing | null>(null);
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
    const [featureSetupState, setFeatureSetupState] = useState<Record<string, Record<string, unknown>>>({});
    const [hasRestoredState, setHasRestoredState] = useState(false);

    // ============================================================
    // STATE PERSISTENCE - Restore from guideState.config on mount
    // ============================================================
    useEffect(() => {
        if (hasRestoredState) return;

        const savedConfig = guideState.getConfig<EmbedAppGuideConfig>('embedAppConfig');

        if (savedConfig) {
            // Restore selected features
            if (savedConfig.selectedFeatures?.length > 0) {
                setSelectedFeatures(savedConfig.selectedFeatures);
            }

            // Restore feature config
            if (savedConfig.featureConfig) {
                setFeatureSetupState(savedConfig.featureConfig as Record<string, Record<string, unknown>>);
            }

            // Restore selected listing (need to find it in the listings array)
            if (savedConfig.selectedListingId && listings) {
                const listing = listings.find(l => l.listing_id === savedConfig.selectedListingId);

                if (listing) {
                    setSelectedListing(listing);
                }
            }
        }

        setHasRestoredState(true);
    }, [guideState, listings, hasRestoredState]);

    // ============================================================
    // STATE PERSISTENCE - Sync state changes to guideState.config
    // ============================================================
    useEffect(() => {
        // Don't save until we've restored (prevents overwriting with empty state)
        if (!hasRestoredState) return;

        const config: EmbedAppGuideConfig = {
            selectedListingId: selectedListing?.listing_id || null,
            selectedFeatures,
            featureConfig: featureSetupState as EmbedAppFeatureConfig,
        };

        guideState.updateConfig('embedAppConfig', config);
    }, [selectedListing?.listing_id, selectedFeatures, featureSetupState, hasRestoredState]);

    // Reset guide if step is out of bounds (e.g., after changing step count)
    useEffect(() => {
        if (guideState.currentStep >= STEPS.length) {
            guideState.goToStep(0);
        }
    }, [guideState.currentStep]);

    // Check if we should skip feature setup step
    const featuresNeedingSetup = selectedFeatures.filter(id => 
        FEATURES.find(f => f.id === id)?.requiresSetup
    );

    // Reset feature index when features change to prevent out-of-bounds issues
    useEffect(() => {
        // If current index is out of bounds, reset to 0
        if (currentFeatureIndex >= featuresNeedingSetup.length) {
            setCurrentFeatureIndex(0);
        }
    }, [featuresNeedingSetup.length, currentFeatureIndex]);

    // Clean up feature setup state when features are deselected
    useEffect(() => {
        setFeatureSetupState(prev => {
            const newState = { ...prev };
            // Remove state for features that are no longer selected
            Object.keys(newState).forEach(featureId => {
                if (!selectedFeatures.includes(featureId)) {
                    delete newState[featureId];
                }
            });
            return newState;
        });
    }, [selectedFeatures]);

    const handleStepComplete = (stepId: string) => {
        guideState.markStepComplete(stepId);
        guideState.nextStep();
    };

    const handleChooseFeaturesComplete = () => {
        if (featuresNeedingSetup.length === 0) {
            // Skip feature setup, go directly to your app
            guideState.markStepComplete('choose-features');
            guideState.markStepComplete('feature-setup');
            guideState.goToStep(4);
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
                    <SigningAuthorityStep
                        onComplete={() => handleStepComplete('signing-authority')}
                        onBack={guideState.prevStep}
                    />
                );

            case 2:
                return (
                    <ChooseFeaturesStep
                        onComplete={handleChooseFeaturesComplete}
                        onBack={guideState.prevStep}
                        selectedFeatures={selectedFeatures}
                        setSelectedFeatures={setSelectedFeatures}
                    />
                );

            case 3:
                // If no features need setup, skip to step 4
                if (featuresNeedingSetup.length === 0) {
                    // Auto-advance to next step
                    setTimeout(() => {
                        guideState.markStepComplete('feature-setup');
                        guideState.goToStep(4);
                    }, 0);
                    return null;
                }

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
                        integrationId={selectedIntegration?.id}
                    />
                );

            case 4:
                return (
                    <YourAppStep
                        onBack={guideState.prevStep}
                        onComplete={() => handleStepComplete('your-app')}
                        selectedFeatures={selectedFeatures}
                        selectedListing={selectedListing}
                        featureSetupState={featureSetupState}
                        integrationId={selectedIntegration?.id}
                    />
                );

            case 5:
                return (
                    <GoLiveStep
                        integration={selectedIntegration}
                        guideType="embed-app"
                        onBack={guideState.prevStep}
                        completedItems={[
                            'SDK installed and configured',
                            'Signing authority configured',
                            'App listing created',
                            `${selectedFeatures.length} feature${selectedFeatures.length !== 1 ? 's' : ''} configured`,
                            'Integration code generated',
                        ]}
                        title="Ready to Go Live!"
                        description="Your embedded app integration is complete. Activate it to start using it in production."
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
