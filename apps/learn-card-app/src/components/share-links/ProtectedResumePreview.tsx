import React from 'react';
import type { VC } from '@learncard/types';
import { IonIcon } from '@ionic/react';
import { documentTextOutline, downloadOutline } from 'ionicons/icons';
import { getProtectedResumePdf } from '../../helpers/resume-publishing/protectedPdf';
import * as m from '../../paraglide/messages.js';

type Props = {
    credential: VC;
    proof?: React.ReactNode;
    onDownload?: () => Promise<void>;
    downloading?: boolean;
};

/** Exact managed PDF card. Bytes are fetched only through a deliberate guarded download. */
export const ProtectedResumePreview = ({ credential, proof, onDownload, downloading }: Props) => {
    const pdf = getProtectedResumePdf(credential);
    return (
        <article
            className="bg-white rounded-[20px] p-6 md:p-8 space-y-5 border border-grayscale-200 sentry-block ph-no-capture"
            data-feedback-exclude
        >
            <div className="flex items-center gap-4">
                <span
                    className="inline-flex items-center justify-center rounded-[20px] bg-grayscale-100 p-4 text-grayscale-700"
                    aria-hidden
                >
                    <IonIcon icon={documentTextOutline} className="h-7 w-7" />
                </span>
                <div className="min-w-0 space-y-1">
                    <h2 className="text-lg font-semibold text-grayscale-900">
                        {m['resumePublishing.pdfHeading']()}
                    </h2>
                    {pdf && (
                        <p className="text-xs text-grayscale-600">
                            {m['resumePublishing.pdfSize']({
                                size: String(Math.ceil(pdf.byteLength / 1024)),
                            })}
                        </p>
                    )}
                    {proof}
                </div>
            </div>
            {pdf ? (
                <>
                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        {onDownload
                            ? m['resumePublishing.pdfReady']()
                            : m['resumePublishing.manageContent']()}
                    </p>
                    {onDownload && (
                        <button
                            type="button"
                            onClick={() => void onDownload()}
                            disabled={downloading}
                            className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-[20px] bg-grayscale-900 text-white text-sm font-medium disabled:opacity-40"
                        >
                            <IonIcon icon={downloadOutline} aria-hidden />
                            {downloading
                                ? m['shareLinks.preparingPdf']()
                                : m['resumePublishing.downloadToView']()}
                        </button>
                    )}
                </>
            ) : (
                <p role="alert" className="text-sm text-red-700">
                    {m['resumePublishing.previewError']()}
                </p>
            )}
            <p className="text-xs text-grayscale-600 leading-relaxed">
                {m['resumePublishing.limits']()}
            </p>
        </article>
    );
};
