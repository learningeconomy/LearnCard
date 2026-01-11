/**
 * AppConfigTab - App Configuration for Embedded Apps
 * 
 * For embed-app integrations: URL checker, permission configuration,
 * consent contract selection, and header configuration examples.
 * 
 * Mirrors functionality from EmbedAppGuide's YourAppStep.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
    Globe,
    Lock,
    Monitor,
    Shield,
    Search,
    Loader2,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Copy,
    Check,
    ChevronDown,
    ChevronUp,
    User,
    Award,
    FileSearch,
    ClipboardCheck,
    Play,
    ExternalLink,
    Info,
} from 'lucide-react';
import type { LCNIntegration, AppStoreListing } from '@learncard/types';

import { useToast, ToastTypeEnum, useModal, ModalTypes } from 'learn-card-base';
import { Clipboard } from '@capacitor/clipboard';

import { CodeBlock } from '../../components/CodeBlock';
import { useDeveloperPortal } from '../../useDeveloperPortal';
import { AppPreviewModal } from '../../components/AppPreviewModal';
import type { ExtendedAppStoreListing } from '../../types';

interface UrlCheckResult {
    id: string;
    label: string;
    status: 'pending' | 'checking' | 'pass' | 'fail' | 'warn';
    message?: string;
}

interface Permission {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    required?: boolean;
}

const PERMISSIONS: Permission[] = [
    {
        id: 'identity',
        name: 'User Identity',
        description: 'Access user DID and profile information',
        icon: <User className="w-4 h-4" />,
        required: true,
    },
    {
        id: 'issue-credentials',
        name: 'Issue Credentials',
        description: 'Send credentials to the user\'s wallet',
        icon: <Award className="w-4 h-4" />,
    },
    {
        id: 'request-credentials',
        name: 'Request Credentials',
        description: 'Search and request user credentials',
        icon: <FileSearch className="w-4 h-4" />,
    },
    {
        id: 'consent',
        name: 'Data Consent',
        description: 'Request ongoing data access via consent contracts',
        icon: <ClipboardCheck className="w-4 h-4" />,
    },
    {
        id: 'navigation',
        name: 'Wallet Navigation',
        description: 'Navigate to wallet features from your app',
        icon: <Play className="w-4 h-4" />,
    },
];

const checkUrl = async (url: string): Promise<UrlCheckResult[]> => {
    const results: UrlCheckResult[] = [
        { id: 'https', label: 'HTTPS', status: 'pending' },
        { id: 'reachable', label: 'Reachable', status: 'pending' },
        { id: 'cors', label: 'CORS Headers', status: 'pending' },
    ];

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

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
            method: 'HEAD',
            mode: 'cors',
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        results[1] = { ...results[1], status: 'pass', message: `Status ${response.status}` };

        const corsHeader = response.headers.get('Access-Control-Allow-Origin');

        if (corsHeader === '*' || corsHeader) {
            results[2] = { ...results[2], status: 'pass', message: `CORS: ${corsHeader}` };
        } else {
            results[2] = { ...results[2], status: 'warn', message: 'CORS header not visible (may still work)' };
        }
    } catch (err) {
        if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
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

interface AppConfigTabProps {
    integration: LCNIntegration;
    selectedListing?: AppStoreListing | null;
}

export const AppConfigTab: React.FC<AppConfigTabProps> = ({
    integration,
    selectedListing: externalListing,
}) => {
    const { presentToast } = useToast();
    const { newModal } = useModal();

    const { useListingsForIntegration, useUpdateListing } = useDeveloperPortal();
    const { data: listings } = useListingsForIntegration(integration.id);
    const updateListingMutation = useUpdateListing();

    const [selectedListing, setSelectedListing] = useState<AppStoreListing | null>(externalListing || null);
    const [appUrl, setAppUrl] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['identity']);
    const [isChecking, setIsChecking] = useState(false);
    const [checkResults, setCheckResults] = useState<UrlCheckResult[] | null>(null);
    const [showHeaderExamples, setShowHeaderExamples] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    // Auto-select first listing
    useEffect(() => {
        if (listings && listings.length > 0 && !selectedListing) {
            const first = listings[0];
            setSelectedListing(first);

            try {
                const config = JSON.parse(first.launch_config_json || '{}');
                if (config.url) setAppUrl(config.url);
                if (config.permissions) setSelectedPermissions(config.permissions);
            } catch (e) {
                // ignore
            }
        }
    }, [listings, selectedListing]);

    // Sync with external listing
    useEffect(() => {
        if (externalListing) {
            setSelectedListing(externalListing);

            try {
                const config = JSON.parse(externalListing.launch_config_json || '{}');
                if (config.url) setAppUrl(config.url);
                if (config.permissions) setSelectedPermissions(config.permissions);
            } catch (e) {
                // ignore
            }
        }
    }, [externalListing]);

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

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAppUrl(e.target.value);

        if (checkResults) {
            setCheckResults(null);
        }
    };

    const togglePermission = (permId: string) => {
        const perm = PERMISSIONS.find(p => p.id === permId);

        if (perm?.required) return;

        if (selectedPermissions.includes(permId)) {
            setSelectedPermissions(selectedPermissions.filter(p => p !== permId));
        } else {
            setSelectedPermissions([...selectedPermissions, permId]);
        }
    };

    const handleSaveConfig = async () => {
        if (!selectedListing) return;

        try {
            await updateListingMutation.mutateAsync({
                listingId: selectedListing.listing_id,
                updates: {
                    launch_config_json: JSON.stringify({
                        url: appUrl,
                        permissions: selectedPermissions,
                    }),
                },
            });

            presentToast('Configuration saved!', { type: ToastTypeEnum.Success, hasDismissButton: true });
        } catch (err) {
            console.error('Failed to save config:', err);
            presentToast('Failed to save configuration', { type: ToastTypeEnum.Error, hasDismissButton: true });
        }
    };

    const handleCopy = async (code: string, id: string) => {
        await Clipboard.write({ string: code });
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
        presentToast('Copied!', { hasDismissButton: true });
    };

    const handlePreview = () => {
        if (!selectedListing || !appUrl) return;

        const extendedListing: ExtendedAppStoreListing = {
            ...selectedListing,
            launch_config_json: JSON.stringify({
                url: appUrl,
                permissions: selectedPermissions,
            }),
        };

        newModal(
            <AppPreviewModal listing={extendedListing} />,
            {},
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
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

    const getStatusIcon = (status: UrlCheckResult['status']) => {
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

    const allPassed = checkResults?.every(r => r.status === 'pass' || r.status === 'warn') || false;
    const hasFailed = checkResults?.some(r => r.status === 'fail') || false;

    const expressCode = `// Express.js middleware
app.use((req, res, next) => {
    // Allow iframe embedding from any origin
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Content-Security-Policy', "frame-ancestors *");
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    next();
});`;

    const nginxCode = `# Nginx configuration
location / {
    add_header X-Frame-Options "ALLOWALL";
    add_header Content-Security-Policy "frame-ancestors *";
    add_header Access-Control-Allow-Origin "*";
}`;

    const nextCode = `// next.config.js
/** @type {import('next').NextConfig} */
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

