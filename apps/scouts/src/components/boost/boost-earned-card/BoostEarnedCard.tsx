import React from 'react';
import moment from 'moment';
import { ErrorBoundary } from 'react-error-boundary';
import { VC } from '@learncard/types';
import { IonCol } from '@ionic/react';
import {
    BoostPageViewMode,
    BoostPageViewModeType,
    BoostGenericCardWrapper,
    CredentialCategory,
    resetIonicModalBackground,
    setIonicModalBackground,
    useGetResolvedCredential,
    BrandingEnum,
    CredentialCategoryEnum,
    useModal,
    useGetVCInfo,
    categoryMetadata,
    BoostCategoryOptionsEnum,
    ModalTypes,
    useGetBoostParents,
} from 'learn-card-base';
import BoostPreview from '../boostCMS/BoostPreview/BoostPreview';
import NonBoostPreview from '../boostCMS/BoostPreview/NonBoostPreview';
import CredentialBadge from 'learn-card-base/components/CredentialBadge/CredentialBadge';
import BadgeSkeleton from 'learn-card-base/components/boost/boostSkeletonLoaders/BadgeSkeleton';
import BoostTextSkeleton from 'learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons';
import ShareBoostLink from '../boost-options-menu/ShareBoostLink';

import { getCredentialSubject, getUrlFromImage } from 'learn-card-base/helpers/credentialHelpers';
import {
    getImageUrlFromCredential,
    getCredentialName,
} from 'learn-card-base/helpers/credentialHelpers';
import {
    unwrapBoostCredential,
    isBoostCredential,
} from 'learn-card-base/helpers/credentialHelpers';

import { useLoadingLine } from '../../../stores/loadingStore';
import useBoostMenu, { BoostMenuType } from '../hooks/useBoostMenu';
import { useHighlightedCredentials } from '../../../hooks/useHighlightedCredentials';
import { getRoleFromCred, getScoutsNounForRole } from '../../../helpers/troop.helpers';

type BoostEarnedCardProps = {
    credential?: VC;
    uri?: string;
    defaultImg: string;
    onCheckMarkClick?: any;
    selectAll?: any;
    initialCheckmarkState?: boolean;
    categoryType: CredentialCategory;
    useWrapper?: boolean;
    showChecked?: boolean;
    verifierState?: boolean;
    hasBeenClicked?: boolean;
    boostPageViewMode?: BoostPageViewModeType;
    className?: string;
    branding?: BrandingEnum;
    loading?: boolean;
};

