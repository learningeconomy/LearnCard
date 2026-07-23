import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useRenderMethodEnabled } from '../../../../hooks/useRenderMethodEnabled';

import { IonPage } from '@ionic/react';
import { VCDisplayCard2 } from '@learncard/react';
import * as m from '../../../../paraglide/messages.js';
import { BoostPreviewTabsEnum } from '../../../boost-preview-tabs/boost-preview-tabs.helpers';
import { boostPreviewStore } from 'learn-card-base';
import { prettifyVerificationItems } from 'learn-card-base/helpers/verificationPrettifier';
import { applyLifecycleStatusToVerifications } from 'learn-card-base/helpers/lifecycleVerification.helpers';
import BoostMediaPreview from './BoostMediaPreview';
import BoostDetailsSideBar from './BoostDetailsSideBar';
import BoostDetailsSideMenu from './BoostDetailsSideMenu';
import RenderMethodDisplay from '../../../render-method/RenderMethodDisplay';
import VerifiedChildCLRFooter from './VerifiedChildCLRFooter';
import EndorsementBadge from '../../../boost-endorsements/EndorsementBadge';
import BoostFooterLayout from 'learn-card-base/components/boost/boostFooter/BoostFooterLayout';
import ReactCredentialIssuerPopover, {
    useReactCredentialIssuerPopover,
} from 'learn-card-base/components/CredentialBadge/ReactCredentialIssuerPopover';

import { VC, UnsignedVC, VerificationItem } from '@learncard/types';
import {
    useModal,
    useWallet,
    ModalTypes,
    useDeviceTypeByWidth,
    useGetCredentialWithEdits,
    DisplayTypeEnum,
    BoostCategoryOptionsEnum,
    PreviewTypeEnum,
} from 'learn-card-base';
import { useKnownDIDRegistry } from 'learn-card-base/hooks/useRegistry';

import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';
import { getSvgMustacheRenderMethod } from '@learncard/render-method-plugin';
import { BoostPreviewDisplayViewEnum } from 'learn-card-base/stores/boostPreviewStore';

export type IssueHistory = {
    id?: string | number;
    name?: string;
    thumb?: string;
    date?: string;
};

export type BoostPreviewProps = {
    credential: VC;
    verificationItems: VerificationItem[];
    lifecycleStatus?: 'active' | 'revoked' | 'suspended';
    categoryType: BoostCategoryOptionsEnum;
    customThumbComponent: React.ReactNode;
    customBodyCardComponent: React.ReactNode;
    customFooterComponent: React.ReactNode;
    issueHistory?: IssueHistory[];
    issueeOverride?: string;
    issuerOverride?: string;
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
    handleCloseModal?: () => void;
    handleShareBoost?: () => void;
    formattedDisplayType?: string;
    skipVerification?: boolean;
    customLinkedCredentialsComponent?: React.ReactNode;
    displayType?: DisplayTypeEnum;
    showEndorsementBadge?: boolean;
    existingEndorsements?: VC[];
    previewType?: PreviewTypeEnum;
    isEarnedBoost?: boolean;
    isClrChildCredential?: boolean;
    issuancesSummaryComponent?: React.ReactNode;
    isPreview?: boolean;
};

export const useVerification = (credential: VC) => {
    const [vcVerifications, setVCVerifications] = useState<VerificationItem[]>([]);
    const { initWallet } = useWallet();
    useEffect(() => {
        const verify = async () => {
            const wallet = await initWallet();
            const verifications = await wallet?.invoke?.verifyCredential(credential, {}, true);
            setVCVerifications(prettifyVerificationItems(verifications ?? []));
        };
        verify();
    }, []);
    return vcVerifications;
};

