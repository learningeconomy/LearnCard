import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonTextarea,
    IonButton,
    IonButtons,
    IonLoading,
    IonToast,
    IonText,
    IonCol,
    IonRow,
    IonPage,
} from '@ionic/react';
import MiniGhost from 'learn-card-base/assets/images/ghostboost.png';

interface BoostDescriptionInputProps {
    onSubmit: (description: string) => Promise<void>;
    onCancel: () => void;
    initialDescription?: string;
    title: string;
    subtext: string;
}

const BoostDescriptionInput: React.FC<BoostDescriptionInputProps> = ({
    onSubmit,
    onCancel,
    initialDescription = '',
    title,
    subtext,
}) => {
    const [description, setDescription] = useState(initialDescription);
    const [isLoading, setIsLoading] = useState(false);
    const [showErrorToast, setShowErrorToast] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        setDescription(initialDescription);
    }, [initialDescription]);

    const handleSubmit = async () => {
        if (description.trim()) {
            setIsLoading(true);
            try {
                await onSubmit(description.trim());
            } catch (error) {
                console.error('Error generating boost details:', error);
                setErrorMessage('An unexpected error occurred. Please try again.');
                setShowErrorToast(true);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <IonContent className="bg-indigo-500" color="indigo-500">
            <IonHeader className="ion-no-border bg-indigo-500 pt-5">
                <IonToolbar color="#fffff">
                    <IonRow className="flex flex-col pb-4">
                        <IonCol className="w-full flex items-center justify-center mt-8">
                            <h6 className="flex items-center justify-center text-white font-poppins font-medium text-xl tracking-wide">
                                {title}
                            </h6>
                        </IonCol>
                    </IonRow>
                    <IonRow className="flex items-center justify-center w-full">
                        <IonCol className="text-center">
                            <p className="text-center text-sm font-semibold px-[16px] text-white">
                                {subtext}
                            </p>
                        </IonCol>
                    </IonRow>
                    <IonRow className="flex items-center justify-center w-full mt-4 mb-[20px]">
                        <IonCol className="text-center">
                            <div className="relative flex flex-col items-center justify-center p-4 pb-0 rounded-3xl flex-1">
                                <div className="absolute top-0 left-[%50] w-[170px] h-[170px] bg-indigo-800 rounded-full" />
                                <img
                                    src={MiniGhost}
                                    alt="ghost"
                                    className="z-50 w-[200px] h-[170px] mt-[-35px]"
                                />
                            </div>
                        </IonCol>
                    </IonRow>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding bg-indigo-800">
                <div className="w-full max-w-md mx-auto">
                    {' '}
                    {/* Ensure full width on mobile with w-full */}
                    <IonTextarea
                        value={description}
                        onIonInput={e => setDescription(e.detail.value!)}
                        placeholder="Describe the boost you want to make."
                        rows={6}
                        className="ion-padding bg-indigo-800 text-white rounded-md"
                        style={{ '--min-width': '385px', '--max-width': '385px' }} // Ionic's custom properties
                    />
                    <IonButton
                        expand="block"
                        onClick={handleSubmit}
                        disabled={!description.trim() || isLoading}
                        className="mt-4"
                    >
                        {isLoading ? 'Generating...' : 'Generate Boost'}
                    </IonButton>
                    <IonButton
                        expand="block"
                        onClick={onCancel}
                        className="mt-2 bg-indigo-800 text-white"
                    >
                        Go Back
                    </IonButton>
                    <IonLoading isOpen={isLoading} message="Generating boost details..." />
                    <IonToast
                        isOpen={showErrorToast}
                        onDidDismiss={() => setShowErrorToast(false)}
                        message={errorMessage}
                        duration={5000}
                        position="bottom"
                        color="white"
                    />
                </div>
            </IonContent>
        </IonContent>
    );
};

export default BoostDescriptionInput;
