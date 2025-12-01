import React, { useEffect, useState } from 'react';
import { Clipboard } from '@capacitor/clipboard';
import moment from 'moment';

import {
    BoostCategoryOptionsEnum,
    ModalTypes,
    useModal,
    useWallet,
    walletStore,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';

import { IonPage, useIonModal } from '@ionic/react';
import CopyStack from 'apps/learn-card-app/src/components/svgs/CopyStack';
import BoostShareableQRCode from '../../../boost/boostCMS/boostCMSForms/boostCMSIssueTo/BoostShareableQRCode';
import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import useDebounce from 'apps/learn-card-app/src/hooks/useDebounce';
import ModalLayout from 'learn-card-base/components/modals/ionic-modals/CancelModalLayout';
import FamilyCrest from '../../FamilyCrest/FamilyCrest';
import ReplyIcon from 'learn-card-base/svgs/ReplyIcon';
import BoostSearch from '../../../boost/boost-search/BoostSearch';
import FamilyGuardianIssueToList from './FamilyGuardianIssueToList';
import AddUser from '../../../svgs/AddUser';

import { VC } from '@learncard/types';
import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { BoostCMSIssueTo, ShortBoostState } from '../../../boost/boost';

type FamilyInviteGuardianProps = {
    boostUri: string;
    credential: VC;
    handleCloseModal: () => void;
};

export const FamilyInviteGuardian: React.FC<FamilyInviteGuardianProps> = ({
    credential,
    boostUri,
    handleCloseModal,
}) => {
    const { initWallet } = useWallet();

    const [expirationDate, setExpirationDate] = useState<undefined | string>(undefined);
    const [claimLimit, setClaimLimit] = useState<number | undefined>(undefined);
    const [state, setState] = useState<ShortBoostState>({ issueTo: [] as BoostCMSIssueTo[] });

    const [isLinkLoading, setIsLinkLoading] = useState<boolean>(false);
    const [generateClaimLink, setGenerateClaimLink] = useState<boolean>(true);
    const [boostClaimLink, setBoostClaimLink] = useState<string>('');

    const { presentToast } = useToast();

    const getExpirationInSeconds = () => {
        const today = moment(); // now
        const expiration = moment(expirationDate); // expiration date
        const differenceInSeconds = expiration.diff(today, 'seconds', true); // get difference between both dates in seconds
        return Math.floor(differenceInSeconds);
    };

    const generateBoostClaimLink = useDebounce(async () => {
        if (isLinkLoading) return;
        if (generateClaimLink) setIsLinkLoading(true);

        walletStore.set.wallet(null); // ! clear wallet store, to prevent stale challenges
        const wallet = await initWallet(); // re-init wallet after clearing wallet store

        try {
            const rsas = await wallet?.invoke?.getRegisteredSigningAuthorities();

            if (rsas?.length > 0) {
                const rsa = rsas?.[0];

                if (generateClaimLink) {
                    let _ttlSeconds = undefined;
                    if (expirationDate) {
                        _ttlSeconds = getExpirationInSeconds();
                    }
                    // generate claim link with existing rsa
                    const _boostClaimLink = await wallet?.invoke?.generateClaimLink(
                        boostUri,
                        {
                            name: rsa?.relationship?.name,
                            endpoint: rsa?.signingAuthority?.endpoint,
                        },
                        {
                            ttlSeconds: _ttlSeconds,
                            totalUses:
                                claimLimit !== undefined && claimLimit > 0
                                    ? Math.floor(Number(claimLimit))
                                    : undefined,
                        }
                    );

                    setBoostClaimLink(
                        `https://learncard.app/claim/boost?claim=true&boostUri=${_boostClaimLink?.boostUri}&challenge=${_boostClaimLink?.challenge}`
                    );
                    setIsLinkLoading(false);
                }
            } else {
                const signingAuthorities = await wallet.invoke.getSigningAuthorities();

                // find existing signing authority
                let sa = signingAuthorities.find(
                    signingAuthority => signingAuthority?.name === 'lca-sa'
                );

                if (!sa) {
                    // create signing authority
                    sa = await wallet?.invoke?.createSigningAuthority('lca-sa');
                }

                // register signing authority
                const rsa = await wallet?.invoke?.registerSigningAuthority(
                    sa?.endpoint,
                    sa?.name,
                    sa?.did
                );

                if (rsa) {
                    if (generateClaimLink) {
                        let _ttlSeconds = undefined;
                        if (expirationDate) {
                            _ttlSeconds = getExpirationInSeconds();
                        }
                        const _boostClaimLink = await wallet?.invoke?.generateClaimLink(
                            boostUri,
                            {
                                name: sa?.name,
                                endpoint: sa?.endpoint,
                            },
                            {
                                ttlSeconds: _ttlSeconds,
                                totalUses:
                                    claimLimit !== undefined && claimLimit > 0
                                        ? Math.floor(Number(claimLimit))
                                        : undefined,
                            }
                        );

                        setBoostClaimLink(
                            `https://learncard.app/claim/boost?claim=true&boostUri=${_boostClaimLink?.boostUri}&challenge=${_boostClaimLink?.challenge}`
                        );
                        setIsLinkLoading(false);
                    }
                }
            }
        } catch (error) {
            setIsLinkLoading(false);
            console.log('error:generateBoostClaimLink', error);
        }
    });

    const copyBoostLinkToClipBoard = async () => {
        try {
            await Clipboard.write({
                string: boostClaimLink,
            });
            presentToast('Boost link copied to clipboard', {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (err) {
            presentToast('Unable to copy boost link to clipboard', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const handleShare = async () => {
        if (Capacitor.isNativePlatform()) {
            await Share.share({
                title: 'Guardian Invite',
                text: '',
                url: boostClaimLink,
                dialogTitle: '',
            });
        } else {
            copyBoostLinkToClipBoard();
        }
    };

    const thumbnail = credential?.image;
    const emoji = credential?.display?.emoji;
    const familyName = credential?.name;

    const shareableCodeState = {
        basicInfo: {
            type: BoostCategoryOptionsEnum.family,
            achievementType: AchievementTypes.Family,
            name: familyName,
        },
        appearance: {
            badgeThumbnail: thumbnail,
            emoji: emoji,
        },
    };

    const [presentClaimQRCode, dismissClaimQRCode] = useIonModal(BoostShareableQRCode, {
        state: shareableCodeState,
        handleCloseModal: () => dismissClaimQRCode(),
        boostClaimLink: boostClaimLink,
        text: 'Scan Code to Join Family',
    });

    const [presentIssueTo, dismissIssueTo] = useIonModal(FamilyGuardianIssueToList, {
        state: state,
        setState: setState,
        handleCloseModal: () => dismissIssueTo(),
        handleOpenSearch: () => {
            presentSearchContacts();
        },
        boostUri: boostUri,
    });

    const [presentSearchContacts, dismissSearchContacts] = useIonModal(BoostSearch, {
        state: state,
        setState: setState,
        handleCloseModal: () => {
            dismissSearchContacts();
        },
        onSave: () => {
            presentIssueTo();
        },
    });

    useEffect(() => {
        generateBoostClaimLink();
    }, []);

    return (
        <IonPage>
            <ModalLayout handleOnClick={handleCloseModal} containerClass="!pt-6">
                <div className="w-full">
                    <FamilyCrest
                        containerClassName="z-9999 !mt-[65px]"
                        imageClassName="w-[90px]"
                        familyName={familyName}
                        thumbnail={thumbnail}
                        showSleeve={false}
                        showEmoji={emoji?.unified}
                        emoji={emoji}
                    />

                    <div className="flex flex-col items-center justify-center w-full mb-4 mt-6 rounded-[15px]">
                        <div className="w-[90%] bg-grayscale-100 flex items-center justify-between px-4 rounded-2xl py-4">
                            <div className="w-[80%] flex flex-col justify-center items-start text-left">
                                <p className="w-full text-grayscale-600 line-clamp-1 font-poppins text-sm">
                                    {isLinkLoading ? 'Generating Link...' : boostClaimLink}
                                </p>
                            </div>
                            <div
                                onClick={copyBoostLinkToClipBoard}
                                className="w-[20%] flex items-center justify-end"
                            >
                                <CopyStack className="w-[32px] h-[32px] text-grayscale-600" />
                            </div>
                        </div>
                        <div className="w-full px-4 mt-6">
                            <button
                                onClick={() => {
                                    handleCloseModal();
                                    presentClaimQRCode();
                                }}
                                disabled={isLinkLoading}
                                className="w-full flex items-center justify-between px-2 border-b-grayscale-200 py-4 border-solid border-b-[1px]"
                            >
                                <div className="flex flex-col items-start justify-center">
                                    <p
                                        className={`m-0 p-0 text-lg font-poppins ${
                                            isLinkLoading
                                                ? 'text-grayscale-400'
                                                : 'text-grayscale-900'
                                        }`}
                                    >
                                        Show QR Code
                                    </p>
                                </div>
                                <div className="max-w-[30px] max-h-[30px] min-h-[30px] min-w-[30px] object-contain rounded-full bg-white mr-2">
                                    <QRCodeScanner
                                        className={`h-[30px] w-[30px] text-grayscale-900`}
                                    />
                                </div>
                            </button>
                        </div>
                        <div className="w-full px-4 mt-2">
                            <button
                                onClick={() => {
                                    handleCloseModal();
                                    handleShare();
                                }}
                                disabled={isLinkLoading}
                                className="w-full flex items-center justify-between px-2 border-b-grayscale-200 border-solid border-b-[1px] py-4"
                            >
                                <div className="flex flex-col items-start justify-center">
                                    <p
                                        className={`m-0 p-0 text-lg font-poppins ${
                                            isLinkLoading
                                                ? 'text-grayscale-400'
                                                : 'text-grayscale-900'
                                        }`}
                                    >
                                        Share Link
                                    </p>
                                </div>
                                <div className="max-w-[30px] max-h-[30px] min-h-[30px] min-w-[30px] object-contain rounded-full bg-white mr-2">
                                    <ReplyIcon
                                        version="2"
                                        className={`h-[30px] w-[30px] text-grayscale-900`}
                                    />
                                </div>
                            </button>
                        </div>
                        <div className="w-full px-4 mt-2">
                            <button
                                onClick={() => {
                                    presentSearchContacts();
                                }}
                                disabled={isLinkLoading}
                                className="w-full flex items-center justify-between px-2 border-b-grayscale-200 py-4"
                            >
                                <div className="flex flex-col items-start justify-center">
                                    <p
                                        className={`m-0 p-0 text-lg font-poppins ${
                                            isLinkLoading
                                                ? 'text-grayscale-400'
                                                : 'text-grayscale-900'
                                        }`}
                                    >
                                        Browse Contacts
                                    </p>
                                </div>
                                <div className="max-w-[30px] max-h-[30px] min-h-[30px] min-w-[30px] object-contain rounded-full bg-white mr-2">
                                    <AddUser
                                        version="2"
                                        className={`h-[30px] w-[30px] text-grayscale-900`}
                                    />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </ModalLayout>
        </IonPage>
    );
};

export default FamilyInviteGuardian;
