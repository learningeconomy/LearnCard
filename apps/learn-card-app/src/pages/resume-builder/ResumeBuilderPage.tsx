import React from 'react';
import { IonContent, IonPage } from '@ionic/react';
import ResumeBuilder from '../../components/resume-builder/ResumeBuilder/ResumeBuilder';

const ResumeBuilderPage: React.FC = () => {
    return (
        <IonPage>
            <IonContent fullscreen className="ion-no-padding">
                <div className="h-full w-full">
                    <ResumeBuilder />
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ResumeBuilderPage;
