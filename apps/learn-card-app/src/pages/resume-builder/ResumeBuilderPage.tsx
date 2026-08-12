import React from 'react';

import { IonContent, IonPage } from '@ionic/react';
import ResumeBuilder from '../../components/resume-builder/ResumeBuilder';

import { useExistingResumes } from '../../hooks/useExistingResumes';

const ResumeBuilderPage: React.FC = () => {
    useExistingResumes();

    return (
        <IonPage>
            <IonContent className="ion-no-padding">
                <div className="h-full w-full">
                    <ResumeBuilder />
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ResumeBuilderPage;
