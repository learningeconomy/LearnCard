import React from 'react';
import moment from 'moment';
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

import { IonItem, IonList } from '@ionic/react';
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

    const handlePresentBoostMenuModal = useBoostMenu({
        boostUri: boost.uri,
        boostCredential: boostVC,
        categoryType,
        menuType: BoostMenuType.managed,
        onCloseModal: () => closeModal?.(),
        onDelete: () => closeAllModals?.(),
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
        onDotsClick: boost?.status === 'DRAFT' ? handleOptionsMenu : undefined,
        formattedDisplayType: formattedDisplayType,
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
        customIssueHistoryComponent: (
            <IonList lines="none" className="flex flex-col items-center justify-center w-[100%]">
                {recipients?.map((recipient, index) => {
                    return (
                        <IonItem
                            key={recipient?.recieved || index}
                            lines="none"
                            className={`w-[100%] max-w-[600px] ion-no-border px-[4px] flex items-center justify-between notificaion-list-item py-[8px] border-b-2`}
                        >
                            <div className="flex items-center justify-start w-full">
                                <div className="flex items-center justify-start">
                                    <UserProfilePicture
                                        customContainerClass="flex justify-center items-center w-12 h-12 rounded-full overflow-hidden text-white font-medium text-4xl mr-3"
                                        customImageClass="flex justify-center items-center w-12 h-12 rounded-full overflow-hidden object-cover"
                                        customSize={120}
                                        user={recipient?.to}
                                    />
                                </div>
                                <div className="flex flex-col items-start justify-center pt-1 pr-1 pb-1">
                                    <p className="text-grayscale-900 font-semibold capitalize text-sm">
                                        {recipient?.to?.displayName || recipient?.to?.profileId}
                                    </p>
                                    <p className="text-grayscale-600 font-normal text-sm">
                                        {moment(recipient?.received).format('DD MMMM YYYY')} &bull;{' '}
                                        {moment(recipient?.received).format('h:mm A')}
                                    </p>
                                </div>
                            </div>
                        </IonItem>
                    );
                })}
            </IonList>
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
        onDotsClick: isDraft && !showSkeleton ? handleOptionsMenu : undefined,
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
        customIssueHistoryComponent: (
            <IonList lines="none" className="flex flex-col items-center justify-center w-[100%]">
                {recipients?.map((recipient, index) => {
                    return (
                        <IonItem
                            key={recipient?.recieved || index}
                            lines="none"
                            className="w-[100%] max-w-[600px] ion-no-border px-[4px] flex items-center justify-between notificaion-list-item py-[8px] border-b-2"
                        >
                            <div className="flex items-center justify-start w-full">
                                <div className="flex items-center justify-start">
                                    <UserProfilePicture
                                        customContainerClass="flex justify-center items-center w-12 h-12 rounded-full overflow-hidden text-white font-medium text-4xl mr-3"
                                        customImageClass="flex justify-center items-center w-12 h-12 rounded-full overflow-hidden object-cover"
                                        customSize={120}
                                        user={recipient?.to}
                                    />
                                </div>
                                <div className="flex flex-col items-start justify-center pt-1 pr-1 pb-1 text-sm">
                                    <p className="text-grayscale-900 font-semibold capitalize">
                                        {recipient?.to?.displayName || recipient?.to?.profileId}
                                    </p>
                                    <p className="text-grayscale-600 font-normal text-sm">
                                        {moment(recipient?.received).format('DD MMMM YYYY')} &bull;{' '}
                                        {moment(recipient?.received).format('h:mm A')}
                                    </p>
                                </div>
                            </div>
                        </IonItem>
                    );
                })}
            </IonList>
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
