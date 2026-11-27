import React from 'react';

import ResumeBuilder from '../../components/resume-builder/ResumeBuilder';

import { useExistingResumes } from '../../hooks/useExistingResumes';
import { AppPage } from '../../components/chrome';

const ResumeBuilderPage: React.FC = () => {
    useExistingResumes();

    return (
        <AppPage>
            <ResumeBuilder />
        </AppPage>
    );
};

export default ResumeBuilderPage;
