import { IonContent, IonPage } from '@ionic/react';
import { AppSpinner } from '../../components/feedback/AppSpinner';
import * as m from '../../paraglide/messages.js';

const ExchangeLoading = () => {
    return (
        <IonPage>
            <IonContent fullscreen>
                <div className="min-h-full bg-grayscale-100 flex flex-col items-center justify-center p-4 font-poppins">
                    <AppSpinner name="crescent" className="text-emerald-600 w-8 h-8 mb-4" />
                    <p className="text-sm text-grayscale-600 font-medium">
                        {m['common.loading']()}
                    </p>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ExchangeLoading;
