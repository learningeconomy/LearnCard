import React from 'react';
import Lottie from 'react-lottie-player';

import { IonRow, IonCol } from '@ionic/react';
import RibbonAwardIcon from 'learn-card-base/svgs/RibbonAwardIcon';
import MembershipSleeve from 'learn-card-base/assets/images/membership-sleeve.svg';
import IDDisplayCard from 'learn-card-base/components/id/IDDisplayCard';
import EmptyImage from 'learn-card-base/assets/images/empty-image.png';
import ThreeDots from 'learn-card-base/svgs/ThreeDots';
import HourGlass from '../../assets/lotties/hourglass.json';
import BoostPreviewBody from '../../components/boost/boostCMS/BoostPreview/BoostPreviewBody';
import CredentialVerificationDisplay from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';
import IDIcon from 'learn-card-base/svgs/IDIcon';
import BoostListItem from 'learn-card-base/components/boost/BoostListItem';

import { BoostRecipientInfo, VC } from '@learncard/types';
import { BoostPageViewMode, BoostPageViewModeType, CredentialListTabEnum } from 'learn-card-base';
import { BoostCategoryOptionsEnum } from '../../components/boost/boost-options/boostOptions';
import { getAchievementTypeDisplayText } from 'learn-card-base/helpers/credentialHelpers';
import BoostTextSkeleton, {
    BoostSkeleton,
} from 'learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons';
import GearPlusIcon from 'learn-card-base/svgs/GearPlusIcon';

type IdDisplayContainerProps = {
    achievementType: string;
    title?: string;
    location?: string;
    showIssuerThumbnail?: boolean;
    issuerThumbnail?: string;
    issuerName?: string;
    backgroundImage?: string;
    dimBackgroundImage?: boolean;
    fontColor?: string;
    accentColor?: string;
    recipients?: BoostRecipientInfo[];
    recipientsLoading?: boolean;
    boostStatus?: string;
    handlePreviewBoost?: () => void;
    handleEditOnClick?: () => void;
    handleShortBoost?: () => void;
    handleOptionsModal?: () => void;
    viewMode: CredentialListTabEnum;
    categoryType: BoostCategoryOptionsEnum;
    idDisplayContainerClass?: string;
    idSleeveFooterClass?: string;
    issueeThumbnail?: string;
    issueeName?: string;
    cred?: VC;
    showQRCode?: boolean;
    handleQRCodeClick?: () => void;
    boostPageViewMode?: BoostPageViewModeType;
    loading?: boolean;
};

