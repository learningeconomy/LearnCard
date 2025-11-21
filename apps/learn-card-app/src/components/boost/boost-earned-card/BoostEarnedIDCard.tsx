import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { ErrorBoundary } from 'react-error-boundary';
import { VC } from '@learncard/types';

import credentialSearchStore from 'learn-card-base/stores/credentialSearchStore';

import { BoostGenericCard } from '@learncard/react';
import {
    BoostCategoryOptionsEnum,
    BoostPageViewMode,
    BoostPageViewModeType,
    CredentialListTabEnum,
    ModalTypes,
    ProfilePicture,
    ellipsisMiddle,
    resetIonicModalBackground,
    setIonicModalBackground,
    useGetResolvedCredential,
    useModal,
    useWallet,
    useGetVCInfo,
} from 'learn-card-base';
import BoostPreview from '../boostCMS/BoostPreview/BoostPreview';
import CredentialBadge from 'learn-card-base/components/CredentialBadge/CredentialBadge';
import IdDisplayContainer from 'apps/learn-card-app/src/pages/ids/IdDisplayContainer';
import IDDisplayCard from 'learn-card-base/components/id/IDDisplayCard';
import CredentialSubjectDisplay from 'learn-card-base/components/CredentialSubjectDisplay/CredentialSubjectDisplay';
import ShareBoostLink from '../boost-options-menu/ShareBoostLink';
import ViewIdModal from 'apps/learn-card-app/src/pages/ids/view-id/ViewIdModal';

import {
    CATEGORY_TO_WALLET_SUBTYPE,
    getCredentialSubject,
    getUrlFromImage,
    getImageUrlFromCredential,
    getCredentialName,
    unwrapBoostCredential,
    isBoostCredential,
    getIssuerNameNonBoost,
    getAchievementTypeDisplayText,
} from 'learn-card-base/helpers/credentialHelpers';

import {
    ID_CARD_DISPLAY_TYPES,
    getIDCardDisplayInputsFromVC,
} from 'learn-card-base/helpers/credentials/ids';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';

import { useLoadingLine } from 'apps/learn-card-app/src/stores/loadingStore';
import useBoostMenu, { BoostMenuType } from '../hooks/useBoostMenu';
import { LCR } from 'learn-card-base/types/credential-records';
import { getInfoFromCredential } from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';

type BoostEarnedIDCardProps = {
    credential?: VC;
    record?: LCR;
    defaultImg: string;
    onCheckMarkClick?: () => void;
    selectAll?: any;
    initialCheckmarkState?: boolean;
    categoryType: string;
    useWrapper?: boolean;
    showChecked?: boolean;
    boostPageViewMode?: BoostPageViewModeType;
    loading?: boolean;
};

