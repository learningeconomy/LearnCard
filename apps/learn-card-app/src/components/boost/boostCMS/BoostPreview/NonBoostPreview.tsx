import React, { useEffect, useMemo, useState } from 'react';
import { BoostPreviewTabsEnum } from '../../../boost-preview-tabs/boost-preview-tabs.helpers';
import { boostPreviewStore } from 'learn-card-base';
import { Capacitor } from '@capacitor/core';
import { useRenderMethodEnabled } from '../../../../hooks/useRenderMethodEnabled';

import { IonPage } from '@ionic/react';
import RenderMethodDisplay from '../../../render-method/RenderMethodDisplay';
import BoostDetailsSideBar from './BoostDetailsSideBar';
import BoostDetailsSideMenu from './BoostDetailsSideMenu';
import VerifiedChildCLRFooter from './VerifiedChildCLRFooter';
import EndorsementBadge from '../../../boost-endorsements/EndorsementBadge';
import VCDisplayCardWrapper2 from 'learn-card-base/components/vcmodal/VCDisplayCardWrapper2';
import BoostFooter from 'learn-card-base/components/boost/boostFooter/BoostFooter';
import ClrTranscriptFullPage from '../../../clr-transcript/surfaces/ClrTranscriptFullPage';
import {
    normalizeClrTranscriptDisplayModel,
    ClrTranscriptSurface,
} from '../../../../helpers/clrRenderer.helpers';
import { getDownloadableEvidence } from '../../../clr-transcript/clr.helpers';

import { VC, UnsignedVC, VerificationItem } from '@learncard/types';
import {
    BoostCategoryOptionsEnum,
    useWallet,
    useModal,
    ModalTypes,
    useDeviceTypeByWidth,
    DisplayTypeEnum,
} from 'learn-card-base';
import { getSvgMustacheRenderMethod } from '@learncard/render-method-plugin';
import { BoostPreviewDisplayViewEnum } from 'learn-card-base/stores/boostPreviewStore';

type IssueHistory = {
    id?: string | number;
    name?: string;
    thumb?: string;
    date?: string;
};

type NonBoostPreviewProps = {
    credential: VC;
    boostUri?: string;
    credentialUri?: string;
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
    onDotsClick?: () => void;
    qrCodeOnClick?: () => void;
    handleShareBoost?: () => void;
    customLinkedCredentialsComponent?: React.ReactNode;
    showEndorsementBadge?: boolean;
    existingEndorsements?: VC[];
    isEarnedBoost?: boolean;
    isClrChildCredential?: boolean;
    isClrCredential?: boolean;
    displayType?: DisplayTypeEnum;
    isPreview?: boolean;
};

