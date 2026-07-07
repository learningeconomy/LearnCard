import React from 'react';

import ResumeConfigPanelDocumentSetup from './ResumeConfigPanelDocumentSetup';
import ResumeConfigPanelUserInfo from './ResumeConfigPanelUserInfo';
import ResumeConfigCredentialSelector from './ResumeConfigCredentialSelector';

import { RESUME_SECTIONS, ResumeSectionKey } from '../../resume-builder.helpers';

export const ResumeConfigPanelOptions: React.FC<{
    focusSectionKey?: ResumeSectionKey;
    focusRequestId?: number;
}> = ({ focusSectionKey, focusRequestId }) => {
    return (
        <div className="flex flex-col h-full bg-grayscale-50">
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <ResumeConfigPanelDocumentSetup />
                <ResumeConfigPanelUserInfo />
                <div className="rounded-2xl border border-grayscale-200 bg-white p-4">
                    <h3 className="text-sm font-semibold text-grayscale-900">Credentials</h3>
                    <p
                        className="mt-1 text-xs leading-relaxed text-grayscale-600"
                        title="Select Credentials from your LearnCard to be included in your verified digital resume"
                    >
                        Select Credentials from your LearnCard to be included in your verified
                        digital resume
                    </p>
                </div>
                {RESUME_SECTIONS.map(section => (
                    <ResumeConfigCredentialSelector
                        key={section.key}
                        sectionKey={section.key as ResumeSectionKey}
                        label={section.label}
                        focusSectionKey={focusSectionKey}
                        focusRequestId={focusRequestId}
                    />
                ))}
            </div>
        </div>
    );
};

export default ResumeConfigPanelOptions;
