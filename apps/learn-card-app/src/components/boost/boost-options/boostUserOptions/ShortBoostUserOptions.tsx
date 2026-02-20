import React, { useEffect, useState, useRef } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { createPortal } from 'react-dom';

import { useIonAlert } from '@ionic/react';
import ShortBoostSomeoneScreen from './ShortBoostSomeoneScreen';
import BoostShareableCode from '../../boostCMS/boostCMSForms/boostCMSIssueTo/BoostShareableCode';
import BoostSearch from '../../boost-search/BoostSearch';
import AddUser from '../../../svgs/AddUser';

import { BoostUserTypeEnum } from '../boostOptions';

import { useAnalytics, AnalyticsEvents } from '@analytics';
import useBoost from '../../../boost/hooks/useBoost';
import {
    useModal,
    ModalTypes,
    ProfilePicture,
    boostCategoryMetadata,
    BoostCategoryOptionsEnum,
} from 'learn-card-base';

import { UnsignedVC, VC } from '@learncard/types';
import {
    BoostCMSAppearanceDisplayTypeEnum,
    BoostCMSIssueTo,
    BoostCMSState,
    ShortBoostState,
} from '../../boost';
import { closeAll } from 'apps/learn-card-app/src/helpers/uiHelpers';
import { BoostIssuanceLoading } from '../../boostLoader/BoostLoader';
import { getDefaultDisplayType } from '../../boostHelpers';

export enum ShortBoostStepsEnum {
    boostUserTypeOptions = 'boostUserTypeOptions',
    issueTo = 'issueTo',
    generateLink = 'generateLink',
}

