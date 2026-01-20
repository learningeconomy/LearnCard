import React from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { IonPage, IonContent, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle } from '@ionic/react';

import { useLearnCardPostMessage } from '../../hooks/post-message/useLearnCardPostMessage';
import { useLearnCardMessageHandlers } from '../../hooks/post-message/useLearnCardMessageHandlers';

interface EmbedAppParams {
    appId: string;
}

/**
 * Full-screen dedicated page for embedded partner applications.
 * 
 * Accessible via:
 * - /apps/:appId?embedUrl=https://example.com&appName=My App (query params)
 * - /apps/:appId with embedUrl and appName in location state
 * 
 * Query params take precedence over location state.
 */
interface LaunchConfig {
    url?: string;
    permissions?: string[];
    [key: string]: unknown;
}

export const EmbedAppFullScreen: React.FC = () => {
    const history = useHistory<{ embedUrl?: string; appName?: string; launchConfig?: LaunchConfig; isInstalled?: boolean }>();
    const { appId } = useParams<EmbedAppParams>();
    const [isLoading, setIsLoading] = React.useState(true);

    // Get embedUrl and appName from query params or location state
    const queryParams = React.useMemo(() => new URLSearchParams(history.location.search), [history.location.search]);
    
    const embedUrl = queryParams.get('embedUrl') || history.location.state?.embedUrl;
    const appName = queryParams.get('appName') || history.location.state?.appName || 'Partner App';
    const launchConfig = history.location.state?.launchConfig;
    const isInstalled = history.location.state?.isInstalled ?? false;

    // Redirect back if no embedUrl provided
    React.useEffect(() => {
        if (!embedUrl) {
            console.error('[EmbedApp] No embedUrl provided in query params or state, redirecting back');
            history.goBack();
        }
    }, [embedUrl, history]);

    // Extract origin from embedUrl for security
    const embedOrigin = React.useMemo(() => {
        if (!embedUrl) return '';
        try {
            const url = new URL(embedUrl);
            return url.origin;
        } catch {
            console.error('[PostMessage] Invalid embedUrl:', embedUrl);
            return '';
        }
    }, [embedUrl]);

    // Use shared handlers
    const handlers = useLearnCardMessageHandlers({
        embedOrigin,
        launchConfig,
        isInstalled,
    });

    // Initialize the PostMessage listener with trusted origins
    useLearnCardPostMessage({
        trustedOrigins: embedOrigin ? [embedOrigin] : [],
        handlers,
        debug: false, // Disable detailed logging
    });

    if (!embedUrl) {
        return null; // Will redirect via useEffect
    }

    const embedUrlWithOverride = `${embedUrl}?lc_host_override=${window.location.origin}`;
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonButton onClick={() => history.goBack()}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </IonButton>
                    </IonButtons>
                    <IonTitle>{appName}</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <div className="relative w-full h-full">
                    {isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 z-10">
                            <div className="flex flex-col items-center gap-4">
                                {/* Animated spinner */}
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-indigo-200 rounded-full"></div>
                                    <div className="w-16 h-16 border-4 border-indigo-600 rounded-full border-t-transparent absolute top-0 left-0 animate-spin"></div>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-semibold text-grayscale-800">Loading {appName}...</p>
                                    <p className="text-sm text-grayscale-600 mt-1">Please wait</p>
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
                        title={`${appName} - Full Screen`}
                    />
                </div>
            </IonContent>
        </IonPage>
    );
};

export default EmbedAppFullScreen;