module.exports = nextConfig;`;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">App Configuration</h2>
                <p className="text-sm text-gray-500">
                    Configure your embedded app's URL and permissions
                </p>
            </div>

            {/* App Selector */}
            {listings && listings.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select App</label>
                    <select
                        value={selectedListing?.listing_id || ''}
                        onChange={(e) => {
                            const listing = listings.find(l => l.listing_id === e.target.value);
                            setSelectedListing(listing || null);

                            if (listing) {
                                try {
                                    const config = JSON.parse(listing.launch_config_json || '{}');
                                    if (config.url) setAppUrl(config.url);
                                    if (config.permissions) setSelectedPermissions(config.permissions);
                                } catch (err) {
                                    // ignore
                                }
                            }
                        }}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                        {listings.map(listing => (
                            <option key={listing.listing_id} value={listing.listing_id}>
                                {listing.display_name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* No Listings Warning */}
            {(!listings || listings.length === 0) && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-amber-800 font-medium">No app listings found</p>
                    <p className="text-sm text-amber-700 mt-1">
                        Create an app listing in the App Listings tab first.
                    </p>
                </div>
            )}

            {selectedListing && (
                <>
                    {/* URL Configuration */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">App URL</label>

                        <div className="flex gap-2">
                            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-cyan-500">
                                <Globe className="w-4 h-4 text-gray-400" />
                                <input
                                    type="url"
                                    value={appUrl}
                                    onChange={handleUrlChange}
                                    placeholder="https://your-app.com"
                                    className="flex-1 outline-none"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && appUrl.trim()) {
                                            handleCheckUrl();
                                        }
                                    }}
                                />
                            </div>

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

                        <p className="text-xs text-gray-500">
                            The URL of your app that will be embedded in LearnCard
                        </p>
                    </div>

                    {/* URL Check Results */}
                    {checkResults && (
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
                                {checkResults.map(result => (
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

                                            {getStatusIcon(isChecking && result.status === 'pending' ? 'checking' : result.status)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {!isChecking && hasFailed && (
                                <p className="mt-3 text-xs text-red-600">
                                    Fix the issues above before going live. See header examples below.
                                </p>
                            )}

                            {!isChecking && allPassed && (
                                <p className="mt-3 text-xs text-emerald-600">
                                    Your URL passed basic checks. You may still need to configure iframe headers (X-Frame-Options).
                                </p>
                            )}
                        </div>
                    )}

                    {/* Header Configuration Examples */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <button
                            onClick={() => setShowHeaderExamples(!showHeaderExamples)}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-amber-600" />
                                <div className="text-left">
                                    <h3 className="font-medium text-gray-800">Required Response Headers</h3>
                                    <p className="text-xs text-gray-500">Configure your server to allow iframe embedding</p>
                                </div>
                            </div>

                            {showHeaderExamples ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                        </button>

                        {showHeaderExamples && (
                            <div className="p-4 border-t border-gray-200 space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">Express.js</span>
                                        <button
                                            onClick={() => handleCopy(expressCode, 'express')}
                                            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                        >
                                            {copied === 'express' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                    </div>
                                    <CodeBlock code={expressCode} maxHeight="max-h-40" />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">Next.js</span>
                                        <button
                                            onClick={() => handleCopy(nextCode, 'next')}
                                            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                        >
                                            {copied === 'next' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                    </div>
                                    <CodeBlock code={nextCode} maxHeight="max-h-40" />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">Nginx</span>
                                        <button
                                            onClick={() => handleCopy(nginxCode, 'nginx')}
                                            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                        >
                                            {copied === 'nginx' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                    </div>
                                    <CodeBlock code={nginxCode} maxHeight="max-h-32" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Permissions */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Permissions</label>
                        <p className="text-xs text-gray-500">
                            Select what your app can access from the wallet
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {PERMISSIONS.map(perm => {
                                const isSelected = selectedPermissions.includes(perm.id);

                                return (
                                    <button
                                        key={perm.id}
                                        onClick={() => togglePermission(perm.id)}
                                        disabled={perm.required}
                                        className={`flex items-start gap-3 p-3 border rounded-xl text-left transition-all ${
                                            isSelected
                                                ? 'border-cyan-500 bg-cyan-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        } ${perm.required ? 'cursor-default' : ''}`}
                                    >
                                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-cyan-100 text-cyan-600' : 'bg-gray-100 text-gray-500'}`}>
                                            {perm.icon}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-medium text-sm ${isSelected ? 'text-cyan-700' : 'text-gray-700'}`}>
                                                    {perm.name}
                                                </span>
                                                {perm.required && (
                                                    <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                                                        Required
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">{perm.description}</p>
                                        </div>

                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                            isSelected ? 'border-cyan-500 bg-cyan-500' : 'border-gray-300'
                                        }`}>
                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            onClick={handlePreview}
                            disabled={!selectedListing || !appUrl}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                        >
                            <Play className="w-4 h-4" />
                            Preview App
                        </button>

                        <button
                            onClick={handleSaveConfig}
                            disabled={updateListingMutation.isPending || !selectedListing}
                            className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 transition-colors"
                        >
                            {updateListingMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                            Save Configuration
                        </button>
                    </div>
                </>
            )}

            {/* Common Issues */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Common Issues
                </h4>

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
        </div>
    );
};
