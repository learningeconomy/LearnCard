import React, { useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

import { useModal } from 'learn-card-base';
import { IonPage, IonContent, IonToast, IonHeader, IonToolbar } from '@ionic/react';

import { useLearnCardPostMessage } from '../../hooks/post-message/useLearnCardPostMessage';
import { useLearnCardMessageHandlers } from '../../hooks/post-message/useLearnCardMessageHandlers';
import { CredentialClaimModal } from './CredentialClaimModal';

interface LaunchConfig {
    url?: string;
    permissions?: string[];
    [key: string]: unknown;
}

interface EmbedIframeModalProps {
    embedUrl: string;
    appId?: string | number;
    appName?: string;
    launchConfig?: LaunchConfig;
    isInstalled?: boolean;
    hideFullScreenButton?: boolean;
}

export const EmbedIframeModal: React.FC<EmbedIframeModalProps> = ({
    embedUrl,
    appId,
    appName = 'Partner App',
    launchConfig,
    isInstalled = false,
    hideFullScreenButton = false,
}) => {
    const { closeModal } = useModal();
    const history = useHistory();
    const [showErrorToast, setShowErrorToast] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);

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

    const handleFullScreen = () => {
        // Close the modal first
        closeModal();

        // Navigate to the full-screen route with state
        history.push(`/apps/${appId || 'preview'}`, {
            embedUrl,
            appName,
            launchConfig,
            isInstalled,
        });
    };

    // Extract origin from embedUrl for security
    const embedOrigin = React.useMemo(() => {
        try {
            const url = new URL(embedUrl);
            return url.origin;
        } catch (error) {
            console.error('[PostMessage] Invalid embedUrl:', embedUrl);
            setErrorMessage(`Invalid embed URL: ${embedUrl}`);
            setShowErrorToast(true);
            return '';
        }
    }, [embedUrl]);

    // Use shared handlers
    const handlers = useLearnCardMessageHandlers({
        embedOrigin,
        onNavigate: closeModal,
        launchConfig,
        isInstalled,
        appId: appId?.toString(),
        onCredentialIssued: handleCredentialIssued,
    });

    // Initialize the PostMessage listener with trusted origins
    useLearnCardPostMessage({
        trustedOrigins: embedOrigin ? [embedOrigin] : [],
        handlers,
        debug: false, // Disable detailed logging
    });

    const embedUrlWithOverride = `${embedUrl}?lc_host_override=${window.location.origin}`;

    return (
        <IonPage className="h-full w-full">
            <IonHeader>
                <IonToolbar>
                    <div className="flex items-center justify-between px-4 py-2 bg-white border-b">
                        <h2 className="text-xl font-semibold">{appName}</h2>
                        <div className="flex items-center gap-2">
                            {!hideFullScreenButton && !Capacitor.isNativePlatform() && (
                                <button
                                    onClick={handleFullScreen}
                                    className="px-4 py-2 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium flex items-center gap-2"
                                    title="Open in full screen"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                                        />
                                    </svg>
                                    Full Screen
                                </button>
                            )}
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 rounded-full bg-gray-200 hover:bg-gray-300 font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <div className="w-full h-full flex-1">
                    <div className="relative w-full h-full flex-1">
                        {isLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 z-10">
                                <div className="flex flex-col items-center gap-4">
                                    {/* Animated spinner */}
                                    <div className="relative">
                                        <div className="w-16 h-16 border-4 border-indigo-200 rounded-full"></div>
                                        <div className="w-16 h-16 border-4 border-indigo-600 rounded-full border-t-transparent absolute top-0 left-0 animate-spin"></div>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-semibold text-grayscale-800">
                                            Loading {appName}...
                                        </p>
                                        <p className="text-sm text-grayscale-600 mt-1">
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
                            title={`${appName} - Modal View`}
                        />
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

export default EmbedIframeModal;