const NonBoostPreview: React.FC<NonBoostPreviewProps> = ({
    credential,
    boostUri,
    credentialUri,
    verificationItems,
    categoryType,
    issueHistory,
    issueeOverride,
    issuerOverride,
    handleCloseModal,
    customThumbComponent,
    customBodyCardComponent,
    customFooterComponent,
    subjectDID,
    subjectImageComponent,
    issuerImageComponent,
    showVerifications = true,
    boostPreviewWrapperCustomClass = '',
    customCriteria,
    customDescription,
    customIssueHistoryComponent,
    titleOverride,
    onDotsClick,
    qrCodeOnClick,
    handleShareBoost,
    customLinkedCredentialsComponent,
    showEndorsementBadge,
    existingEndorsements,
    isEarnedBoost,
    isClrChildCredential = false,
    isClrCredential = false,
    displayType,
    isPreview = false,
}) => {
    const enableRenderMethod = useRenderMethodEnabled();
    const { initWallet } = useWallet();
    const [vcVerifications, setVCVerifications] = useState<VerificationItem[]>([]);
    const renderMethod = enableRenderMethod ? getSvgMustacheRenderMethod(credential as VC) : null;
    const selectedDisplayView = boostPreviewStore.useTracked.selectedDisplayView();

    useEffect(() => {
        // Reset to Details tab whenever the credential changes
        boostPreviewStore.set.updateSelectedTab(BoostPreviewTabsEnum.Details);
    }, [credential?.id]);
    useEffect(() => {
        boostPreviewStore.set.updateSelectedDisplayView(
            enableRenderMethod && renderMethod
                ? BoostPreviewDisplayViewEnum.Issuer
                : BoostPreviewDisplayViewEnum.Default
        );
    }, [credential?.id, renderMethod?.template, enableRenderMethod]);
    const [isFront, setIsFront] = useState(true);
    const { newModal, closeModal } = useModal();

    const { isMobile } = useDeviceTypeByWidth();

    useEffect(() => {
        if (isPreview) return;

        const verify = async () => {
            const wallet = await initWallet();
            const verifications = await wallet?.invoke?.verifyCredential(credential, {}, true);
            setVCVerifications(verifications);
        };

        verify();
    }, [credential, isPreview]);

    useEffect(() => {
        if (!isFront) {
            setIsFront(!isFront);
            if (isMobile) {
                openDetailsSideModal();
            }
        }
    }, [isFront]);

    const openDetailsSideModal = () => {
        // ! this prevents the modal from opening if there are no verifications
        // ! on desktop this opens regardless, commenting out for now
        // ! to keep things consistent across mobile and desktop
        // if (vcVerifications.length === 0) {
        //     return;
        // }
        newModal(
            <BoostDetailsSideMenu
                credential={selectedCredential}
                categoryType={categoryType}
                verificationItems={detailVerificationItems}
                customLinkedCredentialsComponent={customLinkedCredentialsComponent}
                existingEndorsements={existingEndorsements}
                isEarnedBoost={isEarnedBoost}
                isClrChildCredential={isClrChildCredential}
                renderMethodCredential={credential as VC | UnsignedVC}
                isPreview={isPreview}
            />,
            {
                className: '!bg-transparent',
                hideButton: true,
            },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    const endorsementBadge = showEndorsementBadge ? (
        <EndorsementBadge
            credential={credential}
            categoryType={categoryType}
            onClick={() => {
                if (isMobile) {
                    openDetailsSideModal();
                }
            }}
        />
    ) : null;

    let verifications: VerificationItem[] = [];
    if (isClrChildCredential) {
        verifications = [];
    } else if (showVerifications && verificationItems && verificationItems.length > 0) {
        verifications = verificationItems;
    } else if (showVerifications) {
        verifications = vcVerifications;
    }

    const detailVerificationItems = isClrChildCredential ? verificationItems : verifications;

    const selectedCredential = credential;

    const isCertificate =
        displayType === DisplayTypeEnum.Certificate ||
        credential?.display?.displayType === 'certificate';
    const isID =
        displayType === DisplayTypeEnum.ID ||
        credential?.display?.displayType === 'id' ||
        categoryType === 'ID';
    const isIssuerViewSelected =
        enableRenderMethod &&
        Boolean(renderMethod) &&
        selectedDisplayView === BoostPreviewDisplayViewEnum.Issuer;

    const bgImage = credential?.display?.backgroundImager;
    const showBackground = bgImage && isCertificate;

    const bgColor = isClrCredential ? 'bg-grayscale-100' : '';

    const clrModel = useMemo(
        () =>
            isClrCredential || isClrChildCredential
                ? normalizeClrTranscriptDisplayModel(
                      credential as unknown as Record<string, unknown>
                  )
                : null,
        [credential, isClrCredential, isClrChildCredential]
    );
    const clrEvidence = clrModel ? getDownloadableEvidence(clrModel.evidence) : [];
    const hasClrEvidence = clrEvidence.length > 0;

    const credentialDisplay = (
        <VCDisplayCardWrapper2
            credential={credential}
            issueeOverride={issueeOverride}
            issuerOverride={issuerOverride}
            issueHistory={issueHistory}
            categoryType={categoryType}
            verificationItems={verifications}
            customThumbComponent={customThumbComponent}
            customBodyCardComponent={customBodyCardComponent}
            customFooterComponent={
                isClrChildCredential ? <VerifiedChildCLRFooter /> : customFooterComponent
            }
            subjectDID={subjectDID}
            subjectImageComponent={subjectImageComponent}
            issuerImageComponent={issuerImageComponent}
            customDescription={customDescription}
            customCriteria={customCriteria}
            customIssueHistoryComponent={customIssueHistoryComponent}
            enableLightbox
            titleOverride={titleOverride}
            handleClose={isCertificate ? handleCloseModal : undefined}
            onDotsClick={onDotsClick}
            hideNavButtons
            setIsFrontOverride={setIsFront}
            customLinkedCredentialsComponent={customLinkedCredentialsComponent}
            customBodyContentSlot={endorsementBadge}
        />
    );

    let credentialContent: React.ReactNode;
    if ((isClrCredential || isClrChildCredential) && clrModel) {
        credentialContent = (
            <ClrTranscriptFullPage
                model={clrModel}
                boost={credential}
                // boostUri comes from boost cards; credentialUri from direct credential views
                boostUri={boostUri ?? credentialUri}
                options={{ viewer: 'student', surface: ClrTranscriptSurface.Full }}
            />
        );
    } else if (isIssuerViewSelected && renderMethod) {
        credentialContent = (
            <RenderMethodDisplay
                vc={credential}
                renderMethod={renderMethod}
                fallback={credentialDisplay}
                className="w-full"
            />
        );
    } else {
        credentialContent = credentialDisplay;
    }

    return (
        <IonPage>
            <div className={`flex h-full ${bgColor}`}>
                <section
                    className={`flex h-full overflow-y-scroll pb-[80px] flex-1 items-start justify-center relative boost-cms-preview [&::part(scroll)]:px-0`}
                >
                    <div
                        className={`w-full ${
                            isMobile && isClrCredential ? 'px-0' : 'px-2'
                        } flex flex-col items-center justify-center overflow-x-auto ${boostPreviewWrapperCustomClass} ${
                            isCertificate ? 'certificate-display-zoom' : ''
                        } ${isID ? '!px-0 safe-area-top-margin mt-[20px]' : ''}`}
                    >
                        <section
                            className={`w-full overflow-y-auto max-h-full pb-32 disable-scrollbars ${
                                Capacitor.isNativePlatform() && !isClrCredential
                                    ? 'pt-0 safe-area-top-margin'
                                    : 'pt-[30px]'
                            } ${isMobile && isClrCredential ? '!p-0' : 'px-6'}`}
                        >
                            {credentialContent}
                        </section>
                    </div>
                </section>
                <footer className="w-full flex justify-center items-center ion-no-border absolute bottom-0 z-10">
                    <BoostFooter
                        handleClose={handleCloseModal}
                        handleDetails={
                            isMobile && !isClrCredential ? () => openDetailsSideModal() : undefined
                        }
                        handleShare={handleShareBoost}
                        handleDotMenu={onDotsClick}
                        useFullCloseButton={!isMobile || isClrCredential}
                    />
                </footer>
                {!isMobile && !isClrCredential && (
                    <BoostDetailsSideBar
                        credential={selectedCredential}
                        categoryType={categoryType}
                        verificationItems={detailVerificationItems}
                        customLinkedCredentialsComponent={customLinkedCredentialsComponent}
                        existingEndorsements={existingEndorsements}
                        isEarnedBoost={isEarnedBoost}
                        isClrChildCredential={isClrChildCredential}
                        renderMethodCredential={credential as VC | UnsignedVC}
                        isPreview={isPreview}
                    />
                )}
            </div>
        </IonPage>
    );
};

export default NonBoostPreview;
