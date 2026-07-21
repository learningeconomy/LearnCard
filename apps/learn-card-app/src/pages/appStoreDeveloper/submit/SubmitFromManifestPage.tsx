import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { IonPage, IonContent, IonSpinner, IonIcon } from '@ionic/react';
import {
    alertCircleOutline,
    checkmarkCircleOutline,
    globeOutline,
    shieldCheckmarkOutline,
    arrowForwardOutline,
    playOutline,
    cameraOutline,
    flashOutline,
    copyOutline,
    checkmarkOutline,
    closeOutline,
} from 'ionicons/icons';
import { AppStoreHeader } from '../components/AppStoreHeader';
import { useDeveloperPortal } from '../useDeveloperPortal';
import { useModal, ModalTypes, useDeviceTypeByWidth } from 'learn-card-base';
import { useImageUpload } from 'learn-card-base';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';
import { EmbedIframeModal } from '../../launchPad/EmbedIframeModal';
import { applyCapturedAction } from '@learncard/partner-connect-core';
import type { CapturedAppManifest } from '@learncard/partner-connect-core';
import type { IntegrationHint } from '../../hooks/post-message/useLearnCardPostMessage.handlers';
import { useWallet } from 'learn-card-base';
import { normalizeConsentRequest } from '@learncard/partner-connect-core';
import type { ConsentRequest } from '@learncard/partner-connect-core';
import { ConsentDesignerCard } from './ConsentDesignerCard';

const decodeManifestFromUrl = (base64url: string): CapturedAppManifest => {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json);
};

interface PreviewLaunchConfig {
    url: string;
    permissions: string[];
    contractUri?: string;
}

// Default app icon used across the developer portal (see PartnerDashboard fallback)
const DEFAULT_APP_ICON_URL = 'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb';

// Mirrors ALLOWED_IMAGE_DOMAINS in brain-service app-store routes — captured favicons
// from arbitrary sites will be rejected server-side, so filter them client-side too.
const ALLOWED_ICON_DOMAINS = [
    'cdn.filestackcontent.com',
    'learncard.com',
    'amazonaws.com',
    's3.amazonaws.com',
    'cloudfront.net',
    'imgur.com',
    'i.imgur.com',
];

const isAllowedIconUrl = (url: string | undefined): url is string => {
    if (!url || !url.startsWith('https://')) return false;
    try {
        const { hostname } = new URL(url);
        return ALLOWED_ICON_DOMAINS.some(
            domain => hostname === domain || hostname.endsWith(`.${domain}`)
        );
    } catch {
        return false;
    }
};

// Backend validation failures arrive as raw Zod issue arrays — map to friendly text.
const toFriendlyError = (err: unknown, fallback: string): string => {
    const message = err instanceof Error ? err.message : '';
    if (!message) return fallback;
    try {
        const issues = JSON.parse(message);
        if (Array.isArray(issues)) {
            const details = issues
                .map((issue: { path?: unknown[]; message?: string }) => {
                    const path = Array.isArray(issue.path) ? issue.path.join('.') : '';
                    return path ? `${path}: ${issue.message ?? ''}` : issue.message ?? '';
                })
                .filter(Boolean)
                .join(' · ');
            return details ? `${fallback} (${details})` : fallback;
        }
    } catch {
        // Not a Zod issue array — use the raw message if it looks human-readable
    }
    return message.length < 200 && !message.startsWith('[') ? message : fallback;
};

