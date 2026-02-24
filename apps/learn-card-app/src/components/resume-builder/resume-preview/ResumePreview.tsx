import React, { useMemo } from 'react';

import ResumePreviewUserInfo from './ResumePreviewUserInfo';
import ResumePreviewEmptyPlaceholder from './ResumePreviewEmptyPlaceholder';
import ResumePreviewGroupedCredentialsBlock from './ResumePreviewGroupedCredentialsBlock';

import { RESUME_SECTIONS } from '../resume-builder.helpers';
import { resumeBuilderStore } from '../../../stores/resumeBuilderStore';

const ResumePreview: React.FC = () => {
    const sectionOrder = resumeBuilderStore.useTracked.sectionOrder();
    const personalDetails = resumeBuilderStore.useTracked.personalDetails();
    const credentialEntries = resumeBuilderStore.useTracked.credentialEntries();

    const orderedSections = useMemo(() => {
        return sectionOrder
            .map(key => RESUME_SECTIONS.find(s => s.key === key))
            .filter(Boolean) as (typeof RESUME_SECTIONS)[number][];
    }, [sectionOrder]);

    const hasAnyContent = useMemo(() => {
        const hasPersonal = Object.values(personalDetails).some(v => v.trim());
        const hasCredentials = Object.values(credentialEntries).some(arr => arr && arr.length > 0);
        return hasPersonal || hasCredentials;
    }, [personalDetails, credentialEntries]);

    if (!hasAnyContent) {
        return <ResumePreviewEmptyPlaceholder />;
    }

    return (
        <div className="w-full max-w-[760px] mx-auto bg-white shadow-[0_4px_24px_rgba(0,0,0,0.10)] rounded-lg p-10 min-h-[1000px] font-sans">
            {/* Header */}
            <ResumePreviewUserInfo />

            {/* Sections */}
            {orderedSections.map(section => {
                return <ResumePreviewGroupedCredentialsBlock key={section.key} section={section} />;
            })}
        </div>
    );
};

export default ResumePreview;
