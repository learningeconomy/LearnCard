import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { IonPage, IonContent, IonToast } from '@ionic/react';
import { X, Maximize2, Play, AlertCircle } from 'lucide-react';

import { useModal } from 'learn-card-base';
import { useLearnCardPostMessage } from '../../../hooks/post-message/useLearnCardPostMessage';
import { useLearnCardMessageHandlers } from '../../../hooks/post-message/useLearnCardMessageHandlers';

import { DiagnosticsPanel, DiagnosticEvent, ACTION_TO_PERMISSION } from './DiagnosticsPanel';
import { CredentialClaimModal } from '../../launchPad/CredentialClaimModal';
import type {
    AppPermission,
    LaunchConfig as LocalLaunchConfig,
    ExtendedAppStoreListing,
} from '../types';
import { LAUNCH_TYPE_INFO } from '../types';

// LaunchConfig type compatible with useLearnCardMessageHandlers
interface LaunchConfig {
    url?: string;
    permissions?: string[];
    [key: string]: unknown;
}

interface AppPreviewModalProps {
    listing: ExtendedAppStoreListing;
    onClose?: () => void;
}

export const AppPreviewModal: React.FC<AppPreviewModalProps> = ({ listing, onClose }) => {
    const { closeModal } = useModal();
    const [showErrorToast, setShowErrorToast] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [diagnosticEvents, setDiagnosticEvents] = useState<DiagnosticEvent[]>([]);
    const [isDiagnosticsExpanded, setIsDiagnosticsExpanded] = useState(true);
    const eventIdCounter = useRef(0);

    // Credential claim modal state
    const [pendingCredential, setPendingCredential] = useState<{
        credentialUri: string;
        boostUri?: string;
    } | null>(null);

    const handleCredentialIssued = useCallback((credentialUri: string, boostUri?: string) => {
        setPendingCredential({ credentialUri, boostUri });
    }, []);

    const handleDismissClaimModal = useCallback(() => {
        setPendingCredential(null);
    }, []);

    // Parse launch config
    const launchConfig: LaunchConfig = useMemo(() => {
        try {
            return listing.launch_config_json ? JSON.parse(listing.launch_config_json) : {};
        } catch {
            return {};
        }
    }, [listing.launch_config_json]);

    const embedUrl = launchConfig.url || '';
    const requestedPermissions: AppPermission[] = (launchConfig.permissions ||
        []) as AppPermission[];

    // Check if this is an embeddable app type
    const isEmbeddable = listing.launch_type === 'EMBEDDED_IFRAME';

    // Extract origin from embedUrl for security
    const embedOrigin = useMemo(() => {
        if (!embedUrl) return '';
        try {
            const url = new URL(embedUrl);
            return url.origin;
        } catch (error) {
            console.error('[Preview] Invalid embedUrl:', embedUrl);
            setErrorMessage(`Invalid embed URL: ${embedUrl}`);
            setShowErrorToast(true);
            return '';
        }
    }, [embedUrl]);

    // Add diagnostic event
    const addDiagnosticEvent = useCallback(
        (action: string, payload?: unknown): string => {
            const id = `event-${++eventIdCounter.current}`;
            const permission = ACTION_TO_PERMISSION[action] || null;
            const authorized = permission ? requestedPermissions.includes(permission) : true;

            const event: DiagnosticEvent = {
                id,
                timestamp: new Date(),
                action,
                payload,
                permission,
                authorized,
                status: 'pending',
            };

            setDiagnosticEvents(prev => [event, ...prev]);
            return id;
        },
        [requestedPermissions]
    );

    // Update diagnostic event
    const updateDiagnosticEvent = useCallback((id: string, updates: Partial<DiagnosticEvent>) => {
        setDiagnosticEvents(prev =>
            prev.map(event => (event.id === id ? { ...event, ...updates } : event))
        );
    }, []);

    // Wrap handlers to intercept and log calls
    const baseHandlers = useLearnCardMessageHandlers({
        appId: listing.slug || listing.listing_id,
        embedOrigin,
        onNavigate: () => {
            closeModal();
            onClose?.();
        },
        launchConfig,
        isInstalled: true, // Preview mode - treat as installed
        onCredentialIssued: handleCredentialIssued,
    });

    // Create wrapped handlers that log diagnostics
    const wrappedHandlers = useMemo(() => {
        const wrapped: typeof baseHandlers = {};

        for (const [action, handler] of Object.entries(baseHandlers)) {
            wrapped[action as keyof typeof baseHandlers] = async (context: any) => {
                const eventId = addDiagnosticEvent(action, context.payload);

                try {
                    const result = await handler(context);
                    updateDiagnosticEvent(eventId, {
                        status: result.success ? 'success' : 'error',
                        response: result,
                        errorMessage: result.error?.message,
                    });
                    return result;
                } catch (error) {
                    updateDiagnosticEvent(eventId, {
                        status: 'error',
                        errorMessage: error instanceof Error ? error.message : 'Unknown error',
                    });
                    throw error;
                }
            };
        }

        return wrapped;
    }, [baseHandlers, addDiagnosticEvent, updateDiagnosticEvent]);

    console.log('wrappedHandlers', wrappedHandlers);
    console.log('baseHandlers', baseHandlers);

    // Initialize the PostMessage listener
    useLearnCardPostMessage({
        trustedOrigins: embedOrigin ? [embedOrigin] : [],
        handlers: wrappedHandlers,
        debug: true,
    });

    const handleClose = () => {
        closeModal();
        onClose?.();
    };

    const embedUrlWithOverride = embedUrl
        ? `${embedUrl}?lc_host_override=${window.location.origin}`
        : '';

    if (!isEmbeddable) {
        return (
            <IonPage className="h-full w-full">
                <IonContent fullscreen>
                    <div className="w-full h-full flex flex-col bg-gray-100">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 bg-white border-b">
                            <div className="flex items-center gap-3">
                                <img
                                    src={listing.icon_url}
                                    alt={listing.display_name}
                                    className="w-10 h-10 rounded-xl"
                                />
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-700">
                                        {listing.display_name}
                                    </h2>
                                    <span className="text-xs text-gray-500">Preview Mode</span>
                                </div>
                            </div>

                            <button
                                onClick={handleClose}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Non-embeddable message */}
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="max-w-md text-center">
                                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle className="w-8 h-8 text-amber-500" />
                                </div>

                                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                    Preview Not Available
                                </h3>

                                <p className="text-gray-500 mb-4">
                                    This app uses{' '}
                                    <strong>{LAUNCH_TYPE_INFO[listing.launch_type]?.label}</strong>{' '}
                                    launch type which cannot be previewed in an embedded view.
                                </p>

                                {launchConfig.url && (
                                    <a
                                        href={launchConfig.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                                    >
                                        <Play className="w-4 h-4" />
                                        Open App URL
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage className="h-full w-full">
            <IonContent fullscreen>
                <div className="w-full h-full flex flex-col bg-gray-100">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 bg-white border-b">
                        <div className="flex items-center gap-3">
                            <img
                                src={listing.icon_url}
                                alt={listing.display_name}
                                className="w-10 h-10 rounded-xl"
                            />
                            <div>
                                <h2 className="text-lg font-semibold text-gray-700">
                                    {listing.display_name}
                                </h2>
                                <span className="text-xs text-gray-500">Preview Mode</span>
                            </div>
                        </div>

                        <button
                            onClick={handleClose}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Iframe Container */}
                        <div className="flex-1 relative min-h-0">
                            {isLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 z-10">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="relative">
                                            <div className="w-16 h-16 border-4 border-indigo-200 rounded-full" />
                                            <div className="w-16 h-16 border-4 border-indigo-600 rounded-full border-t-transparent absolute top-0 left-0 animate-spin" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-semibold text-gray-800">
                                                Loading {listing.display_name}...
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Please wait
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <iframe
                                src={embedUrlWithOverride}
                                onLoad={() => setIsLoading(false)}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    border: 'none',
                                    display: 'block',
                                }}
                                title={`${listing.display_name} - Preview`}
                            />
                        </div>

                        {/* Diagnostics Panel */}
                        <div className="flex-shrink-0 border-t border-gray-300">
                            <DiagnosticsPanel
                                events={diagnosticEvents}
                                requestedPermissions={requestedPermissions}
                                isExpanded={isDiagnosticsExpanded}
                                onToggleExpand={() =>
                                    setIsDiagnosticsExpanded(!isDiagnosticsExpanded)
                                }
                            />
                        </div>
                    </div>
                </div>
            </IonContent>

            <IonToast
                isOpen={showErrorToast}
                onDidDismiss={() => setShowErrorToast(false)}
                message={errorMessage}
                duration={5000}
                position="bottom"
                color="danger"
            />

            {pendingCredential && (
                <CredentialClaimModal
                    credentialUri={pendingCredential.credentialUri}
                    boostUri={pendingCredential.boostUri}
                    onDismiss={handleDismissClaimModal}
                />
            )}
        </IonPage>
    );
};

export default AppPreviewModal;