export const SubmitFromManifestPage: React.FC = () => {
    const history = useHistory();
    const location = useLocation();
    const [manifest, setManifest] = useState<CapturedAppManifest | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [prodUrlError, setProdUrlError] = useState<string | null>(null);
    const prodUrlInputRef = useRef<HTMLInputElement>(null);
    const [appName, setAppName] = useState('');
    const [tagline, setTagline] = useState('');
    const [isPreparing, setIsPreparing] = useState(false);

    const { useIntegrations, useCreateIntegration, useCreateListing } = useDeveloperPortal();
    const { newModal } = useModal();
    const { isDesktop } = useDeviceTypeByWidth();
    const [previewListingId, setPreviewListingId] = useState<string | null>(null);
    const [previewIntegrationId, setPreviewIntegrationId] = useState<string | null>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isLive, setIsLive] = useState(false);
    const [productionUrl, setProductionUrl] = useState('');
    const [isLocalhost, setIsLocalhost] = useState(false);
    const [iconUrl, setIconUrl] = useState<string | undefined>(undefined);
    const [recentlyCaptured, setRecentlyCaptured] = useState<Set<string>>(new Set());
    const [integrationHints, setIntegrationHints] = useState<IntegrationHint[]>([]);
    const [copiedHint, setCopiedHint] = useState<string | null>(null);
    const [contractUri, setContractUri] = useState<string | null>(null);
    const [showConsentDesigner, setShowConsentDesigner] = useState(false);
    const [currentLaunchConfig, setCurrentLaunchConfig] = useState<PreviewLaunchConfig | null>(
        null
    );
    const { initWallet } = useWallet();

    const handleIntegrationHint = useCallback((hint: IntegrationHint) => {
        setIntegrationHints(prev => {
            if (prev.some(h => h.type === hint.type)) return prev;
            return [...prev, hint];
        });
    }, []);

    const handleCopySnippet = (snippet: string, type: string) => {
        navigator.clipboard.writeText(snippet);
        setCopiedHint(type);
        setTimeout(() => setCopiedHint(null), 2000);
    };

    const dismissHint = (type: string) => {
        setIntegrationHints(prev => prev.filter(h => h.type !== type));
    };

    const createListing = useCreateListing();

    const { handleFileSelect: handleIconUpload, isLoading: isIconUploading } = useImageUpload({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data) => {
            if (data?.url) {
                if (data.url.startsWith('https://')) {
                    setIconUrl(data.url);
                } else {
                    setFormError('Uploaded icon URL must be HTTPS.');
                }
            }
        },
    });
    const { data: integrations, isLoading: isLoadingIntegrations } = useIntegrations();
    const createIntegration = useCreateIntegration();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const manifestParam = params.get('manifest');
        if (!manifestParam) {
            setError('No manifest provided in URL.');
            return;
        }

        try {
            const decoded = decodeManifestFromUrl(manifestParam);
            if (decoded.manifestVersion !== 1) {
                throw new Error('Unsupported manifest version.');
            }
            if (!decoded.appUrl) {
                throw new Error('Manifest is missing appUrl.');
            }
            try {
                new URL(decoded.appUrl);
            } catch {
                throw new Error('Invalid appUrl in manifest.');
            }
            const isLocal =
                decoded.appUrl.includes('localhost') ||
                decoded.appUrl.includes('127.0.0.1') ||
                decoded.appUrl.includes('[::1]') ||
                decoded.appUrl.includes('.localhost') ||
                decoded.appUrl.includes('.local') ||
                decoded.appUrl.startsWith('http://');
            setIsLocalhost(isLocal);

            const sessionManifestStr = sessionStorage.getItem('lc-submit-manifest');
            if (sessionManifestStr) {
                try {
                    const sessionManifest = JSON.parse(sessionManifestStr);
                    const sameSuggestedName =
                        sessionManifest.suggestedName === decoded.suggestedName ||
                        (!sessionManifest.suggestedName && !decoded.suggestedName);

                    if (sessionManifest.appUrl === decoded.appUrl && sameSuggestedName) {
                        setManifest(sessionManifest);
                    } else {
                        setManifest(decoded);
                        sessionStorage.setItem('lc-submit-manifest', JSON.stringify(decoded));
                    }
                } catch {
                    setManifest(decoded);
                    sessionStorage.setItem('lc-submit-manifest', JSON.stringify(decoded));
                }
            } else {
                setManifest(decoded);
                sessionStorage.setItem('lc-submit-manifest', JSON.stringify(decoded));
            }
            setIconUrl(
                isAllowedIconUrl(decoded.suggestedIconUrl) ? decoded.suggestedIconUrl : undefined
            );
            setAppName(decoded.suggestedName || '');
        } catch (err) {
            setError('This publish link is invalid or expired.');
        }
    }, [location.search]);

    const ensureProvisioned = async () => {
        if (!manifest) throw new Error('No manifest');

        // Preview always provisions against the captured app URL (localhost is
        // allowed for DRAFT listings). The production URL only applies at Continue.
        const previewUrl = manifest.appUrl;
        const host = new URL(previewUrl).host;

        let integrationId = previewIntegrationId || integrations?.find(i => i.name === host)?.id;
        if (!integrationId) {
            integrationId = await createIntegration.mutateAsync(host);
            setPreviewIntegrationId(integrationId);
        }

        let listingId = previewListingId;
        if (!listingId) {
            const displayName = appName || manifest.suggestedName || 'Preview App';
            const listing = await createListing.mutateAsync({
                integrationId,
                listing: {
                    display_name: displayName,
                    tagline: tagline || `${displayName} preview`,
                    full_description:
                        tagline ||
                        `${displayName} — draft listing created from a LearnCard app preview.`,
                    icon_url: isAllowedIconUrl(iconUrl) ? iconUrl : DEFAULT_APP_ICON_URL,
                    launch_type: 'EMBEDDED_IFRAME',
                    launch_config_json: JSON.stringify(
                        currentLaunchConfig || {
                            url: previewUrl,
                            permissions: manifest.permissions,
                        }
                    ),
                },
            });
            listingId = listing;
            setPreviewListingId(listingId);
        }

        return { integrationId, listingId };
    };

    const handlePreview = async () => {
        if (!manifest) return;
        setIsPreviewing(true);
        setFormError(null);
        try {
            const { listingId } = await ensureProvisioned();
            setIsLive(true);

            if (!isDesktop) {
                newModal(
                    <EmbedIframeModal
                        embedUrl={manifest.appUrl}
                        appId={listingId}
                        appName={appName || 'Preview App'}
                        launchConfig={
                            currentLaunchConfig || {
                                url: manifest.appUrl,
                                permissions: manifest.permissions,
                            }
                        }
                        isInstalled={true}
                        onIntegrationHint={handleIntegrationHint}
                    />,
                    {
                        hideButton: true,
                        onClose: () => setIsLive(false),
                    },
                    { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
                );
            }
        } catch (err) {
            setFormError(
                toFriendlyError(err, "We couldn't prepare your preview. Please try again.")
            );
        } finally {
            setIsPreviewing(false);
        }
    };

    const handleEnableConsent = async (scopes: ConsentRequest) => {
        if (!manifest) return;
        try {
            const { listingId } = await ensureProvisioned();
            const wallet = await initWallet();
            if (!wallet) throw new Error('Wallet not initialized');

            const response = await wallet.invoke.sendAppEvent(listingId, {
                type: 'upsert-consent-contract',
                scopes,
            });

            const newContractUri = response.contractUri;
            setContractUri(newContractUri);

            setCurrentLaunchConfig({
                url: manifest.appUrl,
                permissions: manifest.permissions,
                contractUri: newContractUri,
            });

            setManifest(prev => {
                if (!prev) return prev;
                const next = {
                    ...prev,
                    consentRequests: [
                        ...prev.consentRequests,
                        {
                            scopes: normalizeConsentRequest(scopes),
                            reason: scopes.reason,
                            lastUsedAt: new Date().toISOString(),
                        },
                    ],
                };
                sessionStorage.setItem('lc-submit-manifest', JSON.stringify(next));
                return next;
            });
        } catch (err) {
            throw err;
        }
    };

    useEffect(() => {
        if (!isLive || !manifest) return;

        const handleMessage = (event: MessageEvent) => {
            if (event.data?.protocol === 'LEARNCARD_V1' && event.data?.action) {
                try {
                    const previewOrigin = new URL(manifest.appUrl).origin;
                    if (event.origin === previewOrigin) {
                        setManifest(prev => {
                            if (!prev) return prev;
                            const next = applyCapturedAction(prev, {
                                action: event.data.action,
                                payload: event.data.payload,
                            });
                            sessionStorage.setItem('lc-submit-manifest', JSON.stringify(next));

                            // Highlight new items
                            const newItems = new Set<string>();
                            if (next.permissions.length > prev.permissions.length)
                                newItems.add('permissions');
                            if (next.templates.length > prev.templates.length)
                                newItems.add('templates');
                            if (next.consentRequests.length > prev.consentRequests.length)
                                newItems.add('consentRequests');
                            if (next.featuresLaunched.length > prev.featuresLaunched.length)
                                newItems.add('featuresLaunched');
                            if (next.counterKeys.length > prev.counterKeys.length)
                                newItems.add('counterKeys');

                            if (newItems.size > 0) {
                                setRecentlyCaptured(newItems);
                                setTimeout(() => setRecentlyCaptured(new Set()), 2000);
                            }

                            return next;
                        });
                    }
                } catch (e) {
                    // Ignore URL parsing errors
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [isLive, manifest?.appUrl]);

    const handleContinue = async () => {
        if (!manifest) return;
        setIsPreparing(true);
        setFormError(null);
        setProdUrlError(null);
        try {
            if (isLocalhost && !productionUrl) {
                setProdUrlError('Enter the https:// domain where your app will live.');
                setIsPreparing(false);
                setTimeout(() => {
                    prodUrlInputRef.current?.focus();
                    prodUrlInputRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                    });
                }, 100);
                return;
            }
            if (isLocalhost) {
                try {
                    const prodUrlObj = new URL(productionUrl);
                    if (prodUrlObj.protocol !== 'https:') {
                        setProdUrlError('Production URL must be HTTPS.');
                        setIsPreparing(false);
                        setTimeout(() => {
                            prodUrlInputRef.current?.focus();
                            prodUrlInputRef.current?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center',
                            });
                        }, 100);
                        return;
                    }
                    if (prodUrlObj.pathname !== '/' || prodUrlObj.search || prodUrlObj.hash) {
                        setProdUrlError(
                            'Production URL must be an origin only (no path or query).'
                        );
                        setIsPreparing(false);
                        setTimeout(() => {
                            prodUrlInputRef.current?.focus();
                            prodUrlInputRef.current?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center',
                            });
                        }, 100);
                        return;
                    }
                } catch {
                    setProdUrlError('Invalid production URL.');
                    setIsPreparing(false);
                    setTimeout(() => {
                        prodUrlInputRef.current?.focus();
                        prodUrlInputRef.current?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                        });
                    }, 100);
                    return;
                }
            }
            const finalUrl = isLocalhost ? productionUrl : manifest.appUrl;
            const appUrlObj = new URL(finalUrl);
            const host = appUrlObj.host;

            let integrationId =
                previewIntegrationId || integrations?.find(i => i.name === host)?.id;
            if (!integrationId) {
                integrationId = await createIntegration.mutateAsync(host);
            }

            history.push({
                pathname: previewListingId
                    ? `/app-store/developer/integrations/${integrationId}/apps/${previewListingId}`
                    : `/app-store/developer/integrations/${integrationId}/apps/new`,
                state: {
                    capturedManifest: manifest,
                    listing: {
                        display_name: appName,
                        tagline: tagline,
                        icon_url: iconUrl,
                        launch_type: 'EMBEDDED_IFRAME',
                        launch_config_json: JSON.stringify({
                            url: finalUrl,
                            permissions: manifest.permissions,
                            ...(contractUri ? { contractUri } : {}),
                        }),
                    },
                },
            });
        } catch (err) {
            setFormError(
                toFriendlyError(
                    err,
                    "We couldn't prepare your app for submission. Please try again."
                )
            );
            setIsPreparing(false);
        }
    };

    if (error) {
        return (
            <IonPage>
                <AppStoreHeader title="Publish your app" />
                <IonContent className="ion-padding">
                    <div className="max-w-2xl mx-auto mt-12">
                        <div className="p-6 bg-red-50 border border-red-100 rounded-2xl flex flex-col items-center text-center gap-4">
                            <IonIcon icon={alertCircleOutline} className="w-12 h-12 text-red-500" />
                            <div>
                                <h2 className="text-lg font-semibold text-red-900 mb-1">
                                    Invalid Link
                                </h2>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                            <button
                                onClick={() => history.push('/app-store/developer')}
                                className="mt-2 px-6 py-3 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                            >
                                Go to Developer Portal
                            </button>
                        </div>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    if (!manifest || isLoadingIntegrations) {
        return (
            <IonPage>
                <AppStoreHeader title="Publish your app" />
                <IonContent className="ion-padding">
                    <div className="flex justify-center items-center h-full">
                        <IonSpinner name="crescent" />
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    const leftPaneContent = (
        <div className={`${isDesktop ? 'max-w-xl mx-auto' : 'max-w-2xl mx-auto'} pb-12 w-full`}>
            <div className="text-center mb-8 mt-4">
                <h1 className="text-2xl font-semibold text-grayscale-900 mb-2">Publish your app</h1>
                <p className="text-sm text-grayscale-600">
                    We captured everything your app uses. Review, test, and submit.
                </p>
            </div>

            {formError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                    <IonIcon
                        icon={alertCircleOutline}
                        className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                    />
                    <p className="text-sm text-red-700">{formError}</p>
                </div>
            )}

            {!isDesktop && (
                <div className="bg-white rounded-2xl border border-grayscale-300 p-6 mb-6 shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-grayscale-900 mb-1">
                            Preview in LearnCard
                        </h3>
                        <p className="text-sm text-grayscale-600">
                            Run your app inside LearnCard. We'll keep capturing what it uses.
                        </p>
                    </div>
                    <button
                        onClick={handlePreview}
                        disabled={isPreviewing || !appName}
                        className={`flex items-center gap-2 py-3 px-6 rounded-[20px] font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            previewListingId
                                ? 'bg-grayscale-900 text-white hover:opacity-90'
                                : 'border border-grayscale-300 text-grayscale-700 hover:bg-grayscale-10'
                        }`}
                    >
                        {isPreviewing ? (
                            <>
                                <IonSpinner name="crescent" className="w-4 h-4" />
                                Preparing preview...
                            </>
                        ) : (
                            <>
                                <IonIcon icon={playOutline} className="w-4 h-4" />
                                Preview
                            </>
                        )}
                    </button>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-grayscale-300 p-6 mb-6 shadow-sm">
                <div className="flex items-start gap-5 mb-6">
                    <div className="relative group cursor-pointer" onClick={handleIconUpload}>
                        {isIconUploading ? (
                            <div className="w-16 h-16 rounded-2xl bg-grayscale-100 border border-grayscale-200 flex items-center justify-center">
                                <IonSpinner
                                    name="crescent"
                                    className="w-6 h-6 text-grayscale-500"
                                />
                            </div>
                        ) : iconUrl ? (
                            <img
                                src={iconUrl}
                                alt="App Icon"
                                className="w-16 h-16 rounded-2xl object-cover border border-grayscale-200"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-2xl bg-grayscale-100 border border-grayscale-200 flex items-center justify-center text-2xl font-semibold text-grayscale-700">
                                {appName.charAt(0).toUpperCase() || '?'}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                            <IonIcon icon={cameraOutline} className="w-5 h-5 mb-0.5" />
                            <span className="text-[10px] font-medium">Change</span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                            App Name
                        </label>
                        <input
                            type="text"
                            value={appName}
                            onChange={e => setAppName(e.target.value)}
                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                            placeholder="My Awesome App"
                        />
                        {isLocalhost ? (
                            <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                <div className="flex items-center gap-1.5 text-amber-800 text-xs font-medium mb-2">
                                    <IonIcon icon={globeOutline} className="w-4 h-4" />
                                    You're testing from{' '}
                                    <strong>{new URL(manifest.appUrl).host}</strong>
                                </div>
                                <label className="block text-xs font-medium text-amber-900 mb-1">
                                    Where will your app live?
                                </label>
                                <input
                                    ref={prodUrlInputRef}
                                    type="text"
                                    value={productionUrl}
                                    onChange={e => {
                                        setProductionUrl(e.target.value);
                                        if (prodUrlError) setProdUrlError(null);
                                    }}
                                    className={`w-full py-2 px-3 border rounded-lg text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:border-transparent bg-white ${
                                        prodUrlError
                                            ? 'border-red-300 focus:ring-red-500'
                                            : 'border-amber-200 focus:ring-amber-500'
                                    }`}
                                    placeholder="https://myapp.com"
                                />
                                {prodUrlError && (
                                    <div className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                                        <IonIcon
                                            icon={alertCircleOutline}
                                            className="w-3.5 h-3.5"
                                        />
                                        {prodUrlError}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="mt-2 text-xs text-grayscale-500 flex items-center gap-1">
                                <IonIcon icon={globeOutline} className="w-3.5 h-3.5" />
                                {manifest.appUrl}
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                        Tagline
                    </label>
                    <input
                        type="text"
                        value={tagline}
                        onChange={e => setTagline(e.target.value)}
                        className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                        placeholder="One sentence about your app"
                    />
                </div>
            </div>

            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-grayscale-900 flex items-center gap-2">
                        <IonIcon
                            icon={checkmarkCircleOutline}
                            className="w-4 h-4 text-emerald-500"
                        />
                        Captured from your app
                    </h3>
                    {isLive && (
                        <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Watching your app...
                        </div>
                    )}
                </div>

                {integrationHints.length > 0 && (
                    <div className="mb-4 space-y-3">
                        {integrationHints.map(hint => {
                            if (hint.type === 'consent-not-configured') {
                                return (
                                    <ConsentDesignerCard
                                        key={hint.type}
                                        appName={appName}
                                        onEnable={handleEnableConsent}
                                        onDismiss={() => dismissHint(hint.type)}
                                    />
                                );
                            }
                            return (
                                <div
                                    key={hint.type}
                                    className="bg-amber-50 border border-amber-100 rounded-2xl p-5 relative animate-fade-in-up"
                                >
                                    <button
                                        onClick={() => dismissHint(hint.type)}
                                        className="absolute top-3 right-3 p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-full transition-colors"
                                    >
                                        <IonIcon icon={closeOutline} className="w-4 h-4" />
                                    </button>
                                    <div className="flex items-start gap-3 mb-3">
                                        <IonIcon
                                            icon={flashOutline}
                                            className="w-5 h-5 text-amber-500 shrink-0 mt-0.5"
                                        />
                                        <div>
                                            <h4 className="text-sm font-semibold text-grayscale-900 mb-1">
                                                {hint.title}
                                            </h4>
                                            <p className="text-sm text-grayscale-600">
                                                {hint.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <pre className="bg-white border border-amber-200 rounded-xl p-3 text-xs font-mono text-grayscale-800 whitespace-pre overflow-x-auto">
                                            {hint.snippet}
                                        </pre>
                                        <button
                                            onClick={() =>
                                                handleCopySnippet(hint.snippet, hint.type)
                                            }
                                            className="absolute top-2 right-2 py-1.5 px-3 rounded-[20px] border border-grayscale-300 bg-white text-grayscale-700 font-medium text-xs hover:bg-grayscale-10 transition-colors flex items-center gap-1.5 shadow-sm"
                                        >
                                            {copiedHint === hint.type ? (
                                                <>
                                                    <IonIcon
                                                        icon={checkmarkOutline}
                                                        className="w-3.5 h-3.5 text-emerald-500"
                                                    />
                                                    Copied ✓
                                                </>
                                            ) : (
                                                <>
                                                    <IonIcon
                                                        icon={copyOutline}
                                                        className="w-3.5 h-3.5"
                                                    />
                                                    Copy code
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="space-y-4">
                    {manifest.permissions.includes('request_consent') &&
                        manifest.consentRequests.length === 0 &&
                        !integrationHints.some(h => h.type === 'consent-not-configured') && (
                            <div className="mb-4">
                                {showConsentDesigner ? (
                                    <ConsentDesignerCard
                                        appName={appName}
                                        onEnable={handleEnableConsent}
                                        onDismiss={() => setShowConsentDesigner(false)}
                                    />
                                ) : (
                                    <div className="bg-white rounded-2xl border border-grayscale-300 p-5 flex items-center justify-between shadow-sm">
                                        <div>
                                            <h4 className="text-sm font-semibold text-grayscale-900 mb-1">
                                                Consent not configured
                                            </h4>
                                            <p className="text-xs text-grayscale-600">
                                                Your app requests consent, but hasn't set up what to
                                                ask for.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setShowConsentDesigner(true)}
                                            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1"
                                        >
                                            Set up consent{' '}
                                            <IonIcon
                                                icon={arrowForwardOutline}
                                                className="w-4 h-4"
                                            />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                    {manifest.permissions.length > 0 && (
                        <div
                            className={`bg-white rounded-2xl border p-5 transition-colors duration-500 ${
                                recentlyCaptured.has('permissions')
                                    ? 'border-emerald-400 ring-1 ring-emerald-400'
                                    : 'border-grayscale-300'
                            }`}
                        >
                            <h4 className="text-xs font-medium text-grayscale-700 mb-3 uppercase tracking-wider">
                                Permissions
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {manifest.permissions.map(p => (
                                    <span
                                        key={p}
                                        className="px-2.5 py-1 bg-grayscale-100 text-grayscale-700 rounded-lg text-xs font-medium"
                                    >
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {manifest.templates.length > 0 && (
                        <div
                            className={`bg-white rounded-2xl border p-5 transition-colors duration-500 ${
                                recentlyCaptured.has('templates')
                                    ? 'border-emerald-400 ring-1 ring-emerald-400'
                                    : 'border-grayscale-300'
                            }`}
                        >
                            <h4 className="text-xs font-medium text-grayscale-700 mb-3 uppercase tracking-wider">
                                Credential Templates
                            </h4>
                            <p className="text-xs text-grayscale-500 mb-4">
                                Created automatically the first time your app sends it.
                            </p>
                            <div className="space-y-3">
                                {manifest.templates.map(t => (
                                    <div
                                        key={t.alias}
                                        className="p-3 bg-grayscale-10 rounded-xl border border-grayscale-200"
                                    >
                                        <div className="font-medium text-sm text-grayscale-900 mb-1">
                                            {'name' in t.template ? t.template.name : t.alias}
                                        </div>
                                        <div className="text-xs text-grayscale-600 flex items-center gap-3">
                                            <span>
                                                Alias:{' '}
                                                <code className="bg-grayscale-200 px-1 rounded">
                                                    {t.alias}
                                                </code>
                                            </span>
                                            {'achievementType' in t.template &&
                                                t.template.achievementType && (
                                                    <span>Type: {t.template.achievementType}</span>
                                                )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {manifest.consentRequests.length > 0 && (
                        <div
                            className={`bg-white rounded-2xl border p-5 transition-colors duration-500 ${
                                recentlyCaptured.has('consentRequests')
                                    ? 'border-emerald-400 ring-1 ring-emerald-400'
                                    : 'border-grayscale-300'
                            }`}
                        >
                            <h4 className="text-xs font-medium text-grayscale-700 mb-3 uppercase tracking-wider">
                                Consent Requests
                            </h4>
                            <div className="space-y-3">
                                {manifest.consentRequests.map((c, i) => (
                                    <div
                                        key={i}
                                        className="p-3 bg-grayscale-10 rounded-xl border border-grayscale-200"
                                    >
                                        {c.reason && (
                                            <div className="text-sm text-grayscale-900 mb-2 italic">
                                                "{c.reason}"
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-2">
                                            {c.scopes.read.personalFields.map(f => (
                                                <span
                                                    key={`read-pf-${f}`}
                                                    className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs flex items-center gap-1"
                                                >
                                                    <IonIcon
                                                        icon={shieldCheckmarkOutline}
                                                        className="w-3 h-3"
                                                    />{' '}
                                                    Read: {f}
                                                </span>
                                            ))}
                                            {c.scopes.read.credentialCategories.map(cat => (
                                                <span
                                                    key={`read-cat-${cat}`}
                                                    className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs flex items-center gap-1"
                                                >
                                                    <IonIcon
                                                        icon={shieldCheckmarkOutline}
                                                        className="w-3 h-3"
                                                    />{' '}
                                                    Read: {cat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div
                        className={`bg-white rounded-2xl border p-5 flex items-center justify-between text-sm transition-colors duration-500 ${
                            recentlyCaptured.has('featuresLaunched') ||
                            recentlyCaptured.has('counterKeys')
                                ? 'border-emerald-400 ring-1 ring-emerald-400'
                                : 'border-grayscale-300'
                        }`}
                    >
                        <span className="text-grayscale-700">
                            Features used:{' '}
                            <strong className="text-grayscale-900">
                                {manifest.featuresLaunched.length}
                            </strong>
                        </span>
                        <span className="text-grayscale-700">
                            Counters:{' '}
                            <strong className="text-grayscale-900">
                                {manifest.counterKeys.length}
                            </strong>
                        </span>
                        <span className="text-grayscale-700">
                            Context:{' '}
                            <strong className="text-grayscale-900">
                                {manifest.usedLearnerContext ? 'Yes' : 'No'}
                            </strong>
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleContinue}
                    disabled={isPreparing || !appName || !tagline}
                    className="flex items-center gap-2 py-3 px-6 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {isPreparing ? (
                        <>
                            <IonSpinner name="crescent" className="w-4 h-4" />
                            Preparing...
                        </>
                    ) : (
                        <>
                            Continue
                            <IonIcon icon={arrowForwardOutline} className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    const rightPaneContent = isDesktop && (
        <div className="sticky top-0 h-[calc(100vh-80px)] py-6 pr-6 pl-2 flex flex-col">
            <div className="flex-1 rounded-2xl border border-grayscale-300 bg-white shadow-sm overflow-hidden flex flex-col">
                <div className="h-12 border-b border-grayscale-200 bg-grayscale-10 flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-sm font-medium text-grayscale-900 truncate">
                            {appName || 'Preview App'}
                        </span>
                        {isLive && (
                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Watching
                            </div>
                        )}
                    </div>
                    {isLive && (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-grayscale-500 hidden xl:inline">
                                Changes apply when you continue
                            </span>
                            <button
                                onClick={() => setIsLive(false)}
                                className="text-xs font-medium text-grayscale-600 hover:text-grayscale-900 transition-colors"
                            >
                                Stop
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-1 relative bg-grayscale-100">
                    {isLive ? (
                        <div className="absolute inset-0 animate-fade-in-up">
                            <EmbedIframeModal
                                embedUrl={manifest.appUrl}
                                appId={previewListingId || undefined}
                                appName={appName || 'Preview App'}
                                launchConfig={
                                    currentLaunchConfig || {
                                        url: manifest.appUrl,
                                        permissions: manifest.permissions,
                                    }
                                }
                                isInstalled={true}
                                inline={true}
                                onIntegrationHint={handleIntegrationHint}
                            />
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                                <IonIcon
                                    icon={playOutline}
                                    className="w-8 h-8 text-indigo-500 ml-1"
                                />
                            </div>
                            <h3 className="text-lg font-semibold text-grayscale-900 mb-2">
                                Preview your app
                            </h3>
                            <p className="text-sm text-grayscale-600 mb-6 max-w-xs">
                                Run your app inside LearnCard to test it and capture any missing
                                permissions.
                            </p>
                            <button
                                onClick={handlePreview}
                                disabled={isPreviewing || !appName}
                                className="flex items-center gap-2 py-3 px-6 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isPreviewing ? (
                                    <>
                                        <IonSpinner name="crescent" className="w-4 h-4" />
                                        Preparing preview...
                                    </>
                                ) : (
                                    <>
                                        <IonIcon icon={playOutline} className="w-4 h-4" />
                                        Start preview
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <IonPage>
            <AppStoreHeader title="Publish your app" />
            <IonContent>
                <div className="flex min-h-full">
                    <div className={`flex-1 ${isDesktop ? 'p-6' : 'ion-padding'}`}>
                        {leftPaneContent}
                    </div>
                    {isDesktop && (
                        <div className="w-1/2 max-w-2xl shrink-0 bg-grayscale-50 border-l border-grayscale-200">
                            {rightPaneContent}
                        </div>
                    )}
                </div>
            </IonContent>
        </IonPage>
    );
};
