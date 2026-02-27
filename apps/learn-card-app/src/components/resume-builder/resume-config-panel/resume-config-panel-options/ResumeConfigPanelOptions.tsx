import React from 'react';

import ResumeConfigPanelUserInfo from './ResumeConfigPanelUserInfo';
import ResumeConfigCredentialSelector from './ResumeConfigCredentialSelector';

import { RESUME_SECTIONS, ResumeSectionKey } from '../../resume-builder.helpers';

export const ResumeConfigPanelOptions: React.FC = () => {
    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
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
