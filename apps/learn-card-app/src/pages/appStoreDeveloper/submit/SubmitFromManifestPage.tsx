import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
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
    personOutline,
    ribbonOutline,
    sparklesOutline,
    notificationsOutline,
    rocketOutline,
    statsChartOutline,
} from 'ionicons/icons';
import { AppStoreHeader } from '../components/AppStoreHeader';
import { useDeveloperPortal } from '../useDeveloperPortal';
import { useModal, ModalTypes, useDeviceTypeByWidth, getLogger } from 'learn-card-base';
import { useImageUpload } from 'learn-card-base';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';
import { EmbedIframeModal } from '../../launchPad/EmbedIframeModal';
import { consumePublishResume } from './publishResume';
import {
    applyCapturedAction,
    decodeManifestFromUrl,
    isAppBuilderPreviewHost,
} from '@learncard/partner-connect-core';
import type { CapturedAppManifest } from '@learncard/partner-connect-core';
import type { IntegrationHint } from '../../../hooks/post-message/useLearnCardPostMessage.handlers';
import { useWallet } from 'learn-card-base';
import {
    normalizeConsentRequest,
    canonicalConsentScopeString,
} from '@learncard/partner-connect-core';
import type { ConsentRequest } from '@learncard/partner-connect-core';
import { ConsentDesignerCard } from './ConsentDesignerCard';
import { findReusableListing } from './listingReuse';
import { ListingDetailsFields, StandOutSection } from './ListingEditor';
import { StoreListingPreview } from './StoreListingPreview';
import { AppCapabilitiesSummary } from './AppCapabilitiesSummary';
import { describeManifest, getPermissionLabel } from './appCapabilities';
import { DEFAULT_APP_ICON_URL } from './constants';
import {
    EMPTY_LISTING_DETAILS,
    listingToData,
    toListingUpdates,
    toSubmissionUpdates,
} from './listingForm';
import type { ListingData, ListingDetails } from './listingForm';
import { getFirstMissingField, getProductionUrlError } from './listingValidation';
import type { ListingField } from './listingValidation';

interface PreviewLaunchConfig {
    url: string;
    permissions: string[];
    contractUri?: string;
    devPreviewKey?: string;
}

interface ProvisionedPreview {
    integrationId: string;
    listingId: string;
}

const getPreviewDraftKey = (manifest: CapturedAppManifest): string =>
    `partner-preview:${manifest.appUrl}:${manifest.suggestedName ?? ''}`;

const log = getLogger('submit-from-manifest');

// Session keys. `SESSION_MANIFEST_SOURCE_KEY` records the exact `?manifest=` param the
// session copy was built from, so a *newer* publish link is never mistaken for a reload
// of the previous one (appUrl + suggestedName are identical across app versions).
const SESSION_MANIFEST_KEY = 'lc-submit-manifest';
const SESSION_MANIFEST_SOURCE_KEY = 'lc-submit-manifest-source';

interface StoredProvision {
    integrationId: string;
    listingId?: string;
}

// Provisioning is remembered per captured appUrl (origin + pathname) — the only part of
// the manifest that is stable as the app evolves. Keying by name/title would make every
// retitled capture look like a brand new app and silently drop the change diff.
const getProvisionKey = (appUrl: string): string => `partner-preview:${appUrl}`;

const readStoredProvision = (appUrl: string): StoredProvision | null => {
    try {
        const raw = localStorage.getItem(getProvisionKey(appUrl));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as StoredProvision;
        return typeof parsed?.integrationId === 'string' ? parsed : null;
    } catch {
        return null;
    }
};

const storeProvision = (appUrl: string, provision: StoredProvision): void => {
    try {
        localStorage.setItem(getProvisionKey(appUrl), JSON.stringify(provision));
    } catch {
        // Storage unavailable — the diff check falls back to the host-name lookup.
    }
};

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
                    return path ? `${path}: ${issue.message ?? ''}` : (issue.message ?? '');
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

const PERSONAL_FIELD_LABELS: Record<string, string> = {
    'name': 'Name',
    'email': 'Email',
    'phone': 'Phone',
    'birthDate': 'Birth date',
    'country': 'Country',
    'avatar': 'Profile photo',
};

import { ManifestDiffPanel } from '../dashboards/components/ManifestDiffPanel';
import type { AppListingStatus, AppManifestDiff } from '@learncard/types';

