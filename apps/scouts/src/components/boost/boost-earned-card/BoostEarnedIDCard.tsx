import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Boost, VC } from '@learncard/types';
import * as m from '../../../paraglide/messages.js';
import { formatLocaleDate } from '../../../i18n/formatters';

import useBoostMenu, { BoostMenuType } from '../hooks/useBoostMenu';
import useGetTroopNetwork from '../../../hooks/useGetTroopNetwork';

import { BoostGenericCard } from '@learncard/react';
import { useLoadingLine } from '../../../stores/loadingStore';
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
    useGetCredentialWithEdits,
    useGetResolvedCredential,
    useModal,
    useWallet,
    useGetVCInfo,
    categoryMetadata,
    CredentialCategoryEnum,
} from 'learn-card-base';
import BoostPreview from '../boostCMS/BoostPreview/BoostPreview';
import NonBoostPreview from '../boostCMS/BoostPreview/NonBoostPreview';
import CredentialBadge from 'learn-card-base/components/CredentialBadge/CredentialBadge';
import IdDisplayContainer from '../../../pages/ids/IdDisplayContainer';
import IDDisplayCard from 'learn-card-base/components/id/IDDisplayCard';
import CredentialSubjectDisplay from 'learn-card-base/components/CredentialSubjectDisplay/CredentialSubjectDisplay';
import ShareTroopIdModal from '../../../pages/troop/ShareTroopIdModal';

import {
    getCredentialSubject,
    getDefaultCategoryForCredential,
    getUrlFromImage,
} from 'learn-card-base/helpers/credentialHelpers';
import {
    getImageUrlFromCredential,
    getCredentialName,
} from 'learn-card-base/helpers/credentialHelpers';
import {
    unwrapBoostCredential,
    isBoostCredential,
} from 'learn-card-base/helpers/credentialHelpers';

import {
    ID_CARD_DISPLAY_TYPES,
    getIDCardDisplayInputsFromVC,
} from 'learn-card-base/helpers/credentials/ids';

import { BespokeLearnCard } from 'learn-card-base/types/learn-card';

type BoostEarnedIDCardProps = {
    credential?: VC;
    uri?: string;
    defaultImg: string;
    onCheckMarkClick?: () => void;
    selectAll?: boolean;
    initialCheckmarkState?: boolean;
    categoryType: CredentialCategoryEnum;
    useWrapper?: boolean;
    showChecked?: boolean;
    boostPageViewMode?: BoostPageViewModeType;
    loading?: boolean;
};

