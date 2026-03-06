import React from 'react';

import X from 'learn-card-base/svgs/X';

import { ProfilePicture, useCurrentUser, useGetCurrentLCNUser } from 'learn-card-base';
import { ResumePdfPreviewData } from './resume-preview/useResumePdf';

export const ResumeIframePreview: React.FC<{
    preview: ResumePdfPreviewData | null;
    onClose: () => void;
}> = ({ preview, onClose }) => {
    const { currentLCNUser } = useGetCurrentLCNUser();
    const currentUser = useCurrentUser();

    const name = currentLCNUser?.displayName || currentUser?.name || 'Resume Preview';

    if (!preview) return null;

    return (
        <div className="absolute inset-0 z-30 bg-black/50 p-3 sm:p-6 ">
            <div className="w-full h-full bg-white rounded-xl shadow-2xl border border-grayscale-200 overflow-hidden flex flex-col">
                <div className="shrink-0 h-[48px] px-3 border-b border-grayscale-200 flex items-center justify-between bg-grayscale-50">
                    <div className="flex items-center gap-2">
                        <ProfilePicture
                            customContainerClass="text-grayscale-900 h-[30px] w-[30px] min-h-[30px] min-w-[30px] max-h-[30px] max-w-[30px] mt-[0px] mb-0"
                            customImageClass="w-full h-full object-cover"
                        />
                        <div className="flex flex-col">
                            <p className="text-base font-semibold text-grayscale-900 truncate">
                                {name}
                            </p>
                            <p className="text-xs font-medium text-grayscale-700">
                                {preview.pageCount} {preview.pageCount === 1 ? 'Page' : 'Pages'} •{' '}
                                {preview.fileName}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="text-grayscale-400 hover:text-grayscale-700 border-[1px] border-solid border-grayscale-200 rounded-full p-2.5"
                    >
                        <X className="w-3.5 h-3.5 text-grayscale-700" />
                    </button>
                </div>
                <iframe
                    src={preview.url}
                    title="Resume PDF Preview"
                    className="w-full flex-1 bg-grayscale-100"
                />
            </div>
        </div>
    );
};

export default ResumeIframePreview;
