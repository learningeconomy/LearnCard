import React from 'react';
import { useHistory } from 'react-router-dom';

import { IonSpinner } from '@ionic/react';
import DocumentIcon from '../svgs/Document';
import ShareIcon from 'learn-card-base/svgs/Share';
import DownloadIcon from 'learn-card-base/svgs/DownloadIcon';
import LeftArrow from 'learn-card-base/svgs/LeftArrow';
import ResumeBuilderHistoryDropdownButton from './ResumeBuilderHistoryDropdownButton';
import type { ExistingResume } from '../../hooks/useExistingResumes';

export type ResumeBuilderHeaderAction = 'preview' | 'download' | 'publish' | null;

export const ResumeBuilderHeader: React.FC<{
    loadingAction: ResumeBuilderHeaderAction;
    isMobile?: boolean;
    isDesktopPanelClosed?: boolean;
    onPreview: () => void;
    onDownload: () => void;
    onPublish: () => void;
    onShareCurrentResume?: () => void;
    onSelectResume: (resume: ExistingResume) => Promise<void> | void;
    activeResumeRecordId?: string | null;
    isEditingExistingResume?: boolean;
}> = ({
    loadingAction,
    isMobile = false,
    isDesktopPanelClosed = false,
    onPreview,
    onDownload,
    onPublish,
    onShareCurrentResume,
    onSelectResume,
    activeResumeRecordId,
    isEditingExistingResume = false,
}) => {
    const history = useHistory();

    return (
        <div className="shrink-0 border-b border-grayscale-200 bg-white/95 backdrop-blur-sm px-2 py-3 safe-area-top-margin">
            <div className="flex items-center justify-between">
                <div className="flex items-center justify-start gap-2">
                    <ResumeBuilderHistoryDropdownButton
                        activeResumeRecordId={activeResumeRecordId}
                        disabled={loadingAction !== null}
                        onSelectResume={onSelectResume}
                    />

                    {isMobile && (
                        <button
                            aria-label="Go back"
                            onClick={() => {
                                history.goBack();
                            }}
                        >
                            <LeftArrow className="w-7 h-auto text-grayscale-900" />
                        </button>
                    )}

                    <button
                        onClick={onPreview}
                        disabled={loadingAction !== null}
                        className="inline-flex items-center gap-1 h-9 px-4 rounded-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
                    >
                        <DocumentIcon className="w-5 h-5" />
                        {loadingAction === 'preview' ? (
                            <IonSpinner name="crescent" className="w-4 h-4" />
                        ) : (
                            'Preview'
                        )}
                    </button>
                </div>

                <div
                    className={`flex items-center ${
                        !isMobile && isDesktopPanelClosed ? 'pr-[60px]' : ''
                    }`}
                >
                    <button
                        onClick={onDownload}
                        disabled={loadingAction !== null}
                        className={`inline-flex items-center gap-2 h-9 rounded-full border border-grayscale-200 border-solid bg-white hover:bg-grayscale-50 disabled:opacity-60 disabled:cursor-not-allowed text-indigo-500 font-semibold text-sm transition-colors ${
                            isMobile ? 'w-9 justify-center px-0' : 'px-4'
                        }`}
                    >
                        {!(isMobile && loadingAction === 'download') && (
                            <DownloadIcon className="w-5 h-5" />
                        )}
                        {loadingAction === 'download' ? (
                            <IonSpinner name="crescent" className="w-4 h-4" />
                        ) : (
                            <span className={isMobile ? 'sr-only' : ''}>Download PDF</span>
                        )}
                    </button>
                    {isEditingExistingResume && onShareCurrentResume ? (
                        <button
                            onClick={onShareCurrentResume}
                            disabled={loadingAction !== null}
                            className={`ml-2 inline-flex items-center gap-2 h-9 rounded-full border border-grayscale-200 border-solid bg-white hover:bg-grayscale-50 disabled:opacity-60 disabled:cursor-not-allowed text-indigo-500 font-semibold text-sm transition-colors ${
                                isMobile ? 'w-9 justify-center px-0' : 'px-4'
                            }`}
                        >
                            <ShareIcon className="w-5 h-5" />
                            <span className={isMobile ? 'sr-only' : ''}>Share Resume</span>
                        </button>
                    ) : null}
                    <button
                        onClick={onPublish}
                        disabled={loadingAction !== null}
                        className={`ml-2 inline-flex items-center gap-2 h-9 rounded-full border border-grayscale-200 border-solid bg-white hover:bg-grayscale-50 disabled:opacity-60 disabled:cursor-not-allowed text-indigo-500 font-semibold text-sm transition-colors ${
                            isMobile ? 'w-9 justify-center px-0' : 'px-4'
                        }`}
                    >
                        {!(isMobile && loadingAction === 'publish') && (
                            <ShareIcon className="w-5 h-5" />
                        )}
                        {loadingAction === 'publish' ? (
                            <IonSpinner name="crescent" className="w-4 h-4" />
                        ) : (
                            <span className={isMobile ? 'sr-only' : ''}>
                                {isEditingExistingResume ? 'Save Resume' : 'Publish VC'}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResumeBuilderHeader;
