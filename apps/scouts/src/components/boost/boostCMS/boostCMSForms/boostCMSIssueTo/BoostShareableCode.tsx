import React, { useEffect, useState } from 'react';
import { Clipboard } from '@capacitor/clipboard';
import moment from 'moment';

import {
    IonRow,
    IonCol,
    IonGrid,
    IonSpinner,
    IonToggle,
    IonDatetime,
    IonInput,
} from '@ionic/react';

import { useWallet, walletStore, useToast, ToastTypeEnum, useModal, ModalTypes } from 'learn-card-base';
import { BoostCMSState } from '../../../boost';

import CopyStack from '../../../../svgs/CopyStack';
import Calendar from '../../../../svgs/Calendar';
import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import BoostShareableQRCode from './BoostShareableQRCode';
// @ts-ignore
import InfinityIcon from 'learn-card-base/svgs/Infinity';
import useDebounce from '../../../../../hooks/useDebounce';
import useFirebaseAnalytics from '../../../../../hooks/useFirebaseAnalytics';

export const BoostShareableCode: React.FC<{
    state: BoostCMSState;
    boostUri: string;
    customClassName?: string;
    defaultGenerateLinkToggleState?: boolean;
}> = ({ state, boostUri, customClassName, defaultGenerateLinkToggleState = false }) => {
    const { initWallet } = useWallet();
    const { logAnalyticsEvent } = useFirebaseAnalytics();

    const [toggle, setToggle] = useState<boolean>(defaultGenerateLinkToggleState ?? false);
    const [expirationDate, setExpirationDate] = useState<undefined | string>(undefined);

    const [claimLimitToggle, setClaimLimitToggle] = useState<boolean>(false);
    const [claimLimit, setClaimLimit] = useState<number | undefined>(undefined);

    const [isLinkLoading, setIsLinkLoading] = useState<boolean>(false);
    const [generateClaimLink, setGenerateClaimLink] = useState<boolean>(false);
    const [boostClaimLink, setBoostClaimLink] = useState<string>('');

    const { presentToast } = useToast();

    const { newModal: newDatePickerModal, closeModal: closeDatePickerModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

    const { newModal: newQRCodeModal, closeModal: closeQRCodeModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

    const openDatePicker = () => {
        newDatePickerModal(
            <div className="w-full h-full transparent flex items-center justify-center">
                <IonDatetime
                    onIonChange={e => {
                        clearBoostLink();
                        setExpirationDate(moment(e.detail.value as string).toISOString());
                    }}
                    value={expirationDate ? moment(expirationDate).format('YYYY-MM-DD') : null}
                    id="datetime"
                    presentation="date-time"
                    className="bg-white text-black rounded-[20px] shadow-3xl z-50"
                    showDefaultButtons
                    showDefaultTimeLabel
                    color="indigo-500"
                    max="2050-12-31"
                    min={moment().format('YYYY-MM-DD')}
                />
            </div>
        );
    };

    const presentBoostCode = () => {
        newQRCodeModal(
            <BoostShareableQRCode
                state={state}
                showEditButton={true}
                handleCloseModal={() => closeQRCodeModal()}
                boostClaimLink={boostClaimLink}
            />
        );
    };

    const getExpirationInSeconds = () => {
        const today = moment(); // now
        const expiration = moment(expirationDate); // expiration date
        const differenceInSeconds = expiration.diff(today, 'seconds', true); // get difference between both dates in seconds
        return Math.floor(differenceInSeconds);
    };

    const clearBoostLink = () => setBoostClaimLink('');

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
                                claimLimit !== undefined && (claimLimit as number) > 0
                                    ? Math.floor(Number(claimLimit))
                                    : undefined,
                        }
                    );

                    setBoostClaimLink(
                        `https://pass.scout.org/claim/boost?claim=true&boostUri=${_boostClaimLink?.boostUri}&challenge=${_boostClaimLink?.challenge}`
                    );
                    logAnalyticsEvent('generate_claim_link', {
                        category: state?.basicInfo?.type,
                        boostType: state?.basicInfo?.achievementType,
                        method: 'Claim Link',
                    });
                    setIsLinkLoading(false);
                }
            } else {
                const signingAuthorities = await wallet?.invoke.getSigningAuthorities();

                // find existing signing authority
                let sa = signingAuthorities?.find(
                    (signingAuthority: any) => signingAuthority?.name === 'lca-sa'
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
                                    claimLimit !== undefined && (claimLimit as number) > 0
                                        ? Math.floor(Number(claimLimit))
                                        : undefined,
                            }
                        );

                        setBoostClaimLink(
                            `https://pass.scout.org/claim/boost?claim=true&boostUri=${_boostClaimLink?.boostUri}&challenge=${_boostClaimLink?.challenge}`
                        );
                        logAnalyticsEvent('generate_claim_link', {
                            category: state?.basicInfo?.type,
                            boostType: state?.basicInfo?.achievementType,
                            method: 'Claim Link',
                        });
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

    useEffect(() => {
        // registers signing authority on initial toggle
        if (toggle) {
            generateBoostClaimLink(false);
        } else {
            // clears state on toggle off
            setClaimLimit(undefined);
            setExpirationDate(undefined);
            setBoostClaimLink('');
        }
    }, [toggle]);

    return (
        <IonGrid className={`w-full flex items-center justify-center flex-col ${customClassName}`}>
            <IonRow className="w-full bg-white flex flex-col items-center justify-center max-w-[600px] mt-4 rounded-[20px] ion-padding">
                <div className="w-full flex items-center justify-between px-[8px] py-[8px]">
                    <p className="text-grayscale-900 font-medium w-10/12">Generate Claim Link?</p>
                    <IonToggle
                        mode="ios"
                        color="emerald-700"
                        onIonChange={() => {
                            setToggle(!toggle);
                        }}
                        checked={toggle}
                    />
                </div>

                {toggle && (
                    <>
                        <div className="flex flex-col items-center justify-center w-full mb-2 mt-2">
                            <button
                                className="w-full flex items-center justify-between bg-grayscale-100 text-grayscale-500 rounded-[15px] px-[16px] py-[12px] font-medium tracking-widest text-base"
                                onClick={() => {
                                    openDatePicker();
                                }}
                            >
                                {expirationDate
                                    ? moment(expirationDate).format('MMMM Do, YYYY - hh:mm A')
                                    : 'Expiration Date'}
                                <Calendar className="w-[30px] text-grayscale-700" />
                            </button>
                        </div>

                        <div className="w-full flex flex-col  py-[8px]">
                            <div className="flex w-full items-center justify-between mb-4">
                                <p className="text-grayscale-900 font-medium w-10/12 text-left pr-2">
                                    Set Claim Limit?
                                </p>
                                <IonToggle
                                    mode="ios"
                                    color="emerald-700"
                                    onClick={() => {
                                        setClaimLimit(undefined);
                                        setClaimLimitToggle(!claimLimitToggle);
                                    }}
                                    checked={claimLimitToggle}
                                />
                            </div>

                            {claimLimitToggle && (
                                <div className="flex items-center">
                                    <IonInput
                                        autocapitalize="on"
                                        className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base mr-2`}
                                        placeholder="Unlimited"
                                        type="number"
                                        min={0}
                                        value={claimLimit}
                                        onIonInput={e => {
                                            clearBoostLink();
                                            setClaimLimit(Number(e.detail.value));
                                        }}
                                        onKeyDown={e => {
                                            // Allow only numbers
                                            if (
                                                !/[0-9]/.test(e.key) &&
                                                e.key !== 'Backspace' &&
                                                e.key !== 'Delete'
                                            ) {
                                                e.preventDefault();
                                            }
                                        }}
                                        onPaste={e => {
                                            e.preventDefault();
                                            // Get the pasted text and remove any non-numeric characters
                                            const pastedText = (
                                                e.clipboardData || (window as any).Clipboard
                                            ).getData('text');
                                            const numericText = pastedText.replace(/\D/g, '');
                                            if (numericText) {
                                                setClaimLimit(Number(numericText));
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="w-full flex items-center justify-center mb-4 mt-4">
                            <button
                                onClick={() => {
                                    setGenerateClaimLink(true);
                                    generateBoostClaimLink();
                                }}
                                className="flex items-center justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white text-2xl w-full shadow-lg font-medium font-notoSans"
                            >
                                {isLinkLoading ? 'Generating Link...' : 'Generate Link'}
                            </button>
                        </div>

                        {boostClaimLink && (
                            <>
                                <div className="flex items-center justify-center w-full divider-with-text" />

                                <IonRow className="flex items-center justify-center w-full bg-grayscale-100 mt-4 mb-4 rounded-[15px]">
                                    <IonCol className="w-full flex items-center justify-between px-4 py-3 rounded-2xl">
                                        <div className="w-[80%] flex justify-start items-center text-left">
                                            {isLinkLoading || boostClaimLink.length === 0 ? (
                                                <>
                                                    <IonSpinner
                                                        name="crescent"
                                                        color="dark"
                                                        className="scale-[1] mr-1"
                                                    />{' '}
                                                    <p className="flex items-center justify-center text-left text-grayscale-500 font-medium text-sm line-clamp-1 ml-2 font-notoSans">
                                                        {boostClaimLink
                                                            ? 'Updating Link...'
                                                            : 'Generating Link...'}
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="w-full flex items-center justify-start text-left text-grayscale-500 font-medium text-sm line-clamp-1 whitespace-nowrap text-ellipsis">
                                                    {boostClaimLink}
                                                </p>
                                            )}
                                        </div>
                                        <div
                                            onClick={() => copyBoostLinkToClipBoard()}
                                            className="w-[20%] flex items-center justify-end"
                                        >
                                            <CopyStack className="w-[32px] h-[32px] text-grayscale-900" />
                                        </div>
                                    </IonCol>
                                </IonRow>

                                <div className="w-full flex items-center justify-center">
                                    <button
                                        onClick={() => presentBoostCode()}
                                        className="flex items-center font-medium justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white text-2xl w-full shadow-lg font-notoSans"
                                    >
                                        <QRCodeScanner className="ml-[5px] h-[30px] w-[30px] mr-2 " />{' '}
                                        Show Code
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}
            </IonRow>
        </IonGrid>
    );
};

export default BoostShareableCode;