export const BoostEarnedIDCard: React.FC<BoostEarnedIDCardProps> = ({
    credential: _credential,
    uri,
    defaultImg,
    categoryType,
    useWrapper = true,
    onCheckMarkClick,
    initialCheckmarkState,
    showChecked,
    boostPageViewMode = BoostPageViewMode.Card,
    loading,
}) => {
    const [wallet, setWallet] = useState<BespokeLearnCard | undefined>(undefined);
    const { initWallet } = useWallet();
    const { newModal: newPreviewModal, closeModal: closePreviewModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

    const openPreviewModal = () => {
        if (!cred) return;

        const Preview = isBoost ? BoostPreview : NonBoostPreview;

        newPreviewModal(
            <ErrorBoundary fallback={<div>{m['boost.somethingWentWrong']()}</div>}>
                <Preview
                    credential={cred}
                    categoryType={categoryType as unknown as BoostCategoryOptionsEnum}
                    issuerOverride={issuerName}
                    issueeOverride={issueeName}
                    verificationItems={undefined}
                    handleCloseModal={closePreviewModal}
                    handleShareBoost={presentShareBoostLink}
                    onDotsClick={handlePresentBoostMenuModal}
                    subjectDID={subjectDID}
                    subjectImageComponent={subjectProfileImageElement}
                    issuerImageComponent={issuerProfileImageElement}
                    customThumbComponent={
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
                                achievementType={
                                    cred?.credentialSubject?.achievement?.achievementType
                                }
                                boostType={categoryType as unknown as BoostCategoryOptionsEnum}
                                badgeThumbnail={badgeThumbnail}
                                badgeCircleCustomClass="w-[170px] h-[170px]"
                                showBackgroundImage={false}
                                backgroundImage={cred?.display?.backgroundImage ?? ''}
                                backgroundColor={cred?.display?.backgroundColor ?? ''}
                                credential={credential!}
                            />
                        )
                    }
                    customDescription={customDescription}
                    titleOverride={cardTitle}
                    qrCodeOnClick={() => {
                        closePreviewModal();
                        presentShareBoostLink();
                    }}
                    customBodyCardComponent={undefined}
                    customFooterComponent={undefined}
                    customIssueHistoryComponent={undefined}
                />
            </ErrorBoundary>
        );
    };

    useEffect(() => {
        initWallet().then(setWallet);
    }, []);

    const {
        data: resolvedCredential,
        isFetching: resolvedBoostFetching,
        isLoading: resolvedBoostLoading,
    } = useGetResolvedCredential(uri, !_credential);
    const credential = resolvedCredential || _credential;
    const isBoost = credential && isBoostCredential(credential);
    let cred = credential && unwrapBoostCredential(credential);
    const { credentialWithEdits } = useGetCredentialWithEdits(cred);
    cred = credentialWithEdits ?? cred;

    const credType = cred?.credentialSubject?.achievement?.achievementType;

    // # get the ID type
    // while the credential is displayed as an ID
    // the underlying category can be any of the following categories
    // ['Global Admin ID', 'National Network Admin ID', 'Troop Leader ID', 'Scout ID'],
    const credentialCategoryType = _credential
        ? getDefaultCategoryForCredential(_credential)
        : undefined;

    const credImg = getUrlFromImage(getCredentialSubject(cred)?.image ?? '');
    const cardTitle = isBoost ? cred?.name : getCredentialName(cred);

    const { network: networkData } = useGetTroopNetwork({ credential: cred });
    const subtitle = networkData?.name;

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

    const { handlePresentBoostMenuModal } = useBoostMenu(
        credential!,
        uri || '',
        credential as unknown as Boost,
        credentialCategoryType ?? categoryType,
        BoostMenuType.earned
    );

    const type = categoryMetadata[categoryType as unknown as CredentialCategoryEnum]?.walletSubtype;
    const isID = (categoryType as unknown) === BoostCategoryOptionsEnum.id;
    const isMembership = (categoryType as unknown) === BoostCategoryOptionsEnum.membership;

    let idDisplayContainerClass = '';
    let idSleeveFooterClass = '';

    if (isID) {
        idDisplayContainerClass = '!border-white';
        idSleeveFooterClass = '!bg-teal-300';
    } else if (isMembership) {
        idDisplayContainerClass = '!border-white';
        idSleeveFooterClass = '!bg-sp-green-light';
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

    let subjectDID: string | undefined;
    let issuerThumbnailSrc: string | undefined;
    let showIssuerThumbnail: boolean | undefined;

    const vcInfo = useGetVCInfo(cred);
    const vcInfoLoading = vcInfo.loading;
    let { issuerName, issuerProfileImageElement, issueeName, subjectProfileImageElement } = vcInfo;

    const showSkeleton = loading || resolvedBoostLoading || vcInfoLoading;

    let customDescription: React.ReactNode | undefined;

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
            if (issuerThumbnail) showIssuerThumbnail = true;
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

    const presentShareBoostLink = () => {
        if (!credential) return;

        newPreviewModal(
            <ShareTroopIdModal
                credential={credential.boostCredential ?? credential}
                uri={credential.boostId ?? uri}
            />,
            { sectionClassName: '!bg-transparent !shadow-none !max-w-[355px]' },
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
        );
    };

    const presentModal = () => {
        openPreviewModal();
    };

    const dissmissModal = () => {
        closePreviewModal();
    };

    const issueDate = formatLocaleDate(cred?.issuanceDate, {
        month: 'long',
        day: '2-digit',
        year: 'numeric',
    });

    if (!useWrapper) {
        return (
            <ErrorBoundary fallback={<div>{m['boost.somethingWentWrong']()}</div>}>
                <BoostGenericCard
                    innerOnClick={
                        !showChecked && !showSkeleton
                            ? () => {
                                  setIonicModalBackground(cred?.display?.backgroundImage);
                                  presentModal();
                              }
                            : undefined
                    }
                    onCheckClick={onCheckMarkClick}
                    showChecked={showChecked}
                    checkStatus={initialCheckmarkState}
                    optionsTriggerOnClick={handlePresentBoostMenuModal}
                    className="bg-white text-black z-[1000] mt-[15px]"
                    customHeaderClass="boost-managed-card"
                    thumbImgSrc={badgeThumbnail}
                    dateDisplay={issueDate}
                    issuerName={issuerName}
                    customThumbComponent={
                        <CredentialBadge
                            achievementType={cred?.credentialSubject?.achievement?.achievementType}
                            boostType={categoryType as unknown as BoostCategoryOptionsEnum}
                            badgeThumbnail={badgeThumbnail}
                            showBackgroundImage
                            backgroundImage={cred?.display?.backgroundImage ?? ''}
                            backgroundColor={cred?.display?.backgroundColor ?? ''}
                            badgeContainerCustomClass="mt-[0px] mb-[8px]"
                            badgeCircleCustomClass="w-[116px] h-[116px] shadow-3xl mt-1"
                            badgeRibbonContainerCustomClass="left-[38%] bottom-[-20%]"
                            badgeRibbonCustomClass="w-[26px]"
                            badgeRibbonIconCustomClass="w-[90%] mt-[4px]"
                            credential={credential!}
                        />
                    }
                    title={cardTitle}
                    type={type}
                />
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary fallback={<div>{m['boost.somethingWentWrong']()}</div>}>
            <IdDisplayContainer
                showQRCode
                handleQRCodeClick={() => {
                    closePreviewModal();
                    presentShareBoostLink();
                }}
                achievementType={cred?.credentialSubject?.achievement?.achievementType}
                title={cardTitle}
                subtitle={subtitle}
                viewMode={CredentialListTabEnum.Earned}
                handlePreviewBoost={
                    cred && !showSkeleton
                        ? () => {
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
                handleOptionsModal={handlePresentBoostMenuModal}
                categoryType={categoryType as unknown as BoostCategoryOptionsEnum}
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