export const BoostEarnedIDCard: React.FC<BoostEarnedIDCardProps> = ({
    credential: _credential,
    record,
    defaultImg,
    categoryType,
    useWrapper = true,
    onCheckMarkClick,
    initialCheckmarkState,
    showChecked,
    boostPageViewMode = BoostPageViewMode.Card,
    loading,
}) => {
    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });
    const [wallet, setWallet] = useState<BespokeLearnCard | undefined>(undefined);
    const { initWallet } = useWallet();

    useEffect(() => {
        initWallet().then(setWallet);
    }, []);

    const {
        data: resolvedCredential,
        isFetching: resolvedBoostFetching,
        isLoading: resolvedBoostLoading,
    } = useGetResolvedCredential(record?.uri, !_credential);
    const credential = resolvedCredential || _credential;
    const isBoost = credential && isBoostCredential(credential);
    const cred = credential && unwrapBoostCredential(credential);
    const credImg = getUrlFromImage(getCredentialSubject(cred)?.image ?? '');
    const cardTitle = isBoost ? cred?.name : getCredentialName(cred);

    const displayType =
        credential?.boostCredential?.credentialSubject?.achievement?.achievementType;
    const formattedDisplayType = getAchievementTypeDisplayText(displayType, categoryType);

    const mappedInputs = credential ? getIDCardDisplayInputsFromVC(credential) : {};

    const credentialBackgroundFetching = resolvedBoostFetching && !resolvedBoostLoading;

    useLoadingLine(credentialBackgroundFetching);

    const {
        idDisplayType,
        issueeName: _issueeName = '',
        issueeThumbnail = '',
        idIssuerName,
        issuerThumbnail,
        credentialSubject = {},
    } = mappedInputs;

    const handlePresentBoostMenuModal = useBoostMenu({
        credential,
        record,
        categoryType,
        menuType: BoostMenuType.earned,
    });

    const type =
        CATEGORY_TO_WALLET_SUBTYPE?.[categoryType] ?? CATEGORY_TO_WALLET_SUBTYPE.Achievement;
    const isID = categoryType === BoostCategoryOptionsEnum.id;
    const isMembership = categoryType === BoostCategoryOptionsEnum.membership;

    let idDisplayContainerClass = '';
    let idSleeveFooterClass = '';

    if (isID) {
        idDisplayContainerClass = '!border-white';
        idSleeveFooterClass = '!bg-blue-300';
    } else if (isMembership) {
        idDisplayContainerClass = '!border-teal-400';
        idSleeveFooterClass = '!bg-teal-300';
    }

    const issuerThumbStyles = {
        customImageClass: 'w-full h-full object-cover',
        customContainerClass:
            'flex items-center justify-center h-full text-white font-medium text-lg',
    };
    const issueeThumbStyles = {
        customImageClass: 'w-full h-full object-cover',
        customContainerClass:
            'flex items-center justify-center h-full text-white font-medium text-4xl',
    };
    const fallbackThumbStyles =
        'flex flex-row items-center justify-center h-full w-full overflow-hidden bg-gray-50 text-emerald-700 font-semibold text-xl';

    const thumbImage = (cred && getImageUrlFromCredential(cred)) || defaultImg;
    const badgeThumbnail = credImg && credImg?.trim() !== '' ? credImg : thumbImage;

    let issuerThumbnailSrc = cred?.boostID?.issuerThumbnail;
    let showIssuerThumbnail = cred?.boostID?.showIssuerThumbnail;
    let subjectDID;

    let {
        issuerName,
        issuerProfileImageElement,
        issueeName,
        subjectProfileImageElement,
        loading: vcInfoLoading,
    } = useGetVCInfo(cred);

    const showSkeleton = loading || resolvedBoostLoading || vcInfoLoading;

    let customDescription;

    if (mappedInputs) {
        if (idIssuerName) issuerName = mappedInputs?.idIssuerName;
        if (issuerThumbnail) {
            issuerProfileImageElement = (
                <ProfilePicture
                    overrideSrc
                    overrideSrcURL={issuerThumbnail}
                    {...issuerThumbStyles}
                />
            );
            issuerThumbnailSrc = issuerThumbnail;
            if (!!issuerThumbnail) showIssuerThumbnail = true;
        }
        if (issueeThumbnail) {
            subjectProfileImageElement = (
                <ProfilePicture
                    overrideSrc
                    overrideSrcURL={issueeThumbnail}
                    {...issueeThumbStyles}
                />
            );
        }
        if (_issueeName) issueeName = _issueeName;
        if (credentialSubject && idDisplayType === ID_CARD_DISPLAY_TYPES.PermanentResidentCard) {
            subjectDID = ellipsisMiddle(credentialSubject?.id, 8, 6);
            customDescription = <CredentialSubjectDisplay credentialSubject={credentialSubject} />;
        }
    }

    const presentShareBoostLink = (goBack?: boolean) => {
        const shareBoostLinkModalProps = {
            handleClose: () => closeModal(),
            boost: credential,
            boostUri: record?.uri,
            categoryType,
            onBackButtonClick: goBack
                ? () => {
                      closeModal();
                      presentModal();
                  }
                : () => {},
        };

        newModal(<ShareBoostLink {...shareBoostLinkModalProps} />);
    };

    const earnedBoostIdCardProps = {
        credential: cred,
        categoryType: categoryType,
        issuerOverride: issuerName,
        issueeOverride: issueeName,
        verificationItems: undefined,
        handleCloseModal: () => closeModal(),
        subjectDID: subjectDID,
        subjectImageComponent: subjectProfileImageElement,
        issuerImageComponent: issuerProfileImageElement,
        customThumbComponent:
            isID || isMembership ? (
                <IDDisplayCard
                    cred={credential}
                    idClassName="p-0 m-0 mt-4 boost-id-preview-body min-h-[160px]"
                    idFooterClassName="p-0 m-0 mt-[-15px] boost-id-preview-footer"
                    customIssuerThumbContainerClass="id-card-issuer-thumb-preview-container"
                    name={cardTitle}
                    location={cred?.address?.streetAddress}
                    issuerThumbnail={issuerThumbnailSrc}
                    showIssuerImage={showIssuerThumbnail}
                    backgroundImage={cred?.boostID?.backgroundImage}
                    dimBackgroundImage={cred?.boostID?.dimBackgroundImage}
                    fontColor={cred?.boostID?.fontColor}
                    accentColor={cred?.boostID?.accentColor}
                    idIssuerName={cred?.boostID?.IDIssuerName ?? issuerName}
                    {...mappedInputs}
                />
            ) : (
                <CredentialBadge
                    achievementType={cred?.credentialSubject?.achievement?.achievementType}
                    boostType={categoryType}
                    badgeThumbnail={badgeThumbnail}
                    badgeCircleCustomClass="w-[170px] h-[170px]"
                />
            ),
        customDescription: customDescription,
        titleOverride: cardTitle,
        qrCodeOnClick: () => {
            closeModal();
            presentShareBoostLink(true);
        },
        formattedDisplayType: formattedDisplayType,
    };

    const presentModal = () => {
        // newModal(<ViewIdModal credential={cred} boostUri={uri} />); // WIP for new ID view
        newModal(<BoostPreview {...earnedBoostIdCardProps} />);
    };

    const { createdAt } = getInfoFromCredential(cred, 'MMMM DD, YYYY', {
        uppercaseDate: false,
    });
    const issueDate = moment(createdAt).format('MMMM DD YYYY');

    const handlePresentOptionsModal = async () => {
        handlePresentBoostMenuModal();
    };

    const searchString = credentialSearchStore.use.searchString();
    const doesNotMatchSearch =
        searchString &&
        (!cardTitle || !cardTitle.toLowerCase().includes(searchString.toLowerCase()));
    const isSearchWithNoResults = credentialSearchStore.use.isSearchWithNoResults();
    useEffect(() => {
        if (!doesNotMatchSearch) {
            // this is how we're keeping track of the number of search results
            credentialSearchStore.set.addMatch(cardTitle);
        }
    }, [searchString]);

    if (doesNotMatchSearch && !isSearchWithNoResults) {
        return undefined;
    }

    if (!useWrapper) {
        return (
            <ErrorBoundary fallback={<div>Something went wrong</div>}>
                <BoostGenericCard
                    innerOnClick={
                        !showChecked && !showSkeleton
                            ? () => {
                                  resetIonicModalBackground();
                                  setIonicModalBackground(cred?.display?.backgroundImage);
                                  presentModal();
                              }
                            : undefined
                    }
                    onCheckClick={onCheckMarkClick}
                    showChecked={showChecked}
                    checkStatus={initialCheckmarkState}
                    optionsTriggerOnClick={handlePresentOptionsModal}
                    className="bg-white text-black z-[1000] mt-[15px]"
                    customHeaderClass="boost-managed-card"
                    thumbImgSrc={badgeThumbnail}
                    dateDisplay={issueDate}
                    issuerName={issuerName}
                    customThumbComponent={
                        <CredentialBadge
                            achievementType={cred?.credentialSubject?.achievement?.achievementType}
                            boostType={categoryType}
                            badgeThumbnail={badgeThumbnail}
                            showBackgroundImage
                            backgroundImage={cred?.display?.backgroundImage}
                            backgroundColor={cred?.display?.backgroundColor}
                            badgeContainerCustomClass="mt-[0px] mb-[8px]"
                            badgeCircleCustomClass="w-[116px] h-[116px] shadow-3xl mt-1"
                            badgeRibbonContainerCustomClass="left-[38%] bottom-[-20%]"
                            badgeRibbonCustomClass="w-[26px]"
                            badgeRibbonIconCustomClass="w-[90%] mt-[4px]"
                        />
                    }
                    title={cardTitle}
                    type={type}
                />
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <IdDisplayContainer
                showQRCode
                handleQRCodeClick={() => {
                    closeModal();
                    presentShareBoostLink();
                }}
                achievementType={cred?.credentialSubject?.achievement?.achievementType}
                title={cardTitle}
                viewMode={CredentialListTabEnum.Earned}
                handlePreviewBoost={
                    cred && !showSkeleton
                        ? () => {
                              resetIonicModalBackground();
                              setIonicModalBackground(cred?.display?.backgroundImage);
                              presentModal();
                          }
                        : undefined
                }
                location={cred?.address?.streetAddress}
                issuerName={issuerName}
                issuerThumbnail={issuerThumbnailSrc}
                showIssuerThumbnail={showIssuerThumbnail}
                backgroundImage={cred?.boostID?.backgroundImage}
                dimBackgroundImage={cred?.boostID?.dimBackgroundImage}
                fontColor={cred?.boostID?.fontColor}
                accentColor={cred?.boostID?.accentColor}
                handleOptionsModal={handlePresentOptionsModal}
                categoryType={categoryType}
                idDisplayContainerClass={idDisplayContainerClass}
                idSleeveFooterClass={idSleeveFooterClass}
                issueeThumbnail={issueeThumbnail}
                cred={credential}
                boostPageViewMode={boostPageViewMode}
                loading={showSkeleton}
            />
        </ErrorBoundary>
    );
};

export default BoostEarnedIDCard;
