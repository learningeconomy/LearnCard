import React, { useEffect, useState } from 'react';
import { Clipboard } from '@capacitor/clipboard';
import { IonSpinner } from '@ionic/react';
import { QRCodeSVG } from 'qrcode.react';
import { UnsignedVC, VC } from '@learncard/types';
import {
    ProfilePicture,
    ToastTypeEnum,
    truncateWithEllipsis,
    useShareBoostMutation,
    useToast,
} from 'learn-card-base';
import X from 'learn-card-base/svgs/X';

type ResumeShareLinkProps = {
    handleClose?: () => void;
    resume: VC | UnsignedVC;
    resumeUri: string;
};

const ResumeShareLink: React.FC<ResumeShareLinkProps> = ({ handleClose, resume, resumeUri }) => {
    const { presentToast } = useToast();
    const [shareLink, setShareLink] = useState<string>('');
    const { mutate: shareResume, isPending } = useShareBoostMutation();

    useEffect(() => {
        if (!resumeUri) return;

        shareResume(
            {
                credential: resume,
                credentialUri: resumeUri,
                shareRouteName: 'verify/resume',
            },
            {
                onSuccess: data => setShareLink(data?.link ?? ''),
                onError: () => {
                    presentToast('Unable to generate resume share link.', {
                        type: ToastTypeEnum.Error,
                        hasDismissButton: true,
                    });
                },
            }
        );
    }, [presentToast, resume, resumeUri, shareResume]);

    const copyShareLink = async () => {
        if (!shareLink) return;

        try {
            await Clipboard.write({ string: shareLink });
            presentToast('Resume link copied to clipboard', {
                hasDismissButton: true,
            });
        } catch {
            presentToast('Unable to copy resume link to clipboard', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    return (
        <section className="flex h-full w-full items-center justify-center p-5">
            <div className="w-full max-w-[400px] rounded-[28px] border-2 border-white bg-grayscale-900 shadow-[0_20px_50px_rgba(15,23,42,0.35)] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5">
                    <ProfilePicture
                        customContainerClass="flex justify-center items-center h-[44px] w-[44px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-xl min-w-[44px] min-h-[44px]"
                        customImageClass="flex justify-center items-center h-[44px] w-[44px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[44px] min-h-[44px]"
                        customSize={120}
                    />
                    <p className="text-[22px] font-medium text-white">Share</p>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="text-white disabled:opacity-50"
                        disabled={!handleClose}
                        aria-label="Close share modal"
                    >
                        <X className="h-8 w-8 text-white" />
                    </button>
                </div>

                <div className="px-6 pb-6">
                    <div className="rounded-[28px] bg-white p-4 sm:p-5">
                        <div className="aspect-square w-full overflow-hidden rounded-[20px] bg-white flex items-center justify-center">
                            {isPending || !shareLink ? (
                                <IonSpinner name="crescent" className="h-8 w-8 text-indigo-500" />
                            ) : (
                                <QRCodeSVG value={shareLink} size={420} className="h-full w-full" />
                            )}
                        </div>

                        <div className="mt-4 flex items-center gap-3 rounded-full bg-grayscale-100 px-4 py-3">
                            <p className="min-w-0 flex-1 truncate text-[16px] font-medium text-grayscale-500">
                                {shareLink
                                    ? truncateWithEllipsis(shareLink, 40)
                                    : 'Generating link...'}
                            </p>
                            <button
                                type="button"
                                onClick={copyShareLink}
                                disabled={!shareLink}
                                className="shrink-0 text-[16px] font-semibold text-blue-500 disabled:opacity-50"
                            >
                                Copy Link
                            </button>
                        </div>
                    </div>

                    <div className="mt-3 w-full flex flex-col gap-[10px] bg-sky-50 border border-sky-200 rounded-[15px] p-[14px]">
                        <p className="text-sky-900 font-poppins text-[16px] font-[600] m-0">
                            Share your LearnCard resume
                        </p>
                        <p className="text-sky-800 text-sm m-0">
                            This link and QR code let others view your shared resume.
                        </p>
                        <p className="text-sky-800 text-sm m-0">
                            Share with recruiters, hiring managers, friends, or anyone you want to
                            review your resume.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ResumeShareLink;
