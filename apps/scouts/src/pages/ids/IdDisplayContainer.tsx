import React from 'react';
import Lottie from 'react-lottie-player';

import { IonRow, IonCol } from '@ionic/react';
import RibbonAwardIcon from 'learn-card-base/svgs/RibbonAwardIcon';
import MembershipSleeve from 'learn-card-base/assets/images/troops-sleeve.svg';
import ThreeDots from 'learn-card-base/svgs/ThreeDots';
import HourGlass from '../../assets/lotties/hourglass.json';
import BoostPreviewBody from '../../components/boost/boostCMS/BoostPreview/BoostPreviewBody';
import BoostListItem from 'learn-card-base/components/boost/BoostListItem';
import TroopPage from '../troop/TroopPage';
import TroopID from '../troop/TroopID';
import TroopIdStatusButton from '../troop/TroopIdStatusButton';
import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import { VerifiedBadgeWhiteBackground } from 'learn-card-base/svgs/VerifiedBadge';
import { insertParamsToFilestackUrl } from 'learn-card-base';
import { BoostRecipientInfo, VC } from '@learncard/types';
import {
    BoostPageViewMode,
    BoostPageViewModeType,
    BrandingEnum,
    CredentialListTabEnum,
    ModalTypes,
    useGetCurrentLCNUser,
    useModal,
} from 'learn-card-base';
import { BoostCategoryOptionsEnum } from 'learn-card-base';
import { getAchievementTypeDisplayText } from 'learn-card-base/helpers/credentialHelpers';
import {
    BoostSkeleton,
    BoostTextSkeleton,
} from 'learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons';
import { getDefaultBadgeThumbForCredential } from '../../helpers/troop.helpers';

type IdDisplayContainerProps = {
    achievementType: string;
    title?: string;
    subtitle?: string;
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
    subtitle,
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
    const currentUser = useGetCurrentLCNUser();
    const { newModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    let idBody = null;

    let credSleeve;

    if (categoryType === BoostCategoryOptionsEnum.id) {
        credSleeve = MembershipSleeve;
    } else if (categoryType === BoostCategoryOptionsEnum.membership) {
        credSleeve = MembershipSleeve;
    }

    let achievementTypeText = getAchievementTypeDisplayText(achievementType, categoryType);

    if (achievementTypeText === 'Scout') {
        achievementTypeText = 'Troop';
    }

    if (boostPageViewMode === BoostPageViewMode.List) {
        return (
            <BoostListItem
                credential={cred}
                title={title}
                onClick={handlePreviewBoost}
                onOptionsClick={handleOptionsModal}
                categoryType={categoryType}
                branding={BrandingEnum.scoutPass}
                loading={loading}
                managedBoost={viewMode === CredentialListTabEnum.Managed}
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
                    bottom: -65,
                    left: 0,
                    width: '400px',
                }}
                className="min-w-[100%] w-full h-[55%] bg-repeat bg-contain z-50"
            >
                <IonRow className="w-full flex items-center">
                    <IonCol className="flex justify-start items-center pl-2">
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
                    </IonCol>
                    <IonCol className="flex justify-end items-center pr-2 relative">
                        <div className="w-full absolute top-[30px] right-[35px]">
                            <TroopIdStatusButton
                                credential={cred?.boostCredential ?? cred}
                                skeletonStyles={{
                                    padding: '8px 14px 8px 14px',
                                    width: '100px',
                                    position: 'absolute',
                                    top: '-26px',
                                    right: '10px',
                                }}
                            />
                        </div>
                    </IonCol>
                </IonRow>
            </div>
        );
    } else {
        let recipientsEl;
        if (boostStatus === 'DRAFT') {
            recipientsEl = (
                <button
                    className="flex items-center justify-center bg-grayscale-200 rounded-full px-4 py-[4px] text-grayscale-900 text-base font-medium shadow-bottom"
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
                    bottom: -65,
                    left: 0,
                }}
                className="min-w-[100%] w-full h-[55%] bg-repeat bg-contain z-50"
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
                                className="flex items-center justify-center bg-white rounded-full pl-[2.5px] pr-[10px] py-[4px] text-grayscale-800 text-base font-medium shadow-bottom"
                            >
                                <RibbonAwardIcon className="ml-[5px] h-[23px] w-[23px] mr-1" /> Send
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
            onClick={() => {
                if (!cred) return;
                newModal(
                    <TroopPage
                        credential={cred.boostCredential ?? cred}
                        handleShare={handleQRCodeClick}
                    />
                );
            }}
        >
            <div className="relative id-card-sleeve-container max-w-[360px] bg-sp-green-forest rounded-[20px] px-[8px] pt-[8px]">
                <div className="bg-white px-[6px] rounded-t-[15px]">
                    {!loading && (
                        <IonRow className="min-h-[55px]">
                            <IonCol
                                size="11"
                                className="flex items-center justify-start gap-[10px] z-50 mt-2"
                            >
                                {showIssuerThumbnail && (
                                    <div className="w-[50px] h-[50px] min-w-[50px] min-h-[50px] rounded-full overflow-hidden relative">
                                        {issuerThumbnail ? (
                                            <img
                                                alt="issuer thumbnail"
                                                src={insertParamsToFilestackUrl(
                                                    issuerThumbnail,
                                                    'resize=width:200/quality=value:75/'
                                                )}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            getDefaultBadgeThumbForCredential(
                                                cred,
                                                'h-[50px] w-[50px]'
                                            )
                                        )}
                                    </div>
                                )}
                                <div className="text-left flex flex-col items-start justify-center w-full">
                                    {title && (
                                        <h3 className="w-full flex gap-[4px] items-center">
                                            <span className="text-grayscale-900 font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] line-clamp-1">
                                                {title}
                                            </span>
                                        </h3>
                                    )}
                                    <span className="text-grayscale-700 font-notoSans text-[14px] font-[600] line-clamp-1">
                                        {achievementTypeText} {subtitle && `• ${subtitle}`}
                                    </span>
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
                                className="absolute top-[18px] right-[13px]"
                            >
                                <ThreeDots className="text-grayscale-600 w-[20px] h-[20px]" />
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

                    <div className={`relative p-[4px] ${idDisplayContainerClass}`}>
                        <TroopID
                            credential={cred?.boostCredential ?? cred}
                            name={currentUser.currentLCNUser?.displayName ?? 'Unknown'}
                            thumbSrc={currentUser.currentLCNUser?.image}
                            containerClassName="w-[325px]"
                            mainClassName="!pt-[15px] pb-[22px] !items-start"
                            hideFooter
                        />
                        {!loading && (
                            <button
                                onClick={e => {
                                    e.stopPropagation();
                                    handleQRCodeClick();
                                }}
                                className="absolute top-[10px] right-[10px] flex items-center justify-center bg-white rounded-full p-[10px] z-50 shadow-3xl"
                            >
                                <QRCodeScanner className="h-[30px] w-[30px] text-grayscale-900" />
                            </button>
                        )}
                    </div>
                    {idBody}
                </div>
            </div>
        </IonRow>
    );
};

export default IdDisplayContainer;