const RibbonCategory: React.FC<{ categoryType: BoostCategoryOptionsEnum }> = ({ categoryType }) => {
    switch (categoryType) {
        case BoostCategoryOptionsEnum.socialBadge:
            return (
                <span className="text-[12px] font-semibold text-blue-500">
                    {m['wallet.categoriesSingular.socialBadges']()}
                </span>
            );
        case BoostCategoryOptionsEnum.achievement:
            return (
                <span className="text-[12px] font-semibold text-pink-400">
                    {m['wallet.categoriesSingular.achievements']()}
                </span>
            );
        case BoostCategoryOptionsEnum.learningHistory:
            return (
                <span className="text-[12px] font-semibold text-emerald-600">
                    {m['wallet.categoriesSingular.studies']()}
                </span>
            );
        case BoostCategoryOptionsEnum.workHistory:
            return (
                <span className="text-[12px] font-semibold text-cyan-500">
                    {m['wallet.categoriesSingular.experiences']()}
                </span>
            );
        case BoostCategoryOptionsEnum.accommodation:
            return (
                <span className="text-[12px] font-semibold text-violet-500">
                    {m['wallet.categoriesSingular.assistance']()}
                </span>
            );
        case BoostCategoryOptionsEnum.accomplishment:
            return (
                <span className="text-[12px] font-semibold text-yellow-500">
                    {m['wallet.categoriesSingular.portfolio']()}
                </span>
            );
        default:
            return;
    }
};

