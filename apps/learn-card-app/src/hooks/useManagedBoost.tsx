import React from 'react';
import { useHistory } from 'react-router-dom';

import useBoostMenu, { BoostMenuType } from '../components/boost/hooks/useBoostMenu';
import useShortBoost from '../components/boost/hooks/useShortBoost';
import { useLoadingLine } from '../stores/loadingStore';
import {
    useModal,
    useGetProfile,
    useCurrentUser,
    useResolveBoost,
    useGetBoostRecipients,
    useCountBoostRecipients,
    ModalTypes,
    CredentialBadge,
    CredentialCategory,
    UserProfilePicture,
} from 'learn-card-base';

import { IssuanceList } from '../components/issuances/IssuanceList';
import { IssuancesSummary } from '../components/issuances/IssuancesSummary';
import BoostPreview from '../components/boost/boostCMS/BoostPreview/BoostPreview';
import BoostPreviewBody from '../components/boost/boostCMS/BoostPreview/BoostPreviewBody';
import BoostPreviewFooter from '../components/boost/boostCMS/BoostPreview/BoostPreviewFooter';
import CertificatePreviewRecipients from '../components/boost/boostCMS/BoostPreview/CertificatePreviewRecipients';

import { filterBoostRecipients } from '../components/boost/boostHelpers';
import {
    getAchievementTypeDisplayText,
    getImageUrlFromCredential,
    unwrapBoostCredential,
} from 'learn-card-base/helpers/credentialHelpers';

import { Boost, LCNProfile, VC } from '@learncard/types';
import IDDisplayCard from 'learn-card-base/components/id/IDDisplayCard';

