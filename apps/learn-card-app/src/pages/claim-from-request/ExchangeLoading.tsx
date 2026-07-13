import { IonContent, IonPage, IonSpinner } from '@ionic/react';

const ExchangeLoading = () => {
    return (
        <IonPage>
            <IonContent fullscreen>
                <div className="min-h-full bg-grayscale-100 flex flex-col items-center justify-center p-4 font-poppins">
                    <IonSpinner name="crescent" className="text-emerald-600 w-8 h-8 mb-4" />
                    <p className="text-sm text-grayscale-600 font-medium">Loading...</p>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ExchangeLoading;
