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
            {isMobile && (
                <IonHeader className="ion-no-border">
                    <IonToolbar color="grayscale-100">
                        <div className="flex items-center justify-start px-4 gap-2">
                            <button
                                aria-label="Go back"
                                onClick={() => {
                                    history.goBack();
                                }}
                            >
                                <LeftArrow className="w-7 h-auto text-grayscale-900" />
                            </button>

                            <p className="text-grayscale-900 font-semibold">Resume Builder</p>
                        </div>
                    </IonToolbar>
                </IonHeader>
            )}
            <IonContent fullscreen className="ion-no-padding">
                <div className="h-full w-full">
                    <ResumeBuilder />
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ResumeBuilderPage;
