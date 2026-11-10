import React from 'react';
import { IonHeader, IonSpinner, IonToolbar } from '@ionic/react';
import DocumentIcon from '../svgs/Document';
import ShareIcon from 'learn-card-base/svgs/Share';
import DownloadIcon from 'learn-card-base/svgs/DownloadIcon';
import LeftArrow from 'learn-card-base/svgs/LeftArrow';
import Checkmark from '../svgs/Checkmark';
import type { ResumeBuilderHeaderAction } from './ResumeBuilderHeader';
import * as m from '../../paraglide/messages.js';

export interface ResumeBuilderToolbarProps {
    loadingAction: ResumeBuilderHeaderAction;
    isMobile?: boolean;
    isDesktopPanelClosed?: boolean;
    historyControl: React.ReactNode;
    onBack: () => void;
    onPreview: () => void;
    onDownload: () => void;
    onPublish: () => void;
    onShareCurrentResume?: () => void;
    disableShareCurrentResume?: boolean;
    disablePublish?: boolean;
    isEditingExistingResume?: boolean;
}

/** Keep navigation and secondary actions separate from the two labelled primary actions. */
export const ResumeBuilderToolbar: React.FC<ResumeBuilderToolbarProps> = ({
    loadingAction,
    isMobile = false,
    isDesktopPanelClosed = false,
    historyControl,
    onBack,
    onPreview,
    onDownload,
    onPublish,
    onShareCurrentResume,
    disableShareCurrentResume = false,
    disablePublish = false,
    isEditingExistingResume = false,
}) => {
    const busy = loadingAction !== null;
    const secondaryClass =
        'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-[20px] p-2 text-sm font-medium text-grayscale-700 hover:bg-grayscale-100 disabled:cursor-not-allowed disabled:opacity-40 transition-colors';

    return (
        <IonHeader className="resume-builder-toolbar ion-no-border shrink-0 font-poppins">
            <IonToolbar className="[--background:white] [--border-width:0px] [--padding-start:0px] [--padding-end:0px]">
                <div
                    className={`border-b border-grayscale-200 px-3 py-2 ${isMobile ? 'space-y-2' : 'flex items-center gap-4 px-5 py-3'} ${!isMobile && isDesktopPanelClosed ? 'pr-[72px]' : ''}`}
                >
                    <div className="flex min-w-0 flex-1 items-center gap-1">
                        {isMobile && (
                            <button
                                type="button"
                                onClick={onBack}
                                aria-label={m['passport.resumeBuilder.goBack']()}
                                className={secondaryClass}
                            >
                                <LeftArrow className="h-6 w-6" />
                            </button>
                        )}
                        <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-grayscale-900">
                            {m['passport.resumeBuilder.yourResume']()}
                        </h1>
                        <div className="flex shrink-0 items-center gap-1">
                            {historyControl}
                            <button
                                type="button"
                                onClick={onDownload}
                                disabled={busy}
                                aria-label={m['passport.resumeBuilder.download']()}
                                aria-busy={loadingAction === 'download'}
                                className={secondaryClass}
                            >
                                {loadingAction === 'download' ? (
                                    <IonSpinner name="crescent" className="h-5 w-5" />
                                ) : (
                                    <DownloadIcon className="h-5 w-5" />
                                )}
                                <span className={isMobile ? 'sr-only' : ''}>
                                    {loadingAction === 'download'
                                        ? m['passport.resumeBuilder.generatingPdf']()
                                        : m['passport.resumeBuilder.download']()}
                                </span>
                            </button>
                            {isEditingExistingResume && onShareCurrentResume && (
                                <button
                                    type="button"
                                    onClick={onShareCurrentResume}
                                    disabled={busy || disableShareCurrentResume}
                                    aria-label={m['common.share']()}
                                    className={secondaryClass}
                                >
                                    <ShareIcon className="h-5 w-5" />
                                    <span className={isMobile ? 'sr-only' : ''}>
                                        {m['common.share']()}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                    <div
                        className={
                            isMobile ? 'grid grid-cols-2 gap-2' : 'flex shrink-0 items-center gap-2'
                        }
                    >
                        <button
                            type="button"
                            onClick={onPreview}
                            disabled={busy}
                            aria-busy={loadingAction === 'preview'}
                            className="flex min-h-11 items-center justify-center gap-2 rounded-[20px] border border-grayscale-300 bg-white px-4 py-2 text-sm font-medium text-grayscale-900 hover:bg-grayscale-100 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                        >
                            {loadingAction === 'preview' ? (
                                <IonSpinner name="crescent" className="h-4 w-4" />
                            ) : (
                                <DocumentIcon className="h-5 w-5 shrink-0" />
                            )}
                            {loadingAction === 'preview'
                                ? m['passport.resumeBuilder.generatingPdf']()
                                : m['common.preview']()}
                        </button>
                        <button
                            type="button"
                            onClick={onPublish}
                            disabled={busy || disablePublish}
                            aria-busy={loadingAction === 'publish'}
                            className="flex min-h-11 items-center justify-center gap-2 rounded-[20px] bg-grayscale-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 transition-opacity"
                        >
                            {loadingAction === 'publish' ? (
                                <IonSpinner name="crescent" className="h-4 w-4" />
                            ) : (
                                <Checkmark className="h-5 w-5 shrink-0" />
                            )}
                            {loadingAction === 'publish'
                                ? m['common.saving']()
                                : isEditingExistingResume
                                  ? m['common.save']()
                                  : m['common.publish']()}
                        </button>
                    </div>
                </div>
            </IonToolbar>
        </IonHeader>
    );
};
