import React, { useEffect, useState } from 'react';
import moment from 'moment';
import Lottie from 'react-lottie-player';
import { useHistory } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';

import { VC, Boost } from '@learncard/types';

import { IonList, IonItem } from '@ionic/react';
import BoostPreview from '../../boost/boostCMS/BoostPreview/BoostPreview';
import BoostPreviewBody from '../../boost/boostCMS/BoostPreview/BoostPreviewBody';
import BoostPreviewFooter from '../../boost/boostCMS/BoostPreview/BoostPreviewFooter';
import CredentialBadge from 'learn-card-base/components/CredentialBadge/CredentialBadge';
// @ts-ignore
import HourGlass from '../../../assets/lotties/hourglass.json';
import IDDisplayCard from 'learn-card-base/components/id/IDDisplayCard';
import IdDisplayContainer from '../../../pages/ids/IdDisplayContainer';
import { BoostIssuanceLoading } from '../boostLoader/BoostLoader';

import {
    BoostCategoryOptionsEnum,
    BoostPageViewMode,
    BoostPageViewModeType,
    CredentialListTabEnum,
    UserProfilePicture,
    resetIonicModalBackground,
    setIonicModalBackground,
    useGetProfile,
    useCountBoostRecipients,
    useResolveBoost,
    BrandingEnum,
    CredentialCategory,
    useModal,
    ModalTypes,
    useGetBoostRecipients,
} from 'learn-card-base';
import useShortBoost from '../hooks/useShortBoost';
import useBoostMenu, { BoostMenuType } from '../hooks/useBoostMenu';
import useBoost from '../hooks/useBoost';
import { useLoadingLine } from '../../../stores/loadingStore';

import { closeAll } from '../../../helpers/uiHelpers';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';
import { getImageUrlFromCredential } from 'learn-card-base/helpers/credentialHelpers';

type BoostManagedIDCardProps = {
    boost: Boost;
    boostVC?: VC;
    defaultImg: string;
    categoryType: CredentialCategory;
    sizeLg?: number;
    sizeMd?: number;
    sizeSm?: number;
    branding?: BrandingEnum;
    userToBoostProfileId?: string;
    boostPageViewMode?: BoostPageViewModeType;
    loading?: boolean;
};

