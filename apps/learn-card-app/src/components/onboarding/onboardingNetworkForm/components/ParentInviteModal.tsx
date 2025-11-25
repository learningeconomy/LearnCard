import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';
import { IonSpinner } from '@ionic/react';

import { useWallet } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';

import { v4 as uuidv4 } from 'uuid';

import LearnCardCircle from '../../../../assets/images/learncard-circle-icon.svg';

export type ParentInviteModalProps = {
    handleCloseModal: () => void;
};

const ParentInviteModal: React.FC<ParentInviteModalProps> = ({ handleCloseModal }) => {
    const { initWallet } = useWallet();

    const { presentToast } = useToast();

    const [inviteLink, setInviteLink] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [email, setEmail] = useState<string>('');

    const expiration = 2592000;

    const generateInviteLink = async () => {
        setLoading(true);
        try {
            const wallet = await initWallet();
            const challenge = uuidv4();
            const generated: { challenge: string; profileId: string } =
                await wallet?.invoke?.generateInvite(challenge, expiration);
            const _inviteLink = `https://learncard.app/invite?challenge=${generated?.challenge}&profileId=${generated?.profileId}`;
            setInviteLink(_inviteLink);
        } catch (e) {
            presentToast('Failed to generate invite link', {
                className: ToastTypeEnum.CopyFail,
                hasDismissButton: true,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        generateInviteLink();
    }, []);

    const copyInviteLinkToClipboard = async () => {
        try {
            await Clipboard.write({ string: inviteLink });
            presentToast('Invite link copied to clipboard', {
                className: ToastTypeEnum.CopySuccess,
                hasDismissButton: true,
            });
        } catch (e) {
            presentToast('Unable to copy Invite link', {
                className: ToastTypeEnum.CopyFail,
                hasDismissButton: true,
            });
        }
    };

    const handleShareInvite = async () => {
        if (!inviteLink) return;
        if (Capacitor.isNativePlatform()) {
            await Share.share({
                title: 'LearnCard Invite',
                text: '',
                url: inviteLink,
                dialogTitle: 'Share Invite',
            });
        } else {
            await copyInviteLinkToClipboard();
        }
    };

    const handleSendEmailInvite = async () => {
        if (!inviteLink) return;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            presentToast('Please enter a valid email', {
                className: ToastTypeEnum.CopyFail,
                hasDismissButton: true,
            });
            return;
        }

        const subject = encodeURIComponent('Join LearnCard');
        const body = encodeURIComponent(
            `Hi,\n\nPlease join me on LearnCard using this invite link:\n${inviteLink}\n\nThanks!`
        );

        window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
    };

    return (
        <div className="flex flex-col gap-[10px] w-full h-full items-center justify-center px-[20px]">
            <div className="w-full bg-white rounded-[24px] px-[20px] py-[28px] shadow-3xl text-center max-w-[600px]">
                <div className="mx-auto mb-4 h-[60px] w-[60px] flex items-center justify-center">
                    <img src={LearnCardCircle} alt="LearnCard" className="h-[60px] w-[60px]" />
                </div>
                <h2 className="text-[22px] font-semibold text-grayscale-900 mb-2 font-noto">
                    Invite your parent to join LearnCard!
                </h2>
                <p className="text-grayscale-700 text-[15px] leading-[22px] px-[10px]">
                    Click the <span className="font-semibold">Share Invite</span> button or type in
                    their email and click the <span className="font-semibold">Send Invite</span>
                    button.
                </p>

                <div className="w-full flex items-center justify-center mt-4 px-2">
                    <button
                        type="button"
                        onClick={handleShareInvite}
                        disabled={loading || !inviteLink}
                        className="flex items-center justify-center bg-emerald-700 rounded-full px-[18px] py-[12px] text-white font-poppins text-[16px] w-full shadow-lg"
                    >
                        {loading ? <IonSpinner name="crescent" /> : 'Share Invite'}
                    </button>
                </div>

                <div className="flex items-center justify-center w-full mt-3">
                    <div className="flex items-center justify-center w-full px-5">
                        <h2 className="divider-with-text">
                            <span>or</span>
                        </h2>
                    </div>
                </div>

                <div className="w-full flex items-center justify-center mt-1 px-2">
                    <input
                        type="email"
                        placeholder="email@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full bg-grayscale-100 rounded-2xl px-4 py-3 text-grayscale-800 placeholder:text-grayscale-500"
                    />
                </div>
            </div>

            <div className="w-full flex gap-[10px] justify-center px-[10px] left-[0px] items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 absolute bottom-0 bg-white !max-h-[100px] safe-area-bottom">
                <div className="w-full max-w-[700px] flex gap-[10px]">
                    <button
                        type="button"
                        onClick={handleCloseModal}
                        className="shadow-button-bottom flex-1 py-[10px] text-[17px] bg-white rounded-[40px] text-grayscale-900 shadow-box-bottom border border-grayscale-200"
                    >
                        Back
                    </button>
                    <button
                        type="button"
                        onClick={handleSendEmailInvite}
                        disabled={loading || !inviteLink}
                        className="shadow-button-bottom font-semibold flex-1 py-[10px] text-[17px] bg-emerald-700 rounded-[40px] text-white shadow-box-bottom"
                    >
                        Send Invite
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ParentInviteModal;