export const BoostEarnedCard: React.FC<BoostEarnedCardProps> = ({
    credential: _credential,
    uri,
    defaultImg,
    categoryType,
    useWrapper = true,
    onCheckMarkClick,
    initialCheckmarkState,
    showChecked,
    className = '',
    verifierState,
    hasBeenClicked,
    boostPageViewMode = BoostPageViewMode.Card,
    branding,
    loading,
}) => {
    const {
        data: resolvedCredential,
        isFetching: credentialFetching,
        isLoading: credentialLoading,
    } = useGetResolvedCredential(uri, !_credential);
    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });

    console.log('///BOOST EARNED CARD');

    // Below query is so we can get parent boost info...
    // Get boostId from resolved credential
    const {
        data: parentBoosts,
    } = useGetBoostParents(resolvedCredential?.boostId, 1);

    const parentSourceTitle =
        parentBoosts?.records?.[0]?.meta?.edits?.name || parentBoosts?.records?.[0]?.name;

    const credential = resolvedCredential || _credential;
    const isBoost = credential && isBoostCredential(credential);
    const cred = credential && unwrapBoostCredential(credential);

    const boostIssuer = (credential as any)?.boostCredential?.issuer;
    const boostIssuerDid =
        typeof boostIssuer === 'string' ? boostIssuer : boostIssuer?.id;

    // Fallback to VC issuer if boostCredential.issuer is not available
    const issuerDid =
        boostIssuerDid ||
        (typeof cred?.issuer === 'string' ? cred.issuer : (cred as any)?.issuer?.id);

    // Extract user ID from DID (e.g., "jpgclub" from "did:web:localhost%3A4000:users:jpgclub")
    const profileID = issuerDid?.split(':').pop();

    const { credentials: highlightedCreds } = useHighlightedCredentials(profileID);

    const unknownVerifierTitle = React.useMemo(() => {
        if (!highlightedCreds || highlightedCreds.length === 0) return undefined;

        const role = getRoleFromCred(highlightedCreds[0]);
        return getScoutsNounForRole(role); // Just the role, no "Verified" prefix
    }, [highlightedCreds]);

    const credImg = getUrlFromImage(getCredentialSubject(cred)?.image ?? '');
    const cardTitle = isBoost ? cred?.name : getCredentialName(cred);

    const credentialBackgroundFetching = credentialFetching && !credentialLoading;

    useLoadingLine(credentialBackgroundFetching);

    const type = categoryMetadata[categoryType].walletSubtype;
    const isCertificate = cred?.display?.displayType === 'certificate';
    const isID = cred?.display?.displayType === 'id' || categoryType === 'ID';
    const isMeritBadge = categoryType === CredentialCategoryEnum.meritBadge;

    const thumbImage = (cred && getImageUrlFromCredential(cred)) || defaultImg;
    const badgeThumbnail = credImg && credImg?.trim() !== '' ? credImg : thumbImage;

    const {
        issuerName,
        issuerProfileImageElement,
        issueeName,
        subjectProfileImageElement,
        loading: vcInfoLoading,
    } = useGetVCInfo(cred);

    const showSkeleton = loading || credentialLoading || vcInfoLoading;

    const handleClick = (click: string) => {
        if (showSkeleton) return;
        if (click === 'innerOnClick' && !hasBeenClicked) {
            if (cred) {
                if (isCertificate || isID || isMeritBadge) {
                    setIonicModalBackground(cred?.display?.backgroundImage);
                }
                presentModal();
            }
        } else if (click === 'onCheckClick') {
            hasBeenClicked = true;
            onCheckMarkClick();
        }
    };

    const presentModal = () => {
        const earnedBoostModalProps = {
            credential: cred as any,
            categoryType: categoryType as unknown as BoostCategoryOptionsEnum,
            issuerOverride: issuerName,
            issueeOverride: issueeName,
            verificationItems: isBoost ? (undefined as any) : [],
            handleShareBoost: () => openShareBoostLink(),
            handleCloseModal: () => closeModal(),
            subjectImageComponent: subjectProfileImageElement,
            issuerImageComponent: issuerProfileImageElement,
            onDotsClick: () => {
                handleOptionsMenu();
            },
            customThumbComponent: (
                <CredentialBadge
                    achievementType={cred?.credentialSubject?.achievement?.achievementType}
                    fallbackCircleText={cardTitle}
                    boostType={categoryType as any}
                    badgeThumbnail={badgeThumbnail}
                    badgeCircleCustomClass="w-[170px] h-[170px]"
                    credential={cred as any}
                    branding={branding}
                    showBackgroundImage={false}
                    backgroundImage={cred?.display?.backgroundImage ?? ''}
                    backgroundColor={cred?.display?.backgroundColor ?? ''}
                />
            ),
            customBodyCardComponent: undefined as any,
            customFooterComponent: undefined as any,
            customIssueHistoryComponent: undefined as any,
            unknownVerifierTitle,
        };

        const backgroundImage = isCertificate || isID ? cred?.display?.backgroundImage : undefined;

        if (isBoost) {
            newModal(<BoostPreview {...(earnedBoostModalProps as any)} />, { backgroundImage });
        } else {
            newModal(<NonBoostPreview {...(earnedBoostModalProps as any)} />, { backgroundImage });
        }
    };

    const { handlePresentBoostMenuModal } = useBoostMenu(
        credential as any,
        (uri || '') as string,
        credential as any,
        categoryType as any,
        BoostMenuType.earned,
        closeModal
    );

    const openShareBoostLink = () => {
        newModal(
            <ShareBoostLink
                handleClose={closeModal}
                boost={credential as any}
                boostUri={uri || ''}
                categoryType={categoryType as any}
            />
        );
    };

    const handleOptionsMenu = async () => {
        handlePresentBoostMenuModal();
    };

    const issueDate = moment(cred?.issuanceDate).format('MMMM DD YYYY');

    const isCardView = boostPageViewMode === BoostPageViewMode.Card;

    if (!useWrapper) {
        return (
            <ErrorBoundary fallback={<div>Something went wrong</div>}>
                <BoostGenericCardWrapper
                    innerOnClick={
                        cred && !showChecked && !showSkeleton
                            ? () => {
                                  if (isCertificate || isID || isMeritBadge) {
                                      setIonicModalBackground(cred?.display?.backgroundImage);
                                  }
                                  presentModal();
                              }
                            : undefined
                    }
                    onCheckClick={onCheckMarkClick}
                    showChecked={showChecked}
                    checkStatus={initialCheckmarkState}
                    optionsTriggerOnClick={handleOptionsMenu}
                    className={`bg-white text-black z-[1000] mt-[15px] ${className}`}
                    customHeaderClass="boost-managed-card"
                    thumbImgSrc={badgeThumbnail}
                    dateDisplay={issueDate}
                    issuerName={issuerName}
                    customThumbComponent={
                        <CredentialBadge
                            achievementType={cred?.credentialSubject?.achievement?.achievementType}
                            fallbackCircleText={cardTitle}
                            boostType={categoryType as any}
                            badgeThumbnail={badgeThumbnail}
                            showBackgroundImage
                            backgroundImage={cred?.display?.backgroundImage ?? ''}
                            backgroundColor={cred?.display?.backgroundColor ?? ''}
                            badgeContainerCustomClass="mt-[0px] mb-[8px]"
                            badgeCircleCustomClass="w-[116px] h-[116px] shadow-3xl mt-1"
                            badgeRibbonContainerCustomClass="left-[38%] bottom-[-20%]"
                            badgeRibbonCustomClass="w-[26px]"
                            badgeRibbonIconCustomClass="w-[90%] mt-[4px]"
                            displayType={cred?.display?.displayType}
                            credential={cred as any}
                            branding={branding}
                        />
                    }
                    title={cardTitle}
                    type={categoryType as any}
                    categoryType={categoryType as any}
                    boostPageViewMode={boostPageViewMode}
                    credential={cred as any}
                    branding={branding}
                    unknownVerifierTitle={unknownVerifierTitle}
                />
            </ErrorBoundary>
        );
    }

    if (verifierState) {
        return (
            <ErrorBoundary fallback={<div>Something went wrong</div>}>
                <IonCol
                    size={isCardView ? '6' : '12'}
                    size-sm={isCardView ? '4' : undefined}
                    size-md={isCardView ? '4' : undefined}
                    size-lg={isCardView ? '3' : undefined}
                    className={`flex justify-center items-center relative ${
                        isCardView ? '' : 'p-0'
                    }`}
                >
                    <BoostGenericCardWrapper
                        innerOnClick={() => handleClick('innerOnClick')}
                        onCheckClick={() => handleClick('onCheckClick')}
                        showChecked={showChecked}
                        checkStatus={initialCheckmarkState}
                        className={`bg-white text-black z-[1000] ${className}`}
                        customHeaderClass="boost-managed-card"
                        thumbImgSrc={badgeThumbnail}
                        dateDisplay={issueDate}
                        issuerName={issuerName}
                        customThumbComponent={
                            <>
                                <CredentialBadge
                                    achievementType={
                                        cred?.credentialSubject?.achievement?.achievementType
                                    }
                                    boostType={categoryType as any}
                                    badgeThumbnail={badgeThumbnail}
                                    showBackgroundImage
                                    backgroundImage={cred?.display?.backgroundImage ?? ''}
                                    backgroundColor={cred?.display?.backgroundColor ?? ''}
                                    badgeContainerCustomClass="mt-[0px] mb-[8px]"
                                    badgeCircleCustomClass="w-[116px] h-[116px] shadow-3xl mt-1"
                                    badgeRibbonContainerCustomClass="left-[38%] bottom-[-20%]"
                                    badgeRibbonCustomClass="w-[26px]"
                                    badgeRibbonIconCustomClass="w-[90%] mt-[4px]"
                                    displayType={cred?.display?.displayType}
                                    credential={cred as any}
                                    branding={branding}
                                />
                            </>
                        }
                        title={cardTitle}
                        type={categoryType as any}
                        categoryType={categoryType as any}
                        boostPageViewMode={boostPageViewMode}
                        credential={cred as any}
                        branding={branding}
                        unknownVerifierTitle={unknownVerifierTitle}
                    />
                </IonCol>
            </ErrorBoundary>
        );
    }

    let customTitle = undefined;
    if (showSkeleton) {
        customTitle = (
            <div className="w-full flex items-center justify-center pt-2">
                <BoostTextSkeleton
                    containerClassName="w-full flex items-center justify-center"
                    skeletonStyles={{ width: '80%' }}
                />
            </div>
        );
    } else if (isMeritBadge) {
        customTitle = (
            <div className="flex flex-col w-full mt-[4px]">
                <span className="w-full text-grayscale-900 text-[16px] font-notoSans font-semibold text-center leading-[125%] line-clamp-1 px-[8px]">
                    {cardTitle}
                </span>

                <span className="text-sp-purple-base text-[12px] font-[600] uppercase font-notoSans">
                    Merit Badge
                </span>
                <span className="px-[10px] text-[11px] line-clamp-1">{parentSourceTitle}</span>
            </div>
        );
    } else {
        customTitle = (
            <div className="flex flex-col mt-[4px]">
                <span className="text-grayscale-900 text-[16px] font-notoSans font-semibold text-center leading-[125%] line-clamp-1 px-[8px]">
                    {cardTitle}
                </span>
                <span className="px-[10px] text-[11px] line-clamp-1">{parentSourceTitle}</span>
            </div>
        );
    }

    return (
        <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <IonCol
                size={isCardView ? '6' : '12'}
                size-sm={isCardView ? '4' : undefined}
                size-md={isCardView ? '4' : undefined}
                size-lg={isCardView ? '4' : undefined}
                className={`flex justify-center items-center relative ${isCardView ? '' : 'p-0'}`}
            >
                <BoostGenericCardWrapper
                    innerOnClick={
                        cred && !showSkeleton
                            ? () => {
                                  if (isCertificate || isID || isMeritBadge) {
                                      setIonicModalBackground(cred?.display?.backgroundImage);
                                  }
                                  presentModal();
                              }
                            : undefined
                    }
                    className={`bg-white text-black z-[1000] ${className}`}
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
                        showSkeleton ? (
                            <BoostTextSkeleton
                                containerClassName="w-full flex items-center justify-center"
                                skeletonStyles={{ width: '80%' }}
                            />
                        ) : parentSourceTitle ? (
                            <></>
                        ) : undefined
                    }
                    customThumbComponent={
                        showSkeleton ? (
                            <BadgeSkeleton
                                badgeContainerCustomClass="mt-[0px] mb-[8px]"
                                badgeCircleCustomClass="w-[116px] h-[116px] shadow-3xl mt-1"
                            />
                        ) : (
                            <CredentialBadge
                                achievementType={
                                    cred?.credentialSubject?.achievement?.achievementType
                                }
                                fallbackCircleText={cardTitle}
                                boostType={categoryType as any}
                                badgeThumbnail={badgeThumbnail}
                                showBackgroundImage
                                backgroundImage={cred?.display?.backgroundImage ?? ''}
                                backgroundColor={cred?.display?.backgroundColor ?? ''}
                                badgeContainerCustomClass="mt-[0px] mb-[8px]"
                                badgeCircleCustomClass={`mt-1 ${
                                    isMeritBadge
                                        ? 'w-[100px] h-[100px] mt-[20px]'
                                        : 'w-[116px] h-[116px] shadow-3xl'
                                }`}
                                badgeRibbonContainerCustomClass="left-[38%] bottom-[-20%]"
                                badgeRibbonCustomClass="w-[26px]"
                                badgeRibbonIconCustomClass="w-[90%] mt-[4px]"
                                displayType={cred?.display?.displayType}
                                credential={cred as any}
                                branding={branding}
                            />
                        )
                    }
                    title={cardTitle}
                    customTitle={customTitle}
                    type={categoryType as any}
                    categoryType={categoryType as any}
                    boostPageViewMode={boostPageViewMode}
                    credential={cred as any}
                    branding={branding}
                    loading={showSkeleton}
                    unknownVerifierTitle={unknownVerifierTitle}
                />
            </IonCol>
        </ErrorBoundary>
    );
};

export default BoostEarnedCard;
