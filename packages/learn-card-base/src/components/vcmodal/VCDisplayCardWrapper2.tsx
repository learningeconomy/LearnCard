import React, { useState, useEffect, useMemo } from 'react';

import IDDisplayCard from '../id/IDDisplayCard';
import { VCDisplayCard2 } from '@learncard/react';
import FamilyBoostPreview from './FamilyBoostPreview/FamilyBoostPreview';

import useVerifyCredential from 'learn-card-base/hooks/useVerifyCredential';
import { useKnownDIDRegistry } from 'learn-card-base/hooks/useRegistry';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { useGetVCInfo } from 'learn-card-base/hooks/useGetVCInfo';

import {
    BoostCategoryOptionsEnum,
    BrandingEnum,
    CredentialBadge,
    CredentialSubjectDisplay,
} from 'learn-card-base';

import { VC, VerificationItem, CredentialRecord } from '@learncard/types';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { ID_CARD_DISPLAY_TYPES } from 'learn-card-base/helpers/credentials/ids';
import { formatDid } from 'learn-card-base/helpers/didHelpers';

//TODO rewrite this whole thing
// it was written preboost and once the boost stuff came in
// things were quite different and all the different cases got quite messy

type VCDisplayCardWrapper2Props = {
    credential: VC;
    cr?: CredentialRecord;
    walletDid?: string;
    overrideCardImageUrl?: string;
    overrideCardTitle?: string;
    overrideDetails?: React.ReactNode;
    overrideIssueName?: string;
    customBodyCardComponent?: React.ReactNode;
    customFooterComponent?: React.ReactNode;
    customRibbonComponent?: React.ReactNode;
    checkProof?: boolean;
    brandingEnum?: BrandingEnum;
    hideAwardedTo?: boolean;
    handleClose?: () => void;
    isFrontOverride?: boolean;
    setIsFrontOverride?: (value: boolean) => void;
    hideNavButtons?: boolean;
    showDetailsBtn?: boolean;
    hideQRCode?: boolean;
    hideFrontFaceDetails?: boolean;
    onMediaClick?: (url: string) => void;
    handleClaim?: () => void;
    claimStatusText?: string;
    bottomButton?: React.ReactNode;
    categoryType?: BoostCategoryOptionsEnum;
    customLinkedCredentialsComponent?: React.ReactNode;
    useCurrentUserName?: boolean;
    customBodyContentSlot?: React.ReactNode;
    unknownVerifierTitle?: string;
    issueeOverride?: string;
    issuerOverride?: string;
    issueHistory?: any[];
    verificationItems?: VerificationItem[];
    customThumbComponent?: React.ReactNode;
    subjectDID?: string;
    subjectImageComponent?: React.ReactNode;
    issuerImageComponent?: React.ReactNode;
    customDescription?: React.ReactNode;
    customCriteria?: React.ReactNode;
    customIssueHistoryComponent?: React.ReactNode;
    enableLightbox?: boolean;
    titleOverride?: string;
    qrCodeOnClick?: () => void;
};