const IdDisplayContainer: React.FC<IdDisplayContainerProps> = ({
    achievementType,
    title,
    location = '',
    showIssuerThumbnail = false,
    issuerThumbnail,
    issuerName = '',
    backgroundImage,
    dimBackgroundImage,
    fontColor = '',
    accentColor = '',
    recipients,
    recipientsLoading,
    boostStatus = '',
    handlePreviewBoost = () => {},
    handleEditOnClick = () => {},
    handleShortBoost = () => {},
    handleOptionsModal = () => {},
    viewMode = CredentialListTabEnum.Earned,
    categoryType,
    idDisplayContainerClass = '',
    idSleeveFooterClass = '',
    issueeThumbnail = '',
    issueeName = '',
    cred,
    showQRCode = false,
    handleQRCodeClick = () => {},
    boostPageViewMode = BoostPageViewMode.Card,
    loading,
}) => {
    let idBody = null;

    let credSleeve;

    if (categoryType === BoostCategoryOptionsEnum.id) {
        credSleeve = MembershipSleeve;
    } else if (categoryType === BoostCategoryOptionsEnum.membership) {
        credSleeve = MembershipSleeve;
    }

    let achievementTypeText = getAchievementTypeDisplayText(achievementType, categoryType);

    if (boostPageViewMode === BoostPageViewMode.List) {
        return (
            <BoostListItem
                credential={cred}
                title={title}
                onClick={handlePreviewBoost}
                onOptionsClick={handleOptionsModal}
                categoryType={categoryType}
                loading={loading}
            />
        );
    }

    if (viewMode === CredentialListTabEnum.Earned) {
        idBody = (
            <div
                style={{
                    backgroundImage: `url(${credSleeve})`,
                    backgroundRepeat: 'no-repeat',
                    position: 'absolute',
                    bottom: 0,
                }}
                className="bottom-0 left-0 absolute min-w-[100%] w-full h-[55%] bg-repeat bg-contain z-50"
            >
                <IonRow className="w-full flex items-center">
                    <IonCol className="flex justify-start items-center pl-2">
                        {loading && (
                            <div className="flex items-start justify-start">
                                <BoostSkeleton
                                    containerClassName="h-[30px] w-[30px]"
                                    skeletonStyles={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '100%',
                                    }}
                                />
                            </div>
                        )}
                    </IonCol>

                    <IonCol className="flex justify-end items-center pr-2">
                        <IDIcon className="text-white" />
                    </IonCol>
                </IonRow>
            </div>
        );
    } else {
        let recipientsEl;
        if (boostStatus === 'DRAFT') {
            recipientsEl = (
                <button
                    className="font-poppins flex items-center justify-center bg-grayscale-200 rounded-full px-4 py-[2px] text-grayscale-900 text-lg font-medium shadow-bottom"
                    onClick={e => {
                        e.stopPropagation();
                        handleEditOnClick();
                    }}
                >
                    Edit Draft
                </button>
            );
        }

        if (recipientsLoading) {
            recipientsEl = (
                <div className="relative ml-8 text-center flex flex-col items-center justify-center">
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

        if (recipients?.length > 0) {
            recipientsEl = (
                <BoostPreviewBody
                    recipients={recipients}
                    showRecipientText={false}
                    customRecipientContainerClass="!py-0 !pl-[4px] !items-start !justify-start"
                    customBoostPreviewContainerClass="bg-none"
                    customBoostPreviewContainerRowClass="!items-start !justify-start"
                />
            );
        }

        idBody = (
            <div
                style={{
                    backgroundImage: `url(${credSleeve})`,
                    backgroundRepeat: 'no-repeat',
                    position: 'absolute',
                    bottom: 0,
                }}
                className="bottom-0 left-0 absolute min-w-[100%] w-full h-[55%] bg-repeat bg-contain z-50"
            >
                <IonRow className="w-full flex items-center">
                    <IonCol className="flex justify-start items-center pl-2 mt-1">
                        {!loading && recipientsEl}
                        {loading && (
                            <div className="flex items-start justify-start">
                                <BoostSkeleton
                                    containerClassName="h-[30px] w-[30px]"
                                    skeletonStyles={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '100%',
                                    }}
                                />
                            </div>
                        )}
                    </IonCol>
                    <IonCol className="flex justify-end items-center pr-2 mt-1">
                        {loading ? (
                            <BoostSkeleton
                                containerClassName="small-boost-boost-btn flex boost-btn-click rounded-[40px] w-[96px] h-[40px] text-white flex justify-center items-center"
                                skeletonStyles={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '40px',
                                }}
                            />
                        ) : (
                            <button
                                onClick={e => {
                                    e.stopPropagation();
                                    handleShortBoost();
                                }}
                                className="font-poppins flex items-center justify-center bg-grayscale-50 rounded-full pl-[2.5px] pr-[10px] py-[4px] text-grayscale-900 text-lg font-medium shadow-bottom"
                            >
                                <GearPlusIcon className="ml-[5px] h-[23px] w-[23px] mr-1 text-grayscale-900" />{' '}
                                Boost
                            </button>
                        )}
                    </IonCol>
                </IonRow>
            </div>
        );
    }

    return (
        <IonRow
            className="flex items-center justify-center cursor-pointer mx-4 max-h-[200px] overflow-hidden"
            onClick={handlePreviewBoost}
        >
            <div className="relative id-card-sleeve-container bg-blue-400 rounded-t-[15px] px-[6px]">
                {!loading && (
                    <IonRow className="min-h-[55px] pb-1">
                        <IonCol size="11" className="flex items-center justify-start z-50 mt-2">
                            {showIssuerThumbnail && (
                                <div className="relative mr-2">
                                    <div
                                        className={`absolute flex items-center justify-center left-[60%] top-[-20%] z-50`}
                                    >
                                        <CredentialVerificationDisplay
                                            credential={cred}
                                            iconClassName="w-[20px] h-[20px]"
                                        />
                                    </div>
                                    <div className="w-[45px] h-[45px] min-w-[45px] min-h-[45px] rounded-full bg-white flex items-center justify-center overflow-hidden border-[2px] border-solid border-white relative">
                                        {issuerThumbnail ? (
                                            <img
                                                alt="issuer thumbnail"
                                                src={issuerThumbnail}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <img
                                                alt="issuer thumbnail"
                                                src={EmptyImage}
                                                className="w-[30px] h-[34px]"
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                            <div className="text-left flex flex-col items-start justify-center w-full">
                                {achievementTypeText && (
                                    <h3 className="text-sm font-bold capitalize text-white text-left w-full line-clamp-1">
                                        {achievementTypeText}
                                    </h3>
                                )}
                                {title && (
                                    <h3 className="text-sm font-normal capitalize text-white text-left w-full line-clamp-1">
                                        {title}
                                    </h3>
                                )}
                                {/* {location && (
                                <p className="text-sm text-grayscale-800 text-left font-medium">
                                    {location}
                                </p>
                            )} */}
                            </div>
                        </IonCol>
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                handleOptionsModal();
                            }}
                            className="flex items-center justify-center text-center rounded-full text-white text-sm font-bold h-[32px] w-[32px] m-0 absolute top-[5px] right-0"
                        >
                            <ThreeDots className="text-white h-[30px] p-0 m-0" />
                        </button>
                    </IonRow>
                )}

                {loading && (
                    <IonRow className="min-h-[55px] pb-1">
                        <IonCol size="11" className="flex items-center justify-start z-50 mt-2">
                            {showIssuerThumbnail && (
                                <div className="relative mr-2">
                                    <div className="w-[45px] h-[45px] min-w-[45px] min-h-[45px] rounded-full bg-none flex items-center justify-center overflow-hidden relative">
                                        <BoostSkeleton
                                            containerClassName="w-full h-full rounded-full"
                                            skeletonStyles={{ width: '100%', height: '100%' }}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="text-left flex flex-col items-start justify-center w-full">
                                <BoostTextSkeleton
                                    containerClassName="w-full"
                                    skeletonStyles={{ width: '80%' }}
                                />
                                <BoostTextSkeleton
                                    containerClassName="w-full"
                                    skeletonStyles={{ width: '50%' }}
                                />
                            </div>
                        </IonCol>
                    </IonRow>
                )}

                <div
                    className={`flex flex-col items-center justify-center z-50 border-4 rounded-[28px]  p-0 m-0 ${idDisplayContainerClass}`}
                >
                    <IDDisplayCard
                        name={title}
                        location={location}
                        idIssuerName={issuerName}
                        issuerThumbnail={issuerThumbnail}
                        showIssuerImage={showIssuerThumbnail}
                        backgroundImage={backgroundImage}
                        dimBackgroundImage={dimBackgroundImage}
                        fontColor={fontColor}
                        accentColor={accentColor}
                        idClassName="border-none"
                        issueeName={issueeName}
                        issueeThumbnail={issueeThumbnail}
                        showQRCode={showQRCode}
                        handleQRCodeClick={handleQRCodeClick}
                        loading={loading}
                    />
                </div>
                {idBody}
            </div>
        </IonRow>
    );
};

export default IdDisplayContainer;
