import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSpinner,
    IonButton,
    IonCard,
    IonCardContent,
    IonIcon,
    IonText,
    IonGrid,
    IonRow,
    IonCol,
} from '@ionic/react';
import {
    refreshOutline,
    homeOutline,
    alertCircleOutline,
    informationCircleOutline,
} from 'ionicons/icons';
import { getAppBaseUrl, getLCNApiUrl } from '../../config/bootstrapTenantConfig';

/**
 * Parse the interaction URL to extract workflowId and interactionId.
 * URL format: /interactions/{workflowId}/{interactionId}
 * Example: /interactions/claim/eyJib29zdFVyaSI6...?iuv=1
 */
const parseInteractionUrl = (url: string): { workflowId: string; interactionId: string } | null => {
    // Match '/interactions/{workflowId}/{interactionId}' where interactionId is base64url
    const match = url.match(/\/interactions\/([a-zA-Z0-9-]+)\/([a-zA-Z0-9\-_=]+)(?:\?.*)?$/);

    if (match && match[1] && match[2]) {
        return {
            workflowId: match[1],
            interactionId: match[2],
        };
    }
    return null;
};

/**
 * Check if running on localhost (dev environment without edge function)
 */
const isLocalhost = (): boolean => {
    const baseUrl = getAppBaseUrl();
    return baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
};

const InteractionsPage: React.FC = () => {
    const location = useLocation();
    const history = useHistory();

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInteractionDetails = useCallback(async () => {
        setLoading(true);
        setError(null);

        const currentPath = location.pathname;
        const currentSearch = location.search;
        const appURL = getAppBaseUrl();
        const fullUrl = `${appURL}${currentPath}${currentSearch}`;

        const queryParams = new URLSearchParams(currentSearch);

        if (queryParams.get('iuv') !== '1') {
            setError('Invalid interaction link: Missing required parameters.');
            setLoading(false);
            return;
        }

        // Parse the URL to extract workflowId and interactionId
        const parsed = parseInteractionUrl(fullUrl);
        if (!parsed) {
            setError('Invalid interaction URL format.');
            setLoading(false);
            return;
        }

        const { workflowId, interactionId } = parsed;
        const lcnApiUrl = getLCNApiUrl();
        const vcapiUrl = `${lcnApiUrl}/workflows/${workflowId}/exchanges/${interactionId}`;

        // On localhost, there's no edge function to handle content negotiation
        // so we redirect directly to the request page
        if (isLocalhost()) {
            history.replace(`/request?vc_request_url=${encodeURIComponent(vcapiUrl)}`);
            return;
        }

        // On Netlify (production), the edge function handles this:
        // - JSON requests get protocol info
        // - HTML requests get redirected
        // But since we're in the SPA, the edge function already redirected us here
        // or we need to fetch the JSON if we came via a different path
        try {
            const response = await fetch(fullUrl, {
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch interaction details. Status: ${response.status}`);
            }

            const data = await response.json();

            if (data && data.protocols && typeof data.protocols.vcapi === 'string') {
                // Successfully fetched vcapi URL, redirect
                history.replace(
                    `/request?vc_request_url=${encodeURIComponent(data.protocols.vcapi)}`
                );
            } else {
                throw new Error('Invalid interaction data received from the server.');
            }
        } catch (e: any) {
            console.error('Error fetching interaction details:', e);
            setError(e.message || 'An unknown error occurred while processing the interaction.');
            setLoading(false);
        }
    }, [location, history]);

    useEffect(() => {
        fetchInteractionDetails();
    }, [fetchInteractionDetails]); // fetchInteractionDetails is memoized with useCallback

    const handleTryAgain = () => {
        fetchInteractionDetails();
    };

    const handleGoHome = () => {
        history.push('/home'); // Or your app's main/home route
    };

    if (loading) {
        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Interaction</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent fullscreen className="ion-padding">
                    <IonGrid style={{ height: '100%' }}>
                        <IonRow
                            className="ion-justify-content-center ion-align-items-center"
                            style={{ height: '100%' }}
                        >
                            <IonCol size="auto">
                                <IonSpinner
                                    name="crescent"
                                    style={{ width: '50px', height: '50px' }}
                                />
                                <IonText color="medium">
                                    <p className="ion-text-center ion-margin-top">
                                        Processing interaction...
                                    </p>
                                </IonText>
                            </IonCol>
                        </IonRow>
                    </IonGrid>
                </IonContent>
            </IonPage>
        );
    }

    if (error) {
        return (
            <IonPage>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Interaction Error</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent fullscreen className="ion-padding">
                    <IonGrid style={{ height: '100%' }}>
                        <IonRow
                            className="ion-justify-content-center ion-align-items-center"
                            style={{ height: '100%' }}
                        >
                            <IonCol sizeXs="12" sizeSm="10" sizeMd="8" sizeLg="6">
                                <IonCard color="light" className="ion-padding">
                                    <IonCardContent className="ion-text-center">
                                        <IonIcon
                                            icon={alertCircleOutline}
                                            color="danger"
                                            style={{ fontSize: '48px', marginBottom: '16px' }}
                                        />
                                        <IonTitle
                                            color="danger"
                                            style={{ fontSize: '1.5rem', fontWeight: 'bold' }}
                                        >
                                            Interaction Error
                                        </IonTitle>
                                        <IonText
                                            color="medium"
                                            className="ion-margin-top ion-margin-bottom"
                                        >
                                            <p>{error}</p>
                                        </IonText>
                                        <IonButton
                                            expand="block"
                                            onClick={handleTryAgain}
                                            className="ion-margin-top"
                                        >
                                            <IonIcon slot="start" icon={refreshOutline} />
                                            Try Again
                                        </IonButton>
                                        <IonButton
                                            expand="block"
                                            color="medium"
                                            fill="outline"
                                            onClick={handleGoHome}
                                            className="ion-margin-top"
                                        >
                                            <IonIcon slot="start" icon={homeOutline} />
                                            Go to Home
                                        </IonButton>
                                    </IonCardContent>
                                </IonCard>
                            </IonCol>
                        </IonRow>
                    </IonGrid>
                </IonContent>
            </IonPage>
        );
    }

    // This state should ideally not be reached if redirection is working,
    // but as a fallback or if redirection is slightly delayed:
    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Interaction</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen className="ion-padding">
                <IonGrid style={{ height: '100%' }}>
                    <IonRow
                        className="ion-justify-content-center ion-align-items-center"
                        style={{ height: '100%' }}
                    >
                        <IonCol size="auto">
                            <IonIcon
                                icon={informationCircleOutline}
                                color="primary"
                                style={{ fontSize: '48px' }}
                            />
                            <IonText color="medium">
                                <p className="ion-text-center ion-margin-top">
                                    Finalizing interaction...
                                </p>
                            </IonText>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default InteractionsPage;
