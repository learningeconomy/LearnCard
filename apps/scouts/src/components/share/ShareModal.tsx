import React, { useState, useEffect } from 'react';
import * as m from '../../paraglide/messages.js';
import { Capacitor } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';
import { Share } from '@capacitor/share';

import { IonSpinner } from '@ionic/react';
import User from 'learn-card-base/svgs/User';
import CopyStack from '../svgs/CopyStack';

import { useWallet, useToast, ToastTypeEnum } from 'learn-card-base';
import { getLogger } from 'learn-card-base';
import { getAppBaseUrl } from '../../config/bootstrapTenantConfig';
const log = getLogger('share-modal');

const ShareModal: React.FC<{
    handleCloseModal: () => void;
    showCloseButton?: boolean;
    history?: any;
}> = ({ handleCloseModal, showCloseButton = true, history }) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();

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
                const _inviteLink = `${getAppBaseUrl()}/invite?challenge=${
                    generatedInvite?.challenge
                }&profileId=${generatedInvite?.profileId}`;
                setInviteLink(_inviteLink);
                setLoading(false);
            } catch (e) {
                log.debug('generateInvite::error', e);
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
                string: `${getAppBaseUrl()}/connect?did=${wallet?.id?.did()}`,
            });
            presentToast(m['share.profileLinkCopied'](), {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (err) {
            presentToast(m['share.profileLinkCopyFailed'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const copyInviteLinkToClipBoard = async () => {
        try {
            await Clipboard.write({
                string: inviteLink,
            });
            presentToast(m['share.inviteLinkCopied'](), {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (err) {
            presentToast(m['share.inviteLinkCopyFailed'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const handleShare = async () => {
        const wallet = await initWallet();

        if (Capacitor.isNativePlatform()) {
            await Share.share({
                title: m['share.addContact'](),
                text: '',
                url: `${getAppBaseUrl()}/connect?did=${wallet?.id?.did()}`,
                dialogTitle: '',
            });
        } else {
            copyContactLinkToClipBoard();
        }
    };

    return (
        <section className="text-grayscale-900 pt-[36px] pb-[16px]">
            <div className="flex w-full items-center justify-start text-left mb-4 px-4">
                <p className="text-grayscale-900 m-0 text-xl font-bold">{m['common.share']()}</p>
            </div>

            <div className="w-full flex items-center justify-center px-4">
                <button
                    onClick={handleShare}
                    className="flex items-center justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white text-2xl w-full shadow-lg font-medium"
                >
                    <User className="ml-[5px] h-[30px] w-[30px] mr-2" /> {m['share.shareProfile']()}
                </button>
            </div>

            <div className="flex items-center justify-center w-full mt-3">
                <div className="flex items-center justify-center w-full px-5">
                    <h2 className="divider-with-text">
                        <span>{m['share.or']()}</span>
                    </h2>
                </div>
            </div>

            <div className="w-full flex items-center justify-center mt-1 px-4">
                <h1 className="text-grayscale-900 text-[20px]  w-full text-left">
                    {m['share.sendInvLink']()}
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
                                    {m['share.genLink']()}
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
                    {m['share.linkExpires']({ time: '1 hour' })}
                </h1>
            </div>
        </section>
    );
};

export default ShareModal;
