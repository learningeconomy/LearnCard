import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Boost, VC, VerificationItem } from '@learncard/types';
import { IonCol } from '@ionic/react';
import * as m from '../../../paraglide/messages.js';
import { formatLocaleDate } from '../../../i18n/formatters';
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
    getCategoryMetadata,
    BoostCategoryOptionsEnum,
    ModalTypes,
    useGetBoostParents,
} from 'learn-card-base';
import BoostPreview from '../boostCMS/BoostPreview/BoostPreview';
import NonBoostPreview from '../boostCMS/BoostPreview/NonBoostPreview';
import CredentialBadge from 'learn-card-base/components/CredentialBadge/CredentialBadge';
import { WalletCategoryTypes } from 'learn-card-base/components/IssueVC/types';
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
    onCheckMarkClick?: () => void;
    selectAll?: boolean | null;
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

// Callers pass the credential's raw category, which can be missing or a value we don't know.
// Normalize it once so everything downstream (card, list row, skeleton, modals) only ever sees a
// known category, falling back to Achievement like getCategoryMetadata does.
const normalizeCategory = (category?: string | null): CredentialCategory =>
    (category && Object.hasOwn(categoryMetadata, category)
        ? category
        : CredentialCategoryEnum.achievement) as CredentialCategory;

type BoostEarnedCardSkeletonProps = Pick<
    BoostEarnedCardProps,
    'categoryType' | 'boostPageViewMode' | 'branding'
>;

export const BoostEarnedCardSkeleton: React.FC<BoostEarnedCardSkeletonProps> = ({
    categoryType: rawCategoryType,
    boostPageViewMode = BoostPageViewMode.Card,
    branding,
}) => {
    const categoryType = normalizeCategory(rawCategoryType);
    const isCardView = boostPageViewMode === BoostPageViewMode.Card;
    const type = getCategoryMetadata(categoryType).walletSubtype;

    return (
        <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <IonCol
                size={isCardView ? '6' : '12'}
                size-sm={isCardView ? '4' : undefined}
                size-md={isCardView ? '4' : undefined}
                size-lg={isCardView ? '4' : undefined}
                className={`flex justify-center items-center relative ${isCardView ? '' : 'p-0'}`}
                aria-hidden="true"
                inert
            >
                <BoostGenericCardWrapper
                    className="bg-white text-grayscale-900 z-[1000]"
                    customHeaderClass="boost-managed-card"
                    customDateDisplay={
                        <BoostTextSkeleton
                            containerClassName="w-full flex items-center justify-center"
                            skeletonStyles={{ width: '50%' }}
                        />
                    }
                    customIssuerName={
                        <BoostTextSkeleton
                            containerClassName="w-full flex items-center justify-center"
                            skeletonStyles={{ width: '80%' }}
                        />
                    }
                    customThumbComponent={
                        <BadgeSkeleton
                            badgeContainerCustomClass="mt-[0px] mb-[8px]"
                            badgeCircleCustomClass="w-[116px] h-[116px] shadow-3xl mt-1"
                        />
                    }
                    customTitle={
                        <div className="w-full flex items-center justify-center pt-2">
                            <BoostTextSkeleton
                                containerClassName="w-full flex items-center justify-center"
                                skeletonStyles={{ width: '80%' }}
                            />
                        </div>
                    }
                    type={type}
                    categoryType={categoryType}
                    boostPageViewMode={boostPageViewMode}
                    branding={branding}
                    loading
                />
            </IonCol>
        </ErrorBoundary>
    );
};

