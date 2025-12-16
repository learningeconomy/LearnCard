import React from 'react';
import moment from 'moment';
import { ErrorBoundary } from 'react-error-boundary';

import { useLoadingLine } from '../../../stores/loadingStore';
import useTheme from '../../../theme/hooks/useTheme';
import useBoostMenu, { BoostMenuType } from '../hooks/useBoostMenu';

import {
    useModal,
    CredentialSubjectDisplay,
    useGetVCInfo,
    useGetResolvedCredential,
    useGetCredentialWithEdits,
    ModalTypes,
    DisplayTypeEnum,
    categoryMetadata,
    BoostPageViewMode,
    CredentialCategory,
    BoostPageViewModeType,
    BoostGenericCardWrapper,
    resetIonicModalBackground,
    BoostCategoryOptionsEnum,
    newCredsStore,
} from 'learn-card-base';
import { IonCol } from '@ionic/react';

import BadgeSkeleton from 'learn-card-base/components/boost/boostSkeletonLoaders/BadgeSkeleton';

import FamilyCard from '../../familyCMS/FamilyCard/FamilyCard';
import BoostPreview from '../boostCMS/BoostPreview/BoostPreview';
import ShareBoostLink from '../boost-options-menu/ShareBoostLink';
import NonBoostPreview from '../boostCMS/BoostPreview/NonBoostPreview';
import IDDisplayCard from 'learn-card-base/components/id/IDDisplayCard';
import CredentialBadge from 'learn-card-base/components/CredentialBadge/CredentialBadge';
import CustomIssuerName from './helpers/CustomIssuerName';
import BoostTextSkeleton from 'learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons';
import CredentialBadgeNew from 'learn-card-base/components/CredentialBadge/CredentialBadgeNew';
import CustomBoostTitleDisplay from './helpers/CustomBoostTitleDisplay';
import BoostLinkedCredentialsBox from '../boostLinkedCredentials/BoostLinkedCredentialsBox';

import { getClrLinkedCredentials } from 'learn-card-base/helpers/credentialHelpers';

import { getInfoFromCredential } from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';
import {
    unwrapBoostCredential,
    isBoostCredential,
} from 'learn-card-base/helpers/credentialHelpers';

import { VC } from '@learncard/types';
import { LCR } from 'learn-card-base/types/credential-records';
import { ID_CARD_DISPLAY_TYPES } from 'learn-card-base/helpers/credentials/ids';
import { getDefaultDisplayType } from '../boostHelpers';

type BoostEarnedCardProps = {
    credential?: VC;
    record?: Partial<LCR>;
    defaultImg?: string;
    onCheckMarkClick?: any;
    selectAll?: any;
    initialCheckmarkState?: boolean;
    categoryType: CredentialCategory;
    sizeLg?: number;
    sizeMd?: number;
    sizeSm?: number;
    useWrapper?: boolean;
    showChecked?: boolean;
    verifierState?: boolean;
    hasBeenClicked?: boolean;
    boostPageViewMode?: BoostPageViewModeType;
    className?: string;
    loading?: boolean;
    isInSkillsModal?: boolean;
    textColor?: string;
};

