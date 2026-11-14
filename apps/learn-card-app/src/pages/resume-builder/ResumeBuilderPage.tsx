import React from 'react';

import { IonPage } from '@ionic/react';
import ResumeBuilder from '../../components/resume-builder/ResumeBuilder';

import { useExistingResumes } from '../../hooks/useExistingResumes';

const ResumeBuilderPage: React.FC = () => {
    useExistingResumes();

    return (
        <IonPage>
            <ResumeBuilder />
        </IonPage>
    );
};

export default ResumeBuilderPage;
