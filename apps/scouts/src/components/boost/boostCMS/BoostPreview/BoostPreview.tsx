import React, { useEffect, useState } from 'react';
import BoostFooter from 'learn-card-base/components/boost/boostFooter/BoostFooter';
import CredentialIssuerPopover, {
    useCredentialIssuerPopover,
} from 'learn-card-base/components/CredentialBadge/CredentialIssuerPopover';
import { getVCDisplayCardVariant, VCDisplayCard2 } from '@learncard/react';
import { IonContent, IonFooter, IonPage, IonRow } from '@ionic/react';

import type { IssuerTrustProfile, VC, VerificationItem } from '@learncard/types';
import { useWallet, BoostCategoryOptionsEnum } from 'learn-card-base';
import {
    getIssuerContextLabel,
    getIssuerContextName,
    useIssuerContext,
} from 'learn-card-base/hooks/useIssuerContext';
import { useT } from 'learn-card-base/i18n';

type IssueHistory = {
    id?: string | number;
    name?: string;
    thumb?: string;
    date?: string;
};

type BoostPreviewProps = {
    credential: VC;
    verificationItems: VerificationItem[];
    categoryType: BoostCategoryOptionsEnum;
    customThumbComponent: React.ReactNode;
    customBodyCardComponent: React.ReactNode;
    customFooterComponent: React.ReactNode;
    issueHistory?: IssueHistory[];
    issueeOverride?: string;
    issuerOverride?: string;
    handleCloseModal: () => void;
    subjectDID?: string;
    subjectImageComponent?: React.ReactNode;
    issuerImageComponent?: React.ReactNode;
    showVerifications?: boolean;
    boostPreviewWrapperCustomClass?: string;
    customCriteria?: React.ReactNode;
    customDescription?: React.ReactNode;
    customIssueHistoryComponent: React.ReactNode;
    titleOverride?: string;
    hideIssueDate?: boolean;
    onDotsClick?: () => void;
    qrCodeOnClick?: () => void;
    hideQRCode?: boolean;
    handleShareBoost?: () => void;
    verifierLabelOverride?: string;
    issuerTrustProfile?: IssuerTrustProfile;
};

