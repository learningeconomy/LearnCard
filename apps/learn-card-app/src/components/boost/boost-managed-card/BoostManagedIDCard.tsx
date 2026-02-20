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
const HourGlass = '/lotties/hourglass.json';
import IDDisplayCard from 'learn-card-base/components/id/IDDisplayCard';
import IdDisplayContainer from 'apps/learn-card-app/src/pages/ids/IdDisplayContainer';
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
    useResolveBoost,
    useCountBoostRecipients,
    useModal,
    ModalTypes,
    categoryMetadata,
    CredentialCategory,
} from 'learn-card-base';
import { useGetBoostRecipients } from 'learn-card-base';
import useShortBoost from '../hooks/useShortBoost';
import useBoostMenu, { BoostMenuType } from '../hooks/useBoostMenu';
import useBoost from '../hooks/useBoost';
import { useLoadingLine } from 'apps/learn-card-app/src/stores/loadingStore';

import { closeAll } from 'apps/learn-card-app/src/helpers/uiHelpers';
import {
    unwrapBoostCredential,
    getAchievementTypeDisplayText,
    getImageUrlFromCredential,
} from 'learn-card-base/helpers/credentialHelpers';

import { useTheme } from '../../../theme/hooks/useTheme';

type BoostManagedIDCardProps = {
    boost: Boost;
    boostVC?: VC;
    defaultImg: string;
    categoryType: CredentialCategory;
    sizeLg?: number;
    sizeMd?: number;
    sizeSm?: number;
    boostPageViewMode?: BoostPageViewModeType;
    userToBoostProfileId?: string;
    loading?: boolean;
};

