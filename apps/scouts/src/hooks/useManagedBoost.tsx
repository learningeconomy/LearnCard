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
    BoostUserTypeEnum,
    CredentialCategoryEnum,
    ProfilePicture,
    BrandingEnum,
    setIonicModalBackground,
    resetIonicModalBackground,
} from 'learn-card-base';

import { IonItem, IonList } from '@ionic/react';
import BoostPreview from '../components/boost/boostCMS/BoostPreview/BoostPreview';
import BoostPreviewBody from '../components/boost/boostCMS/BoostPreview/BoostPreviewBody';
import BoostPreviewFooter from '../components/boost/boostCMS/BoostPreview/BoostPreviewFooter';
import UpdateBoostCMS from '../components/boost/boostCMS/UpdateBoostCMS';

import { closeAll } from '../helpers/uiHelpers';
import {
    getImageUrlFromCredential,
    unwrapBoostCredential,
} from 'learn-card-base/helpers/credentialHelpers';

import { Boost, VC } from '@learncard/types';

export const useManagedBoost = (
    boost: Boost,
    additionalInfo: {
        categoryType: CredentialCategory;
        boostVC?: VC; // if we already have the VC we can skip the useResolveBoost call
        loading?: boolean;
        defaultImg?: string;
        disableLoadingLine?: boolean;
        useCmsModal?: boolean;
        parentUri?: string;
        branding?: BrandingEnum;
        overrideCustomize?: boolean;
        refetchQuery?: () => void;
    }
) => {
    const history = useHistory();
    const currentUser = useCurrentUser();

    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });

    const {
        boostVC: _boostVC,
        categoryType,
        loading,
        defaultImg,
        disableLoadingLine,
        useCmsModal,
        parentUri,
        branding,
        refetchQuery,
        overrideCustomize,
    } = additionalInfo;

    // TODO handle edits? useGetCredentialWithEdits. Might not be relevant for managed boosts?
    const {
        data: resolvedBoost,
        isLoading: resolvedBoostLoading,
        isFetching: resolvedBoostFetching,
    } = useResolveBoost(boost?.uri, !_boostVC);
    const boostVC = _boostVC || resolvedBoost;

    const cred = unwrapBoostCredential(boostVC);
    const credImg = cred?.credentialSubject?.image;
    const thumbImage = (cred && getImageUrlFromCredential(cred)) || defaultImg;
    const badgeThumbnail = credImg && credImg?.trim() !== '' ? credImg : (thumbImage as string);

    const isMeritBadge = categoryType === CredentialCategoryEnum.meritBadge;
    const isID = boostVC?.display?.displayType === 'id' || categoryType === 'ID';
    const isDraft = boost?.status === 'DRAFT';
    const isLive = boost?.status === 'LIVE';

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
                    name: recipient?.to?.displayName as string,
                    thumb: recipient?.to?.image as string,
                    date: recipient?.received as string,
                    profileId: recipient?.to?.profileId as string,
                });
            }
        });
    }

    const { data: myProfile, isLoading: myProfileLoading } = useGetProfile();

    const { handlePresentBoostMenuModal } = useBoostMenu(
        boostVC as any,
        boost.uri,
        boost as any,
        categoryType,
        BoostMenuType.managed,
        closeAll
    );

    const handleOptionsMenu = async () => {
        handlePresentBoostMenuModal();
    };

    const { handlePresentShortBoostModal } = useShortBoost(
        history,
        boostVC as any,
        boost?.uri,
        myProfile?.profileId as string,
        boost as any
    );

    const showSkeleton = loading || resolvedBoostLoading || recipientsLoading || myProfileLoading;

    const link = `/boost/update`;
    const linkQueryParams = `?uri=${boost?.uri}&boostUserType=someone&boostCategoryType=${boost?.category}&boostSubCategoryType=${boost?.type}$overrideCustomize=${overrideCustomize}`;

    const handleEditOnClick = () => {
        if (useCmsModal) {
            presentBoostCMSModal();
        } else {
            closeModal();
            history.push(`${link}${linkQueryParams}`);
        }
    };

    const presentBoostCMSModal = () => {
        newModal(
            <UpdateBoostCMS
                boostCategoryType={categoryType}
                boostSubCategoryType={boost?.type}
                boostUserType={BoostUserTypeEnum.someone}
                handleCloseModal={() => {
                    refetchQuery?.();
                    closeModal();
                }}
                boostUri={boost.uri}
                overrideCustomize={overrideCustomize}
                parentUri={parentUri}
            />
        );
    };

    const handleIssueOnClick = () => {
        closeModal();
        history.push(`${link}${linkQueryParams}&issue=true`);
    };

    const presentManagedBoostPreview = () => {
        newModal(
            <BoostPreview
                credential={boostVC as any}
                categoryType={categoryType as any}
                showVerifications={false}
                onDotsClick={isDraft && !showSkeleton ? handleOptionsMenu : undefined}
                issueeOverride={isMeritBadge ? 'Scout' : undefined}
                issuerOverride={isMeritBadge ? currentUser?.name : undefined}
                issuerImageComponent={isMeritBadge ? <ProfilePicture /> : undefined}
                handleCloseModal={() => closeModal()}
                customBodyCardComponent={
                    <BoostPreviewBody
                        recipients={recipients ?? []}
                        recipientCountOverride={recipientCount}
                        canEdit={boost?.status === 'DRAFT'}
                        handleEditOnClick={handleEditOnClick}
                        customBoostPreviewContainerClass="bg-white"
                        customBoostPreviewContainerRowClass="items-center"
                    />
                }
                customThumbComponent={
                    <CredentialBadge
                        achievementType={boostVC?.credentialSubject?.achievement?.achievementType}
                        boostType={categoryType as any}
                        badgeThumbnail={badgeThumbnail}
                        badgeCircleCustomClass="w-[170px] h-[170px]"
                        displayType={cred?.display?.displayType}
                        credential={boostVC as any}
                        branding={branding}
                        showBackgroundImage={false}
                        backgroundImage={boostVC?.display?.backgroundImage ?? ''}
                        backgroundColor={boostVC?.display?.backgroundColor ?? ''}
                    />
                }
                customFooterComponent={
                    <BoostPreviewFooter
                        showSaveAndQuitButton={false}
                        handleSubmit={handleIssueOnClick}
                        selectedVCType={categoryType as any}
                    />
                }
                customIssueHistoryComponent={
                    <IonList lines="none" className="flex flex-col items-center justify-center w-full">
                        {recipients?.map((recipient, index) => {
                            return (
                                <IonItem
                                    key={index}
                                    lines="none"
                                    className="w-full max-w-[600px] ion-no-border px-[4px] flex items-center justify-between notificaion-list-item py-[8px] border-b-2 last:border-b-0"
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
                                                {moment(
                                                    recipient?.received ?? resolvedBoost?.issuanceDate
                                                ).format('DD MMMM YYYY')}{' '}
                                                &bull;{' '}
                                                {moment(
                                                    recipient?.received ?? resolvedBoost?.issuanceDate
                                                ).format('h:mm A')}
                                            </p>
                                        </div>
                                    </div>
                                </IonItem>
                            );
                        })}
                    </IonList>
                }
                verificationItems={[]}
            />,
            {
                onClose: () => {
                    resetIonicModalBackground();
                },
            }
        );
    };

    const presentManagedBoostModal = () => {
        if (showSkeleton) return;
        if (isID || isMeritBadge) {
            setIonicModalBackground(cred?.display?.backgroundImage);
        }
        presentManagedBoostPreview();
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
        handleEditOnClick,
        handleIssueOnClick,
        handleOptionsMenu,
        presentManagedBoostModal,
        handlePresentShortBoostModal,
    };
};

export default useManagedBoost;