const BoostPreview: React.FC<BoostPreviewProps> = ({
    credential,
    verificationItems,
    categoryType,
    issueHistory,
    issueeOverride,
    issuerOverride,
    handleCloseModal,
    customThumbComponent,
    customBodyCardComponent,
    customFooterComponent,
    verifierLabelOverride,
    issuerTrustProfile,
    subjectDID,
    subjectImageComponent,
    issuerImageComponent,
    showVerifications = true,
    boostPreviewWrapperCustomClass = '',
    customCriteria,
    customDescription,
    customIssueHistoryComponent,
    titleOverride,
    hideIssueDate,
    onDotsClick,
    qrCodeOnClick,
    hideQRCode = false,
    handleShareBoost,
}) => {
    const { initWallet } = useWallet();
    const { credentialIssuerPopoverProps, openCredentialIssuerPopover } =
        useCredentialIssuerPopover();
    const t = useT();
    const { issuerContext, registryIssuerName } = useIssuerContext(credential, {
        trustProfile: issuerTrustProfile,
    });
    const issuerLabelName = issuerContext
        ? getIssuerContextName(issuerContext, issuerOverride ?? registryIssuerName)
        : undefined;
    const issuerLabel = issuerContext
        ? getIssuerContextLabel(issuerContext, t, issuerLabelName, verifierLabelOverride)
        : undefined;
    const [isFront, setIsFront] = useState(true);

    useEffect(() => {
        const verify = async () => {
            const wallet = await initWallet();
            const verifications = await wallet?.invoke?.verifyCredential(credential, {}, true);
            setVCVerifications(verifications);
        };

        verify();
    }, [credential]);

    const verifications = showVerifications ? verificationItems || vcVerifications : [];

    const isCertificate = credential?.display?.displayType === 'certificate';
    const isID =
        credential?.display?.displayType === 'id' ||
        categoryType === BoostCategoryOptionsEnum.membership ||
        categoryType === BoostCategoryOptionsEnum.id;
    const shouldUseHostCardPadding = getVCDisplayCardVariant(credential, categoryType) !== 'ribbon';
    let displayCategoryType = categoryType;

    let customRibbonCategoryComponent;

    if (categoryType === BoostCategoryOptionsEnum.socialBadge) {
        customRibbonCategoryComponent = (
            <span className="uppercase text-[14px] font-[600] leading-[25px] select-none text-sp-blue-dark-ocean">
                Boost
            </span>
        );
    } else if (categoryType === BoostCategoryOptionsEnum.membership) {
        customRibbonCategoryComponent = (
            <span
                className={`uppercase text-[14px] font-[600] leading-[12px] select-none text-sp-green-base`}
            >
                Troop
            </span>
        );
        displayCategoryType = BoostCategoryOptionsEnum.id;
    }

    return (
        <IonPage>
            <IonContent
                fullscreen
                className={`flex items-center justify-center ion-padding boost-cms-preview transition-colors [&::part(scroll)]:px-0 gradient-mask-b-90`}
            >
                <IonRow
                    className={`flex flex-col items-center justify-center overflow-x-auto pb-32 ${boostPreviewWrapperCustomClass} ${
                        shouldUseHostCardPadding ? 'px-1' : ''
                    } ${isCertificate ? 'pt-14 md:pt-20' : ''} ${
                        isID ? '!px-0 safe-area-top-margin mt-[20px]' : ''
                    }`}
                >
                    <section
                        className={`w-full safe-area-top-margin ${
                            shouldUseHostCardPadding ? 'px-6' : ''
                        }`}
                    >
                        <VCDisplayCard2
                            credential={credential}
                            issueeOverride={issueeOverride}
                            issuerOverride={issuerOverride}
                            issueHistory={issueHistory}
                            categoryType={displayCategoryType}
                            verificationItems={verifications}
                            customThumbComponent={customThumbComponent}
                            customBodyCardComponent={customBodyCardComponent}
                            customFooterComponent={customFooterComponent}
                            subjectDID={subjectDID}
                            subjectImageComponent={subjectImageComponent}
                            issuerImageComponent={issuerImageComponent}
                            customDescription={customDescription}
                            customCriteria={customCriteria}
                            customIssueHistoryComponent={customIssueHistoryComponent}
                            enableLightbox
                            titleOverride={titleOverride}
                            issuerContext={issuerContext}
                            issuerLabel={issuerLabel}
                            issuerLabelName={issuerLabelName}
                            handleXClick={isCertificate ? handleCloseModal : undefined}
                            hideIssueDate={hideIssueDate}
                            customRibbonCategoryComponent={customRibbonCategoryComponent}
                            hideNavButtons
                            isFrontOverride={isFront}
                            setIsFrontOverride={setIsFront}
                            qrCodeOnClick={qrCodeOnClick}
                            hideQRCode={hideQRCode}
                            onVerifierClick={
                                issuerContext
                                    ? event => openCredentialIssuerPopover(event, issuerContext)
                                    : undefined
                            }
                        />
                    </section>
                </IonRow>
            </IonContent>
            <IonFooter
                mode="ios"
                className="w-full flex justify-center items-center p-[0px] m-[0px] ion-no-border absolute bottom-0"
            >
                <IonRow className="relative z-10 w-full flex justify-center items-center gap-8">
                    <BoostFooter
                        handleX={handleCloseModal}
                        handleDetails={isFront ? () => setIsFront(!isFront) : undefined}
                        handleBack={!isFront ? () => setIsFront(!isFront) : undefined}
                        handleShare={handleShareBoost}
                        handleDotMenu={onDotsClick}
                    />
                </IonRow>
            </IonFooter>
            <CredentialIssuerPopover {...credentialIssuerPopoverProps} />
        </IonPage>
    );
};

export default BoostPreview;