const AUTOSAVE_DELAY_MS = 800;

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

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
    const [listingDetails, setListingDetails] = useState<ListingDetails>(EMPTY_LISTING_DETAILS);
    const [saveState, setSaveState] = useState<SaveState>('idle');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showMissingHint, setShowMissingHint] = useState(false);
    const [submittedIntegrationId, setSubmittedIntegrationId] = useState<string | null>(null);
    const [existingListingStatus, setExistingListingStatus] = useState<AppListingStatus | null>(
        null
    );
    const [rightPaneTab, setRightPaneTab] = useState<'store' | 'try'>('store');
    const hasEditedListingRef = useRef(false);
    const isSubmittingRef = useRef(false);
    const restoredAppUrlRef = useRef<string | null>(null);
    const iconFieldRef = useRef<HTMLDivElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const taglineInputRef = useRef<HTMLInputElement>(null);
    const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
    const contactEmailInputRef = useRef<HTMLInputElement>(null);

    const {
        useIntegrations,
        useCreateIntegration,
        useCreateListing,
        useUpdateListing,
        useSubmitForReview,
    } = useDeveloperPortal();
    const updateListing = useUpdateListing();
    const submitForReview = useSubmitForReview();
    const { newModal } = useModal();
    const { isDesktop } = useDeviceTypeByWidth();
    const [previewListingId, setPreviewListingId] = useState<string | null>(null);
    const [previewIntegrationId, setPreviewIntegrationId] = useState<string | null>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isLive, setIsLive] = useState(false);
    const [productionUrl, setProductionUrl] = useState('');
    const [isLocalhost, setIsLocalhost] = useState(false);
    const [resumedAfterSignIn, setResumedAfterSignIn] = useState(false);

    useEffect(() => {
        if (consumePublishResume()) setResumedAfterSignIn(true);
    }, []);
    const [uploadedIconUrl, setUploadedIconUrl] = useState<string | undefined>(undefined);
    const [manifestDiff, setManifestDiff] = useState<AppManifestDiff | null>(null);
    const [manifestVersion, setManifestVersion] = useState<number | null>(null);
    const [isApplyingDiff, setIsApplyingDiff] = useState(false);
    const [diffApplied, setDiffApplied] = useState(false);
    const [displayIconUrl, setDisplayIconUrl] = useState<string | undefined>(undefined);
    const [isIconImported, setIsIconImported] = useState(false);
    const [recentlyCaptured, setRecentlyCaptured] = useState<Set<string>>(new Set());
    const [integrationHints, setIntegrationHints] = useState<IntegrationHint[]>([]);
    const [copiedHint, setCopiedHint] = useState<string | null>(null);
    const [contractUri, setContractUri] = useState<string | null>(null);
    const [showConsentDesigner, setShowConsentDesigner] = useState(false);
    const [currentLaunchConfig, setCurrentLaunchConfig] = useState<PreviewLaunchConfig | null>(
        null
    );
    const provisioningPromiseRef = useRef<Promise<ProvisionedPreview> | null>(null);
    const [designerConsentKey, setDesignerConsentKey] = useState<string | null>(null);
    const [designerConsentScopes, setDesignerConsentScopes] = useState<ConsentRequest | null>(null);
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

    const {
        handleFileSelect: handleIconUpload,
        isLoading: isIconUploading,
        uploadImageFromUrl,
    } = useImageUpload({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data) => {
            if (data?.url) {
                if (data.url.startsWith('https://')) {
                    hasEditedListingRef.current = true;
                    setUploadedIconUrl(data.url);
                    setDisplayIconUrl(data.url);
                } else {
                    setFormError('Uploaded icon URL must be HTTPS.');
                }
            }
        },
    });
    const { data: integrations, isLoading: isLoadingIntegrations } = useIntegrations();
    const createIntegration = useCreateIntegration();

    useEffect(() => {
        if (!manifest || diffApplied) return;

        const checkManifest = async () => {
            const { appUrl } = manifest;
            try {
                const host = new URL(appUrl).host;
                const stored = readStoredProvision(appUrl);
                // The host-name lookup only finds integrations this flow created; the
                // stored record is what survives a title change or an integration the
                // developer created (or renamed) elsewhere.
                const integrationId =
                    stored?.integrationId ?? integrations?.find(i => i.name === host)?.id;

                log.debug('manifest.diff-check.start', {
                    appUrl,
                    host,
                    hasStoredProvision: Boolean(stored),
                    integrationId: integrationId ?? null,
                    storedListingId: stored?.listingId ?? null,
                });

                if (!integrationId) return;

                const wallet = await initWallet();
                if (!wallet?.invoke?.submitAppManifest) {
                    log.debug('manifest.diff-check.unsupported', { appUrl });
                    return;
                }

                const result = await wallet.invoke.submitAppManifest(integrationId, manifest);

                log.debug('manifest.diff-check.result', {
                    integrationId,
                    version: result.version,
                    noop: result.noop,
                    hasDiff: Boolean(result.diff),
                });

                if (result.noop) return;

                if (!result.diff) {
                    // No active version to compare against yet, so there is nothing to
                    // review — make this the baseline instead. Skipping it would leave
                    // the integration permanently baseline-less, and every later capture
                    // would keep coming back diff-less too.
                    if (!wallet.invoke.applyManifestVersion) return;
                    try {
                        await wallet.invoke.applyManifestVersion(
                            integrationId,
                            result.version,
                            stored?.listingId
                        );
                        log.debug('manifest.diff-check.baseline-applied', {
                            integrationId,
                            version: result.version,
                        });
                    } catch (e) {
                        log.debug('manifest.diff-check.baseline-failed', e, { integrationId });
                    }
                    return;
                }

                setManifestDiff(result.diff);
                setManifestVersion(result.version);
                setPreviewIntegrationId(integrationId);
            } catch (e) {
                log.debug('manifest.diff-check.failed', e, { appUrl });
            }
        };

        checkManifest();
    }, [manifest, integrations, diffApplied]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const manifestParam = params.get('manifest');
        if (!manifestParam) {
            setError('This publish link is missing its app details.');
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
            let appHostname: string;
            try {
                appHostname = new URL(decoded.appUrl).hostname;
            } catch {
                throw new Error('Invalid appUrl in manifest.');
            }
            // Local and app-builder preview addresses are not where the app will live,
            // so the developer must confirm the real address before continuing.
            const needsProductionUrl =
                decoded.appUrl.includes('localhost') ||
                decoded.appUrl.includes('127.0.0.1') ||
                decoded.appUrl.includes('[::1]') ||
                decoded.appUrl.includes('.localhost') ||
                decoded.appUrl.includes('.local') ||
                decoded.appUrl.startsWith('http://') ||
                isAppBuilderPreviewHost(appHostname);
            setIsLocalhost(needsProductionUrl);

            const applyDecodedManifest = () => {
                setManifest(decoded);
                sessionStorage.setItem(SESSION_MANIFEST_KEY, JSON.stringify(decoded));
                sessionStorage.setItem(SESSION_MANIFEST_SOURCE_KEY, manifestParam);
            };

            // The session copy carries capture that happened *inside* this page (preview
            // postMessages, the consent designer), so it is only safe to restore for the
            // exact same publish link. A different `manifest` param means the app changed
            // and the decoded one is newer — restoring here would re-submit the old
            // manifest, come back `noop`, and hide the change diff.
            const sessionManifestStr = sessionStorage.getItem(SESSION_MANIFEST_KEY);
            const isSameCapture =
                sessionStorage.getItem(SESSION_MANIFEST_SOURCE_KEY) === manifestParam;

            log.debug('manifest.decoded', {
                appUrl: decoded.appUrl,
                hasSessionManifest: Boolean(sessionManifestStr),
                restoredFromSession: Boolean(sessionManifestStr) && isSameCapture,
                hasStoredProvision: Boolean(readStoredProvision(decoded.appUrl)),
            });

            if (sessionManifestStr && isSameCapture) {
                try {
                    setManifest(JSON.parse(sessionManifestStr));
                } catch {
                    applyDecodedManifest();
                }
            } else {
                applyDecodedManifest();
            }
            const suggestedIcon = decoded.suggestedIconUrl;
            if (isAllowedIconUrl(suggestedIcon)) {
                setUploadedIconUrl(suggestedIcon);
                setDisplayIconUrl(suggestedIcon);
            } else if (suggestedIcon) {
                setDisplayIconUrl(suggestedIcon);
            }

            const sessionDesignerKey = sessionStorage.getItem('lc-submit-designer-key');
            const sessionDesignerScopes = sessionStorage.getItem('lc-submit-designer-scopes');
            if (sessionDesignerKey) setDesignerConsentKey(sessionDesignerKey);
            if (sessionDesignerScopes) {
                try {
                    setDesignerConsentScopes(JSON.parse(sessionDesignerScopes));
                } catch {
                    // Ignore malformed session state; the designer starts from defaults.
                }
            }
            setAppName(decoded.suggestedName || '');
        } catch (err) {
            setError('This publish link is invalid or expired.');
        }
    }, [location.search]);

    useEffect(() => {
        if (
            manifest &&
            manifest.suggestedIconUrl &&
            !isAllowedIconUrl(manifest.suggestedIconUrl) &&
            !uploadedIconUrl
        ) {
            let isMounted = true;
            const importIcon = async () => {
                try {
                    const url = await uploadImageFromUrl(manifest.suggestedIconUrl!);
                    if (url && isMounted) {
                        setIsIconImported(true);
                        setTimeout(() => {
                            if (isMounted) setIsIconImported(false);
                        }, 3000);
                    }
                } catch (e) {
                    // silent no-op
                }
            };
            importIcon();
            return () => {
                isMounted = false;
            };
        }
    }, [manifest?.suggestedIconUrl]);

    const ensureProvisioned = async (): Promise<ProvisionedPreview> => {
        if (provisioningPromiseRef.current) return provisioningPromiseRef.current;

        const provision = async (): Promise<ProvisionedPreview> => {
            if (!manifest) throw new Error('No manifest');

            // Preview always provisions against the captured app URL (localhost is
            // allowed for DRAFT listings). The production URL only applies on submit.
            const previewUrl = manifest.appUrl;
            const host = new URL(previewUrl).host;
            const previewKey = getPreviewDraftKey(manifest);
            const displayName = appName || manifest.suggestedName || 'Preview App';

            const storedProvision = readStoredProvision(previewUrl);

            let integrationId =
                previewIntegrationId ||
                storedProvision?.integrationId ||
                integrations?.find(i => i.name === host)?.id;
            if (!integrationId) {
                integrationId = await createIntegration.mutateAsync(host);
                setPreviewIntegrationId(integrationId);
            }

            if (previewListingId) {
                storeProvision(previewUrl, { integrationId, listingId: previewListingId });
                return { integrationId, listingId: previewListingId };
            }

            const wallet = await initWallet();
            const existingListings = await wallet.invoke.getListingsForIntegration(integrationId, {
                limit: 100,
            });
            const existingDraft = findReusableListing(existingListings.records, {
                storedListingId: storedProvision?.listingId,
                previewKey,
                previewUrl,
                displayName,
            });

            if (existingDraft && existingDraft.app_listing_status !== 'DRAFT') {
                setExistingListingStatus(existingDraft.app_listing_status);
            }

            let listingId = existingDraft?.listing_id;

            if (existingDraft) {
                let existingConfig: Partial<PreviewLaunchConfig> = {};
                try {
                    existingConfig = JSON.parse(
                        existingDraft.launch_config_json
                    ) as PreviewLaunchConfig;
                } catch {
                    // Older listings may have no launch details yet; start from the capture.
                }
                const restoredConfig: PreviewLaunchConfig = {
                    url: previewUrl,
                    permissions: manifest.permissions,
                    devPreviewKey: previewKey,
                    ...(typeof existingConfig.contractUri === 'string'
                        ? { contractUri: existingConfig.contractUri }
                        : {}),
                };

                setPreviewIntegrationId(integrationId);
                setPreviewListingId(existingDraft.listing_id);
                setCurrentLaunchConfig(restoredConfig);
                if (restoredConfig.contractUri) setContractUri(restoredConfig.contractUri);
            } else {
                const launchConfig: PreviewLaunchConfig = {
                    ...(currentLaunchConfig ?? {
                        url: previewUrl,
                        permissions: manifest.permissions,
                    }),
                    devPreviewKey: previewKey,
                };
                listingId = await createListing.mutateAsync({
                    integrationId,
                    listing: {
                        display_name: displayName,
                        tagline: tagline || `${displayName} preview`,
                        full_description:
                            tagline ||
                            `${displayName} — draft listing created from a LearnCard app preview.`,
                        icon_url: isAllowedIconUrl(uploadedIconUrl)
                            ? uploadedIconUrl
                            : DEFAULT_APP_ICON_URL,
                        launch_type: 'EMBEDDED_IFRAME',
                        launch_config_json: JSON.stringify(launchConfig),
                    },
                });

                setPreviewIntegrationId(integrationId);
                setPreviewListingId(listingId);
                setCurrentLaunchConfig(launchConfig);
            }

            storeProvision(previewUrl, { integrationId, listingId });

            if (wallet?.invoke?.submitAppManifest && wallet?.invoke?.applyManifestVersion) {
                const result = await wallet.invoke.submitAppManifest(integrationId, manifest);
                log.debug('manifest.provision.submitted', {
                    integrationId,
                    listingId,
                    version: result.version,
                    noop: result.noop,
                });
                if (!result.noop) {
                    await wallet.invoke.applyManifestVersion(
                        integrationId,
                        result.version,
                        listingId
                    );
                }
            }

            return { integrationId, listingId: listingId! };
        };

        const pendingProvision = provision().finally(() => {
            provisioningPromiseRef.current = null;
        });
        provisioningPromiseRef.current = pendingProvision;

        return pendingProvision;
    };

    const handlePreview = async () => {
        if (!manifest) return;
        setIsPreviewing(true);
        setFormError(null);
        try {
            const { listingId } = await ensureProvisioned();
            setIsLive(true);
            setRightPaneTab('try');

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
                        launchFeaturesInNewTab={true}
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

        const normalizedScopes = normalizeConsentRequest(scopes);
        const newKey = canonicalConsentScopeString(normalizedScopes);

        setManifest(prev => {
            if (!prev) return prev;

            const nextRequests = prev.consentRequests.filter(
                req => canonicalConsentScopeString(req.scopes) !== designerConsentKey
            );

            const existingIndex = nextRequests.findIndex(
                req => canonicalConsentScopeString(req.scopes) === newKey
            );

            if (existingIndex >= 0) {
                nextRequests[existingIndex] = {
                    ...nextRequests[existingIndex],
                    lastUsedAt: new Date().toISOString(),
                    reason: scopes.reason || nextRequests[existingIndex].reason,
                };
            } else {
                nextRequests.push({
                    scopes: normalizedScopes,
                    reason: scopes.reason,
                    lastUsedAt: new Date().toISOString(),
                });
            }

            const next = {
                ...prev,
                consentRequests: nextRequests,
            };
            sessionStorage.setItem(SESSION_MANIFEST_KEY, JSON.stringify(next));
            return next;
        });

        setDesignerConsentKey(newKey);
        setDesignerConsentScopes(scopes);
        sessionStorage.setItem('lc-submit-designer-key', newKey);
        sessionStorage.setItem('lc-submit-designer-scopes', JSON.stringify(scopes));
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
                            sessionStorage.setItem(SESSION_MANIFEST_KEY, JSON.stringify(next));

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

    const listingData = useMemo<ListingData>(
        () => ({
            ...listingDetails,
            name: appName,
            tagline,
            iconUrl:
                uploadedIconUrl && isAllowedIconUrl(uploadedIconUrl)
                    ? uploadedIconUrl
                    : DEFAULT_APP_ICON_URL,
        }),
        [listingDetails, appName, tagline, uploadedIconUrl]
    );

    const missingField = getFirstMissingField({
        ...listingData,
        needsProductionUrl: isLocalhost,
        productionUrl,
    });

    const updateDetails = (updates: Partial<ListingDetails>) => {
        hasEditedListingRef.current = true;
        setListingDetails(prev => ({ ...prev, ...updates }));
    };

    // A previous visit may already have a listing for this app: bring back what was
    // typed there, and point preview/apply at it instead of creating another listing.
    useEffect(() => {
        if (!manifest || restoredAppUrlRef.current === manifest.appUrl) return;
        restoredAppUrlRef.current = manifest.appUrl;

        const stored = readStoredProvision(manifest.appUrl);
        if (!stored?.listingId) return;
        const { integrationId, listingId } = stored;

        let cancelled = false;
        const restore = async () => {
            try {
                const wallet = await initWallet();
                const listing = await wallet.invoke.getAppStoreListing(listingId);
                if (cancelled || !listing) return;

                try {
                    const config = JSON.parse(listing.launch_config_json) as PreviewLaunchConfig;
                    setCurrentLaunchConfig(config);
                    if (config.contractUri) setContractUri(config.contractUri);
                } catch {
                    // An unreadable launch config is rebuilt from the captured app on submit.
                }
                setPreviewIntegrationId(integrationId);
                setPreviewListingId(listingId);

                if (listing.app_listing_status !== 'DRAFT') {
                    setExistingListingStatus(listing.app_listing_status);
                    return;
                }
                if (hasEditedListingRef.current) return;

                const { name, tagline: savedTagline, iconUrl, ...details } = listingToData(listing);
                if (name) setAppName(name);
                if (savedTagline) setTagline(savedTagline);
                if (iconUrl !== DEFAULT_APP_ICON_URL && isAllowedIconUrl(iconUrl)) {
                    setUploadedIconUrl(iconUrl);
                    setDisplayIconUrl(iconUrl);
                }
                setListingDetails(details);
            } catch (e) {
                log.debug('listing.restore.failed', e, { listingId });
            }
        };

        restore();
        return () => {
            cancelled = true;
        };
        // Runs once per app: capture updates change `manifest` but not which listing to restore.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [manifest?.appUrl]);

    useEffect(() => {
        if (!manifest || !hasEditedListingRef.current || existingListingStatus) return;

        const timer = setTimeout(async () => {
            if (isSubmittingRef.current) return;
            setSaveState('saving');
            try {
                const { listingId } = await ensureProvisioned();
                await updateListing.mutateAsync({
                    listingId,
                    updates: toListingUpdates(listingData),
                });
                setSaveState('saved');
            } catch (e) {
                log.warn('listing.autosave.failed', e);
                setSaveState('error');
            }
        }, AUTOSAVE_DELAY_MS);

        return () => clearTimeout(timer);
        // Debounced on listing edits only; ensureProvisioned is recreated every render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listingData]);

    const focusField = (field: ListingField) => {
        const refs: Record<ListingField, React.RefObject<HTMLElement>> = {
            icon: iconFieldRef,
            name: nameInputRef,
            productionUrl: prodUrlInputRef,
            tagline: taglineInputRef,
            description: descriptionInputRef,
            contactEmail: contactEmailInputRef,
        };
        const element = refs[field].current;
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element?.focus({ preventScroll: true });
    };

    const handleSubmit = async () => {
        if (!manifest || isSubmitting) return;
        setFormError(null);

        if (missingField) {
            setShowMissingHint(true);
            focusField(missingField.field);
            return;
        }

        const urlError = isLocalhost ? getProductionUrlError(productionUrl) : null;
        if (urlError) {
            setProdUrlError(urlError);
            focusField('productionUrl');
            return;
        }

        isSubmittingRef.current = true;
        setIsSubmitting(true);
        try {
            const { integrationId, listingId } = await ensureProvisioned();
            const finalUrl = isLocalhost ? new URL(productionUrl.trim()).origin : manifest.appUrl;
            await updateListing.mutateAsync({
                listingId,
                integrationId,
                updates: toSubmissionUpdates(listingData, {
                    url: finalUrl,
                    permissions: manifest.permissions,
                    contractUri: contractUri ?? currentLaunchConfig?.contractUri,
                }),
            });
            await submitForReview.mutateAsync(listingId);

            storeProvision(manifest.appUrl, { integrationId, listingId });
            [
                SESSION_MANIFEST_KEY,
                SESSION_MANIFEST_SOURCE_KEY,
                'lc-submit-designer-key',
                'lc-submit-designer-scopes',
            ].forEach(key => sessionStorage.removeItem(key));

            setSubmittedIntegrationId(integrationId);
        } catch (err) {
            isSubmittingRef.current = false;
            log.error('listing.submit.failed', err);
            setFormError(toFriendlyError(err, "We couldn't submit your app. Please try again."));
        } finally {
            setIsSubmitting(false);
        }
    };

    const capabilityRows = React.useMemo(() => {
        if (!manifest) return [];
        const rows = [];

        if (manifest.permissions.includes('request_identity')) {
            rows.push({
                id: 'identity',
                icon: personOutline,
                text: 'Signs users in with LearnCard',
                highlight: recentlyCaptured.has('permissions'),
            });
        }

        const latestConsent =
            designerConsentScopes ||
            manifest.consentRequests[manifest.consentRequests.length - 1]?.scopes;
        if (latestConsent) {
            const readItems = [
                ...(latestConsent.read?.credentialCategories || []),
                ...(latestConsent.read?.personalFields?.map(f => PERSONAL_FIELD_LABELS[f] || f) ||
                    []),
            ];
            const writeItems = latestConsent.write?.credentialCategories || [];

            let text = 'Asks permission to read ';
            if (readItems.length > 0) {
                if (readItems.length <= 2) {
                    text += readItems.join(' and ');
                } else {
                    text += `${readItems.slice(0, 2).join(', ')} and ${readItems.length - 2} more`;
                }
            } else {
                text += 'data';
            }

            if (writeItems.length > 0) {
                text += ' and add credentials';
            }

            rows.push({
                id: 'consent',
                icon: shieldCheckmarkOutline,
                text,
                highlight: recentlyCaptured.has('consentRequests'),
            });
        }

        if (manifest.templates.length > 0) {
            const names = manifest.templates.map(t =>
                'name' in t.template ? t.template.name : t.alias
            );
            let text = `Sends ${manifest.templates.length} credential${
                manifest.templates.length === 1 ? '' : 's'
            }: `;
            if (names.length <= 2) {
                text += names.join(', ');
            } else {
                text += `${names.slice(0, 2).join(', ')}, and ${names.length - 2} more`;
            }
            rows.push({
                id: 'templates',
                icon: ribbonOutline,
                text,
                highlight: recentlyCaptured.has('templates'),
            });
        }

        if (manifest.usedLearnerContext) {
            rows.push({
                id: 'context',
                icon: sparklesOutline,
                text: "Personalizes with the user's learning data",
                highlight: false,
            });
        }

        if (manifest.usedNotifications) {
            rows.push({
                id: 'notifications',
                icon: notificationsOutline,
                text: 'Sends notifications',
                highlight: false,
            });
        }

        if (manifest.featuresLaunched.length > 0) {
            rows.push({
                id: 'features',
                icon: rocketOutline,
                text: 'Opens LearnCard features',
                title: manifest.featuresLaunched.join(', '),
                highlight: recentlyCaptured.has('featuresLaunched'),
            });
        }

        if (manifest.counterKeys.length > 0) {
            rows.push({
                id: 'counters',
                icon: statsChartOutline,
                text: 'Tracks progress',
                subNode: (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {manifest.counterKeys.map(k => (
                            <code
                                key={k}
                                className="px-1.5 py-0.5 bg-grayscale-100 text-grayscale-700 rounded text-[10px] font-mono"
                            >
                                {k}
                            </code>
                        ))}
                    </div>
                ),
                highlight: recentlyCaptured.has('counterKeys'),
            });
        }

        return rows;
    }, [manifest, designerConsentScopes, recentlyCaptured]);

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
                                    This link doesn't work
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

    if (submittedIntegrationId) {
        return (
            <IonPage>
                <AppStoreHeader title="Publish your app" />
                <IonContent>
                    <div className="min-h-full flex items-center justify-center p-6">
                        <div className="w-full max-w-[480px] bg-white rounded-[20px] border border-grayscale-200 shadow-sm p-8 text-center font-poppins animate-fade-in-up">
                            <img
                                src={listingData.iconUrl}
                                alt=""
                                className="w-20 h-20 rounded-2xl object-cover border border-grayscale-200 mx-auto mb-5"
                            />
                            <h1 className="text-xl font-semibold text-grayscale-900 mb-2">
                                {appName} is in review
                            </h1>
                            <p className="text-sm text-grayscale-600 leading-relaxed mb-6">
                                We'll take a look and let you know when it's live in the store.
                            </p>
                            <button
                                type="button"
                                onClick={() =>
                                    history.push(
                                        `/app-store/developer/integrations/${submittedIntegrationId}`
                                    )
                                }
                                className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                            >
                                Go to Your App
                            </button>
                            <button
                                type="button"
                                onClick={() => history.push('/app-store/developer')}
                                className="mt-4 text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                            >
                                Back to Developer Portal
                            </button>
                        </div>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    const showConsentSetup =
        manifest.permissions.includes('request_consent') &&
        (manifest.consentRequests.length === 0 || Boolean(designerConsentScopes)) &&
        !integrationHints.some(h => h.type === 'consent-not-configured');

    const saveStatusText: Record<SaveState, string> = {
        idle: '',
        saving: 'Saving…',
        saved: 'All changes saved',
        error: "Couldn't save. We'll try again when you edit.",
    };

    const leftPaneContent = (
        <div className={`${isDesktop ? 'max-w-xl mx-auto' : 'max-w-2xl mx-auto'} pb-12 w-full`}>
            <div className="text-center mb-8 mt-4">
                <h1 className="text-2xl font-semibold text-grayscale-900 mb-2">Publish your app</h1>
                <p className="text-sm text-grayscale-600">
                    Add your store details, then submit. Changes save as you go.
                </p>
            </div>

            {resumedAfterSignIn && (
                <div className="mb-6 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-2.5">
                    <IonIcon
                        icon={checkmarkCircleOutline}
                        className="text-emerald-500 text-lg mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-emerald-700 leading-relaxed">
                        You're signed in. Pick up right where you left off.
                    </span>
                </div>
            )}

            {formError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                    <IonIcon
                        icon={alertCircleOutline}
                        className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                    />
                    <p className="text-sm text-red-700">{formError}</p>
                </div>
            )}

            {existingListingStatus && (
                <div className="mb-6 p-3 bg-grayscale-10 border border-grayscale-200 rounded-2xl flex items-start gap-2.5">
                    <IonIcon
                        icon={checkmarkCircleOutline}
                        className="text-emerald-500 text-lg mt-0.5 shrink-0"
                    />
                    <span className="text-sm text-grayscale-700 leading-relaxed">
                        {existingListingStatus === 'PENDING_REVIEW'
                            ? 'This app is already in review.'
                            : 'This app is already in the store.'}{' '}
                        To change its listing, go to your app.
                    </span>
                </div>
            )}

            {manifestDiff && manifestVersion && !diffApplied && (
                <div className="mb-6 bg-white rounded-2xl border border-grayscale-300 p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-base font-semibold text-grayscale-900 mb-1">
                                Your app changed
                            </h3>
                            <p className="text-sm text-grayscale-600">
                                We detected new capabilities in your app's code.
                            </p>
                        </div>
                        <button
                            onClick={async () => {
                                if (!previewIntegrationId || !manifestVersion) return;
                                setIsApplyingDiff(true);
                                try {
                                    const wallet = await initWallet();
                                    if (!wallet?.invoke?.applyManifestVersion) return;
                                    // An app can have more than one listing, so always say
                                    // which one these changes belong to.
                                    const { listingId } = await ensureProvisioned();
                                    await wallet.invoke.applyManifestVersion(
                                        previewIntegrationId,
                                        manifestVersion,
                                        listingId
                                    );
                                    log.debug('manifest.diff.applied', {
                                        integrationId: previewIntegrationId,
                                        listingId,
                                        version: manifestVersion,
                                    });
                                    setDiffApplied(true);
                                } catch (e) {
                                    log.error('manifest.diff.apply-failed', e, {
                                        integrationId: previewIntegrationId,
                                        version: manifestVersion,
                                    });
                                    setFormError('Failed to apply changes. Please try again.');
                                } finally {
                                    setIsApplyingDiff(false);
                                }
                            }}
                            disabled={isApplyingDiff}
                            className="py-2 px-4 rounded-[20px] bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isApplyingDiff ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Applying...
                                </>
                            ) : (
                                'Apply changes'
                            )}
                        </button>
                    </div>
                    <div className="bg-grayscale-50 rounded-xl p-4 border border-grayscale-200">
                        <ManifestDiffPanel diff={manifestDiff} />
                    </div>
                </div>
            )}

            {!isDesktop && (
                <div className="bg-white rounded-2xl border border-grayscale-300 p-6 mb-6 shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-grayscale-900 mb-1">
                            Try your app
                        </h3>
                        <p className="text-sm text-grayscale-600">
                            Run it inside LearnCard to make sure everything works.
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

            <div className="bg-white rounded-[20px] border border-grayscale-200 p-6 mb-6">
                <h2 className="text-base font-semibold text-grayscale-900 mb-5">Your listing</h2>
                <div className="flex items-start gap-5 mb-5">
                    <div
                        ref={iconFieldRef}
                        tabIndex={-1}
                        className="flex flex-col items-center gap-1.5 w-20 shrink-0 outline-none"
                    >
                        <div
                            className="relative group cursor-pointer w-16 h-16"
                            onClick={handleIconUpload}
                        >
                            {isIconUploading ? (
                                <div className="w-16 h-16 rounded-2xl bg-grayscale-100 border border-grayscale-200 flex items-center justify-center">
                                    <IonSpinner
                                        name="crescent"
                                        className="w-6 h-6 text-grayscale-500"
                                    />
                                </div>
                            ) : displayIconUrl ? (
                                <img
                                    src={displayIconUrl}
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
                            {isIconImported && (
                                <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm animate-fade-in-up">
                                    <IonIcon icon={checkmarkOutline} className="w-3 h-3 block" />
                                </div>
                            )}
                        </div>
                        {!uploadedIconUrl && !isIconImported && (
                            <span className="text-[10px] text-grayscale-500 text-center leading-tight">
                                Tap to upload your icon
                            </span>
                        )}
                        {isIconImported && (
                            <span className="text-[10px] text-emerald-600 font-medium animate-fade-in-up text-center leading-tight">
                                Icon imported
                            </span>
                        )}
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-grayscale-700 mb-1.5">
                            App Name
                        </label>
                        <input
                            ref={nameInputRef}
                            type="text"
                            value={appName}
                            maxLength={50}
                            onChange={e => {
                                hasEditedListingRef.current = true;
                                setAppName(e.target.value);
                            }}
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
                        ref={taglineInputRef}
                        type="text"
                        value={tagline}
                        maxLength={100}
                        onChange={e => {
                            hasEditedListingRef.current = true;
                            setTagline(e.target.value);
                        }}
                        className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                        placeholder="One sentence about your app"
                    />
                </div>

                <div className="mt-5">
                    <ListingDetailsFields
                        details={listingDetails}
                        onChange={updateDetails}
                        descriptionRef={descriptionInputRef}
                    />
                </div>
            </div>

            <div className="mb-6">
                <StandOutSection
                    details={listingDetails}
                    onChange={updateDetails}
                    contactEmailRef={contactEmailInputRef}
                />
            </div>

            {(integrationHints.length > 0 || showConsentSetup) && (
                <div className="mb-6 space-y-3">
                    {integrationHints.map(hint => {
                        if (hint.type === 'consent-not-configured') {
                            return (
                                <ConsentDesignerCard
                                    key={hint.type}
                                    appName={appName}
                                    onEnable={handleEnableConsent}
                                    onDismiss={() => dismissHint(hint.type)}
                                    enabledScopes={designerConsentScopes}
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
                                        onClick={() => handleCopySnippet(hint.snippet, hint.type)}
                                        className="absolute top-2 right-2 py-1.5 px-3 rounded-[20px] border border-grayscale-300 bg-white text-grayscale-700 font-medium text-xs hover:bg-grayscale-10 transition-colors flex items-center gap-1.5 shadow-sm"
                                    >
                                        {copiedHint === hint.type ? (
                                            <>
                                                <IonIcon
                                                    icon={checkmarkOutline}
                                                    className="w-3.5 h-3.5 text-emerald-500"
                                                />
                                                Copied
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

                    {showConsentSetup && (
                        <div>
                            {showConsentDesigner || designerConsentScopes ? (
                                <ConsentDesignerCard
                                    appName={appName}
                                    onEnable={handleEnableConsent}
                                    onDismiss={() => {
                                        setShowConsentDesigner(false);
                                        setDesignerConsentScopes(null);
                                        setDesignerConsentKey(null);
                                        sessionStorage.removeItem('lc-submit-designer-key');
                                        sessionStorage.removeItem('lc-submit-designer-scopes');
                                    }}
                                    enabledScopes={designerConsentScopes}
                                />
                            ) : (
                                <div className="bg-white rounded-[20px] border border-grayscale-200 p-5 flex items-center justify-between gap-4">
                                    <div>
                                        <h4 className="text-sm font-semibold text-grayscale-900 mb-1">
                                            Choose what your app asks for
                                        </h4>
                                        <p className="text-xs text-grayscale-600">
                                            Your app asks people for permission, but hasn't said
                                            what for yet.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowConsentDesigner(true)}
                                        type="button"
                                        className="shrink-0 text-sm font-medium text-grayscale-900 hover:underline flex items-center gap-1"
                                    >
                                        Set It Up{' '}
                                        <IonIcon icon={arrowForwardOutline} className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <AppCapabilitiesSummary lines={describeManifest(manifest)} isWatching={isLive}>
                {capabilityRows.length > 0 && (
                    <div className="space-y-4">
                        {capabilityRows.map(row => (
                            <div key={row.id} className="flex items-start gap-3" title={row.title}>
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500 ${
                                        row.highlight
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : 'bg-grayscale-100 text-grayscale-700'
                                    }`}
                                >
                                    <IonIcon icon={row.icon} className="w-4 h-4" />
                                </div>
                                <div className="pt-1.5">
                                    <div className="text-sm text-grayscale-800 leading-tight">
                                        {row.text}
                                    </div>
                                    {row.subNode}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {manifest.permissions.length > 0 && (
                    <div
                        className={`rounded-2xl border p-4 transition-colors duration-500 ${
                            recentlyCaptured.has('permissions')
                                ? 'border-emerald-400 ring-1 ring-emerald-400'
                                : 'border-grayscale-200'
                        }`}
                    >
                        <h4 className="text-xs font-medium text-grayscale-700 mb-3">
                            What it can do in LearnCard
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {manifest.permissions.map(permission => (
                                <span
                                    key={permission}
                                    className="px-2.5 py-1 bg-grayscale-100 text-grayscale-700 rounded-full text-xs font-medium"
                                >
                                    {getPermissionLabel(permission)}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {manifest.templates.length > 0 && (
                    <div
                        className={`rounded-2xl border p-4 transition-colors duration-500 ${
                            recentlyCaptured.has('templates')
                                ? 'border-emerald-400 ring-1 ring-emerald-400'
                                : 'border-grayscale-200'
                        }`}
                    >
                        <h4 className="text-xs font-medium text-grayscale-700 mb-1">
                            Credentials it gives out
                        </h4>
                        <p className="text-xs text-grayscale-500 mb-3">
                            Set up automatically the first time your app sends one.
                        </p>
                        <div className="space-y-2">
                            {manifest.templates.map(t => (
                                <div
                                    key={t.alias}
                                    className="p-3 bg-grayscale-10 rounded-xl border border-grayscale-200"
                                >
                                    <div className="font-medium text-sm text-grayscale-900">
                                        {'name' in t.template ? t.template.name : t.alias}
                                    </div>
                                    {'achievementType' in t.template &&
                                        t.template.achievementType && (
                                            <div className="text-xs text-grayscale-500 mt-0.5">
                                                {t.template.achievementType}
                                            </div>
                                        )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {manifest.consentRequests.length > 0 && (
                    <div
                        className={`rounded-2xl border p-4 transition-colors duration-500 ${
                            recentlyCaptured.has('consentRequests')
                                ? 'border-emerald-400 ring-1 ring-emerald-400'
                                : 'border-grayscale-200'
                        }`}
                    >
                        <h4 className="text-xs font-medium text-grayscale-700 mb-3">
                            What it asks permission for
                        </h4>
                        <div className="space-y-2">
                            {manifest.consentRequests.map((c, i) => (
                                <div
                                    key={i}
                                    className="p-3 bg-grayscale-10 rounded-xl border border-grayscale-200"
                                >
                                    {c.reason && (
                                        <div className="text-sm text-grayscale-900 mb-2">
                                            "{c.reason}"
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            ...c.scopes.read.personalFields.map(
                                                field => PERSONAL_FIELD_LABELS[field] || field
                                            ),
                                            ...c.scopes.read.credentialCategories,
                                        ].map(item => (
                                            <span
                                                key={item}
                                                className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs flex items-center gap-1"
                                            >
                                                <IonIcon
                                                    icon={shieldCheckmarkOutline}
                                                    className="w-3 h-3"
                                                />
                                                Read {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </AppCapabilitiesSummary>

            {!isDesktop && (
                <div className="mt-6">
                    <h3 className="text-base font-semibold text-grayscale-900 mb-3">
                        How it looks in the store
                    </h3>
                    <StoreListingPreview
                        name={listingData.name}
                        tagline={listingData.tagline}
                        description={listingData.description}
                        iconUrl={displayIconUrl || listingData.iconUrl}
                        category={listingData.category}
                        ageRating={listingData.ageRating}
                        screenshots={listingData.screenshots}
                        highlights={listingData.highlights}
                        heroColor={listingData.heroColor}
                    />
                </div>
            )}

            <div
                className="sticky bottom-0 z-10 -mx-1 mt-6 px-1 pt-3 bg-gradient-to-t from-white via-white to-white/0"
                style={{ paddingBottom: 'calc(1rem + var(--ion-safe-area-bottom, 0px))' }}
            >
                <div className="flex items-center gap-4 p-4 bg-white rounded-[20px] border border-grayscale-200 shadow-lg">
                    <div className="flex-1 min-w-0 text-sm">
                        {existingListingStatus ? (
                            <span className="text-grayscale-600">
                                Changes to the listing live on your app's page.
                            </span>
                        ) : showMissingHint && missingField ? (
                            <button
                                type="button"
                                onClick={() => focusField(missingField.field)}
                                className="text-left font-medium text-grayscale-900 hover:underline"
                            >
                                {missingField.message}
                            </button>
                        ) : (
                            <span
                                className={
                                    saveState === 'error' ? 'text-red-600' : 'text-grayscale-500'
                                }
                            >
                                {saveStatusText[saveState]}
                            </span>
                        )}
                    </div>
                    {existingListingStatus ? (
                        <button
                            type="button"
                            onClick={() =>
                                previewIntegrationId &&
                                history.push(
                                    `/app-store/developer/integrations/${previewIntegrationId}`
                                )
                            }
                            className="py-3 px-5 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                        >
                            Go to Your App
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="py-3 px-5 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Submitting…
                                </>
                            ) : (
                                'Submit for Review'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    const tabClass = (active: boolean): string =>
        `py-1.5 px-3 rounded-full text-xs font-medium transition-colors ${
            active ? 'bg-grayscale-900 text-white' : 'text-grayscale-700 hover:bg-grayscale-200'
        }`;

    const rightPaneContent = isDesktop && (
        <div className="sticky top-0 h-[calc(100vh-80px)] py-6 pr-6 pl-2 flex flex-col">
            <div className="flex-1 rounded-[20px] border border-grayscale-200 bg-white shadow-sm overflow-hidden flex flex-col">
                <div className="h-12 border-b border-grayscale-200 bg-grayscale-10 flex items-center justify-between px-3 shrink-0">
                    <div className="flex items-center gap-1 p-1 bg-grayscale-100 rounded-full">
                        <button
                            type="button"
                            onClick={() => setRightPaneTab('store')}
                            className={tabClass(rightPaneTab === 'store')}
                        >
                            Store preview
                        </button>
                        <button
                            type="button"
                            onClick={() => setRightPaneTab('try')}
                            className={tabClass(rightPaneTab === 'try')}
                        >
                            Try your app
                        </button>
                    </div>
                    {isLive && rightPaneTab === 'try' && (
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Watching
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsLive(false)}
                                className="text-xs font-medium text-grayscale-600 hover:text-grayscale-900 transition-colors"
                            >
                                Stop
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-1 relative bg-grayscale-100">
                    {rightPaneTab === 'store' && (
                        <div className="absolute inset-0 overflow-y-auto p-6 animate-fade-in-up">
                            <StoreListingPreview
                                name={listingData.name}
                                tagline={listingData.tagline}
                                description={listingData.description}
                                iconUrl={displayIconUrl || listingData.iconUrl}
                                category={listingData.category}
                                ageRating={listingData.ageRating}
                                screenshots={listingData.screenshots}
                                highlights={listingData.highlights}
                                heroColor={listingData.heroColor}
                            />
                        </div>
                    )}
                    {isLive && (
                        <div
                            className={`absolute inset-0 ${rightPaneTab === 'try' ? '' : 'hidden'}`}
                        >
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
                                launchFeaturesInNewTab={true}
                            />
                        </div>
                    )}
                    {!isLive && rightPaneTab === 'try' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-white border border-grayscale-200 flex items-center justify-center mb-4">
                                <IonIcon
                                    icon={playOutline}
                                    className="w-7 h-7 text-grayscale-700 ml-1"
                                />
                            </div>
                            <h3 className="text-lg font-semibold text-grayscale-900 mb-2">
                                Try your app
                            </h3>
                            <p className="text-sm text-grayscale-600 mb-6 max-w-xs">
                                Run it inside LearnCard to make sure everything works. We'll notice
                                anything new it uses.
                            </p>
                            <button
                                type="button"
                                onClick={handlePreview}
                                disabled={isPreviewing || !appName}
                                className="flex items-center gap-2 py-3 px-6 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isPreviewing ? (
                                    <>
                                        <IonSpinner name="crescent" className="w-4 h-4" />
                                        Starting…
                                    </>
                                ) : (
                                    <>
                                        <IonIcon icon={playOutline} className="w-4 h-4" />
                                        Start
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
