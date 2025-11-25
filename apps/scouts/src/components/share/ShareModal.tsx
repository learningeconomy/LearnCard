import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';
import { Share } from '@capacitor/share';

import { useIonToast, IonSpinner } from '@ionic/react';
import User from 'learn-card-base/svgs/User';
import CopyStack from '../svgs/CopyStack';

import { useWallet } from 'learn-card-base';

const ShareModal: React.FC<{
    handleCloseModal: () => void;
    showCloseButton?: boolean;
    history?: any;
}> = ({ handleCloseModal, showCloseButton = true, history }) => {
    const { initWallet } = useWallet();
    const [presentToast] = useIonToast();

    const [inviteLink, setInviteLink] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const generateInviteLink = async () => {
            const wallet = await initWallet();
            setLoading(true);
            const generatedInvite: {
                challenge: string;
                profileId: string;
            } = await wallet?.invoke?.generateInvite();

            try {
                const _inviteLink = `https://pass.scout.org/invite?challenge=${generatedInvite?.challenge}&profileId=${generatedInvite?.profileId}`;
                setInviteLink(_inviteLink);
                setLoading(false);
            } catch (e) {
                console.log('generateInvite::error', e);
                setLoading(false);
            }
        };

        if (!inviteLink) {
            generateInviteLink();
        }
    }, [inviteLink]);

    const copyContactLinkToClipBoard = async () => {
        const wallet = await initWallet();

        try {
            await Clipboard.write({
                string: `https://pass.scout.org/connect?did=${wallet?.id?.did()}`,
            });
            presentToast({
                message: 'Profile link copied to clipboard',
                duration: 3000,
                buttons: [
                    {
                        text: 'Dismiss',
                        role: 'cancel',
                    },
                ],
                position: 'top',
                cssClass: 'user-did-success-copy-toast',
            });
        } catch (err) {
            presentToast({
                message: 'Unable to copy Profile link to clipboard',
                duration: 3000,
                buttons: [
                    {
                        text: 'Dismiss',
                        role: 'cancel',
                    },
                ],
                position: 'top',
                cssClass: 'user-did-copy-success-toast',
            });
        }
    };

    const copyInviteLinkToClipBoard = async () => {
        try {
            await Clipboard.write({
                string: inviteLink,
            });
            presentToast({
                message: 'Invite link copied to clipboard',
                duration: 3000,
                buttons: [
                    {
                        text: 'Dismiss',
                        role: 'cancel',
                    },
                ],
                position: 'top',
                cssClass: 'user-did-success-copy-toast',
            });
        } catch (err) {
            presentToast({
                message: 'Unable to copy Invite link to clipboard',
                duration: 3000,
                buttons: [
                    {
                        text: 'Dismiss',
                        role: 'cancel',
                    },
                ],
                position: 'top',
                cssClass: 'user-did-copy-success-toast',
            });
        }
    };

    const handleShare = async () => {
        const wallet = await initWallet();

        if (Capacitor.isNativePlatform()) {
            await Share.share({
                title: 'Add contact',
                text: '',
                url: `https://pass.scout.org/connect?did=${wallet?.id?.did()}`,
                dialogTitle: '',
            });
        } else {
            copyContactLinkToClipBoard();
        }
    };

    return (
        <section className="text-grayscale-900 pt-[36px] pb-[16px]">
            <div className="flex w-full items-center justify-start text-left mb-4 px-4">
                <p className="text-grayscale-900 m-0 text-xl font-bold">Share</p>
            </div>

            <div className="w-full flex items-center justify-center px-4">
                <button
                    onClick={handleShare}
                    className="flex items-center justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white text-2xl w-full shadow-lg font-medium"
                >
                    <User className="ml-[5px] h-[30px] w-[30px] mr-2" /> Share Profile
                </button>
            </div>

            <div className="flex items-center justify-center w-full mt-3">
                <div className="flex items-center justify-center w-full px-5">
                    <h2 className="divider-with-text">
                        <span>or</span>
                    </h2>
                </div>
            </div>

            <div className="w-full flex items-center justify-center mt-1 px-4">
                <h1 className="text-grayscale-900 text-[20px]  w-full text-left">
                    Send invite link to connect
                </h1>
            </div>

            <div className="flex items-center justify-center w-full  mt-4 rounded-[15px] px-4">
                <div className="w-full flex items-center bg-grayscale-100 justify-between px-4 py-3 rounded-2xl">
                    <div className="w-[80%] flex justify-start items-center text-left">
                        {loading ? (
                            <>
                                <IonSpinner
                                    name="crescent"
                                    color="dark"
                                    className="scale-[1] mr-1"
                                />{' '}
                                <p className="flex items-center justify-center text-left text-grayscale-500 font-medium text-sm line-clamp-1 ml-2">
                                    Generating Link...
                                </p>
                            </>
                        ) : (
                            <p className="flex items-center justify-center text-left text-grayscale-500 font-medium text-sm line-clamp-1">
                                {inviteLink}
                            </p>
                        )}
                    </div>
                    <div
                        onClick={copyInviteLinkToClipBoard}
                        className="w-[20%] flex items-center justify-end"
                    >
                        <CopyStack className="w-[32px] h-[32px] text-grayscale-900" />
                    </div>
                </div>
            </div>

            <div className="w-full flex items-center justify-center mb-4 px-4 mt-4">
                <h1 className="text-grayscale-600 tracking-wide w-full text-left text-sm font-normal">
                    Link expires in 1 hour
                </h1>
            </div>
        </section>
    );
};

export default ShareModal;