export const BoostManagedIDCard: React.FC<BoostManagedIDCardProps> = ({
    boost,
    boostVC: _boostVC,
    defaultImg,
    categoryType,
    sizeLg = 4,
    sizeSm = 4,
    sizeMd = 4,
    boostPageViewMode = BoostPageViewMode.Card,
    userToBoostProfileId,
    loading,
}) => {
    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });

    const { colors } = useTheme();
    const primaryColor = colors?.primary;

    const {
        data: resolvedBoost,
        isFetching: resolvedBoostFetching,
        isLoading: resolvedBoostLoading,
    } = useResolveBoost(boost?.uri, !_boostVC);
    const boostVC = _boostVC || resolvedBoost;

    const { data: recipientCount } = useCountBoostRecipients(boost?.uri);

    const history = useHistory();
    const cred = unwrapBoostCredential(boostVC);
    const credImg = cred?.credentialSubject?.image;
    const [bodyComponent, setBodyComponent] = useState<React.ReactNode>();

    const credentialBackgroundFetching = resolvedBoostFetching && !resolvedBoostLoading;

    useLoadingLine(credentialBackgroundFetching);

    const handlePresentBoostMenuModal = useBoostMenu({
        boostUri: boost.uri,
        boostCredential: boostVC,
        categoryType,
        menuType: BoostMenuType.managed,
    });

    const { data: recipients, isLoading: recipientsLoading } = useGetBoostRecipients(boost?.uri);
    const {
        data: myProfile,
        isLoading: myProfileLoading,
        isError: myProfileError,
    } = useGetProfile();

    const showSkeleton = loading || resolvedBoostLoading || recipientsLoading || myProfileLoading;

    const { handlePresentShortBoostModal } = useShortBoost(
        history,
        boostVC,
        boost?.uri,
        myProfile?.profileId,
        boost
    );

    const handleShowShortBoostModal = () => {
        closeAll();
        handlePresentShortBoostModal();
    };

    const [issueLoading, setIssueLoading] = useState(false);
    const { handleSubmitExistingBoostOther } = useBoost(history);

    const handleBoostClick = async () => {
        if (userToBoostProfileId) {
            // immediately issue the boost to the chosen user
            setIssueLoading(true);
            newModal(<BoostIssuanceLoading />);
            await handleSubmitExistingBoostOther(
                [{ profileId: userToBoostProfileId }],
                boost?.uri,
                boost?.status
            );
            setIssueLoading(false);
            closeAll?.();
            closeModal();
        } else {
            // show "Who do you want to Boost?" modal
            handleShowShortBoostModal();
        }
    };

    const thumbImg = boostVC?.image ?? defaultImg;
    const cardTitle = boost?.name || boostVC?.credentialSubject?.achievement?.name;

    const link = `/boost/update`;
    const linkQueryParams = `?uri=${boost?.uri}&boostUserType=someone&boostCategoryType=${boost?.category}&boostSubCategoryType=${boost?.type}`;

    const thumbImage = (cred && getImageUrlFromCredential(cred)) || defaultImg;
    const badgeThumbnail = credImg && credImg?.trim() !== '' ? credImg : thumbImage;

    const formattedDisplayType = getAchievementTypeDisplayText(boost?.type, categoryType);

    const type = categoryMetadata[categoryType].walletSubtype;
    const isID = categoryType === BoostCategoryOptionsEnum.id;
    const isMembership = categoryType === BoostCategoryOptionsEnum.membership;

    let idDisplayContainerClass = '';
    let idSleeveFooterClass = '';

    if (isID) {
        idDisplayContainerClass = '!border-white';
        idSleeveFooterClass = '!bg-teal-300';
    } else if (isMembership) {
        idDisplayContainerClass = '!border-teal-400';
        idSleeveFooterClass = '!bg-teal-300';
    }

    const handleEditOnClick = () => {
        closeModal();
        history.push(`${link}${linkQueryParams}`);
    };

    const handleIssueOnClick = () => {
        closeModal();
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
                    name: recipient?.to?.displayName,
                    thumb: recipient?.to?.image,
                    date: recipient?.received,
                    profileId: recipient?.to?.profileId,
                });
            }
        });
    }
    const handleOptionsMenu = async () => handlePresentBoostMenuModal();
    const presentModal = () => {
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
            customThumbComponent:
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
                <IonList
                    lines="none"
                    className="flex flex-col items-center justify-center w-[100%]"
                >
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
                                            {moment(recipient?.received).format('DD MMMM YYYY')}{' '}
                                            &bull; {moment(recipient?.received).format('h:mm A')}
                                        </p>
                                    </div>
                                </div>
                            </IonItem>
                        );
                    })}
                </IonList>
            ),
            hideQRCode: true,
        };
        newModal(<BoostPreview {...managedBoostIdCardProps} />);
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
                        className={`text-${primaryColor}-600 font-semibold text-base leading-snug`}
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
                            path={HourGlass}
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
    }, [recipientsLoading]);

    return (
        <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <IdDisplayContainer
                achievementType={boostVC?.credentialSubject?.achievement?.achievementType}
                title={cardTitle}
                recipients={recipients}
                recipientsLoading={recipientsLoading}
                boostStatus={boost?.status}
                handlePreviewBoost={
                    boostVC && !showSkeleton
                        ? () => {
                              resetIonicModalBackground();
                              setIonicModalBackground(cred?.display?.backgroundImage);
                              presentModal();
                          }
                        : undefined
                }
                handleEditOnClick={boostVC ? handleEditOnClick : undefined}
                handleShortBoost={boostVC ? handleBoostClick : undefined}
                viewMode={CredentialListTabEnum.Managed}
                location={cred?.address?.streetAddress}
                issuerThumbnail={cred?.boostID?.issuerThumbnail}
                showIssuerThumbnail={cred?.boostID?.showIssuerThumbnail}
                backgroundImage={cred?.boostID?.backgroundImage}
                dimBackgroundImage={cred?.boostID?.dimBackgroundImage}
                fontColor={cred?.boostID?.fontColor}
                accentColor={cred?.boostID?.accentColor}
                handleOptionsModal={handleOptionsMenu}
                categoryType={categoryType}
                idDisplayContainerClass={idDisplayContainerClass}
                idSleeveFooterClass={idSleeveFooterClass}
                cred={cred}
                boostPageViewMode={boostPageViewMode}
                loading={showSkeleton}
            />
        </ErrorBoundary>
    );
};

export default BoostManagedIDCard;
