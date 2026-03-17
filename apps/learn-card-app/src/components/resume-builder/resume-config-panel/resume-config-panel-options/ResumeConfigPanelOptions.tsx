import React from 'react';

import ResumeConfigPanelDocumentSetup from './ResumeConfigPanelDocumentSetup';
import ResumeConfigPanelUserInfo from './ResumeConfigPanelUserInfo';
import ResumeConfigCredentialSelector from './ResumeConfigCredentialSelector';

import { RESUME_SECTIONS, ResumeSectionKey } from '../../resume-builder.helpers';

export const ResumeConfigPanelOptions: React.FC = () => {
    return (
        <div className="flex flex-col h-full bg-grayscale-50">
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <ResumeConfigPanelDocumentSetup />
                <ResumeConfigPanelUserInfo />
                {RESUME_SECTIONS.map(section => (
                    <ResumeConfigCredentialSelector
                        key={section.key}
                        sectionKey={section.key as ResumeSectionKey}
                        label={section.label}
                    />
                ))}
            </div>
        </div>
    );
};

export default ResumeConfigPanelOptions;
