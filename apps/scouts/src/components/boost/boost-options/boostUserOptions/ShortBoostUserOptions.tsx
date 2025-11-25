import React, { useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';

import {
    IonCol,
    IonRow,
    IonGrid,
    IonToolbar,
    IonHeader,
    useIonModal,
    useIonAlert,
} from '@ionic/react';
import X from 'learn-card-base/svgs/X';
import Plus from 'learn-card-base/svgs/Plus';
import RibbonAwardIcon from 'learn-card-base/svgs/RibbonAwardIcon';
import BoostAddressBookContactItem from '../../boostCMS/boostCMSForms/boostCMSIssueTo/BoostAddressBookContactItem';
import BoostSearch from '../../boost-search/BoostSearch';
import LinkChain from 'learn-card-base/svgs/LinkChain';

import { BoostUserTypeEnum } from '../boostOptions';
import useBoost from '../../../boost/hooks/useBoost';
import { ModalTypes, useModal, useScreenWidth } from 'learn-card-base';

import { UnsignedVC, VC } from '@learncard/types';
import { BoostCMSIssueTo, ShortBoostState } from '../../boost';
import { BoostAddressBookEditMode } from '../../boostCMS/boostCMSForms/boostCMSIssueTo/BoostAddressBook';
import { closeAll } from '../../../../helpers/uiHelpers';
import { BoostIssuanceLoading } from '../../boostLoader/BoostLoader';
import BoostShareableCode from '../../boostCMS/boostCMSForms/boostCMSIssueTo/BoostShareableCode';
import ShortBoostSomeoneScreen from './ShortBoostSomeoneScreen';
import useFirebaseAnalytics from '../../../../hooks/useFirebaseAnalytics';

export enum ShortBoostStepsEnum {
    boostUserTypeOptions = 'boostUserTypeOptions',
    issueTo = 'issueTo',
    generateLink = 'generateLink',
}

type ShortBoostUserOptionsProps = {
    handleCloseModal: () => void;
    showCloseButton?: boolean;
    title?: String | React.ReactNode;
    boostCredential: VC | UnsignedVC;
    boost: any;
    boostUri: string;
    profileId: string;
    history: RouteComponentProps['history'];
};
const ShortBoostUserOptions: React.FC<ShortBoostUserOptionsProps> = ({
    handleCloseModal,
    showCloseButton = true,
    title,
    history,
    boostCredential,
    boost,
    boostUri,
    profileId,
}) => {
    const width = useScreenWidth(true);

    const { newModal, closeModal } = useModal();
    const [presentAlert] = useIonAlert();

    const { logAnalyticsEvent } = useFirebaseAnalytics();

    const [page, setPage] = useState(ShortBoostStepsEnum.boostUserTypeOptions);
    const [issueLoading, setIssueLoading] = useState(false);
    const [state, setState] = useState<ShortBoostState>({ issueTo: [] as BoostCMSIssueTo[] });

    const { handleSubmitExistingBoostOther, handleSubmitExistingBoostSelf, boostIssueLoading } =
        useBoost(history);

    const presentBoostSomeoneModal = () => {
        newModal(
            <BoostSearch
                boostUserType={BoostUserTypeEnum.someone}
                handleCloseModal={closeModal}
                handleCloseUserOptionsModal={closeModal}
                cssClass="boost-search-modal safe-area-top-margin"
                state={state}
                setState={setState}
                history={history}
                preserveStateIssueTo={false}
            />,
            {},
            { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
        );
    };

    const [presentBoostIssueLoadingModal, dismissBoostIssueLoadingModal] = useIonModal(
        BoostIssuanceLoading,
        {
            loading: issueLoading,
        }
    );

    const handleBoostSelf = async () => {
        if (!profileId) return;

        setIssueLoading(true);

        presentBoostIssueLoadingModal({ backdropDismiss: false });
        await handleSubmitExistingBoostSelf(profileId, boostUri, boost?.status);
        logAnalyticsEvent('self_boost', {
            category: boost?.category,
            boostType: boost?.type,
            method: 'Managed Boost',
        });
        setIssueLoading(false);
        closeAll?.();
        dismissBoostIssueLoadingModal();
        handleCloseModal?.();
    };

    const handleBoostOther = async () => {
        if (!profileId) return;
        setIssueLoading(true);
        presentBoostIssueLoadingModal({ backdropDismiss: false });
        await handleSubmitExistingBoostOther(state.issueTo, boostUri, boost?.status);
        logAnalyticsEvent('send_boost', {
            category: boost?.category,
            boostType: boost?.type,
            method: 'Managed Boost',
        });
        setIssueLoading(false);
        closeAll?.();
        dismissBoostIssueLoadingModal();
        handleCloseModal?.();
    };

    const selfBoostConfirmationAlert = () => {
        presentAlert({
            backdropDismiss: false,
            cssClass: 'boost-confirmation-alert',
            header: 'Are you sure you want to send this to yourself?',
            buttons: [
                {
                    text: 'OK',
                    role: 'confirm',
                    handler: async () => {
                        handleBoostSelf();
                    },
                },
                {
                    text: 'Cancel',
                    role: 'cancel',
                    handler: () => {
                        console.log('Cancel clicked');
                    },
                },
            ],
        });
    };

    const handleOpenBoostSomeoneModal = () => {
        if (width <= 991) {
            presentBoostSomeoneModal({
                cssClass: 'mobile-modal user-options-modal safe-area-top-margin',
                initialBreakpoint: 1,
                breakpoints: [0, 0.95, 0.95, 1],
                handleBehavior: 'cycle',
            });
        } else {
            presentBoostSomeoneModal({
                cssClass: 'center-modal user-qrcode-modal',
                backdropDismiss: true,
                showBackdrop: false,
            });
        }
    };

    const shareableCodeState = {
        basicInfo: {
            type: boost?.category,
            achievementType: boost?.type,
            name: boost?.name,
        },
        appearance: {
            badgeThumbnail: boostCredential?.image,
            backgroundImage: boostCredential?.display?.backgroundImage,
            backgroundColor: boostCredential?.display?.backgroundColor,
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
        };
        shareableCodeState.basicInfo = {
            ...shareableCodeState?.basicInfo,
            issuerName: boostCredential?.boostID?.IDIssuerName,
        };
    }

    return (
        <section>
            <IonHeader className="ion-no-border bg-white pt-10">
                <IonToolbar color="#fffff">
                    <IonRow className="w-full bg-white">
                        <IonCol className="w-full flex items-center justify-end">
                            {showCloseButton && (
                                <button className="mr-[20px]" onClick={handleCloseModal}>
                                    <X className="text-grayscale-600 h-8 w-8" />
                                </button>
                            )}
                        </IonCol>
                    </IonRow>
                    {title && title}
                </IonToolbar>
            </IonHeader>

            {page === ShortBoostStepsEnum.boostUserTypeOptions && (
                <section>
                    <IonGrid className="ion-padding">
                        <IonCol className="w-full flex items-center justify-center mt-8">
                            <button
                                onClick={selfBoostConfirmationAlert}
                                className="flex items-center justify-center bg-indigo-500 rounded-full px-[18px] py-[12px] font-medium text-white text-2xl w-full shadow-lg"
                            >
                                <RibbonAwardIcon className="ml-[5px] h-[30px] w-[30px] mr-2" />{' '}
                                Boost Myself
                            </button>
                        </IonCol>
                        <IonCol className="w-full flex items-center justify-center mt-1">
                            <button
                                onClick={() => {
                                    setPage(ShortBoostStepsEnum.issueTo);
                                }}
                                className="flex items-center justify-center bg-indigo-500 font-medium rounded-full px-[18px] py-[12px] text-white text-2xl w-full shadow-lg"
                            >
                                <RibbonAwardIcon className="ml-[5px] h-[30px] w-[30px] mr-2" />{' '}
                                Boost Others
                            </button>
                        </IonCol>
                        {boost.status === 'LIVE' && (
                            <IonCol className="w-full flex items-center justify-center mt-1">
                                <button
                                    onClick={() => {
                                        setPage(ShortBoostStepsEnum.generateLink);
                                    }}
                                    className="flex items-center font-medium justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white text-2xl w-full shadow-lg"
                                >
                                    <LinkChain className="ml-[5px] h-[30px] w-[30px] mr-2" />{' '}
                                    Generate Link
                                </button>
                            </IonCol>
                        )}
                        <div className="w-full flex items-center justify-center mt-8">
                            <button
                                onClick={() => handleCloseModal()}
                                className="text-grayscale-900 text-center text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </IonGrid>
                </section>
            )}
            {page === ShortBoostStepsEnum.issueTo && (
                <ShortBoostSomeoneScreen
                    boostUri={boostUri}
                    profileId={profileId}
                    history={history}
                    issuedTo={state.issueTo}
                    handleCloseModal={handleCloseModal}
                    handleBoostSomeone={handleBoostOther}
                    handleOpenModal={handleOpenBoostSomeoneModal}
                    state={state}
                    setState={setState}
                    shareableCodeState={shareableCodeState}
                    boostStatus={boost?.status}
                />
            )}

            {page === ShortBoostStepsEnum.generateLink && (
                <section>
                    <BoostShareableCode
                        boostUri={boostUri}
                        state={shareableCodeState}
                        customClassName="bg-white justify-start items-start p-0 m-0"
                        defaultGenerateLinkToggleState
                    />
                    <div className="w-full flex items-center justify-center mt-8">
                        <button
                            onClick={() => handleCloseModal()}
                            className="text-grayscale-900 text-center text-sm o"
                        >
                            Cancel
                        </button>
                    </div>
                </section>
            )}
        </section>
    );
};

export default ShortBoostUserOptions;
