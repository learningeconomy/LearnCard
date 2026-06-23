import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import * as m from '../../paraglide/messages.js';

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
                    <p style={{ marginTop: '1rem' }}>{m['common.loading']()}</p>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ExchangeLoading;
