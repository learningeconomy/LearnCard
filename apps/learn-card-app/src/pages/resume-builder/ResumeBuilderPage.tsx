import React from 'react';
import { useHistory } from 'react-router-dom';

import { IonContent, IonPage, IonHeader, IonToolbar } from '@ionic/react';
import ResumeBuilder from '../../components/resume-builder/ResumeBuilder';
import LeftArrow from 'learn-card-base/svgs/LeftArrow';
import { useDeviceTypeByWidth } from 'learn-card-base';

const ResumeBuilderPage: React.FC = () => {
    const history = useHistory();

    const { isMobile } = useDeviceTypeByWidth();

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