export const BoostEarnedCard: React.FC<BoostEarnedCardProps> = ({
    credential: _credential,
    uri,
    defaultImg,
    categoryType: rawCategoryType,
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
    const categoryType = normalizeCategory(rawCategoryType);
    const {
        data: resolvedCredential,
        isFetching: credentialFetching,
        isLoading: credentialLoading,
    } = useGetResolvedCredential(uri, !_credential);
    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });

    // Below query is so we can get parent boost info...
    // Get boostId from resolved credential
    const { data: parentBoosts } = useGetBoostParents(resolvedCredential?.boostId, 1);

    const parentSourceTitle =
        parentBoosts?.records?.[0]?.meta?.edits?.name || parentBoosts?.records?.[0]?.name;

    const credential = resolvedCredential || _credential;
    const isBoost = credential && isBoostCredential(credential);
    const cred = credential && unwrapBoostCredential(credential);

    const boostIssuer = credential?.boostCredential?.issuer;
    const boostIssuerDid = typeof boostIssuer === 'string' ? boostIssuer : boostIssuer?.id;

    // Fallback to VC issuer if boostCredential.issuer is not available
    const issuerDid =
        boostIssuerDid || (typeof cred?.issuer === 'string' ? cred.issuer : cred?.issuer?.id);

    // Extract user ID from DID (e.g., "jpgclub" from "did:web:localhost%3A4000:users:jpgclub")
    const profileID = issuerDid?.split(':').pop();

    const { credentials: highlightedCreds } = useHighlightedCredentials(
        profileID,
        Boolean(profileID)
    );

    const unknownVerifierTitle = React.useMemo(() => {
        if (!highlightedCreds || highlightedCreds.length === 0) return undefined;

        const role = getRoleFromCred(highlightedCreds[0]);
        return getScoutsNounForRole(role); // Just the role, no "Verified" prefix
    }, [highlightedCreds]);

    const credImg = getUrlFromImage(getCredentialSubject(cred)?.image ?? '');
    const cardTitle = isBoost ? cred?.name : getCredentialName(cred);

    const credentialBackgroundFetching = credentialFetching && !credentialLoading;

    useLoadingLine(credentialBackgroundFetching);

    const isCertificate = cred?.display?.displayType === 'certificate';
    const isID = cred?.display?.displayType === 'id' || categoryType === 'ID';
    const isMeritBadge = categoryType === CredentialCategoryEnum.meritBadge;
    const boostCategoryType = categoryType as unknown as BoostCategoryOptionsEnum;
    // BoostGenericCardWrapper has always received the category here, not the wallet subtype.
    const wrapperType = categoryType as unknown as WalletCategoryTypes;

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
            onCheckMarkClick?.();
        }
    };

    const presentModal = () => {
        const earnedBoostModalProps: React.ComponentProps<typeof BoostPreview> = {
            credential: cred as VC,
            categoryType: boostCategoryType,
            issuerOverride: issuerName,
            issueeOverride: issueeName,
            verificationItems: isBoost ? (undefined as unknown as VerificationItem[]) : [],
            handleShareBoost: () => openShareBoostLink(unknownVerifierTitle),
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
                    boostType={boostCategoryType}
                    badgeThumbnail={badgeThumbnail}
                    badgeCircleCustomClass="w-[170px] h-[170px]"
                    credential={cred as VC}
                    branding={branding}
                    showBackgroundImage={false}
                    backgroundImage={cred?.display?.backgroundImage ?? ''}
                    backgroundColor={cred?.display?.backgroundColor ?? ''}
                />
            ),
            customBodyCardComponent: undefined,
            customFooterComponent: undefined,
            customIssueHistoryComponent: undefined,
            unknownVerifierTitle,
        };

        const backgroundImage = isCertificate || isID ? cred?.display?.backgroundImage : undefined;

        if (isBoost) {
            newModal(<BoostPreview {...earnedBoostModalProps} />, { backgroundImage });
        } else {
            newModal(<NonBoostPreview {...earnedBoostModalProps} />, { backgroundImage });
        }
    };

    const { handlePresentBoostMenuModal } = useBoostMenu(
        credential as VC,
        uri || '',
        credential as unknown as Boost,
        categoryType,
        BoostMenuType.earned,
        closeModal
    );

    const openShareBoostLink = (title?: string) => {
        newModal(
            <ShareBoostLink
                handleClose={closeModal}
                boost={credential as VC}
                boostUri={uri || ''}
                categoryType={categoryType}
            />
        );
    };

    const handleOptionsMenu = async () => {
        handlePresentBoostMenuModal();
    };

    const issueDate = formatLocaleDate(cred?.issuanceDate, {
        month: 'long',
        day: '2-digit',
        year: 'numeric',
    });

    const isCardView = boostPageViewMode === BoostPageViewMode.Card;

    if (!useWrapper) {
        return (
            <ErrorBoundary fallback={<div>{m['boost.somethingWentWrong']()}</div>}>
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
                            boostType={boostCategoryType}
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
                            credential={cred as VC}
                            branding={branding}
                        />
                    }
                    title={cardTitle}
                    type={wrapperType}
                    categoryType={categoryType}
                    boostPageViewMode={boostPageViewMode}
                    credential={cred as VC}
                    branding={branding}
                    unknownVerifierTitle={unknownVerifierTitle}
                />
            </ErrorBoundary>
        );
    }

    if (verifierState) {
        return (
            <ErrorBoundary fallback={<div>{m['boost.somethingWentWrong']()}</div>}>
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
                                    boostType={boostCategoryType}
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
                                    credential={cred as VC}
                                    branding={branding}
                                />
                            </>
                        }
                        title={cardTitle}
                        type={wrapperType}
                        categoryType={categoryType}
                        boostPageViewMode={boostPageViewMode}
                        credential={cred as VC}
                        branding={branding}
                        unknownVerifierTitle={unknownVerifierTitle}
                    />
                </IonCol>
            </ErrorBoundary>
        );
    }

    let customTitle: React.ReactNode;
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
                    {m['boost.meritBadge']()}
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
        <ErrorBoundary fallback={<div>{m['boost.somethingWentWrong']()}</div>}>
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
                                boostType={boostCategoryType}
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
                                credential={cred as VC}
                                branding={branding}
                            />
                        )
                    }
                    title={cardTitle}
                    customTitle={customTitle}
                    type={wrapperType}
                    categoryType={categoryType}
                    boostPageViewMode={boostPageViewMode}
                    credential={cred as VC}
                    branding={branding}
                    loading={showSkeleton}
                    unknownVerifierTitle={unknownVerifierTitle}
                />
            </IonCol>
        </ErrorBoundary>
    );
};

export default BoostEarnedCard;
