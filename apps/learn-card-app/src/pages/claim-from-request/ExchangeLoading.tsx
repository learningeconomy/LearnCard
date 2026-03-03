import { IonContent, IonPage, IonSpinner } from '@ionic/react';

const ExchangeLoading = () => {
    return (
        <IonPage>
            <IonContent fullscreen>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        textAlign: 'center',
                    }}
                >
                    <IonSpinner name="crescent" />
                    <p style={{ marginTop: '1rem' }}>Loading...</p>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ExchangeLoading;