const ShortBoostUserOptions: React.FC<{
    handleCloseModal: () => void;
    boostCredential: VC | UnsignedVC;
    boost: any;
    boostUri: string;
    profileId: string;
    history: RouteComponentProps['history'];
    handleEditOnClick: () => void;
    onSuccess: () => void;
    overrideClosingAllModals?: boolean;
    draftRecipients?: BoostCMSIssueTo[];
    showBoostContext?: boolean;
}> = ({
    handleCloseModal,
    history,
    boostCredential,
    boost,
    boostUri,
    profileId,
    handleEditOnClick,
    onSuccess,
    overrideClosingAllModals,
    draftRecipients,
    showBoostContext = false,
}) => {
    const { closeAllModals, newModal, closeModal } = useModal();
    const [presentAlert] = useIonAlert();
    const sectionPortal = document.getElementById('section-cancel-portal');

    const { track } = useAnalytics();

    const firstPage =
        draftRecipients?.length && draftRecipients?.length > 0
            ? ShortBoostStepsEnum.issueTo
            : ShortBoostStepsEnum.boostUserTypeOptions;

    const [page, setPage] = useState<ShortBoostStepsEnum>(firstPage);
    const prevPageRef = useRef<ShortBoostStepsEnum>(firstPage);
    const [issueLoading, setIssueLoading] = useState(false);
    const [state, setState] = useState<ShortBoostState>({
        issueTo: draftRecipients || ([] as BoostCMSIssueTo[]),
    });
    const { handleSubmitExistingBoostOther, handleSubmitExistingBoostSelf, boostIssueLoading } =
        useBoost(history);

    // Track previous page value
    const prevPage = prevPageRef.current;
    useEffect(() => {
        prevPageRef.current = page;
    }, [page]);

    const presentBoostIssueLoadingModal = () => {
        newModal(
            <BoostIssuanceLoading />,
            { disableCloseHandlers: true },
            { mobile: ModalTypes.FullScreen, desktop: ModalTypes.FullScreen }
        );
    };

    const handleBoostSelf = async () => {
        if (!profileId) return;

        setIssueLoading(true);

        presentBoostIssueLoadingModal();
        await handleSubmitExistingBoostSelf(profileId, boostUri, boost?.status);
        track(AnalyticsEvents.SELF_BOOST, {
            category: boost?.category,
            boostType: boost?.type,
            method: 'Managed Boost',
        });
        setIssueLoading(false);
        onSuccess?.();
        if (!overrideClosingAllModals) {
            closeAll?.();
            closeAllModals();
        }
        handleCloseModal?.();
    };

    const handleBoostOther = async () => {
        if (!profileId) return;
        setIssueLoading(true);
        presentBoostIssueLoadingModal();
        await handleSubmitExistingBoostOther(state.issueTo, boostUri, boost?.status);
        track(AnalyticsEvents.SEND_BOOST, {
            category: boost?.category,
            boostType: boost?.type,
            method: 'Managed Boost',
        });
        setIssueLoading(false);
        onSuccess?.();
        if (!overrideClosingAllModals) {
            closeAll?.();
            closeAllModals();
            handleCloseModal?.();
        } else {
            // Close two modals (requires 325ms delay). Maybe should update modal helper to allow closing "2" modals at once.
            handleCloseModal?.();
            await new Promise(resolve => setTimeout(resolve, 325));
            handleCloseModal?.();
        }
    };

    const handleSuccessfulLinkGeneration = async () => {
        onSuccess?.();
    };

    const selfBoostConfirmationAlert = () => {
        closeModal();
        handleBoostSelf();

        // No more confirmation
        // presentAlert({
        //     backdropDismiss: false,
        //     cssClass: 'boost-confirmation-alert',
        //     header: 'Are you sure you want to boost yourself?',
        //     buttons: [
        //         {
        //             text: 'OK',
        //             role: 'confirm',
        //             handler: async () => {
        //                 handleBoostSelf();
        //             },
        //         },
        //         {
        //             text: 'Cancel',
        //             role: 'cancel',
        //             handler: () => {
        //                 console.log('Cancel clicked');
        //             },
        //         },
        //     ],
        // });
    };

    const handleOpenBoostSomeoneModal = () => {
        newModal(
            <BoostSearch
                boostUserType={BoostUserTypeEnum.someone}
                handleCloseModal={() => closeModal()}
                handleCloseUserOptionsModal={() => handleCloseModal()}
                state={state}
                setState={setState}
                history={history}
            />,
            {
                sectionClassName: '!max-w-[600px]',
            },
            {
                mobile: ModalTypes.FullScreen,
                desktop: ModalTypes.FullScreen,
            }
        );
    };

    const shareableCodeState: BoostCMSState = {
        basicInfo: {
            type: boost?.category,
            achievementType: boost?.type,
            name: boost?.name,
        },
        appearance: {
            badgeThumbnail: boostCredential?.image,
            backgroundImage: boostCredential?.display?.backgroundImage,
            backgroundColor: boostCredential?.display?.backgroundColor,
            displayType:
                boostCredential?.display?.displayType ?? getDefaultDisplayType(boost?.category),
        },
    };

    if (boostCredential?.boostID) {
        shareableCodeState.address = boostCredential?.address;
        shareableCodeState.appearance = {
            ...shareableCodeState?.appearance,
            fontColor: boostCredential?.boostID?.fontColor,
            accentColor: boostCredential?.boostID?.accentColor,
            idBackgroundImage: boostCredential?.boostID?.backgroundImage,
            dimIdBackgroundImage: boostCredential?.boostID?.dimBackgroundImage,
            idIssuerThumbnail: boostCredential?.boostID?.issuerThumbnail,
            showIdIssuerImage: boostCredential?.boostID?.showIssuerThumbnail,
            displayType: BoostCMSAppearanceDisplayTypeEnum.ID,
        };
        shareableCodeState.basicInfo = {
            ...shareableCodeState?.basicInfo,
            issuerName: boostCredential?.boostID?.IDIssuerName,
        };
    }

    const category = boost?.category as BoostCategoryOptionsEnum;
    const color = boostCategoryMetadata[category]?.color ?? 'grayscale-900';

    if (page === ShortBoostStepsEnum.boostUserTypeOptions) {
        const boostName = boost?.name || boostCredential?.name || 'Boost';

        return (
            <section className="p-[20px] mt-auto bg-white rounded-[15px]">
                {showBoostContext && (
                    <div className="mb-3 pb-3 border-b border-grayscale-200">
                        <p className="text-xs font-medium text-grayscale-600 uppercase tracking-wide mb-1">
                            Sending Boost
                        </p>
                        <div className="flex items-center gap-2">
                            <p className="text-base font-semibold text-grayscale-900 truncate">
                                {boostName}
                            </p>
                        </div>
                    </div>
                )}
                <h1 className="font-poppins text-[22px] font-[600] leading-[130%] tracking-[-0.25px] py-[15px] flex items-center justify-center w-full h-full text-grayscale-900">
                    Select Recipient
                </h1>
                <button
                    onClick={selfBoostConfirmationAlert}
                    className="flex items-center gap-[10px] font-notoSans text-grayscale-800 text-[18px] py-[10px] w-full"
                >
                    <ProfilePicture customContainerClass="w-[35px] h-[35px]" />
                    Myself
                </button>
                <button
                    onClick={() => {
                        setPage(ShortBoostStepsEnum.issueTo);
                    }}
                    className="flex items-center gap-[10px] font-notoSans text-grayscale-800 text-[18px] py-[10px] w-full"
                >
                    <AddUser className="w-[35px] h-[35px]" version="3" />
                    Others
                </button>
                {sectionPortal &&
                    createPortal(
                        <div className="flex flex-col justify-center items-center relative !border-none max-w-[500px]">
                            {boost.status === 'LIVE' && (
                                <button
                                    onClick={() => {
                                        setPage(ShortBoostStepsEnum.generateLink);
                                    }}
                                    className={`flex items-center justify-center bg-${
                                        color || 'grayscale-900'
                                    } disabled:bg-grayscale-400 rounded-full py-2 text-white font-poppins text-lg font-[600] w-full shadow-bottom-4-4`}
                                >
                                    Generate Link
                                </button>
                            )}
                            {boost.status === 'DRAFT' && (
                                <button
                                    onClick={handleEditOnClick}
                                    className="bg-white text-grayscale-900 text-lg font-notoSans py-2 rounded-[20px] w-full h-full shadow-bottom mt-[10px]"
                                >
                                    Edit Draft
                                </button>
                            )}
                            <button
                                onClick={closeModal}
                                className="bg-white text-grayscale-900 text-lg font-notoSans py-2 rounded-[20px] w-full h-full shadow-bottom mt-[10px]"
                            >
                                Close
                            </button>
                        </div>,
                        sectionPortal
                    )}
            </section>
        );
    }

    if (page === ShortBoostStepsEnum.issueTo) {
        const boostName = boost?.name || boostCredential?.name || 'Boost';

        return (
            <ShortBoostSomeoneScreen
                boostUri={boostUri}
                issuedTo={state.issueTo}
                handleBoostSomeone={handleBoostOther}
                handleOpenModal={handleOpenBoostSomeoneModal}
                state={state}
                setState={setState}
                shareableCodeState={shareableCodeState}
                handleGenerateLink={() => setPage(ShortBoostStepsEnum.generateLink)}
                category={category}
                showBoostContext={showBoostContext}
                boostName={boostName}
            />
        );
    }

    // if (page === ShortBoostStepsEnum.generateLink )
    return (
        <BoostShareableCode
            boostUri={boostUri}
            state={shareableCodeState}
            customClassName="p-[20px] m-0 !rounded-[15px]"
            showTitle
            showGenerateClaimLinkToggle={false}
            defaultGenerateLinkToggleState={true}
            autoGenerateLinkOnOpen={true}
            useExternalButtonForModal
            handleBackForModal={() => setPage(ShortBoostStepsEnum.boostUserTypeOptions)}
            handleSuccess={handleSuccessfulLinkGeneration}
        />
    );
};

export default ShortBoostUserOptions;
