import React, { useState, useEffect, memo, useCallback } from 'react';
import { IonList, IonItem } from '@ionic/react';
import { Clipboard } from '@capacitor/clipboard';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

import useDebounce from '../../hooks/useDebounce';
import { useGetProfile, walletStore } from 'learn-card-base';
import { useWallet } from 'learn-card-base';
import { ModalTypes, useModal } from 'learn-card-base';

import CopyStack from '../../components/svgs/CopyStack';
import QRCodeModalContent from '../../components/qrcode-scanner-button/QRCodeModalContent';
import QRCodeIcon from '../../components/svgs/QRCodeIcon';
import ShareArrow from '../../components/svgs/ShareArrow';
import AddUserIcon from '../../components/svgs/AddUserIcon';
import TroopID from './TroopID';
import ShortBoostSomeoneScreen from '../../components/boost/boost-options/boostUserOptions/ShortBoostSomeoneScreen';
import useBoost from '../../components/boost/hooks/useBoost';
import { BoostCMSIssueTo, ShortBoostState } from '../../components/boost/boost';
import { useHistory } from 'react-router';
import { BoostIssuanceLoading } from '../../components/boost/boostLoader/BoostLoader';

import {
    useCountBoostRecipients,
    useGetBoostRecipients,
    UserProfilePicture,
    useResolveBoost,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';

import { VC } from '@learncard/types';

// Types
interface ScoutConnectModalProps {
    boostUriForClaimLink: string;
    type: string;
    credential: VC;
}

interface ToastConfig {
    message: string;
    duration?: number;
    position?: 'top' | 'bottom' | 'middle';
    cssClass?: string;
}

const INITIAL_STATE = {
    issueTo: [],
};

const RecipientAvatars = memo(({ recipients }: { recipients: any[] }) => (
    <div className="flex">
        {recipients?.slice(0, 5)?.map((r, index) => (
            <UserProfilePicture
                key={index}
                user={r.to}
                customContainerClass="flex justify-center items-center w-[25px] h-[25px] rounded-full overflow-hidden text-white font-medium text-4xl mr-3"
                customImageClass="flex justify-center items-center w-[25px] h-[25px] rounded-full overflow-hidden object-cover"
                customSize={120}
            />
        ))}
        {(recipients?.length ?? 0) > 5 && (
            <div className="w-[25px] h-[25px] text-[12px] font-notoSans font-[600] flex items-center justify-center bg-gray-100 rounded-full text-gray-600 z-10">
                +{recipients?.length - 5}
            </div>
        )}
    </div>
));

const ScoutConnectModal: React.FC<ScoutConnectModalProps> = ({
    boostUriForClaimLink,
    type,
    credential,
}) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const history = useHistory();

    const _boostUriForClaimLink = boostUriForClaimLink || credential?.boostId;

    const [linkLoading, setLinkLoading] = useState(true);
    const [claimLink, setClaimLink] = useState<string>('');
    const [state, setState] = useState(INITIAL_STATE);

    const { newModal, closeModal, closeAllModals } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    // Custom hooks
    const { data: recipientCount } = useCountBoostRecipients(_boostUriForClaimLink);
    const { data: recipients } = useGetBoostRecipients(_boostUriForClaimLink);
    const { data: boost } = useResolveBoost(_boostUriForClaimLink);
    const { data: myProfile } = useGetProfile();
    const { handleSubmitExistingBoostOther } = useBoost(history);

    const handleBoostOther = async (localState: typeof INITIAL_STATE) => {
        if (!myProfile?.profileId) return;

        try {
            newModal(
                <BoostIssuanceLoading />,
                { disableCloseHandlers: true },
                { mobile: ModalTypes.FullScreen, desktop: ModalTypes.FullScreen }
            );

            await handleSubmitExistingBoostOther(localState.issueTo, _boostUriForClaimLink, 'LIVE');
            setState(INITIAL_STATE);
            closeAllModals();
        } catch (error) {
            console.error('Error handling boost:', error);
            presentToast('Failed to process boost', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const generateBoostClaimLink = useDebounce(async () => {
        try {
            walletStore.set.wallet(null);
            const wallet = await initWallet();
            const rsas = await wallet?.invoke?.getRegisteredSigningAuthorities();

            if (rsas?.length > 0) {
                const rsa = rsas[0];
                const boostClaimLink = await wallet?.invoke?.generateClaimLink(
                    _boostUriForClaimLink,
                    {
                        name: rsa?.relationship?.name,
                        endpoint: rsa?.signingAuthority?.endpoint,
                    }
                );

                setClaimLink(
                    `https://pass.scout.org/claim/boost?claim=true&boostUri=${boostClaimLink?.boostUri}&challenge=${boostClaimLink?.challenge}`
                );
            } else {
                // Handle new signing authority creation
                const signingAuthorities = await wallet.invoke.getSigningAuthorities();
                let sa = signingAuthorities.find(sa => sa?.name === 'lca-sa');

                if (!sa) {
                    sa = await wallet?.invoke?.createSigningAuthority('lca-sa');
                }

                const rsa = await wallet?.invoke?.registerSigningAuthority(
                    sa?.endpoint,
                    sa?.name,
                    sa?.did
                );

                if (rsa && claimLink) {
                    const boostClaimLink = await wallet?.invoke?.generateClaimLink(
                        _boostUriForClaimLink,
                        {
                            name: sa?.name,
                            endpoint: sa?.endpoint,
                        }
                    );

                    setClaimLink(
                        `https://pass.scout.org/claim/boost?claim=true&boostUri=${boostClaimLink?.boostUri}&challenge=${boostClaimLink?.challenge}`
                    );
                }
            }
        } catch (error) {
            console.error('Error generating claim link:', error);
            presentToast('Failed to generate claim link', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            setLinkLoading(false);
        }
    });

    const copyTroopLinkToClipBoard = async () => {
        try {
            await Clipboard.write({ string: claimLink });
            presentToast('Troop link copied to clipboard', {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (error) {
            presentToast('Unable to copy Troop link', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const handleShare = async () => {
        if (Capacitor.isNativePlatform()) {
            await Share.share({
                title: 'Invite contact',
                text: '',
                url: claimLink,
                dialogTitle: '',
            });
        } else {
            await copyTroopLinkToClipBoard();
        }
    };

    useEffect(() => {
        generateBoostClaimLink();
    }, [_boostUriForClaimLink]);

    return (
        <div className="w-full max-w-[600px] mx-auto h-full p-4 mt-[5px] md:mt-16 lg:mt-24 flex flex-col gap-4">
            <IonList className="ion-no-padding py-2">
                <div className="p-[15px]">
                    <TroopID
                        credential={boost}
                        name={type}
                        thumbSrc={boost?.boostID?.idThumbnail}
                        subTextOverride={`Issued to ${recipientCount} ${
                            recipientCount === 1 ? 'person' : 'people'
                        }`}
                        issuedDateOverride={
                            <div className="flex">
                                {recipients?.slice(0, 5)?.map((r, index) => (
                                    <UserProfilePicture
                                        key={index}
                                        user={r.to}
                                        customContainerClass="flex justify-center items-center w-[25px] h-[25px] rounded-full overflow-hidden text-white font-medium text-4xl mr-3"
                                        customImageClass="flex justify-center items-center w-[25px] h-[25px] rounded-full overflow-hidden object-cover"
                                        customSize={120}
                                    />
                                ))}
                                {(recipients?.length ?? 0) > 5 && (
                                    <div className="w-[25px] h-[25px] text-[12px] font-notoSans font-[600] flex items-center justify-center bg-gray-100 rounded-full text-gray-600 z-10">
                                        +{recipients?.length - 5}
                                    </div>
                                )}
                            </div>
                        }
                    />
                </div>

                {/* Copy to Clipboard */}
                <IonItem lines="none" className="mt-2">
                    <div className="flex flex-row items-center p-5 gap-[10px] w-full h-[70px] bg-[#EFF0F5] rounded-[15px] flex-none order-0 flex-grow-0">
                        <div className="flex flex-row items-center gap-[15px] w-[235px] h-[19px] flex-none order-0 flex-grow-1">
                            {linkLoading ? (
                                <p className="w-[235px] h-[19px] font-['Noto_Sans'] font-normal text-[14px] leading-[19px] flex items-center text-[#6F7590] flex-none order-0 self-stretch flex-grow-0">
                                    Generating Link...
                                </p>
                            ) : (
                                <p className="w-[235px] h-[19px] font-['Noto_Sans'] font-normal text-[14px] leading-[19px] flex items-center text-[#6F7590] flex-none order-0 self-stretch flex-grow-0 truncate">
                                    {!claimLink ? 'Failed to generate link' : claimLink}
                                </p>
                            )}
                        </div>

                        <div
                            onClick={copyTroopLinkToClipBoard}
                            className="w-[30px] h-[30px] flex-shrink-0 ml-auto cursor-pointer"
                        >
                            <CopyStack className="w-full h-full text-[#18224E]" />
                        </div>
                    </div>
                </IonItem>

                {/* Show QR Code*/}
                <IonItem lines="inset" className="mt-2">
                    <button
                        className="flex justify-between items-center w-full disabled:opacity-60"
                        onClick={() => {
                            newModal(
                                <QRCodeModalContent
                                    boostClaimLink={claimLink}
                                    credential={credential}
                                    type={type}
                                    copyTroopLinkToClipBoard={copyTroopLinkToClipBoard}
                                />,
                                {
                                    sectionClassName: '!bg-transparent !shadow-none !max-w-[355px]',
                                },
                                { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
                            );
                        }}
                        disabled={!claimLink}
                    >
                        <p className="text-[17px] font-notoSans font-normal">Show QR Code</p>
                        <QRCodeIcon height="30px" width="30px" />
                    </button>
                </IonItem>

                {/* Share Link */}
                <IonItem lines="inset" className="mt-2">
                    <button
                        className="flex justify-between items-center w-full disabled:opacity-60"
                        onClick={handleShare}
                        disabled={!claimLink}
                    >
                        <p className="text-[17px] font-notoSans font-normal">Share Link</p>
                        <ShareArrow />
                    </button>
                </IonItem>

                {/* Browse Contacts */}
                <IonItem lines="none" className="mt-2">
                    <button
                        onClick={() => {
                            newModal(
                                <ShortBoostSomeoneScreen
                                    boostUri={_boostUriForClaimLink}
                                    profileId={myProfile?.profileId}
                                    history={history}
                                    issuedTo={state.issueTo}
                                    handleCloseModal={closeModal}
                                    handleBoostSomeone={handleBoostOther}
                                    state={state}
                                    setState={setState}
                                    ignoreBoostSearchRestriction
                                />,

                                {
                                    className: '!p-0',
                                    sectionClassName: '!p-0 !max-w-[450px]',
                                },
                                { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
                            );
                        }}
                        className="flex justify-between items-center w-full"
                    >
                        <p className="text-[17px] font-notoSans font-normal">Browse Contacts</p>
                        <AddUserIcon />
                    </button>
                </IonItem>
            </IonList>
        </div>
    );
};

export default ScoutConnectModal;
