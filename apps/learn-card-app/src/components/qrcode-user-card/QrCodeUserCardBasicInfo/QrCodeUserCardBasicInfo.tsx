import React from 'react';
import { Clipboard } from '@capacitor/clipboard';

import ChainLink from 'learn-card-base/svgs/LinkChain';

import {
    useCurrentUser,
    ProfilePicture,
    useToast,
    ToastTypeEnum,
    UserProfilePicture,
} from 'learn-card-base';

const QrCodeUserCardBasicInfo: React.FC<{
    walletDid: string;
    profileId: string;
    contractUri?: string;
    overrideShareLink?: string;
    overrideName?: string;
    overrideImage?: string;
}> = ({ walletDid, profileId, contractUri, overrideShareLink, overrideName, overrideImage }) => {
    const currentUser = useCurrentUser();
    const { presentToast } = useToast();

    const copyToClipBoard = async () => {
        try {
            let link = `learncard.app/connect?connect=true&did=${walletDid}`;

            if (contractUri) {
                link = `${
                    IS_PRODUCTION ? 'https://learncard.app' : 'http://localhost:3000'
                }/passport?contractUri=${contractUri}&teacherProfileId=${profileId}&insightsConsent=true`;
            }

            if (overrideShareLink) {
                link = overrideShareLink;
            }

            await Clipboard.write({
                string: link,
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
        <div className="flex w-full flex-col gap-2 items-center justify-center">
            <ProfilePicture
                customContainerClass="flex justify-center items-center h-[80px] w-[80px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-4xl min-w-[80px] min-h-[80px] "
                customImageClass="flex justify-center items-center h-[80px] w-[80px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[80px] min-h-[80px]"
                customSize={164}
            />
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col items-center justify-center my-6">
            {profilePicture}
            <p
                className={`text-2xl capitalize text-center font-medium w-full text-grayscale-900 mt-2`}
            >
                {name}
            </p>
            {profileId && (
                <button
                    onClick={copyToClipBoard}
                    className={`text-base flex items-center justify-center text-center font-medium text-grayscale-900`}
                >
                    <ChainLink className="h-[20px]" /> {`learncard.app/...${profileId}`}
                </button>
            )}
        </div>
    );
};

export default QrCodeUserCardBasicInfo;
