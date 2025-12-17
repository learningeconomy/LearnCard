import React from 'react';
import { Clipboard } from '@capacitor/clipboard';

import ChainLink from 'learn-card-base/svgs/LinkChain';

import { useCurrentUser, ProfilePicture, useToast, ToastTypeEnum } from 'learn-card-base';

const QrCodeUserCardBasicInfo: React.FC<{ walletDid: string; profileId: string }> = ({
    walletDid,
    profileId,
}) => {
    const currentUser = useCurrentUser();
    const { presentToast } = useToast();

    const copyToClipBoard = async () => {
        try {
            await Clipboard.write({
                string: `https://learncard.app/connect?connect=true&did=${walletDid}`,
            });
            presentToast('Link copied to clipboard', {
                hasDismissButton: true,
            });
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            presentToast('Unable to copy link to clipboard', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    return (
        <div className="flex w-full flex-col items-center justify-center my-6">
            <ProfilePicture
                customContainerClass="flex justify-center items-center h-[80px] w-[80px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-4xl min-w-[80px] min-h-[80px] "
                customImageClass="flex justify-center items-center h-[80px] w-[80px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[80px] min-h-[80px]"
                customSize={164}
            />
            <p className={`text-2xl text-center font-medium w-full text-grayscale-900 mt-2`}>
                {currentUser?.name || currentUser?.email}
            </p>
            {profileId && (
                <button
                    onClick={copyToClipBoard}
                    className={`text-base flex items-center text-center font-medium text-grayscale-900`}
                >
                    <ChainLink className="h-[20px]" /> {`learncard.app/...${profileId}`}
                </button>
            )}
        </div>
    );
};

export default QrCodeUserCardBasicInfo;
