import React, { useEffect, useState } from 'react';
import moment from 'moment';
import base64url from 'base64url';
import { createPortal } from 'react-dom';
import { Clipboard } from '@capacitor/clipboard';

import useDebounce from 'apps/learn-card-app/src/hooks/useDebounce';
import { useAnalytics, AnalyticsEvents } from '@analytics';

import {
    IonRow,
    IonCol,
    useIonModal,
    IonGrid,
    IonSpinner,
    IonToggle,
    IonDatetime,
    IonInput,
} from '@ionic/react';

import {
    ModalTypes,
    useModal,
    useSigningAuthority,
    useWallet,
    walletStore,
    ToastTypeEnum,
    useToast,
} from 'learn-card-base';
import { BoostCMSState } from '../../../boost';

import CopyStack from 'apps/learn-card-app/src/components/svgs/CopyStack';
import Calendar from 'apps/learn-card-app/src/components/svgs/Calendar';
import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import BoostShareableQRCode from './BoostShareableQRCode';

import useTheme from '../../../../../theme/hooks/useTheme';

type BoostShareableCodeProps = {
    state: BoostCMSState;
    boostUri: string;
    customClassName?: string;
    defaultGenerateLinkToggleState?: boolean;
    autoGenerateLinkOnOpen?: boolean;
    // This is used in the "Issue Boost" modals and also in the Boost CMS
    //   these props are differentiate the display and behavior between the two
    showTitle?: boolean;
    showGenerateClaimLinkToggle?: boolean;
    useIonModalDatePicker?: boolean;
    useExternalButtonForModal?: boolean;
    handleBackForModal?: () => void;
    handleSuccess?: () => void;
};

