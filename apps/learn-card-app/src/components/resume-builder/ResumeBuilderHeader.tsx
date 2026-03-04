import React from 'react';

import { IonIcon } from '@ionic/react';
import {
    documentOutline,
    downloadOutline,
    ellipsisVertical,
    shareSocialOutline,
} from 'ionicons/icons';

export type ResumeBuilderHeaderAction = 'preview' | 'download' | null;

export const ResumeBuilderHeader: React.FC<{
    loadingAction: ResumeBuilderHeaderAction;
    onPreview: () => void;
    onDownload: () => void;
}> = ({ loadingAction, onPreview, onDownload }) => {
    return (
        <div className="shrink-0 border-b border-grayscale-200 bg-white/95 backdrop-blur-sm px-4 py-3">
            <div className="flex items-center justify-between gap-3">
                <button
                    onClick={onPreview}
                    disabled={loadingAction !== null}
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
                >
                    <IonIcon icon={documentOutline} className="text-base" />
                    {loadingAction === 'preview' ? 'Opening…' : 'Preview'}
                </button>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onDownload}
                        disabled={loadingAction !== null}
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-full border border-grayscale-200 bg-white hover:bg-grayscale-50 disabled:opacity-60 disabled:cursor-not-allowed text-indigo-500 font-semibold text-sm transition-colors"
                    >
                        <IonIcon icon={downloadOutline} className="text-base" />
                        {loadingAction === 'download' ? 'Generating…' : 'Download PDF'}
                    </button>
                    <button
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-full border border-grayscale-200 bg-white text-grayscale-500 font-semibold text-sm"
                        aria-label="Share (coming soon)"
                    >
                        <IonIcon icon={shareSocialOutline} className="text-base" />
                        Share
                    </button>
                    <button
                        className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-grayscale-200 bg-white text-grayscale-500"
                        aria-label="More options (coming soon)"
                    >
                        <IonIcon icon={ellipsisVertical} className="text-base" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResumeBuilderHeader;
