import React from 'react';

import { useFlags } from 'launchdarkly-react-client-sdk';
import { useLoadingLine } from '../../stores/loadingStore';

import { ErrorBoundaryFallback } from '../../components/boost/boostErrors/BoostErrorsDisplay';
import { IonContent, IonPage } from '@ionic/react';
import { ErrorBoundary } from 'react-error-boundary';
import MainHeader from '../../components/main-header/MainHeader';
import BoostEarnedIDListAlternative from '../../components/boost/boost-earned-card/BoostEarnedIDListAlternative';
import EmptyTroopIcon from '../../assets/images/emptyTroop.svg';
import TroopIDTypeSelectorModal from '../../components/troopsCMS/TroopsIDTypeSelector/TroopIDTypeSelectorModal';
import TroopsCMSWrapper from '../../components/troopsCMS/TroopsCMSWrapper';
import { TroopsCMSViewModeEnum } from '../../components/troopsCMS/troopCMSState';
import Plus from '../../components/svgs/Plus';
import {
    useGetCredentialList,
    useGetIDs,
    useGetCurrentUserTroopIds,
    useModal,
    ModalTypes,
    BrandingEnum,
    BoostPageViewMode,
    CredentialCategoryEnum,
    lazyWithRetry,
} from 'learn-card-base';

const TroopsModalWrapper = lazyWithRetry(
    () => import('../../components/troopsCMS/TroopsModalWrapper')
);

import { openExternalLink } from '../../helpers/externalLinkHelpers';
import {
    SubheaderContentType,
    SubheaderTypeEnum,
} from '../../components/main-subheader/MainSubHeader.types';
import { BoostCategoryOptionsEnum } from 'learn-card-base';
import { useSyncMembershipHighlights } from '../../hooks/useSyncMembershipHighlights';

const WAITLIST_FORM_LINK = 'https://r18y4ggjlxv.typeform.com/to/TKCrkKW5';

export const SignUpForWaitList: React.FC = () => {
    const handleClick = () => {
        const formLink = `${WAITLIST_FORM_LINK}`;
        openExternalLink(formLink);
    };

    return (
        <div className="mt-[20px] z-[50]">
            <button
                onClick={handleClick}
                className="text-white text-2xl font-medium bg-sp-purple-base rounded-full shadow-bottom py-[10px] px-[20px] text-black mt-[10px]"
            >
                Join Waiting List
            </button>
        </div>
    );
};

const MembershipPage: React.FC = () => {
    useSyncMembershipHighlights(true);
    const flags = useFlags();
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });
    const { newModal: newCancelModal, closeModal: closeCancelModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const {
        // oxlint-disable-next-line no-unused-vars
        data: credentials,
        isLoading: credentialsLoading,
        isFetching: credentialsFetching,
    } = useGetCredentialList(CredentialCategoryEnum.membership);

    // logic to show the plus button
    const canCreateGlobalIDs = true;
    const { data: earnedBoostIDs, isLoading: earnedBoostIDsLoading } = useGetIDs();
    // oxlint-disable-next-line no-unused-vars
    const { data: troopIds, isLoading: troopIdsLoading } = useGetCurrentUserTroopIds();

    const hasGlobalAdminID = troopIds?.isScoutGlobalAdmin;
    const hasNationalAdminID = troopIds?.isNationalAdmin;

    const credentialsBackgroundFetching = credentialsFetching && !credentialsLoading;

    useLoadingLine(credentialsBackgroundFetching);

    const handleShowTroops = (boostUri: string) => {
        newModal(<TroopsModalWrapper boostUri={boostUri} />);
    };

    const showTroopIDSelector = () => {
        if (canCreateGlobalIDs && !hasGlobalAdminID) {
            newModal(
                <TroopsCMSWrapper
                    viewMode={TroopsCMSViewModeEnum.global}
                    handleCloseModal={closeModal}
                />
            );
        } else if (hasGlobalAdminID && !hasNationalAdminID) {
            newModal(
                <TroopsCMSWrapper
                    viewMode={TroopsCMSViewModeEnum.network}
                    handleCloseModal={closeModal}
                    parentUri={troopIds?.globalAdmin?.[0]?.boostId as string}
                />
            );
        } else {
            newCancelModal(
                <TroopIDTypeSelectorModal
                    handleCloseModal={closeCancelModal}
                    earnedBoostIDs={(earnedBoostIDs as any) ?? []}
                    isLoading={earnedBoostIDsLoading}
                    onSuccess={(boostUri?: string) => boostUri && handleShowTroops(boostUri)}
                />
            );
        }
    };

    const imgSrc = EmptyTroopIcon;
    const { iconColor, textColor } = SubheaderContentType[SubheaderTypeEnum.Membership];

    const listProps = {
        defaultImg: imgSrc,
        viewMode: BoostPageViewMode.Card,
        category: BoostCategoryOptionsEnum.membership,
        title: 'Troops',
        bgFillerColor: '!sp-green-forest-light',
        emptyMessage: "You don't have any Troops yet.",
        emptyMessageColor: 'text-[#0F631D]',
    };

    const plusButtonOverride =
        canCreateGlobalIDs || hasGlobalAdminID || hasNationalAdminID ? (
            <button
                type="button"
                aria-label="plus-button"
                onClick={() => showTroopIDSelector()}
                className={`flex items-center justify-center h-fit w-fit p-[8px] rounded-full bg-white ${textColor}`}
            >
                <Plus className={`h-[20px] w-[20px] ${iconColor}`} />
            </button>
        ) : (
            <></>
        );

    const idCount = earnedBoostIDs?.length;

    return (
        <IonPage className="bg-sp-green-forest-light">
            <ErrorBoundary fallback={<ErrorBoundaryFallback />}>
                <MainHeader
                    showBackButton
                    subheaderType={SubheaderTypeEnum.Membership}
                    branding={BrandingEnum.scoutPass}
                    plusButtonOverride={
                        !flags?.disableTroopCreation ? plusButtonOverride : undefined
                    }
                    count={idCount as number}
                    countLoading={earnedBoostIDsLoading}
                />

                <IonContent fullscreen color="sp-green-forest-light">
                    <div className="w-full flex items-center justify-center mt-8">
                        {/* <BoostEarnedIDList {...listProps} /> */}

                        {/* 
                           using this workaround until we support 
                           querying earned boosts via an array of categories
                        */}
                        <BoostEarnedIDListAlternative {...listProps} />
                    </div>
                </IonContent>
            </ErrorBoundary>
        </IonPage>
    );
};

export default MembershipPage;
