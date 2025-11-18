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
export const EmbedAppFullScreen: React.FC = () => {
    const history = useHistory<{ embedUrl?: string; appName?: string }>();
    const { appId } = useParams<EmbedAppParams>();

    // Get embedUrl and appName from query params or location state
    const queryParams = React.useMemo(() => new URLSearchParams(history.location.search), [history.location.search]);
    
    const embedUrl = queryParams.get('embedUrl') || history.location.state?.embedUrl;
    const appName = queryParams.get('appName') || history.location.state?.appName || 'Partner App';

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
    });

    // Initialize the PostMessage listener with trusted origins
    useLearnCardPostMessage({
        trustedOrigins: embedOrigin ? [embedOrigin] : [],
        handlers,
        debug: true, // Enable detailed logging
    });

    if (!embedUrl) {
        return null; // Will redirect via useEffect
    }

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
                <iframe
                    src={embedUrl}
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        display: 'block',
                    }}
                    title={`${appName} - Full Screen`}
                />
            </IonContent>
        </IonPage>
    );
};

export default EmbedAppFullScreen;
