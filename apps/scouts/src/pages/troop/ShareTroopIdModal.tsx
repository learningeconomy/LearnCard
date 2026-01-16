import React, { useEffect, useState } from 'react';
import { Clipboard } from '@capacitor/clipboard';
import { QRCodeSVG } from 'qrcode.react';
import { IonSpinner } from '@ionic/react';
import {
    ProfilePicture,
    useGetCurrentLCNUser,
    useShareBoostMutation,
    useGetCredentialWithEdits,
    useToast,
    ToastTypeEnum,
    useGetProfile,
} from 'learn-card-base';

import { getScoutsNounForCred, useGetNetworkFromTroop } from '../../helpers/troop.helpers';
import { VC } from '@learncard/types';
import { getCredentialSubject as getSubject } from 'learn-card-base/helpers/credentialHelpers';

type ShareTroopIdModalProps = {
    credential: VC;
    uri: string;
    unknownVerifierTitle?: string;
};

const ShareTroopIdModal: React.FC<ShareTroopIdModalProps> = ({
    credential,
    uri,
    unknownVerifierTitle,
}) => {
    const { presentToast } = useToast();

    const currentUser = useGetCurrentLCNUser();
    const network = useGetNetworkFromTroop(uri);

    const { credentialWithEdits } = useGetCredentialWithEdits(credential);

    const [shareLink, setShareLink] = useState<string | undefined>('');
    const subject = getSubject(credential);
    const issueeDid = typeof subject?.id === 'string' ? subject?.id : (subject?.id as any)?.id;
    const issueeProfileId = issueeDid?.includes(':users:') ? issueeDid.split(':').pop() : undefined;
    const { data: issueeProfile } = useGetProfile(issueeProfileId);

    const { mutate: shareEarnedBoost, loading: isLinkLoading } = useShareBoostMutation() as any;

    const generateShareLink = async () => {
        shareEarnedBoost(
            { credential, credentialUri: uri },
            {
                async onSuccess(data: any) {
                    setShareLink(data?.link);
                },
            }
        );
    };

    useEffect(() => {
        generateShareLink();
    }, []);

    const copyToClipBoard = async () => {
        if (!shareLink) return;

        try {
            await Clipboard.write({
                string: shareLink,
            });
            presentToast('Link copied to clipboard!', {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (err) {
            presentToast('Failed to copy link to clipboard', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    return (
        <div className="flex flex-col gap-[0.62rem]">
            <section className="bg-white rounded-[20px] flex flex-col items-center gap-[30px] w-full px-[20px] pt-[20px] pb-[30px]">
                <div className="flex flex-col items-center gap-[10px]">
                    <ProfilePicture
                        customContainerClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden border-white border-solid border-[3px] text-white font-medium text-xl min-w-[70px] min-h-[70px]"
                        customImageClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[70px] min-h-[70px]"
                        customSize={120}
                    />
                    <div className="flex flex-col items-center">
                        <span className="font-notoSans text-grayscale-900 text-[20px] font-[600]">
                            {issueeProfile?.displayName ??
                                currentUser.currentLCNUser?.displayName ??
                                'Unknown'}
                        </span>
                        <span className="font-notoSans text-grayscale-700 text-[14px] font-[600]">
                            {getScoutsNounForCred(credential)}
                        </span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="flex items-center gap-[4px] font-notoSans text-[17px] text-grayscale-900">
                            {credentialWithEdits?.name}
                        </span>
                        <span className="font-notoSans text-[14px] font-[600] text-grayscale-900">
                            {network?.name}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col justify-center items-center w-full relative">
                    {!isLinkLoading && shareLink && shareLink?.length > 0 && (
                        <div className="relative h-[255px] w-[255px]">
                            <QRCodeSVG
                                className="h-full w-full"
                                value={shareLink}
                                bgColor="transparent"
                            />
                        </div>
                    )}

                    {(isLinkLoading || shareLink?.length === 0) && (
                        <div className="min-w-[255px] min-h-[255px] h-full w-full relative flex items-center justify-center">
                            <IonSpinner name="crescent" color="dark" className="scale-[1]" />
                        </div>
                    )}
                </div>
            </section>
            <div className="bg-white rounded-[20px]">
                <button
                    onClick={copyToClipBoard}
                    className="bg-sp-purple-base w-full rounded-[20px] py-2 font-notoSans text-lg disabled:opacity-80 text-white"
                    disabled={!shareLink}
                >
                    Share Link
                </button>
            </div>
        </div>
    );
};

export default ShareTroopIdModal;
