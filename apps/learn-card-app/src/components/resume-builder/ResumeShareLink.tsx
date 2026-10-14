import React, { useEffect, useRef, useState } from 'react';
import { Clipboard } from '@capacitor/clipboard';
import { QRCodeSVG } from 'qrcode.react';
import { UnsignedVC, VC } from '@learncard/types';
import { ToastTypeEnum, useToast } from 'learn-card-base';
import X from 'learn-card-base/svgs/X';
import {
    captureResumeAccount,
    useResumeAccountRevision,
} from '../../helpers/resume-publishing/account';
import { useIssueTcpResume } from '../../hooks/useIssueTcpResume';
import { enterSharePrivacy } from '../share-links/sharePrivacy';
import { resumePublicationErrorMessage } from './resumePublicationMessages';
import * as m from '../../paraglide/messages.js';

type ResumeShareLinkProps = {
    handleClose?: () => void;
    resume: VC | UnsignedVC;
    resumeUri: string;
    /** Already committed managed link. Opening this surface must not publish again. */
    committedLink?: string;
};

const ResumeShareLinkContent: React.FC<ResumeShareLinkProps> = ({
    handleClose,
    resumeUri,
    committedLink,
}) => {
    enterSharePrivacy();
    const { presentToast } = useToast();
    const { getResumeShareLink } = useIssueTcpResume();
    const getLink = useRef(getResumeShareLink);
    getLink.current = getResumeShareLink;
    const [shareLink, setShareLink] = useState('');
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState(true);
    const [copying, setCopying] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const isCurrentAccount = captureResumeAccount();
        setShareLink('');
        setError(undefined);
        setLoading(true);
        // Recover the managed link even when provided by the publisher so a
        // stopped or expired entry is never offered from a cached result.
        void getLink
            .current(resumeUri)
            .then(link => {
                if (!cancelled && isCurrentAccount()) setShareLink(link);
            })
            .catch(failure => {
                if (!cancelled && isCurrentAccount())
                    setError(resumePublicationErrorMessage(failure));
            })
            .finally(() => {
                if (!cancelled && isCurrentAccount()) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [resumeUri, committedLink]);

    const copyShareLink = async () => {
        if (!shareLink || copying) return;
        setCopying(true);
        const isCurrentAccount = captureResumeAccount();
        try {
            const currentLink = await getResumeShareLink(resumeUri);
            if (!isCurrentAccount()) return;
            await Clipboard.write({ string: currentLink });
            presentToast(m['toasts.resume.linkCopied'](), { hasDismissButton: true });
        } catch {
            setShareLink('');
            setError(m['resumePublishing.linkUnavailable']());
            presentToast(m['toasts.resume.linkCopyFailed'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            setCopying(false);
        }
    };

    return (
        <section
            className="sentry-block ph-no-capture flex h-full w-full items-center justify-center p-5 font-poppins"
            data-feedback-exclude
        >
            <div className="w-full max-w-[400px] rounded-[20px] border border-grayscale-200 bg-white p-6 space-y-5">
                <div className="flex items-center justify-between gap-4">
                    <h1 className="text-xl font-semibold text-grayscale-900">
                        {m['common.share']()}
                    </h1>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={!handleClose}
                        className="text-grayscale-700 disabled:opacity-50 rounded-[20px]"
                        aria-label={m['passport.resumeBuilder.shareLink.close']()}
                    >
                        <X className="h-8 w-8" />
                    </button>
                </div>
                {loading ? (
                    <p role="status" className="text-sm text-grayscale-600 flex gap-2 items-center">
                        <span
                            aria-hidden
                            className="w-4 h-4 rounded-full border-2 border-grayscale-300 border-t-grayscale-900 animate-spin"
                        />
                        {m['resumePublishing.opening']()}
                    </p>
                ) : error ? (
                    <p role="alert" className="text-sm text-red-700">
                        {error}
                    </p>
                ) : (
                    <>
                        <QRCodeSVG value={shareLink} size={320} className="mx-auto h-auto w-full" />
                        <p className="text-sm text-grayscale-600">
                            {m['resumePublishing.linkReady']()}
                        </p>
                        <button
                            type="button"
                            onClick={() => void copyShareLink()}
                            disabled={!shareLink || copying}
                            className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white text-sm font-medium disabled:opacity-40"
                        >
                            {copying
                                ? m['shareLinks.copying']()
                                : m['passport.resumeBuilder.shareLink.copyLink']()}
                        </button>
                    </>
                )}
                <p className="text-xs text-grayscale-600 leading-relaxed">
                    {m['resumePublishing.limits']()}
                </p>
            </div>
        </section>
    );
};
const ResumeShareLink: React.FC<ResumeShareLinkProps> = props => {
    const revision = useResumeAccountRevision();
    return <ResumeShareLinkContent key={revision} {...props} />;
};
export default ResumeShareLink;
