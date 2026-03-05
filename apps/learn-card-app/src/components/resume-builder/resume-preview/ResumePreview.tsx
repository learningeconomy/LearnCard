import React, { useMemo, useRef, useImperativeHandle, forwardRef } from 'react';

import ResumePreviewUserInfo from './ResumePreviewUserInfo';
import ResumePreviewEmptyPlaceholder from './ResumePreviewEmptyPlaceholder';
import ResumePreviewGroupedCredentialsBlock from './ResumePreviewGroupedCredentialsBlock';
import useResumePdf from './useResumePdf';

import { RESUME_SECTIONS, ResumeSectionKey } from '../resume-builder.helpers';
import { resumeBuilderStore } from '../../../stores/resumeBuilderStore';

const LETTER_HEIGHT_PX = 1056; // US Letter at 96 DPI

export type ResumePreviewHandle = {
    createPDFPreviewUrl: () => Promise<string | null>;
    generatePDF: () => Promise<void>;
};

const ResumePreview = forwardRef<
    ResumePreviewHandle,
    { isMobile?: boolean; isPreviewing?: boolean }
>(function ResumePreview({ isMobile = false }, ref) {
    const sectionOrder = resumeBuilderStore.useTracked.sectionOrder();
    const personalDetails = resumeBuilderStore.useTracked.personalDetails();
    const credentialEntries = resumeBuilderStore.useTracked.credentialEntries();

    const previewCardRef = useRef<HTMLDivElement>(null);
    const { createPDFPreviewUrl, generatePDF } = useResumePdf(previewCardRef);

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

    useImperativeHandle(ref, () => ({
        createPDFPreviewUrl,
        generatePDF,
    }));

    if (!hasAnyContent) {
        return <ResumePreviewEmptyPlaceholder />;
    }

    const cardClasses = isMobile
        ? 'w-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] rounded-xl px-4 py-6 font-sans'
        : 'w-full max-w-[760px] mx-auto bg-white shadow-[0_4px_24px_rgba(0,0,0,0.10)] rounded-lg p-10 font-sans';

    return (
        <div className="relative w-full h-full">
            <div className="w-full h-full overflow-y-auto">
                <div
                    ref={previewCardRef}
                    data-pdf-card
                    className={cardClasses}
                    style={
                        {
                            WebkitTextSizeAdjust: '100%',
                            textSizeAdjust: '100%',
                            minHeight: `${LETTER_HEIGHT_PX}px`,
                        } as React.CSSProperties
                    }
                >
                    <ResumePreviewUserInfo />
                    {orderedSections.map(section => {
                        const sectionKey = section.key as ResumeSectionKey;
                        const entries = [...(credentialEntries[sectionKey] ?? [])].sort(
                            (a, b) => a.index - b.index
                        );
                        if (!entries.length) return null;
                        return (
                            <ResumePreviewGroupedCredentialsBlock
                                key={sectionKey}
                                section={section}
                                filteredUris={entries.map(entry => entry.uri)}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

export default ResumePreview;