export const VCDisplayCardWrapper2: React.FC<VCDisplayCardWrapper2Props> = ({
    credential: _credential,
    cr,
    walletDid: _walletDid,
    overrideCardImageUrl,
    overrideCardTitle,
    overrideIssueName,
    customBodyCardComponent = null,
    customFooterComponent = null,
    checkProof = true,
    brandingEnum = BrandingEnum.learncard,
    handleClose,
    isFrontOverride,
    setIsFrontOverride,
    hideNavButtons,
    hideAwardedTo,
    showDetailsBtn = false,
    hideQRCode = false,
    hideFrontFaceDetails = false,
    onMediaClick,
    bottomButton,
    claimStatusText,
    handleClaim,
    categoryType,
    customLinkedCredentialsComponent,
    useCurrentUserName,
    customBodyContentSlot,
    unknownVerifierTitle,
    issueeOverride,
    issuerOverride,
    issueHistory,
    verificationItems,
    customThumbComponent,
    subjectDID,
    subjectImageComponent,
    issuerImageComponent,
    customDescription: customDescriptionProp,
    customCriteria,
    customIssueHistoryComponent,
    enableLightbox,
    titleOverride,
    qrCodeOnClick,
}) => {
    const currentUser = useCurrentUser();

    const credential = useMemo(() => unwrapBoostCredential(_credential), [_credential]);

    const { verifyCredential } = useVerifyCredential(checkProof);

    const [VcCategory, setVcCategory] = useState<any | null | undefined>();
    const [vcVerification, setVCVerification] = useState<VerificationItem[]>([]);

    useEffect(() => {
        const getCategory = async () => {
            if (categoryType) {
                setVcCategory(categoryType);
            } else {
                const cat = getDefaultCategoryForCredential(credential);
                setVcCategory(cat);
            }
        };

        getCategory();
    }, [credential, categoryType]);

    const category = cr?.category || VcCategory || 'Achievement';
    let _category = category;

    const {
        issuerName,
        issuerProfileImageElement,
        issuerProfile,
        issuerDid,

        // subject
        issueeName,
        issueeProfile,
        subjectProfileImageElement,

        // ID overrides
        idDisplayType,
        idIssuerThumbnailSrc,
        showIdIssuerThumbnail,
        idSubjectDID,
        mappedInputs,

        // VC metadata
        title,
        achievementType,
        badgeThumbnail,
        address,

        // VC Display Metadata
        displayType,
        idBackgroundImage,
        idDimBackgroundImage,
        idFontColor,
        idAccentColor,
    } = useGetVCInfo(credential, categoryType || _category);

    const { data: knownDIDRegistry } = useKnownDIDRegistry(issuerDid);

    useEffect(() => {
        verifyCredential(credential, (verificationItems: VerificationItem[]) => {
            setVCVerification(verificationItems);
        });
    }, [credential]);

    const isID = category === BoostCategoryOptionsEnum.id;
    const isMembership = category === BoostCategoryOptionsEnum.membership;
    const isTroopID = [
        BoostCategoryOptionsEnum.globalAdminId,
        BoostCategoryOptionsEnum.nationalNetworkAdminId,
        BoostCategoryOptionsEnum.troopLeaderId,
        BoostCategoryOptionsEnum.scoutId,
    ].includes(category);

    let customRibbonCategoryComponent = undefined;
    let customDescription = customDescriptionProp;

    if (idSubjectDID && idDisplayType === ID_CARD_DISPLAY_TYPES.PermanentResidentCard) {
        customDescription = <CredentialSubjectDisplay credentialSubject={idSubjectDID} />;
    }

    if (brandingEnum === BrandingEnum.scoutPass) {
        if (category === BoostCategoryOptionsEnum.socialBadge) {
            customRibbonCategoryComponent = (
                <span
                    className={`uppercase font-poppins text-[12px] font-[600] leading-[12px] select-none text-sp-purple-base`}
                >
                    Badge
                </span>
            );
        } else if (category === BoostCategoryOptionsEnum.membership) {
            customRibbonCategoryComponent = (
                <span
                    className={`uppercase font-poppins text-[12px] font-[600] leading-[12px] select-none text-sp-green-base`}
                >
                    Troop
                </span>
            );
            _category = BoostCategoryOptionsEnum.id;
        }
    }

    if (brandingEnum === BrandingEnum.learncard) {
        if (category === BoostCategoryOptionsEnum.achievement) {
            customRibbonCategoryComponent = (
                <span
                    className={`uppercase font-poppins text-[12px] font-[600] leading-[12px] text-pink-400`}
                >
                    Achievement
                </span>
            );
        } else if (category === BoostCategoryOptionsEnum.learningHistory) {
            customRibbonCategoryComponent = (
                <span
                    className={`uppercase text-[12px] font-[600] leading-[12px] select-none text-emerald-600`}
                >
                    Study
                </span>
            );
        } else if (category === BoostCategoryOptionsEnum.workHistory) {
            customRibbonCategoryComponent = (
                <span
                    className={`uppercase text-[12px] font-[600] leading-[12px] select-none text-blue-600`}
                >
                    Experience
                </span>
            );
        } else if (category === BoostCategoryOptionsEnum.accomplishment) {
            customRibbonCategoryComponent = (
                <span
                    className={`uppercase text-[12px] font-[600] leading-[12px] select-none text-lime-600`}
                >
                    Portfolio
                </span>
            );
        }
    }

    const isCertificate = displayType === 'certificate';
    const isFamily = category === BoostCategoryOptionsEnum.family;

    if (isFamily) {
        return (
            <FamilyBoostPreview
                credential={{
                    ...credential,
                    issuer:
                        issuerProfile?.displayName ||
                        issuerProfile?.profileId ||
                        issuerName ||
                        formatDid(issuerDid!),
                }}
                handleClaim={handleClaim}
                isFront={isFrontOverride}
                claimStatusText={claimStatusText}
                hideFrontFaceDetails={hideFrontFaceDetails}
            />
        );
    }

    return (
        <VCDisplayCard2
            categoryType={_category}
            credential={credential}
            issueeOverride={overrideIssueName || issueeName}
            issuerOverride={issuerName}
            customThumbComponent={
                isID || isMembership || isTroopID ? (
                    <IDDisplayCard
                        idClassName="p-0 m-0 mt-4 boost-id-preview-body min-h-[160px]"
                        idFooterClassName="p-0 m-0 mt-[-15px] boost-id-preview-footer"
                        name={overrideCardTitle || title}
                        location={address}
                        issueeThumbnail={issueeProfile?.image}
                        issueeName={useCurrentUserName ? currentUser?.name : issueeName}
                        issuerThumbnail={idIssuerThumbnailSrc}
                        showIssuerImage={showIdIssuerThumbnail}
                        backgroundImage={idBackgroundImage}
                        dimBackgroundImage={idDimBackgroundImage}
                        fontColor={idFontColor}
                        accentColor={idAccentColor}
                        idIssuerName={issuerName}
                        customIssuerThumbContainerClass="id-card-issuer-thumb-preview-container"
                        {...mappedInputs}
                    />
                ) : (
                    <CredentialBadge
                        achievementType={achievementType}
                        fallbackCircleText={overrideCardTitle || title}
                        boostType={category}
                        badgeThumbnail={overrideCardImageUrl || badgeThumbnail!}
                        badgeCircleCustomClass="w-[170px] h-[170px]"
                        branding={brandingEnum}
                    />
                )
            }
            issuerImageComponent={issuerProfileImageElement}
            subjectDID={idSubjectDID}
            subjectImageComponent={subjectProfileImageElement}
            verificationItems={vcVerification}
            customBodyCardComponent={customBodyCardComponent}
            customFooterComponent={customFooterComponent}
            customRibbonCategoryComponent={customRibbonCategoryComponent}
            titleOverride={overrideCardTitle || title}
            customDescription={customDescription}
            handleXClick={isCertificate ? handleClose : undefined}
            knownDIDRegistry={knownDIDRegistry}
            isFrontOverride={isFrontOverride}
            setIsFrontOverride={setIsFrontOverride}
            hideNavButtons={hideNavButtons}
            hideAwardedTo={hideAwardedTo}
            showDetailsBtn={showDetailsBtn}
            hideQRCode={hideQRCode}
            onMediaClick={onMediaClick}
            enableLightbox={true}
            bottomButton={bottomButton}
            customLinkedCredentialsComponent={customLinkedCredentialsComponent}
            customBodyContentSlot={customBodyContentSlot}
            unknownVerifierTitle={unknownVerifierTitle}
        />
    );
};

export default VCDisplayCardWrapper2;