export const BoostManagedIDCard: React.FC<BoostManagedIDCardProps> = ({
    boost,
    boostVC: _boostVC,
    defaultImg,
    categoryType,
    branding,
    userToBoostProfileId,
    boostPageViewMode = BoostPageViewMode.Card,
    loading,
}) => {
    const {
        data: resolvedBoost,
        isFetching: resolvedBoostFetching,
        isLoading: resolvedBoostLoading,
    } = useResolveBoost(boost?.uri, !_boostVC);
    const boostVC = _boostVC || resolvedBoost;

    const history = useHistory();
    const cred = unwrapBoostCredential(boostVC);
    const credImg = cred?.credentialSubject?.image;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_bodyComponent, setBodyComponent] = useState<React.ReactNode>();

    const { data: recipientCount } = useCountBoostRecipients(boost?.uri);
    const credentialBackgroundFetching = resolvedBoostFetching && !resolvedBoostLoading;

    useLoadingLine(credentialBackgroundFetching);

    const { handlePresentBoostMenuModal } = useBoostMenu(
        boostVC as any,
        boost?.uri,
        boost as any,
        categoryType,
        BoostMenuType.managed
    );

    const { data: recipients, isLoading: recipientsLoading } = useGetBoostRecipients(boost?.uri);
    const {
        data: myProfile,
        isLoading: myProfileLoading,
    } = useGetProfile();

    const showSkeleton = loading || resolvedBoostLoading || recipientsLoading || myProfileLoading;

    const { handlePresentShortBoostModal } = useShortBoost(
        history,
        boostVC as any,
        boost?.uri,
        myProfile?.profileId as string,
        boost as any
    );

    const handleShowShortBoostModal = () => {
        closeAll();
        handlePresentShortBoostModal();
    };

    const [issueLoading, setIssueLoading] = useState(false);
    const { handleSubmitExistingBoostOther } = useBoost(history);

    const { newModal: newIssueLoadingModal, closeModal: closeIssueLoadingModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

    const { newModal: newPreviewModal, closeModal: closePreviewModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const handleBoostClick = async () => {
        if (userToBoostProfileId) {
            // immediately issue the boost to the chosen user
            setIssueLoading(true);
            newIssueLoadingModal(<BoostIssuanceLoading loading={issueLoading} />);
            await handleSubmitExistingBoostOther(
                [{ profileId: userToBoostProfileId }],
                boost?.uri,
                boost?.status
            );
            setIssueLoading(false);
            closeAll?.();
            closeIssueLoadingModal();
        } else {
            // show "Who do you want to Boost?" modal
            handleShowShortBoostModal();
        }
    };

    const cardTitle = boost?.name || boostVC?.credentialSubject?.achievement?.name;

    const link = "/boost/update";
    const linkQueryParams = `?uri=${boost?.uri}&boostUserType=someone&boostCategoryType=${boost?.category}&boostSubCategoryType=${boost?.type}`;

    const thumbImage = (cred && getImageUrlFromCredential(cred)) || defaultImg;
    const badgeThumbnail = credImg && credImg?.trim() !== '' ? credImg : (thumbImage as string);

    const isID = categoryType === BoostCategoryOptionsEnum.id;
    const isMembership = categoryType === BoostCategoryOptionsEnum.membership;

    let idDisplayContainerClass = '';
    let idSleeveFooterClass = '';

    if (isID) {
        idDisplayContainerClass = '!border-white';
        idSleeveFooterClass = '!bg-teal-300';
    } else if (isMembership) {
        idDisplayContainerClass = '!border-white';
        idSleeveFooterClass = '!bg-sp-green-light';
    }

    const handleEditOnClick = () => {
        closePreviewModal();
        history.push(`${link}${linkQueryParams}`);
    };

    const handleIssueOnClick = () => {
        closePreviewModal();
        history.push(`${link}${linkQueryParams}&issue=true`);
    };

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

    const presentManagedBoostPreview = () => {
        newPreviewModal(
            <BoostPreview
                credential={boostVC as any}
                categoryType={categoryType as any}
                showVerifications={false}
                issueHistory={issueHistory as any}
                onDotsClick={boost?.status === 'DRAFT' && !showSkeleton ? handleOptionsMenu : undefined}
                issueeOverride={categoryType === CredentialCategoryEnum.meritBadge ? 'Scout' : undefined}
                issuerOverride={categoryType === CredentialCategoryEnum.meritBadge ? currentUser?.name : undefined}
                issuerImageComponent={categoryType === CredentialCategoryEnum.meritBadge ? <ProfilePicture /> : undefined}
                handleCloseModal={() => closePreviewModal()}
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
                    isID || isMembership ? (
                        <IDDisplayCard
                            idClassName="p-0 m-0 mt-4 boost-id-preview-body min-h-[160px]"
                            idFooterClassName="p-0 m-0 mt-[-15px] boost-id-preview-footer"
                            customIssuerThumbContainerClass="id-card-issuer-thumb-preview-container"
                            name={cardTitle}
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
                            boostType={categoryType as any}
                            badgeThumbnail={badgeThumbnail}
                            badgeCircleCustomClass="w-[170px] h-[170px]"
                            showBackgroundImage={false}
                            backgroundImage={boostVC?.display?.backgroundImage ?? ''}
                            backgroundColor={boostVC?.display?.backgroundColor ?? ''}
                            credential={boostVC as any}
                        />
                    )
                }
                customFooterComponent={
                    <BoostPreviewFooter
                        showSaveAndQuitButton={false}
                        handleSubmit={handleIssueOnClick}
                        selectedVCType={categoryType as any}
                    />
                }
                customIssueHistoryComponent={
                    <IonList lines="none" className="flex flex-col items-center justify-center w-[100%]">
                        {recipients?.map((recipient, index) => {
                            return (
                                <IonItem
                                    key={recipient?.received || index}
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
                }
                hideQRCode={true}
                verificationItems={[]}
            />,
            {
                onClose: () => {
                    resetIonicModalBackground();
                },
            }
        );
    };

    useEffect(() => {
        let customBody;
        if (boost?.status === 'DRAFT') {
            customBody = (
                <div className="w-full text-center">
                    <p className="text-grayscale-600 font-semibold text-center text-[14px] leading-none">
                        No Boosts Yet
                    </p>
                    <button
                        className="text-indigo-600 font-semibold text-base leading-snug"
                        onClick={e => {
                            e.stopPropagation();
                            handleEditOnClick();
                        }}
                    >
                        Edit
                    </button>
                </div>
            );
        }

        if (recipientsLoading) {
            customBody = (
                <div className="relative w-full text-center flex flex-col items-center justify-center">
                    <div className="max-w-[50px]">
                        <Lottie
                            loop
                            animationData={HourGlass}
                            play
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                </div>
            );
        }

        if ((recipients?.length ?? 0) > 0 || typeof recipientCount === 'number') {
            customBody = (
                <BoostPreviewBody
                    recipients={recipients ?? []}
                    recipientCountOverride={recipientCount}
                    showRecipientText={false}
                    customRecipientContainerClass="px-[10px] py-0"
                    customBoostPreviewContainerClass="bg-white"
                    customBoostPreviewContainerRowClass="items-center"
                />
            );
        }

        setBodyComponent(customBody);
    }, [recipientsLoading, boost?.status, recipientCount, recipients]);

    const handleOptionsMenu = async () => handlePresentBoostMenuModal();

    return (
        <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <IdDisplayContainer
                achievementType={boostVC?.credentialSubject?.achievement?.achievementType}
                title={cardTitle}
                recipients={recipients as any}
                recipientsLoading={recipientsLoading}
                boostStatus={boost?.status as any}
                handlePreviewBoost={
                    boostVC && !showSkeleton
                        ? () => {
                              setIonicModalBackground(cred?.display?.backgroundImage);
                              presentManagedBoostPreview();
                          }
                        : undefined
                }
                handleEditOnClick={boostVC ? handleEditOnClick : undefined}
                handleShortBoost={boostVC ? handleShowShortBoostModal : undefined}
                viewMode={CredentialListTabEnum.Managed}
                location={cred?.address?.streetAddress}
                issuerThumbnail={cred?.boostID?.issuerThumbnail}
                showIssuerThumbnail={cred?.boostID?.showIssuerThumbnail}
                backgroundImage={cred?.boostID?.backgroundImage}
                dimBackgroundImage={cred?.boostID?.dimBackgroundImage}
                fontColor={cred?.boostID?.fontColor}
                accentColor={cred?.boostID?.accentColor}
                handleOptionsModal={handleOptionsMenu}
                categoryType={categoryType as any}
                idDisplayContainerClass={idDisplayContainerClass}
                idSleeveFooterClass={idSleeveFooterClass}
                cred={cred as any}
                boostPageViewMode={boostPageViewMode}
                loading={showSkeleton}
            />
        </ErrorBoundary>
    );
};

export default BoostManagedIDCard;
