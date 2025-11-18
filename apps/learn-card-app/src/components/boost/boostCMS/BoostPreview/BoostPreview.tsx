import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

import { IonPage } from '@ionic/react';
import { VCDisplayCard2 } from '@learncard/react';
import BoostMediaPreview from './BoostMediaPreview';
import BoostDetailsSideBar from './BoostDetailsSideBar';
import BoostDetailsSideMenu from './BoostDetailsSideMenu';
import BoostFooter from 'learn-card-base/components/boost/boostFooter/BoostFooter';

import { VC, VerificationItem } from '@learncard/types';
import {
    useModal,
    useWallet,
    ModalTypes,
    useDeviceTypeByWidth,
    useGetCredentialWithEdits,
    DisplayTypeEnum,
} from 'learn-card-base';
import { useKnownDIDRegistry } from 'learn-card-base/hooks/useRegistry';

import { BoostCategoryOptionsEnum } from '../../boost-options/boostOptions';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';

export type IssueHistory = {
    id?: string | number;
    name?: string;
    thumb?: string;
    date?: string;
};

export type BoostPreviewProps = {
    credential: VC;
    verificationItems: VerificationItem[];
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
};

export const useVerification = (credential: VC) => {
    const [vcVerifications, setVCVerifications] = useState<VerificationItem[]>([]);
    const { initWallet } = useWallet();
    useEffect(() => {
        const verify = async () => {
            const wallet = await initWallet();
            const verifications = await wallet?.invoke?.verifyCredential(credential, {}, true);
            setVCVerifications(verifications);
        };
        verify();
    }, []);
    return vcVerifications;
};

const RibbonCategory: React.FC<{ categoryType: BoostCategoryOptionsEnum }> = ({ categoryType }) => {
    switch (categoryType) {
        case BoostCategoryOptionsEnum.socialBadge:
            return <span className="text-[12px] font-semibold text-blue-500">Boost</span>;
        case BoostCategoryOptionsEnum.achievement:
            return <span className="text-[12px] font-semibold text-pink-400">Achievement</span>;
        case BoostCategoryOptionsEnum.learningHistory:
            return <span className="text-[12px] font-semibold text-emerald-600">Study</span>;
        case BoostCategoryOptionsEnum.workHistory:
            return <span className="text-[12px] font-semibold text-cyan-500">Experience</span>;
        case BoostCategoryOptionsEnum.accommodation:
            return <span className="text-[12px] font-semibold text-violet-500">Assistance</span>;
        case BoostCategoryOptionsEnum.accomplishment:
            return <span className="text-[12px] font-semibold text-yellow-500">Portfolio</span>;
        default:
            return;
    }
};

const BoostPreview: React.FC<BoostPreviewProps> = ({
    credential: _credential,
    verificationItems,
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
    displayType,
}) => {
    const unwrappedCredential = unwrapBoostCredential(_credential);
    const { credentialWithEdits } = useGetCredentialWithEdits(unwrappedCredential);
    const credential = credentialWithEdits ?? unwrappedCredential;
    const { newModal, closeModal } = useModal();

    const profileID =
        typeof credential?.issuer === 'string' ? credential.issuer : credential?.issuer?.id;
    const { data: knownDIDRegistry } = useKnownDIDRegistry(profileID);

    const vcVerifications = useVerification(credential);
    const [isFront, setIsFront] = useState(true);

    const verifications =
        showVerifications && verificationItems && verificationItems.length > 0
            ? verificationItems
            : showVerifications
            ? vcVerifications
            : [];
    const isCertificate = credential?.display?.displayType === 'certificate';
    const isID = credential?.display?.displayType === 'id' || categoryType === 'ID';

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
                credential={
                    credential?.type.includes('ClrCredential')
                        ? credential?.credentialSubject?.verifiableCredential[0]
                        : credential
                }
                categoryType={categoryType}
                verificationItems={verifications}
                customLinkedCredentialsComponent={customLinkedCredentialsComponent}
                displayType={displayType}
            />,
            {
                className: '!bg-transparent',
                hideButton: true,
            },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    if (displayType === DisplayTypeEnum.Media) {
        return (
            <BoostMediaPreview
                credential={credential}
                openDetailsSideModal={openDetailsSideModal}
                handleShareBoost={handleShareBoost}
                onDotsClick={onDotsClick}
                verifications={verifications}
            />
        );
    }

    return (
        <IonPage>
            <div className="flex h-full">
                <section className="flex h-full overflow-y-scroll flex-1 items-start justify-center relative boost-cms-preview [&::part(scroll)]:px-0">
                    <div
                        className={`w-full px-2 flex flex-col items-center justify-center overflow-x-auto ${boostPreviewWrapperCustomClass} ${
                            isCertificate ? 'certificate-display-zoom' : ''
                        } ${isID ? '!px-0 safe-area-top-margin mt-[20px]' : ''}`}
                    >
                        <section
                            className={`px-6 w-full safe-area-top-margin overflow-y-auto max-h-full pb-32 disable-scrollbars ${
                                Capacitor.isNativePlatform() ? 'pt-0' : 'pt-[30px]'
                            }`}
                        >
                            <VCDisplayCard2
                                credential={credential}
                                issueeOverride={issueeOverride}
                                issuerOverride={issuerOverride}
                                issueHistory={issueHistory}
                                categoryType={categoryType}
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
                                knownDIDRegistry={knownDIDRegistry}
                                handleXClick={isCertificate ? closeModal : undefined}
                                hideIssueDate={hideIssueDate}
                                customRibbonCategoryComponent={
                                    <RibbonCategory categoryType={categoryType} />
                                }
                                hideNavButtons
                                // isFrontOverride={isFront}
                                setIsFrontOverride={setIsFront}
                                qrCodeOnClick={qrCodeOnClick}
                                hideQRCode={hideQRCode}
                                formattedDisplayType={formattedDisplayType}
                                customLinkedCredentialsComponent={customLinkedCredentialsComponent}
                            />
                        </section>
                    </div>
                </section>
                <footer className="w-full flex justify-center items-center ion-no-border absolute bottom-0 z-10">
                    <BoostFooter
                        handleClose={handleCloseModal}
                        handleDetails={isMobile ? () => openDetailsSideModal() : undefined}
                        handleShare={handleShareBoost}
                        handleDotMenu={onDotsClick}
                        useFullCloseButton={!isMobile || !handleShareBoost}
                    />
                </footer>
                {!isMobile && (
                    <BoostDetailsSideBar
                        credential={
                            credential?.type.includes('ClrCredential')
                                ? credential?.credentialSubject?.verifiableCredential[0]
                                : credential
                        }
                        categoryType={categoryType}
                        verificationItems={verifications}
                        customLinkedCredentialsComponent={customLinkedCredentialsComponent}
                        displayType={displayType}
                    />
                )}
            </div>
        </IonPage>
    );
};

export default BoostPreview;