const BoostPreview: React.FC<BoostPreviewProps> = ({
    credential: _credential,
    verificationItems,
    lifecycleStatus,
    categoryType,
    issueHistory,
    issueeOverride,
    issuerOverride,
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
    hideIssueDate,
    onDotsClick,
    qrCodeOnClick,
    hideQRCode = false,
    handleCloseModal,
    handleShareBoost,
    formattedDisplayType,
    skipVerification = false,
    customLinkedCredentialsComponent,
    showEndorsementBadge,
    displayType,
    existingEndorsements,
    previewType,
    isEarnedBoost,
    isClrChildCredential = false,
    issuancesSummaryComponent,
    isPreview = false,
}) => {
    const enableRenderMethod = useRenderMethodEnabled();
    const unwrappedCredential = unwrapBoostCredential(_credential);
    const { credentialWithEdits } = useGetCredentialWithEdits(unwrappedCredential);
    const renderMethod = enableRenderMethod ? getSvgMustacheRenderMethod(_credential as VC) : null;
    const selectedDisplayView = boostPreviewStore.useTracked.selectedDisplayView();

    useEffect(() => {
        // Reset to Details tab whenever the credential changes
        boostPreviewStore.set.updateSelectedTab(BoostPreviewTabsEnum.Details);
    }, [credentialWithEdits?.id]);
    useEffect(() => {
        boostPreviewStore.set.updateSelectedDisplayView(
            enableRenderMethod && renderMethod
                ? BoostPreviewDisplayViewEnum.Issuer
                : BoostPreviewDisplayViewEnum.Default
        );
    }, [credentialWithEdits?.id, renderMethod?.template, enableRenderMethod]);
    const credential = credentialWithEdits ?? unwrappedCredential;
    const { newModal, closeModal } = useModal();
    const { credentialIssuerPopoverProps, openCredentialIssuerPopover } =
        useReactCredentialIssuerPopover();

    const profileID =
        typeof credential?.issuer === 'string' ? credential.issuer : credential?.issuer?.id;
    const { data: knownDIDRegistry } = useKnownDIDRegistry(profileID);

    const vcVerifications = useVerification(credential);
    const [isFront, setIsFront] = useState(true);

    let verifications: VerificationItem[] = [];
    if (isClrChildCredential) {
        verifications = [];
    } else if (showVerifications && verificationItems && verificationItems.length > 0) {
        verifications = verificationItems;
    } else if (showVerifications) {
        verifications = vcVerifications;
    }

    // Reflect the authoritative revoked/suspended status in the side-panel verifications
    // list (the client status check can't see a set suspension bit).
    verifications = applyLifecycleStatusToVerifications(verifications, lifecycleStatus);

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

    const { isMobile } = useDeviceTypeByWidth();

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
        // if (vcVerifications?.length === 0 && !skipVerification) {
        //     return;
        // }
        newModal(
            <BoostDetailsSideMenu
                credential={selectedCredential}
                categoryType={categoryType}
                verificationItems={detailVerificationItems}
                customLinkedCredentialsComponent={customLinkedCredentialsComponent}
                displayType={displayType}
                existingEndorsements={existingEndorsements}
                isEarnedBoost={isEarnedBoost}
                isClrChildCredential={isClrChildCredential}
                renderMethodCredential={_credential as VC | UnsignedVC}
                issuancesSummaryComponent={issuancesSummaryComponent}
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
            credential={_credential}
            categoryType={categoryType}
            onClick={() => {
                if (isMobile) {
                    openDetailsSideModal();
                }
            }}
        />
    ) : null;

    if (displayType === DisplayTypeEnum.Media || previewType === PreviewTypeEnum.Media) {
        return (
            <BoostMediaPreview
                credential={credential}
                openDetailsSideModal={openDetailsSideModal}
                handleShareBoost={handleShareBoost}
                onDotsClick={onDotsClick}
                verifications={verifications}
                handleCloseModal={handleCloseModal}
            />
        );
    }

    const credentialDisplay = (
        <VCDisplayCard2
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
            knownDIDRegistry={knownDIDRegistry}
            handleXClick={isCertificate ? closeModal : undefined}
            hideIssueDate={hideIssueDate}
            customRibbonCategoryComponent={<RibbonCategory categoryType={categoryType} />}
            hideNavButtons
            setIsFrontOverride={setIsFront}
            qrCodeOnClick={qrCodeOnClick}
            hideQRCode={hideQRCode}
            formattedDisplayType={formattedDisplayType}
            customLinkedCredentialsComponent={customLinkedCredentialsComponent}
            customBodyContentSlot={endorsementBadge}
            onVerifierClick={openCredentialIssuerPopover}
        />
    );

    return (
        <IonPage>
            <BoostFooterLayout
                contentOwnsScroll
                footerProps={{
                    handleClose: handleCloseModal,
                    handleDetails: isMobile ? () => openDetailsSideModal() : undefined,
                    handleShare: handleShareBoost,
                    handleDotMenu: onDotsClick,
                    useFullCloseButton: !isMobile || !handleShareBoost,
                }}
            >
                <div className="flex h-full">
                    <section className="flex h-full overflow-y-scroll flex-1 items-start justify-center relative boost-cms-preview [&::part(scroll)]:px-0">
                        <div
                            className={`w-full px-2 flex flex-col items-center justify-center overflow-x-auto ${boostPreviewWrapperCustomClass} ${
                                isCertificate ? 'certificate-display-zoom' : ''
                            } ${isID ? '!px-0 safe-area-top-margin mt-[20px]' : ''}`}
                        >
                            <section
                                className={`px-6 w-full safe-area-top-margin overflow-y-auto max-h-full disable-scrollbars ${
                                    Capacitor.isNativePlatform() ? 'pt-0' : 'pt-[30px]'
                                }`}
                            >
                                {isIssuerViewSelected && renderMethod ? (
                                    <RenderMethodDisplay
                                        vc={credential}
                                        renderMethod={renderMethod}
                                        fallback={credentialDisplay}
                                        className="w-full"
                                    />
                                ) : (
                                    credentialDisplay
                                )}
                            </section>
                        </div>
                    </section>
                    {!isMobile && (
                        <BoostDetailsSideBar
                            credential={selectedCredential}
                            categoryType={categoryType}
                            verificationItems={detailVerificationItems}
                            customLinkedCredentialsComponent={customLinkedCredentialsComponent}
                            displayType={displayType}
                            existingEndorsements={existingEndorsements}
                            isEarnedBoost={isEarnedBoost}
                            isClrChildCredential={isClrChildCredential}
                            renderMethodCredential={_credential as VC | UnsignedVC}
                            issuancesSummaryComponent={issuancesSummaryComponent}
                            isPreview={isPreview}
                        />
                    )}
                    <ReactCredentialIssuerPopover {...credentialIssuerPopoverProps} />
                </div>
            </BoostFooterLayout>
        </IonPage>
    );
};

export default BoostPreview;
