import React, { useState, useEffect, memo, useCallback } from 'react';
import { IonList, IonItem } from '@ionic/react';
import { Clipboard } from '@capacitor/clipboard';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

import useDebounce from '../../hooks/useDebounce';
import { useGetProfile } from 'learn-card-base';
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
import { getAppBaseUrl } from '../../config/bootstrapTenantConfig';

import {
    useCountBoostRecipients,
    useGetBoostRecipients,
    UserProfilePicture,
    useResolveBoost,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';

import { VC } from '@learncard/types';
import { getLogger } from 'learn-card-base';
import * as m from '../../paraglide/messages.js';
const log = getLogger('scout-connect-modal');

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
                {
                    className: 'dark-modal-overlay',
                    sectionClassName: 'transparent-modal',
                    disableCloseHandlers: true,
                },
                { mobile: ModalTypes.FullScreen, desktop: ModalTypes.FullScreen }
            );

            await handleSubmitExistingBoostOther(localState.issueTo, _boostUriForClaimLink, 'LIVE');
            setState(INITIAL_STATE);
            closeAllModals();
        } catch (error) {
            log.error('Error handling boost:', error);
            presentToast(m['troops.toasts.boostFail'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const generateBoostClaimLink = useDebounce(async () => {
        try {
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
                    `${getAppBaseUrl()}/claim/boost?claim=true&boostUri=${
                        boostClaimLink?.boostUri
                    }&challenge=${boostClaimLink?.challenge}`
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

                if (rsa) {
                    const boostClaimLink = await wallet?.invoke?.generateClaimLink(
                        _boostUriForClaimLink,
                        {
                            name: sa?.name,
                            endpoint: sa?.endpoint,
                        }
                    );

                    setClaimLink(
                        `${getAppBaseUrl()}/claim/boost?claim=true&boostUri=${
                            boostClaimLink?.boostUri
                        }&challenge=${boostClaimLink?.challenge}`
                    );
                }
            }
        } catch (error) {
            log.error('Error generating claim link:', error);
            presentToast(m['troops.toasts.linkGenFail'](), {
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
            presentToast(m['troops.toasts.linkCopied'](), {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (error) {
            presentToast(m['troops.toasts.linkCopy'](), {
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
                        subTextOverride={m['troops.membersList.issuedSub']({ count: recipientCount ?? 0, person: m[recipientCount === 1 ? 'boost.person_one' : 'boost.person_other']() })}
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
                        <div className="flex flex-row items-center gap-[15px] h-[19px] flex-1 min-w-0 order-0">
                            {linkLoading ? (
                                <p className="w-full min-w-0 h-[19px] font-['Noto_Sans'] font-normal text-[14px] leading-[19px] flex items-center text-[#6F7590] flex-none order-0 self-stretch truncate">
                                    {m['share.genLink']()}
                                </p>
                            ) : (
                                <p className="w-full min-w-0 h-[19px] font-['Noto_Sans'] font-normal text-[14px] leading-[19px] flex items-center text-[#6F7590] flex-none order-0 self-stretch truncate">
                                    {!claimLink ? m['troops.connect.failed']() : claimLink}
                                </p>
                            )}
                        </div>

                        <div
                            onClick={copyTroopLinkToClipBoard}
                            className="w-[30px] h-[30px] flex-shrink-0 cursor-pointer"
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
                        <p className="text-[17px] font-notoSans font-normal">{m['troops.connect.showQr']()}</p>
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
                        <p className="text-[17px] font-notoSans font-normal">{m['troops.connect.share']()}</p>
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
                        <p className="text-[17px] font-notoSans font-normal">{m['troops.connect.browse']()}</p>
                        <AddUserIcon />
                    </button>
                </IonItem>
            </IonList>
        </div>
    );
};

export default ScoutConnectModal;
