import React from 'react';
import { useHistory } from 'react-router-dom';

import ResumeBuilderHistoryDropdownButton from './ResumeBuilderHistoryDropdownButton';
import { ResumeBuilderToolbar, type ResumeBuilderToolbarProps } from './ResumeBuilderToolbar';
import type { ExistingResume } from '../../hooks/useExistingResumes';

export type ResumeBuilderHeaderAction = 'preview' | 'download' | 'publish' | null;

type ResumeBuilderHeaderProps = Omit<ResumeBuilderToolbarProps, 'onBack' | 'historyControl'> & {
    onSelectResume: (resume: ExistingResume) => Promise<void> | void;
    onCreateNewResume: () => Promise<void> | void;
    activeResumeRecordId?: string | null;
};

export const ResumeBuilderHeader: React.FC<ResumeBuilderHeaderProps> = ({
    onSelectResume,
    onCreateNewResume,
    activeResumeRecordId,
    ...toolbarProps
}) => {
    const history = useHistory();
    return (
        <ResumeBuilderToolbar
            {...toolbarProps}
            onBack={() => history.goBack()}
            historyControl={
                <ResumeBuilderHistoryDropdownButton
                    activeResumeRecordId={activeResumeRecordId}
                    disabled={toolbarProps.loadingAction !== null}
                    onSelectResume={onSelectResume}
                    onCreateNewResume={onCreateNewResume}
                    compact={toolbarProps.isMobile}
                />
            }
        />
    );
};

export default ResumeBuilderHeader;