export const useManagedBoost = (
    boost: Boost,
    additionalInfo: {
        categoryType: CredentialCategory;
        boostVC?: VC; // if we already have the VC we can skip the useResolveBoost call
        loading?: boolean;
        defaultImg?: string;
        disableLoadingLine?: boolean;
        issuerProfileOverride?: LCNProfile;
    }
) => {
    const history = useHistory();
    const currentUser = useCurrentUser();

    const { newModal, closeModal, closeAllModals } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });

    const {
        boostVC: _boostVC,
        categoryType,
        loading,
        defaultImg,
        disableLoadingLine,
        issuerProfileOverride,
    } = additionalInfo;

    // TODO handle edits? useGetCredentialWithEdits. Might not be relevant for managed boosts?
    const {
        data: resolvedBoost,
        isLoading: resolvedBoostLoading,
        isFetching: resolvedBoostFetching,
    } = useResolveBoost(boost?.uri, !_boostVC);
    const boostVC = _boostVC || resolvedBoost;

    const isDraft = boost?.status === 'DRAFT';
    const isLive = boost?.status === 'LIVE';

    const isID = boostVC?.display?.displayType === 'id' || categoryType === 'ID';
    const isCertificate = boostVC?.display?.displayType === 'certificate';
    const isAwardDisplay = boostVC?.display?.displayType === 'award';

    const previewType = boostVC?.display?.previewType;
    const displayType = boostVC?.credentialSubject?.achievement?.achievementType;
    const formattedDisplayType = getAchievementTypeDisplayText(displayType, categoryType);

    const cred = unwrapBoostCredential(boostVC);
    const credImg = cred?.credentialSubject?.image;
    const thumbImage = (cred && getImageUrlFromCredential(cred)) || defaultImg;
    const badgeThumbnail = credImg && credImg?.trim() !== '' ? credImg : thumbImage;

    const credentialBackgroundFetching = resolvedBoostFetching && !resolvedBoostLoading;
    useLoadingLine(credentialBackgroundFetching && !disableLoadingLine);

    const { data: recipientCount } = useCountBoostRecipients(boost?.uri);
    const { data: recipients, isLoading: recipientsLoading } = useGetBoostRecipients(boost?.uri);

    let issueHistory: {
        id: number;
        name: string;
        thumb: string;
        date: string;
        profileId: string;
    }[] = [];

    if (recipients && recipients?.length > 0) {
        recipients?.forEach((recipient, index) => {
            if (
                !issueHistory?.find(
                    historItem => historItem?.profileId === recipient?.to?.profileId
                )
            ) {
                issueHistory.push({
                    id: index,
                    name: recipient?.to?.displayName,
                    thumb: recipient?.to?.image,
                    date: recipient?.received,
                    profileId: recipient?.to?.profileId,
                });
            }
        });
    }

    const {
        data: myProfile,
        isLoading: myProfileLoading,
        isError: myProfileError,
    } = useGetProfile();

    const presentManageIssuancesModal = () => {
        if (!boost?.uri) return;
        newModal(<IssuanceList boostUri={boost.uri} />, { sectionClassName: '!max-w-[480px]' });
    };

    const handlePresentBoostMenuModal = useBoostMenu({
        boostUri: boost.uri,
        boostCredential: boostVC,
        categoryType,
        menuType: BoostMenuType.managed,
        onCloseModal: () => closeModal?.(),
        onDelete: () => closeAllModals?.(),
        onManageIssuances: () => presentManageIssuancesModal(),
    });

    const handleOptionsMenu = async () => {
        handlePresentBoostMenuModal();
    };

    const showSkeleton = loading || resolvedBoostLoading || recipientsLoading || myProfileLoading;

    const filteredRecipients = filterBoostRecipients(recipients);

    const link = `/boost/update`;
    const linkQueryParams = `?uri=${boost?.uri}&boostUserType=someone&boostCategoryType=${boost?.category}&boostSubCategoryType=${boost?.type}`;

    const handleEditOnClick = () => {
        closeModal();
        history.push(`${link}${linkQueryParams}`);
    };

    const handleIssueOnClick = () => {
        closeModal();
        history.push(`${link}${linkQueryParams}&issue=true`);
    };

    const { handlePresentShortBoostModal } = useShortBoost(
        history,
        boostVC,
        boost?.uri,
        myProfile?.profileId,
        boost,
        handleEditOnClick
    );

    const managedBoostIdCardProps = {
        credential: boostVC,
        categoryType: categoryType,
        showVerifications: false,
        issueHistory: issueHistory,
        handleCloseModal: () => closeModal(),
        onDotsClick: !showSkeleton ? handleOptionsMenu : undefined,
        formattedDisplayType: formattedDisplayType,
        issuancesSummaryComponent: boost?.uri ? (
            <IssuancesSummary boostUri={boost.uri} onManage={presentManageIssuancesModal} />
        ) : undefined,
        customBodyCardComponent: (
            <BoostPreviewBody
                recipients={recipients ?? []}
                recipientCountOverride={recipientCount}
                canEdit={boost?.status === 'DRAFT'}
                handleEditOnClick={handleEditOnClick}
                customBoostPreviewContainerClass="bg-white"
                customBoostPreviewContainerRowClass="items-center"
            />
        ),
        customThumbComponent: isID ? (
            <IDDisplayCard
                idClassName="p-0 m-0 mt-4 boost-id-preview-body min-h-[160px]"
                idFooterClassName="p-0 m-0 mt-[-15px] boost-id-preview-footer"
                customIssuerThumbContainerClass="id-card-issuer-thumb-preview-container"
                name={boost?.name || boostVC?.credentialSubject?.achievement?.name}
                location={cred?.address?.streetAddress}
                issuerThumbnail={cred?.boostID?.issuerThumbnail}
                showIssuerImage={cred?.boostID?.showIssuerThumbnail}
                backgroundImage={cred?.boostID?.backgroundImage}
                dimBackgroundImage={cred?.boostID?.dimBackgroundImage}
                fontColor={cred?.boostID?.fontColor}
                accentColor={cred?.boostID?.accentColor}
                idIssuerName={cred?.boostID?.IDIssuerName}
                cred={cred}
            />
        ) : (
            <CredentialBadge
                achievementType={boostVC?.credentialSubject?.achievement?.achievementType}
                boostType={categoryType}
                badgeThumbnail={badgeThumbnail}
                badgeCircleCustomClass="w-[170px] h-[170px]"
            />
        ),
        customFooterComponent: (
            <BoostPreviewFooter
                showSaveAndQuitButton={false}
                handleSubmit={handleIssueOnClick}
                selectedVCType={categoryType}
            />
        ),
        hideQRCode: true,
        previewType,
    };

    const managedBoostModalProps = {
        credential: boostVC,
        categoryType: categoryType,
        showVerifications: false,
        issueHistory: issueHistory,
        handleCloseModal: () => closeModal(),
        onDotsClick: !showSkeleton ? handleOptionsMenu : undefined,
        issueeOverride: isCertificate
            ? `${filteredRecipients?.length} ${filteredRecipients.length > 1 ? 'people' : 'person'}`
            : undefined,
        issuerOverride:
            isCertificate || isAwardDisplay
                ? issuerProfileOverride?.displayName || currentUser?.name
                : undefined,
        issuerImageComponent:
            isCertificate || isAwardDisplay ? (
                <UserProfilePicture user={issuerProfileOverride || currentUser} />
            ) : undefined,
        hideIssueDate: true,
        issuancesSummaryComponent: boost?.uri ? (
            <IssuancesSummary boostUri={boost.uri} onManage={presentManageIssuancesModal} />
        ) : undefined,
        customBodyCardComponent: isCertificate ? (
            <CertificatePreviewRecipients recipients={recipients} />
        ) : (
            <BoostPreviewBody
                recipients={recipients ?? []}
                recipientCountOverride={recipientCount}
                canEdit={isDraft}
                handleEditOnClick={handleEditOnClick}
                customBoostPreviewContainerClass="bg-white"
                customBoostPreviewContainerRowClass="items-center"
                nameOverride={issuerProfileOverride?.displayName}
            />
        ),
        customThumbComponent: isCertificate ? undefined : (
            <CredentialBadge
                achievementType={boostVC?.credentialSubject?.achievement?.achievementType}
                boostType={categoryType}
                badgeThumbnail={badgeThumbnail}
                badgeCircleCustomClass="w-[170px] h-[170px]"
                displayType={cred?.display?.displayType}
                credential={boostVC}
            />
        ),
        customFooterComponent: (
            <BoostPreviewFooter
                showSaveAndQuitButton={false}
                handleSubmit={handleIssueOnClick}
                selectedVCType={categoryType}
            />
        ),
        formattedDisplayType: formattedDisplayType,
        displayType: cred?.display?.displayType,
        previewType,
    };

    const presentManagedBoostModal = () => {
        const backgroundImage =
            isCertificate || isID || isAwardDisplay ? cred?.display?.backgroundImage : undefined;

        const props = isID ? managedBoostIdCardProps : managedBoostModalProps;

        newModal(<BoostPreview {...props} />, { backgroundImage });
    };

    return {
        cred,
        boostVC,
        isLive,
        isDraft,
        recipients,
        thumbImage,
        showSkeleton,
        issueHistory,
        badgeThumbnail,
        recipientCount,
        recipientsLoading,
        formattedDisplayType,
        handleOptionsMenu,
        handleEditOnClick,
        handleIssueOnClick,
        presentManagedBoostModal,
        handlePresentShortBoostModal,
    };
};

export default useManagedBoost;