export const BoostShareableCode: React.FC<BoostShareableCodeProps> = ({
    state,
    boostUri,
    customClassName,
    defaultGenerateLinkToggleState = false,
    autoGenerateLinkOnOpen = false,
    showTitle = true,
    showGenerateClaimLinkToggle = true,
    useIonModalDatePicker = false,
    useExternalButtonForModal = false,
    handleBackForModal,
    handleSuccess,
}) => {
    const { newModal, closeModal } = useModal();
    const { initWallet } = useWallet();
    const { track } = useAnalytics();
    const { getRegisteredSigningAuthority, getRegisteredSigningAuthorities } =
        useSigningAuthority();

    const [toggle, setToggle] = useState<boolean>(defaultGenerateLinkToggleState ?? false);
    const [expirationDate, setExpirationDate] = useState<undefined | string>(undefined);

    const [claimLimitToggle, setClaimLimitToggle] = useState<boolean>(false);
    const [claimLimit, setClaimLimit] = useState<number | undefined>(undefined);

    const [interoperableToggle, setInteroperableToggle] = useState<boolean>(false);
    const [isManuallyChangingParameters, setIsManuallyChangingParameters] =
        useState<boolean>(false);
    const [isLinkLoading, setIsLinkLoading] = useState<boolean>(false);
    const [generateClaimLink, setGenerateClaimLink] = useState<boolean>(false);
    const [boostClaimLink, setBoostClaimLink] = useState<string>('');
    const [interoperableClaimLink, setInteroperableClaimLink] = useState<string>('');

    const { presentToast } = useToast();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const [presentDatePicker] = useIonModal(
        <div className="w-full h-full transparent flex items-center justify-center">
            <IonDatetime
                onIonChange={e => {
                    clearBoostLink();
                    setExpirationDate(moment(e.detail.value).toISOString());
                }}
                value={
                    expirationDate ? moment(expirationDate).format('YYYY-MM-DDTHH:mm') : undefined
                }
                id="datetime"
                presentation="date-time"
                className="bg-white text-black rounded-[20px] z-50"
                showDefaultButtons
                showDefaultTimeLabel
                color={primaryColor}
                max="2050-12-31T23:59"
                min={moment().format('YYYY-MM-DDTHH:mm')}
            />
        </div>
    );

    const getExpirationInSeconds = () => {
        const today = moment(); // now
        const expiration = moment(expirationDate); // expiration date
        const differenceInSeconds = expiration.diff(today, 'seconds', true); // get difference between both dates in seconds
        return Math.floor(differenceInSeconds);
    };

    const clearBoostLink = () => {
        setBoostClaimLink('');
        setInteroperableClaimLink('');
    };

    const constructInteroperableLink = (boostUri: string, challenge: string) => {
        const data = {
            boostUri: boostUri,
            challenge: challenge,
        };
        const boostBase64Url = base64url.encode(JSON.stringify(data));
        return `https://learncard.app/interactions/claim/${boostBase64Url}?iuv=1`;
    };

    const getCurrentClaimLink = () => {
        if (interoperableToggle && interoperableClaimLink) return interoperableClaimLink;
        return boostClaimLink;
    };

    const generateBoostClaimLink = useDebounce(async () => {
        if (isLinkLoading) return;
        if (generateClaimLink) setIsLinkLoading(true);

        walletStore.set.wallet(null); // ! clear wallet store, to prevent stale challenges
        const wallet = await initWallet(); // re-init wallet after clearing wallet store

        try {
            const rsas = await getRegisteredSigningAuthorities();

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
                    setInteroperableClaimLink(
                        constructInteroperableLink(
                            _boostClaimLink?.boostUri,
                            _boostClaimLink?.challenge
                        )
                    );
                    track(AnalyticsEvents.GENERATE_CLAIM_LINK, {
                        category: state?.basicInfo?.type,
                        boostType: state?.basicInfo?.achievementType,
                        method: 'Claim Link',
                    });
                    setIsLinkLoading(false);
                }
            } else {
                const { registeredSigningAuthority: rsa, signingAuthority: sa } =
                    await getRegisteredSigningAuthority();

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
                        setInteroperableClaimLink(
                            constructInteroperableLink(
                                _boostClaimLink?.boostUri,
                                _boostClaimLink?.challenge
                            )
                        );
                        track(AnalyticsEvents.GENERATE_CLAIM_LINK, {
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
                string: getCurrentClaimLink(),
            });
            presentToast('Boost link copied to clipboard', {
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
            setInteroperableClaimLink('');
        }
    }, [toggle]);

    useEffect(() => {
        if (autoGenerateLinkOnOpen) {
            setGenerateClaimLink(true);
            getCurrentClaimLink();
            generateBoostClaimLink();
        }
    }, [autoGenerateLinkOnOpen]);

    const generateLinkDisabled = (claimLimitToggle && !claimLimit) || isLinkLoading;
    const handleGenerateLink = () => {
        setGenerateClaimLink(true);
        setIsManuallyChangingParameters(false);
        generateBoostClaimLink();
    };

    const handleCloseModal = () => {
        handleSuccess?.();
        closeModal();
    };

    const sectionPortal = document.getElementById('section-cancel-portal');

    return (
        <>
            <IonGrid
                className={`flex flex-col gap-[20px] items-center justify-center bg-white w-full max-w-[600px] rounded-[20px] ion-padding  ${customClassName}`}
            >
                <div className="flex items-center justify-between w-full">
                    {showTitle && (
                        <>
                            <h1 className="text-grayscale-900 font-poppins text-[20px] leading-[130%] tracking-[-0.25px] py-[5px]">
                                Claim Link
                            </h1>

                            <button
                                onClick={handleGenerateLink}
                                className={`font-poppins text-white text-[17px] font-normal bg-${primaryColor} rounded-[30px] px-[24px] py-[10px] disabled:opacity-[50%]`}
                                disabled={!isManuallyChangingParameters}
                            >
                                Update
                            </button>
                        </>
                    )}
                </div>
                {showGenerateClaimLinkToggle && (
                    <div className="w-full flex items-center justify-between">
                        <p className="text-grayscale-900 font-medium w-10/12">
                            Generate Claim Link?
                        </p>
                        <IonToggle
                            mode="ios"
                            color="emerald-700"
                            onIonChange={() => {
                                setToggle(!toggle);
                            }}
                            checked={toggle}
                        />
                    </div>
                )}

                {toggle && (
                    <>
                        <div className="flex flex-col gap-[10px] w-full pb-[20px] border-b-[1px] border-grayscale-200 border-solid">
                            {((!isManuallyChangingParameters && autoGenerateLinkOnOpen) ||
                                getCurrentClaimLink()) && (
                                <>
                                    {/* <div className="flex items-center justify-center w-full divider-with-text" /> */}

                                    <IonRow className="flex items-center justify-center w-full bg-grayscale-100 rounded-[15px]">
                                        <IonCol className="w-full flex items-center justify-between px-4 py-3 rounded-2xl">
                                            <div className="w-[80%] flex justify-start items-center text-left">
                                                {isLinkLoading ||
                                                getCurrentClaimLink().length === 0 ? (
                                                    <>
                                                        <IonSpinner
                                                            name="crescent"
                                                            color="dark"
                                                            className="scale-[1] mr-1"
                                                        />{' '}
                                                        <p className="flex items-center justify-center text-left text-grayscale-500 font-medium text-sm line-clamp-1 ml-2">
                                                            {getCurrentClaimLink()
                                                                ? 'Updating Link...'
                                                                : 'Generating Link...'}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <p className="w-full flex items-center justify-start text-left text-grayscale-500 font-medium text-sm line-clamp-1 whitespace-nowrap text-ellipsis">
                                                        {getCurrentClaimLink()}
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
                                    <div className="w-full flex flex-col  ">
                                        <div className="flex w-full items-center justify-between">
                                            <p className="text-grayscale-900 font-medium w-10/12 text-left pr-2">
                                                Enable interoperable link and QR code?
                                            </p>
                                            <IonToggle
                                                mode="ios"
                                                color="emerald-700"
                                                onClick={() => {
                                                    setInteroperableToggle(!interoperableToggle);
                                                }}
                                                checked={interoperableToggle}
                                            />
                                        </div>
                                    </div>
                                    <div className="w-full flex items-center justify-center">
                                        <button
                                            onClick={() => {
                                                newModal(
                                                    <BoostShareableQRCode
                                                        state={state}
                                                        showEditButton
                                                        boostClaimLink={getCurrentClaimLink()}
                                                    />,
                                                    {
                                                        sectionClassName:
                                                            '!bg-transparent !shadow-none !w-[400px] !max-h-[725px]',
                                                    },
                                                    {
                                                        mobile: ModalTypes.Cancel,
                                                        desktop: ModalTypes.Cancel,
                                                    }
                                                );
                                            }}
                                            className="flex items-center justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white font-poppins text-xl w-full shadow-lg  normal tracking-wide"
                                        >
                                            <QRCodeScanner className="ml-[5px] h-[30px] w-[30px] mr-2 " />{' '}
                                            Show Code
                                        </button>
                                    </div>
                                </>
                            )}
                            <span className="text-grayscale-900 font-poppins text-[17px] font-[600]">
                                Expiration Date
                            </span>
                            <button
                                className="w-full flex gap-[10px] items-center justify-between bg-grayscale-100 rounded-[15px] p-[15px] text-grayscale-500  font-notoSans text-[17px]"
                                onClick={() => {
                                    if (useIonModalDatePicker) {
                                        presentDatePicker({
                                            backdropDismiss: true,
                                            showBackdrop: false,
                                            cssClass: 'flex items-center justify-center',
                                        });
                                    } else {
                                        newModal(
                                            <div className="w-full h-full transparent flex items-center justify-center">
                                                <IonDatetime
                                                    onIonChange={e => {
                                                        clearBoostLink();
                                                        setExpirationDate(
                                                            moment(e.detail.value).toISOString()
                                                        );
                                                        setIsManuallyChangingParameters(true);
                                                        closeModal();
                                                    }}
                                                    onIonCancel={() => {
                                                        closeModal();
                                                    }}
                                                    value={
                                                        expirationDate
                                                            ? moment(expirationDate).format(
                                                                  'YYYY-MM-DDTHH:mm'
                                                              )
                                                            : undefined
                                                    }
                                                    id="datetime"
                                                    presentation="date-time"
                                                    className="bg-white text-black rounded-[20px] z-50"
                                                    showDefaultButtons
                                                    showDefaultTimeLabel
                                                    color={primaryColor}
                                                    max="2050-12-31T23:59"
                                                    min={moment().format('YYYY-MM-DDTHH:mm')}
                                                />
                                            </div>,
                                            { sectionClassName: '!w-fit' },
                                            {
                                                mobile: ModalTypes.Center,
                                                desktop: ModalTypes.Center,
                                            }
                                        );
                                    }
                                }}
                            >
                                {expirationDate
                                    ? moment(expirationDate).format('MMMM Do, YYYY - hh:mm A')
                                    : 'Optional...'}
                                <Calendar
                                    className="w-[30px] text-grayscale-700"
                                    version="filled-top"
                                />
                            </button>
                        </div>

                        <div className="w-full flex flex-col gap-[10px]">
                            <div className="flex w-full items-center justify-between">
                                <p className="text-grayscale-900 font-poppins text-[17px] font-[600]">
                                    Unlimited Claims
                                </p>
                                <IonToggle
                                    mode="ios"
                                    color="emerald-700"
                                    onClick={() => {
                                        setClaimLimit(undefined);
                                        setIsManuallyChangingParameters(true);
                                        setClaimLimitToggle(!claimLimitToggle);
                                    }}
                                    checked={!claimLimitToggle}
                                />
                            </div>

                            {claimLimitToggle && (
                                <div className="flex flex-col gap-[10px]">
                                    <p className="text-grayscale-900 font-poppins text-[17px] font-[600]">
                                        Set Claim Limit
                                    </p>
                                    <IonInput
                                        autocapitalize="on"
                                        className={`bg-grayscale-100 text-grayscale-500 rounded-[15px] !px-[15px] !py-[6px] font-notoSans text-[17px]`}
                                        placeholder="How many claims?"
                                        type="number"
                                        min={0}
                                        value={claimLimit}
                                        onIonInput={e => {
                                            clearBoostLink();
                                            setClaimLimit(e.detail.value);
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
                                                e.clipboardData || window.Clipboard
                                            ).getData('text');
                                            const numericText = pastedText.replace(/\D/g, '');
                                            if (numericText) {
                                                setClaimLimit(numericText);
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {!useExternalButtonForModal && (
                            <div className="w-full flex items-center justify-center mb-4 mt-4">
                                <button
                                    onClick={handleGenerateLink}
                                    className="flex items-center justify-center bg-grayscale-900 disabled:bg-grayscale-400 rounded-full px-[18px] py-[12px] text-white font-poppins text-xl w-full shadow-lg  normal tracking-wide"
                                    disabled={generateLinkDisabled}
                                >
                                    {isLinkLoading ? 'Generating Link...' : 'Generate Link'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </IonGrid>

            {sectionPortal &&
                createPortal(
                    <div className="flex flex-col justify-center items-center relative !border-none max-w-[500px]">
                        <div className="flex w-full mb-[5px]">
                            {handleBackForModal && (
                                <button
                                    onClick={handleBackForModal}
                                    className="flex items-center justify-center bg-white rounded-[20px] py-2 text-grayscale-900 font-notoSans text-lg w-full shadow-bottom-4-4 mt-[10px] mr-[10px]"
                                >
                                    Back
                                </button>
                            )}
                            <button
                                onClick={handleCloseModal}
                                className="bg-white text-grayscale-900 text-lg font-notoSans py-2 rounded-[20px] w-full h-full shadow-bottom mt-[10px]"
                            >
                                Close
                            </button>
                        </div>
                    </div>,
                    sectionPortal
                )}
        </>
    );
};

export default BoostShareableCode;
