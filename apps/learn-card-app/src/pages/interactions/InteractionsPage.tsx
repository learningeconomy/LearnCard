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
        const appURL = IS_PRODUCTION ? 'https://learncard.app' : 'http://localhost:8888';
        const fullUrl = `${appURL}${currentPath}${currentSearch}`;

        const queryParams = new URLSearchParams(currentSearch);

        if (queryParams.get('iuv') !== '1') {
            setError('Invalid interaction link: Missing required parameters.');
            setLoading(false);
            return;
        }

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
                // setLoading(false) might not be strictly necessary here due to immediate redirection
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
