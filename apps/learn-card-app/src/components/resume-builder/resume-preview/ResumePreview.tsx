import React, { useMemo } from 'react';

import ResumePreviewUserInfo from './ResumePreviewUserInfo';
import ResumePreviewCredentialToTextBlock from './ResumePreviewCredentialToTextBlock';
import ResumePreviewEmptyPlaceholder from './ResumePreviewEmptyPlaceholder';

import { RESUME_SECTIONS, ResumeSectionKey } from '../resume-builder.helpers';
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
                const sectionKey = section.key as ResumeSectionKey;
                const entries = [...(credentialEntries[sectionKey] ?? [])].sort(
                    (a, b) => a.index - b.index
                );
                if (!entries.length) return null;

                return (
                    <div key={section.key} className="mb-6">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-grayscale-500 mb-3 border-b border-grayscale-100 pb-1">
                            {section.label}
                        </h2>
                        {/* credentials selected converted to resume text block */}
                        <div className="flex flex-col gap-3">
                            {entries.map(entry => (
                                <ResumePreviewCredentialToTextBlock
                                    key={entry.uri}
                                    uri={entry.uri}
                                    section={sectionKey}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ResumePreview;