export const BoostEarnedCard: React.FC<BoostEarnedCardProps> = ({
    credential: _credential,
    record,
    defaultImg,
    categoryType,
    sizeLg = 4,
    sizeSm = 4,
    sizeMd = 4,
    useWrapper = true,
    onCheckMarkClick,
    initialCheckmarkState,
    showChecked,
    className = '',
    verifierState,
    hasBeenClicked,
    boostPageViewMode = BoostPageViewMode.Card,
    loading,
    isInSkillsModal,
    textColor,
}) => {
    const { newModal, closeModal, closeAllModals } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });

    const {
        data: resolvedCredential,
        isFetching: credentialFetching,
        isLoading: credentialLoading,
    } = useGetResolvedCredential(record?.uri, !_credential);
    const credentialBackgroundFetching = credentialFetching && !credentialLoading;
    useLoadingLine(credentialBackgroundFetching);

    const credential = resolvedCredential || _credential;
    const isBoost = credential && isBoostCredential(credential);

    let cred = credential && unwrapBoostCredential(credential);
    const { credentialWithEdits } = useGetCredentialWithEdits(cred);
    cred = credentialWithEdits ?? cred;

    const type = categoryMetadata[categoryType].walletSubtype;

    let {
        issuerName,
        issuerProfileImageElement,

        // subject
        issueeName,
        subjectProfileImageElement,

        // ID overrides
        idDisplayType,
        idIssuerName,
        idIssuerThumbnailSrc,
        showIdIssuerThumbnail,
        idSubjectDID,
        mappedInputs,

        // VC metadata
        title,
        achievementType,
        formattedAchievementType,
        badgeThumbnail,
        isClrCredential,
        linkedCredentialCount,
        address,

        // VC Display Metadata
        displayType,
        previewType,
        idBackgroundImage,
        idDimBackgroundImage,
        idFontColor,
        idAccentColor,
        backgroundImage,
        backgroundColor,

        loading: vcInfoLoading,
    } = useGetVCInfo(cred, categoryType);

    const isCertificate = displayType === DisplayTypeEnum.Certificate;
    const isID = displayType === DisplayTypeEnum.ID || categoryType === 'ID';
    const isAwardDisplay = displayType === DisplayTypeEnum.Award;

    const handlePresentBoostMenuModal = useBoostMenu({
        credential,
        record,
        categoryType,
        menuType: BoostMenuType.earned,
        onDelete: closeAllModals,
    });

    const newCreds = newCredsStore.use.newCreds();
    const newCredsForCategory = newCreds?.[categoryType as CredentialCategory] ?? [];
    const showNewItemIndicator = newCredsForCategory?.includes(record?.uri) ?? false;

    const color = categoryMetadata[categoryType].color;
    const darkColor = categoryMetadata[categoryType].darkColor;
    const { getThemedCategory } = useTheme();
    const colors = getThemedCategory(categoryType as CredentialCategoryEnum)?.colors;
    const indicatorColor = colors?.indicatorColor;

    const presentShareBoostLink = () => {
        const shareBoostLinkModalProps = {
            handleClose: () => closeModal(),
            boost: credential,
            boostUri: record?.uri,
            categoryType,
        };

        newModal(<ShareBoostLink {...shareBoostLinkModalProps} />);
    };

    let customDescription: JSX.Element;

    if (idSubjectDID && idDisplayType === ID_CARD_DISPLAY_TYPES.PermanentResidentCard) {
        customDescription = <CredentialSubjectDisplay credentialSubject={idSubjectDID} />;
    }

    const showSkeleton = loading || credentialLoading || vcInfoLoading;

    const handleClick = (click: string) => {
        if (showSkeleton) return;
        if (click === 'innerOnClick' && !hasBeenClicked) {
            if (cred) {
                resetIonicModalBackground();
                presentModal();
            }
        } else if (click === 'onCheckClick') {
            hasBeenClicked = true;
            onCheckMarkClick();
        }
    };

    const handleOptionsMenu = async () => {
        handlePresentBoostMenuModal();
    };

    const customLinkedCredentialsComponent =
        linkedCredentialCount > 0 ? (
            <BoostLinkedCredentialsBox
                displayType={displayType}
                credential={credential}
                categoryType={categoryType as BoostCategoryOptionsEnum}
                linkedCredentialCount={linkedCredentialCount}
                linkedCredentials={getClrLinkedCredentials(credential)}
                defaultImg={defaultImg}
            />
        ) : undefined;

    const presentModal = () => {
        const earnedBoostIdCardProps = {
            credential: cred,
            categoryType: categoryType,
            issuerOverride: issuerName,
            issueeOverride: issueeName,
            verificationItems: undefined,
            handleCloseModal: () => closeModal(),
            handleShareBoost: () => presentShareBoostLink(),
            onDotsClick: () => {
                // closeModal();
                handleOptionsMenu();
            },
            subjectDID: idSubjectDID,
            subjectImageComponent: subjectProfileImageElement,
            issuerImageComponent: issuerProfileImageElement,
            customThumbComponent: isID ? (
                <IDDisplayCard
                    cred={credential}
                    idClassName="p-0 m-0 mt-4 boost-id-preview-body min-h-[160px]"
                    idFooterClassName="p-0 m-0 mt-[-15px] boost-id-preview-footer"
                    customIssuerThumbContainerClass="id-card-issuer-thumb-preview-container"
                    name={title}
                    location={address}
                    issuerThumbnail={idIssuerThumbnailSrc}
                    showIssuerImage={showIdIssuerThumbnail}
                    backgroundImage={idBackgroundImage}
                    dimBackgroundImage={idDimBackgroundImage}
                    fontColor={idFontColor}
                    accentColor={idAccentColor}
                    idIssuerName={idIssuerName}
                    {...mappedInputs}
                />
            ) : (
                <CredentialBadge
                    achievementType={achievementType}
                    boostType={categoryType}
                    badgeThumbnail={badgeThumbnail}
                    badgeCircleCustomClass="w-[170px] h-[170px]"
                />
            ),
            customDescription: customDescription,
            titleOverride: title,
            qrCodeOnClick: () => {
                closeModal();
                presentShareBoostLink(true);
            },
            formattedDisplayType: formattedAchievementType,
            isEarnedBoost: true,
        };

        const earnedBoostModalProps = {
            credential: cred,
            categoryType: categoryType,
            issuerOverride: issuerName,
            issueeOverride: issueeName,
            verificationItems: isBoost ? undefined : [],
            handleShareBoost: () => presentShareBoostLink(),
            handleCloseModal: () => closeModal(),
            subjectImageComponent: subjectProfileImageElement,
            issuerImageComponent: issuerProfileImageElement,
            onDotsClick: () => {
                // closeModal();
                handleOptionsMenu();
            },
            customThumbComponent: (
                <CredentialBadge
                    achievementType={achievementType}
                    fallbackCircleText={title}
                    boostType={categoryType}
                    badgeThumbnail={badgeThumbnail}
                    badgeCircleCustomClass="w-[170px] h-[170px]"
                    credential={cred}
                />
            ),
            formattedDisplayType: formattedAchievementType,
            customLinkedCredentialsComponent,
            previewType,
            displayType: displayType,
            isEarnedBoost: true,
        };

        const bgImage = isCertificate || isID || isAwardDisplay ? backgroundImage : undefined;

        const props = isID ? earnedBoostIdCardProps : earnedBoostModalProps;

        if (record?.uri) {
            // clear credential from new creds store if it is viewed
            newCredsStore.set.removeCreds([record?.uri]);
        }

        if (isBoost) {
            newModal(<BoostPreview {...props} showEndorsementBadge />, {
                backgroundImage: bgImage,
            });
        } else {
            newModal(<NonBoostPreview {...props} showEndorsementBadge />, {
                backgroundImage: bgImage,
            });
        }
    };

    const { createdAt } = getInfoFromCredential(cred, 'MMMM DD, YYYY', {
        uppercaseDate: false,
    });

    const issueDate = moment(createdAt).format('MMMM DD YYYY');

    const isCardView = boostPageViewMode === BoostPageViewMode.Card;

    let customTitle;
    if (showSkeleton) {
        customTitle = <CustomBoostTitleDisplay showSkeleton />;
    } else {
        customTitle = (
            <CustomBoostTitleDisplay
                displayType={displayType}
                title={title}
                formattedDisplayType={formattedAchievementType}
                textColor={darkColor}
                indicatorColor={indicatorColor}
                credential={cred}
                mediaTitleContainerClassName="!mt-[14px]"
                isEarnedBoost
                showNewItemIndicator={showNewItemIndicator}
            />
        );
    }

    if (!useWrapper) {
        return (
            <ErrorBoundary fallback={<div>Something went wrong</div>}>
                <BoostGenericCardWrapper
                    innerOnClick={
                        cred && !showChecked && !showSkeleton
                            ? () => {
                                  resetIonicModalBackground();
                                  presentModal();
                              }
                            : undefined
                    }
                    onCheckClick={onCheckMarkClick}
                    showChecked={showChecked}
                    checkStatus={initialCheckmarkState}
                    optionsTriggerOnClick={handleOptionsMenu}
                    className={`earned-small-card bg-white text-black z-[1000] mt-[15px] ${className}`}
                    customHeaderClass="boost-managed-card"
                    thumbImgSrc={badgeThumbnail}
                    dateDisplay={issueDate}
                    issuerName={issuerName}
                    customIssuerName={
                        <CustomIssuerName issuerName={issuerName} isLoading={showSkeleton} />
                    }
                    customThumbComponent={
                        <CredentialBadge
                            achievementType={achievementType}
                            fallbackCircleText={title}
                            boostType={categoryType}
                            badgeThumbnail={badgeThumbnail}
                            showBackgroundImage
                            backgroundImage={backgroundImage}
                            backgroundColor={backgroundColor}
                            badgeContainerCustomClass="mt-[0px] mb-[8px]"
                            badgeCircleCustomClass={`!w-[116px] h-[116px] mt-1 ${
                                isAwardDisplay ? 'mt-[17px]' : 'shadow-3xl'
                            }`}
                            badgeRibbonContainerCustomClass="left-[38%] bottom-[-20%]"
                            badgeRibbonCustomClass="w-[26px]"
                            badgeRibbonIconCustomClass="w-[90%] mt-[4px]"
                            displayType={displayType}
                            credential={cred}
                        />
                    }
                    title={title}
                    type={type}
                    categoryType={categoryType}
                    boostPageViewMode={boostPageViewMode}
                    credential={cred}
                    isInSkillsModal={isInSkillsModal}
                    linkedCredentialsCount={linkedCredentialCount}
                    linkedCredentialsClassName={`bg-${color}`}
                    displayType={
                        isClrCredential
                            ? getDefaultDisplayType(categoryType as string)
                            : displayType
                    }
                />
            </ErrorBoundary>
        );
    }

    if (verifierState) {
        return (
            <ErrorBoundary fallback={<div>Something went wrong</div>}>
                <IonCol
                    size={isCardView && !isInSkillsModal ? '6' : '12'}
                    size-sm={isCardView && !isInSkillsModal ? '4' : undefined}
                    size-md={isCardView && !isInSkillsModal ? '4' : undefined}
                    size-lg={isCardView && !isInSkillsModal ? '3' : undefined}
                    className={`flex justify-center items-center relative ${
                        isCardView ? '' : 'p-0'
                    }`}
                >
                    <BoostGenericCardWrapper
                        innerOnClick={() => handleClick('innerOnClick')}
                        onCheckClick={() => handleClick('onCheckClick')}
                        showChecked={showChecked}
                        checkStatus={initialCheckmarkState}
                        className={`earned-small-card bg-white text-black z-[1000] ${className}`}
                        customHeaderClass="boost-managed-card"
                        thumbImgSrc={badgeThumbnail}
                        dateDisplay={issueDate}
                        issuerName={issuerName}
                        customIssuerName={
                            <CustomIssuerName issuerName={issuerName} isLoading={showSkeleton} />
                        }
                        customThumbComponent={
                            <>
                                <CredentialBadge
                                    achievementType={achievementType}
                                    boostType={categoryType}
                                    badgeThumbnail={badgeThumbnail}
                                    showBackgroundImage
                                    backgroundImage={backgroundImage}
                                    backgroundColor={backgroundColor}
                                    badgeContainerCustomClass="mt-[0px] mb-[8px]"
                                    badgeCircleCustomClass={`!w-[116px] h-[116px] mt-1 ${
                                        isAwardDisplay ? 'mt-[17px]' : 'shadow-3xl'
                                    }`}
                                    badgeRibbonContainerCustomClass="left-[38%] bottom-[-20%]"
                                    badgeRibbonCustomClass="w-[26px]"
                                    badgeRibbonIconCustomClass="w-[90%] mt-[4px]"
                                    displayType={displayType}
                                    credential={cred}
                                />
                            </>
                        }
                        title={title}
                        type={type}
                        categoryType={categoryType}
                        boostPageViewMode={boostPageViewMode}
                        credential={cred}
                        isInSkillsModal={isInSkillsModal}
                        linkedCredentialsCount={linkedCredentialCount}
                        linkedCredentialsClassName={`bg-${color}`}
                        displayType={
                            isClrCredential
                                ? getDefaultDisplayType(categoryType as string)
                                : displayType
                        }
                    />
                </IonCol>
            </ErrorBoundary>
        );
    }

    if (categoryType === BoostCategoryOptionsEnum.family) {
        return <FamilyCard showSkeleton={showSkeleton} credential={cred} boostUri={record?.uri} />;
    }

    return (
        <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <IonCol
                size={isCardView && !isInSkillsModal ? '6' : '12'}
                size-sm={isCardView && !isInSkillsModal ? sizeSm : undefined}
                size-md={isCardView && !isInSkillsModal ? sizeMd : undefined}
                size-lg={isCardView && !isInSkillsModal ? sizeLg : undefined}
                className={`flex justify-center items-center relative ${isCardView ? '' : 'p-0'}`}
            >
                <BoostGenericCardWrapper
                    innerOnClick={
                        cred && !showSkeleton
                            ? () => {
                                  resetIonicModalBackground();
                                  presentModal();
                              }
                            : undefined
                    }
                    className={`earned-small-card bg-white text-black z-[1000] ${className}`}
                    customHeaderClass="boost-managed-card"
                    thumbImgSrc={badgeThumbnail}
                    optionsTriggerOnClick={
                        showSkeleton
                            ? undefined
                            : () => {
                                  handleOptionsMenu();
                              }
                    }
                    dateDisplay={issueDate}
                    customDateDisplay={
                        showSkeleton ? (
                            <BoostTextSkeleton
                                containerClassName="w-full flex items-center justify-center"
                                skeletonStyles={{ width: '50%' }}
                            />
                        ) : undefined
                    }
                    issuerName={issuerName}
                    customIssuerName={
                        <CustomIssuerName issuerName={issuerName} isLoading={showSkeleton} />
                    }
                    customThumbComponent={
                        showSkeleton ? (
                            <BadgeSkeleton
                                badgeContainerCustomClass="mt-[0px] mb-[8px]"
                                badgeCircleCustomClass="w-[116px] h-[116px] shadow-3xl mt-1"
                            />
                        ) : (
                            <CredentialBadgeNew
                                achievementType={achievementType}
                                fallbackCircleText={title}
                                boostType={categoryType}
                                badgeThumbnail={badgeThumbnail}
                                showBackgroundImage
                                backgroundImage={backgroundImage}
                                backgroundColor={backgroundColor}
                                badgeContainerCustomClass="mt-[0px] mb-[8px]"
                                badgeCircleCustomClass={`!w-[116px] h-[116px] mt-1 ${
                                    isAwardDisplay ? 'mt-[17px] mb-[-22px]' : 'shadow-3xl'
                                }`}
                                badgeRibbonContainerCustomClass="left-[38%] bottom-[-20%]"
                                badgeRibbonCustomClass="w-[26px]"
                                badgeRibbonIconCustomClass="w-[90%] mt-[4px]"
                                displayType={displayType}
                                credential={cred}
                            />
                        )
                    }
                    title={title}
                    customTitle={customTitle}
                    type={categoryType}
                    categoryType={categoryType}
                    boostPageViewMode={boostPageViewMode}
                    credential={cred}
                    loading={showSkeleton}
                    isInSkillsModal={isInSkillsModal}
                    linkedCredentialsCount={linkedCredentialCount}
                    linkedCredentialsClassName={`bg-${color}`}
                    displayType={
                        isClrCredential
                            ? getDefaultDisplayType(categoryType as string)
                            : displayType
                    }
                    uri={record?.uri}
                    indicatorColor={indicatorColor}
                />
            </IonCol>
        </ErrorBoundary>
    );
};

export default BoostEarnedCard;
