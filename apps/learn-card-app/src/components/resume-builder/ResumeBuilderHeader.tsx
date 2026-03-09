import React from 'react';
import { useHistory } from 'react-router-dom';

import { IonIcon, IonSpinner } from '@ionic/react';
import DocumentIcon from '../svgs/Document';
import { ellipsisVertical } from 'ionicons/icons';
import ShareIcon from 'learn-card-base/svgs/Share';
import DownloadIcon from 'learn-card-base/svgs/DownloadIcon';
import LeftArrow from 'learn-card-base/svgs/LeftArrow';

export type ResumeBuilderHeaderAction = 'preview' | 'download' | null;

export const ResumeBuilderHeader: React.FC<{
    loadingAction: ResumeBuilderHeaderAction;
    isMobile?: boolean;
    onPreview: () => void;
    onDownload: () => void;
}> = ({ loadingAction, isMobile = false, onPreview, onDownload }) => {
    const history = useHistory();

    return (
        <div className="shrink-0 border-b border-grayscale-200 bg-white/95 backdrop-blur-sm px-2 py-3 safe-area-top-margin">
            <div className="flex items-center justify-between">
                <div className="flex items-center justify-start gap-2">
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

                <div className={`flex items-center ${!isMobile ? 'pr-[60px]' : ''}`}>
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
                    {/* <button
                        className={`inline-flex items-center gap-2 h-9 rounded-full border border-solid border-grayscale-200 bg-white text-grayscale-600 font-semibold text-sm ${
                            isMobile ? 'w-9 justify-center px-0' : 'px-4'
                        }`}
                        aria-label="Share (coming soon)"
                    >
                        <ShareIcon className="w-5 h-5" />
                        <span className={isMobile ? 'sr-only' : ''}>Share</span>
                    </button> */}
                    {/* <button
                        className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-grayscale-200 bg-white text-grayscale-500"
                        aria-label="More options (coming soon)"
                    >
                        <IonIcon icon={ellipsisVertical} className="text-base" />
                    </button> */}
                </div>
            </div>
        </div>
    );
};

export default ResumeBuilderHeader;
