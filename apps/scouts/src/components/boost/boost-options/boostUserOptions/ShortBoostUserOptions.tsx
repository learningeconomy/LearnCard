import React, { useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';

import X from 'learn-card-base/svgs/X';
import RibbonAwardIcon from 'learn-card-base/svgs/RibbonAwardIcon';
import BoostSearch from '../../boost-search/BoostSearch';
import LinkChain from 'learn-card-base/svgs/LinkChain';

import { BoostUserTypeEnum } from '../boostOptions';
import useBoost from '../../../boost/hooks/useBoost';
import { ModalTypes, useModal, useScreenWidth } from 'learn-card-base';

import { UnsignedVC, VC } from '@learncard/types';
import { BoostCMSIssueTo, ShortBoostState } from '../../boost';
import { closeAll } from '../../../../helpers/uiHelpers';
import { BoostIssuanceLoading } from '../../boostLoader/BoostLoader';
import BoostShareableCode from '../../boostCMS/boostCMSForms/boostCMSIssueTo/BoostShareableCode';
import ShortBoostSomeoneScreen from './ShortBoostSomeoneScreen';
import useFirebaseAnalytics from '../../../../hooks/useFirebaseAnalytics';
import * as m from '../../../../paraglide/messages.js';
import { AppHeader, AppToolbar } from 'learn-card-base/ui/chrome';
import { AppCol, AppGrid, AppRow } from 'learn-card-base/ui/layout';

export enum ShortBoostStepsEnum {
    boostUserTypeOptions = 'boostUserTypeOptions',
    issueTo = 'issueTo',
    generateLink = 'generateLink',
}

type ShortBoostUserOptionsProps = {
    handleCloseModal: () => void;
    showCloseButton?: boolean;
    title?: string | React.ReactNode;
    boostCredential: VC | UnsignedVC;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
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

    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

    const { logAnalyticsEvent } = useFirebaseAnalytics();

    const [page, setPage] = useState(ShortBoostStepsEnum.boostUserTypeOptions);
    const [issueLoading, setIssueLoading] = useState(false);
    const [state, setState] = useState<ShortBoostState>({ issueTo: [] as BoostCMSIssueTo[] });

    const { handleSubmitExistingBoostOther, handleSubmitExistingBoostSelf } = useBoost(history);

    const presentBoostSomeoneModal = () => {
        newModal(
            <BoostSearch
                boostUserType={BoostUserTypeEnum.someone}
                handleCloseModal={closeModal}
                handleCloseUserOptionsModal={closeModal}
                cssClass="boost-search-modal"
                state={state}
                setState={setState}
                history={history}
                preserveStateIssueTo={false}
            />
        );
    };

    const { newModal: newIssueLoadingModal, closeModal: closeIssueLoadingModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

    const handleBoostSelf = async () => {
        if (!profileId) return;

        setIssueLoading(true);
        newIssueLoadingModal(<BoostIssuanceLoading />, {
            className: 'dark-modal-overlay',
            sectionClassName: 'transparent-modal',
            disableCloseHandlers: true,
        });
        await handleSubmitExistingBoostSelf(profileId, boostUri, boost?.status);
        logAnalyticsEvent('self_boost', {
            category: boost?.category,
            boostType: boost?.type,
            method: 'Managed Boost',
        });
        setIssueLoading(false);
        closeAll?.();
        closeIssueLoadingModal();
        handleCloseModal?.();
    };

    const handleBoostOther = async () => {
        if (!profileId) return;
        setIssueLoading(true);
        newIssueLoadingModal(<BoostIssuanceLoading />, {
            className: 'dark-modal-overlay',
            sectionClassName: 'transparent-modal',
            disableCloseHandlers: true,
        });
        await handleSubmitExistingBoostOther(state.issueTo, boostUri, boost?.status);
        logAnalyticsEvent('send_boost', {
            category: boost?.category,
            boostType: boost?.type,
            method: 'Managed Boost',
        });
        setIssueLoading(false);
        closeAll?.();
        closeIssueLoadingModal();
        handleCloseModal?.();
    };

    const handleOpenBoostSomeoneModal = () => {
        presentBoostSomeoneModal();
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
        (shareableCodeState as any).address = boostCredential?.address;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
        (shareableCodeState as any).appearance = {
            ...shareableCodeState?.appearance,
            fontColor: boostCredential?.boostID?.fontColor,
            accentColor: boostCredential?.boostID?.accentColor,
            idBackgroundImage: boostCredential?.boostID?.backgroundImage,
            dimIdBackgroundImage: boostCredential?.boostID?.dimBackgroundImage,
            idIssuerThumbnail: boostCredential?.boostID?.issuerThumbnail,
            showIdIssuerImage: boostCredential?.boostID?.showIssuerThumbnail,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
        (shareableCodeState as any).basicInfo = {
            ...shareableCodeState?.basicInfo,
            issuerName: boostCredential?.boostID?.IDIssuerName,
        };
    }

    return (
        <section>
            <AppHeader className="ion-no-border bg-white pt-10">
                <AppToolbar color="white">
                    <AppRow className="w-full bg-white">
                        <AppCol className="w-full flex items-center justify-end">
                            {showCloseButton && (
                                <button className="mr-[20px]" onClick={handleCloseModal}>
                                    <X className="text-grayscale-600 h-8 w-8" />
                                </button>
                            )}
                        </AppCol>
                    </AppRow>
                    {title && title}
                </AppToolbar>
            </AppHeader>

            {page === ShortBoostStepsEnum.boostUserTypeOptions && (
                <section>
                    <AppGrid className="ion-padding">
                        <AppCol className="w-full flex items-center justify-center mt-8">
                            <button
                                onClick={handleBoostSelf}
                                className="flex items-center justify-center bg-indigo-500 rounded-full px-[18px] py-[12px] font-medium text-white text-2xl w-full shadow-lg"
                            >
                                <RibbonAwardIcon className="ml-[5px] h-[30px] w-[30px] mr-2" />{' '}
                                {m['boost.boostMyself']()}
                            </button>
                        </AppCol>
                        <AppCol className="w-full flex items-center justify-center mt-1">
                            <button
                                onClick={() => {
                                    setPage(ShortBoostStepsEnum.issueTo);
                                }}
                                className="flex items-center justify-center bg-indigo-500 font-medium rounded-full px-[18px] py-[12px] text-white text-2xl w-full shadow-lg"
                            >
                                <RibbonAwardIcon className="ml-[5px] h-[30px] w-[30px] mr-2" />{' '}
                                {m['boost.boostOthers']()}
                            </button>
                        </AppCol>
                        {boost.status === 'LIVE' && (
                            <AppCol className="w-full flex items-center justify-center mt-1">
                                <button
                                    onClick={() => {
                                        setPage(ShortBoostStepsEnum.generateLink);
                                    }}
                                    className="flex items-center font-medium justify-center bg-grayscale-900 rounded-full px-[18px] py-[12px] text-white text-2xl w-full shadow-lg"
                                >
                                    <LinkChain className="ml-[5px] h-[30px] w-[30px] mr-2" />{' '}
                                    {m['boost.generateLink']()}
                                </button>
                            </AppCol>
                        )}
                        <div className="w-full flex items-center justify-center mt-8">
                            <button
                                onClick={() => handleCloseModal()}
                                className="text-grayscale-900 text-center text-sm"
                            >
                                {m['common.cancel']()}
                            </button>
                        </div>
                    </AppGrid>
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
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
                    shareableCodeState={shareableCodeState as any}
                    boostStatus={boost?.status}
                />
            )}

            {page === ShortBoostStepsEnum.generateLink && (
                <section>
                    <BoostShareableCode
                        boostUri={boostUri}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
                        state={shareableCodeState as any}
                        customClassName="bg-white justify-start items-start p-0 m-0"
                        defaultGenerateLinkToggleState
                    />
                    <div className="w-full flex items-center justify-center mt-8">
                        <button
                            onClick={() => handleCloseModal()}
                            className="text-grayscale-900 text-center text-sm"
                        >
                            {m['common.cancel']()}
                        </button>
                    </div>
                </section>
            )}
        </section>
    );
};

export default ShortBoostUserOptions;
