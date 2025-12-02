import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { ErrorBoundary } from 'react-error-boundary';
import { VC } from '@learncard/types';

import { useIonModal } from '@ionic/react';
import { useLoadingLine } from '../../../stores/loadingStore';
import useBoostMenu, { BoostMenuType } from '../hooks/useBoostMenu';
import useGetTroopNetwork from '../../../hooks/useGetTroopNetwork';

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
    useGetCredentialWithEdits,
    useGetResolvedCredential,
    useModal,
    useWallet,
    useGetVCInfo,
} from 'learn-card-base';
import BoostPreview from '../boostCMS/BoostPreview/BoostPreview';
import CredentialBadge from 'learn-card-base/components/CredentialBadge/CredentialBadge';
import IdDisplayContainer from '../../../pages/ids/IdDisplayContainer';
import IDDisplayCard from 'learn-card-base/components/id/IDDisplayCard';
import CredentialSubjectDisplay from 'learn-card-base/components/CredentialSubjectDisplay/CredentialSubjectDisplay';
import VCDisplayCardWrapper from 'learn-card-base/components/vcmodal/VCDisplayCardWrapper';
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
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

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
    const credentialCategoryType = getDefaultCategoryForCredential(_credential);

    const credImg = getUrlFromImage(getCredentialSubject(cred)?.image ?? '');
    const cardTitle = isBoost ? cred?.name : getCredentialName(cred);

    const network = useGetTroopNetwork(cred);
    const subtitle = network?.name;

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
        credential,
        uri,
        credential,
        credentialCategoryType,
        BoostMenuType.earned
    );

    const type = categoryMetadata[categoryType].walletSubtype;
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

    const credentialComponentDisplay = isBoost ? BoostPreview : VCDisplayCardWrapper;

    const presentShareBoostLink = () => {
        newModal(
            <ShareTroopIdModal credential={credential.boostCredential} uri={credential.boostId} />,
            { sectionClassName: '!bg-transparent !shadow-none !max-w-[355px]' },
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
        );

        // newModal(
        //     <ShareBoostLink
        //         handleClose={closeModal}
        //         boost={credential}
        //         boostUri={uri}
        //         categoryType={categoryType}
        //     />,
        //     {
        //         sectionClassName: '!bg-transparent !shadow-none !w-fit !max-h-[90%]',
        //         hideButton: true,
        //     }
        // );
    };

    const [presentModal, dissmissModal] = useIonModal(credentialComponentDisplay, {
        credential: cred,
        categoryType: categoryType,
        issuerOverride: issuerName,
        issueeOverride: issueeName,
        verificationItems: isBoost ? undefined : [],
        handleCloseModal: () => dissmissModal(),
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
            dissmissModal();
            presentShareBoostLink();
        },
    });

    const issueDate = moment(cred?.issuanceDate).format('MMMM DD YYYY');

    if (!useWrapper) {
        return (
            <ErrorBoundary fallback={<div>Something went wrong</div>}>
                <BoostGenericCard
                    innerOnClick={
                        !showChecked && !showSkeleton
                            ? () => {
                                  setIonicModalBackground(cred?.display?.backgroundImage);
                                  presentModal({ onDidDismiss: () => resetIonicModalBackground() });
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
                    dissmissModal();
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
                              presentModal({ onDidDismiss: () => resetIonicModalBackground() });
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
