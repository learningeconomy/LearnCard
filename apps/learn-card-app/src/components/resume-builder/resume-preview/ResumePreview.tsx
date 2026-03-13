import React, { useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
import { VC } from '@learncard/types';

import ResumePreviewUserInfo from './ResumePreviewUserInfo';
import ResumePreviewEmptyPlaceholder from './ResumePreviewEmptyPlaceholder';
import ResumePreviewGroupedCredentialsBlock from './ResumePreviewGroupedCredentialsBlock';
import useResumePdf, { ResumePdfArtifact, ResumePdfPreviewData } from './useResumePdf';

import { RESUME_SECTIONS, ResumeSectionKey } from '../resume-builder.helpers';
import { resumeBuilderStore } from '../../../stores/resumeBuilderStore';
import { CredentialCategoryEnum } from 'learn-card-base';

const LETTER_HEIGHT_PX = 1056; // US Letter at 96 DPI

export type ResumePreviewHandle = {
    createPDFPreviewUrl: () => Promise<ResumePdfPreviewData | null>;
    generatePDF: () => Promise<void>;
    createPDFArtifact: () => Promise<ResumePdfArtifact | null>;
};

const ResumePreview = forwardRef<
    ResumePreviewHandle,
    {
        isMobile?: boolean;
        isPreviewing?: boolean;
        readOnly?: boolean;
        resolvedCredentialsByUri?: Record<string, VC | null | undefined>;
        qrCodeValue?: string;
    }
>(function ResumePreview(
    { isMobile = false, readOnly = false, resolvedCredentialsByUri, qrCodeValue },
    ref
) {
    const sectionOrder = resumeBuilderStore.useTracked.sectionOrder();
    const personalDetails = resumeBuilderStore.useTracked.personalDetails();
    const credentialEntries = resumeBuilderStore.useTracked.credentialEntries();
    const hiddenSections = resumeBuilderStore.useTracked.hiddenSections();

    const previewCardRef = useRef<HTMLDivElement>(null);
    const { createPDFPreviewUrl, generatePDF, createPDFArtifact } = useResumePdf(previewCardRef);

    const orderedSections = useMemo(() => {
        const sectionsFromSavedOrder = sectionOrder
            .map(key => RESUME_SECTIONS.find(s => s.key === key))
            .filter(Boolean) as (typeof RESUME_SECTIONS)[number][];
        const missingSections = RESUME_SECTIONS.filter(
            section =>
                !sectionsFromSavedOrder.some(orderedSection => orderedSection.key === section.key)
        );

        return [...sectionsFromSavedOrder, ...missingSections];
    }, [sectionOrder]);

    const hasVisibleContent = useMemo(() => {
        const hasPersonal = Object.values(personalDetails).some(v => v.trim());
        const hasCredentials = Object.values(credentialEntries).some(arr => arr && arr.length > 0);
        const hasVisibleEmptySection = readOnly
            ? false
            : orderedSections.some(section => {
                  const sectionKey = section.key as ResumeSectionKey;
                  if (hiddenSections?.[sectionKey]) return false;
                  return sectionKey !== CredentialCategoryEnum.socialBadge;
              });

        return hasPersonal || hasCredentials || hasVisibleEmptySection;
    }, [credentialEntries, hiddenSections, orderedSections, personalDetails, readOnly]);

    useImperativeHandle(ref, () => ({
        createPDFPreviewUrl,
        generatePDF,
        createPDFArtifact,
    }));

    if (!hasVisibleContent) {
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
                    <ResumePreviewUserInfo readOnly={readOnly} qrCodeValue={qrCodeValue} />
                    {orderedSections.map(section => {
                        const sectionKey = section.key as ResumeSectionKey;
                        const entries = [...(credentialEntries[sectionKey] ?? [])].sort(
                            (a, b) => a.index - b.index
                        );
                        if (hiddenSections?.[sectionKey]) return null;
                        return (
                            <ResumePreviewGroupedCredentialsBlock
                                key={sectionKey}
                                section={section}
                                isMobile={isMobile}
                                readOnly={readOnly}
                                filteredUris={entries.map(entry => entry.uri)}
                                resolvedCredentialsByUri={resolvedCredentialsByUri}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

export default ResumePreview;
