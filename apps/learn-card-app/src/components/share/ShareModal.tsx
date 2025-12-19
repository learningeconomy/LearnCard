import React, { useState } from 'react';
import { Clipboard } from '@capacitor/clipboard';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { v4 as uuidv4 } from 'uuid';

import { IonSpinner } from '@ionic/react';
import LinkChain from 'learn-card-base/svgs/LinkChain';
import Select from 'learn-card-base/components/generic/Select';
import CopyStack from '../svgs/CopyStack';

import { useWallet, ToastTypeEnum, useToast } from 'learn-card-base';

type ShareModalProps = {
    contractUri?: string;
    profileId?: string;
    overrideShareLink?: string;
};

const ShareModal: React.FC<ShareModalProps> = ({ contractUri, profileId, overrideShareLink }) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();

    const [inviteLink, setInviteLink] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [expiration, setExpiration] = useState<number>(2592000); // Default to 30 days (30 * 24 * 60 * 60)
    const [expiresIn, setExpiresIn] = useState<number | null>(null);

    const generateInviteLink = async () => {
        const wallet = await initWallet();
        setLoading(true);
        try {
            const challenge = uuidv4();
            const generatedInvite: {
                challenge: string;
                profileId: string;
                expiresIn: number | null;
            } = await wallet?.invoke?.generateInvite(challenge, expiration);
            const _inviteLink = `https://learncard.app/invite?challenge=${generatedInvite?.challenge}&profileId=${generatedInvite?.profileId}`;
            setInviteLink(_inviteLink);
            // Treat null as 0 for "never expire"
            setExpiresIn(generatedInvite?.expiresIn === null ? 0 : generatedInvite?.expiresIn);
        } catch (e) {
            console.log('generateInvite::error', e);
            presentToast('Failed to generate invite link', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const copyInviteLinkToClipBoard = async () => {
        try {
            await Clipboard.write({ string: inviteLink });
            presentToast('Invite link copied to clipboard', {
                hasDismissButton: true,
            });
        } catch (err) {
            presentToast('Unable to copy Invite link to clipboard', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const handleShare = async () => {
        const wallet = await initWallet();

        let link = `learncard.app/connect?connect=true&did=${wallet?.id?.did()}`;

        if (contractUri) {
            link = `${
                IS_PRODUCTION ? 'https://learncard.app' : 'http://localhost:3000'
            }/passport?contractUri=${contractUri}&teacherProfileId=${profileId}&insightsConsent=true`;
        }

        if (overrideShareLink) {
            link = overrideShareLink;
        }

        if (Capacitor.isNativePlatform()) {
            await Share.share({
                title: 'Add contact',
                text: '',
                url: link,
                dialogTitle: '',
            });
        } else {
            copyContactLinkToClipBoard(link);
        }
    };

    const copyContactLinkToClipBoard = async (link: string) => {
        try {
            await Clipboard.write({
                string: link,
            });
            presentToast('Profile link copied to clipboard', {
                hasDismissButton: true,
            });
        } catch (err) {
            presentToast('Unable to copy Profile link to clipboard', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    return (
        <section className="text-grayscale-900 pt-[25px] pb-[16px]">
            <div className="flex flex-col w-full items-start justify-start text-left mb-4 px-4">
                <p className="text-grayscale-900 m-0 text-xl font-notoSans normal tracking-wide">
                    Share
                </p>
                <p className="font-poppins text-[14px] text-grayscale-700 mt-[10px]">
                    Copy your profile url so you can share it with others.
                </p>
            </div>

            <div className="w-full flex items-center justify-center px-4">
                <button
                    onClick={handleShare}
                    className="flex items-center justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white font-poppins text-xl w-full shadow-lg normal tracking-wide"
                >
                    Share Profile <CopyStack className="h-[30px] w-[30px] ml-2" version="2" />
                </button>
            </div>

            {!contractUri && !overrideShareLink && (
                <>
                    <div className="flex items-center justify-center w-full mt-3">
                        <div className="flex items-center justify-center w-full px-5">
                            <h2 className="divider-with-text">
                                <span>or</span>
                            </h2>
                        </div>
                    </div>
                    <div className="w-full flex items-center justify-center mt-1 px-4">
                        <p className="text-grayscale-700 font-normal w-full text-left font-poppins">
                            Allow others to automatically connect to your profile.
                        </p>
                    </div>

                    <div className="w-full flex items-center justify-start px-4 mt-4">
                        <p className="mr-1 font-poppins text-grayscale-700">
                            {expiration === 0 ? 'Link' : 'Link expires in'}
                        </p>
                        <Select
                            value={expiration}
                            setValue={v => setExpiration(v)}
                            placeholder="Select expiration"
                            className="font-semibold text-grayscale-800"
                            options={[
                                { value: 3600, displayText: '1 hour' },
                                { value: 86400, displayText: '24 hours' },
                                { value: 604800, displayText: '7 days' },
                                { value: 2592000, displayText: '30 days' },
                                {
                                    value: 0,
                                    displayText: 'Never expires',
                                    selectedText: 'never expires',
                                },
                            ]}
                        />
                    </div>

                    <div className="w-full flex items-center justify-center mt-4 px-4">
                        <button
                            onClick={generateInviteLink}
                            className="flex items-center justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white font-poppins text-xl w-full shadow-lg normal tracking-wide"
                            disabled={loading}
                        >
                            {loading ? (
                                <IonSpinner name="crescent" />
                            ) : (
                                <>
                                    Generate Invite Link
                                    <LinkChain className="ml-1" version="thin" stroke="white" />
                                </>
                            )}
                        </button>
                    </div>

                    {inviteLink && (
                        <div className="flex items-center justify-center w-full mt-4 rounded-[15px] px-4">
                            <div className="w-full bg-grayscale-100 flex items-center justify-between px-4 py-3 rounded-2xl">
                                <div className="w-[80%] flex justify-start items-center text-left">
                                    <p className="flex items-center justify-center text-left text-grayscale-500 font-medium text-sm line-clamp-1">
                                        {inviteLink}
                                    </p>
                                </div>
                                <div
                                    onClick={copyInviteLinkToClipBoard}
                                    className="w-[20%] flex items-center justify-end"
                                >
                                    <CopyStack className="w-[32px] h-[32px] text-grayscale-900" />
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </section>
    );
};

export default ShareModal;
