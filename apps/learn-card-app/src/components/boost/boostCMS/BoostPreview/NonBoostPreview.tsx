import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

import { IonPage } from '@ionic/react';
import BoostDetailsSideBar from './BoostDetailsSideBar';
import BoostDetailsSideMenu from './BoostDetailsSideMenu';
import EndorsementBadge from '../../../boost-endorsements/EndorsementBadge';
import VCDisplayCardWrapper2 from 'learn-card-base/components/vcmodal/VCDisplayCardWrapper2';
import BoostFooter from 'learn-card-base/components/boost/boostFooter/BoostFooter';

import { VC, VerificationItem } from '@learncard/types';
import { useWallet, useModal, ModalTypes, useDeviceTypeByWidth } from 'learn-card-base';
import { BoostCategoryOptionsEnum } from '../../boost-options/boostOptions';

type IssueHistory = {
    id?: string | number;
    name?: string;
    thumb?: string;
    date?: string;
};

type NonBoostPreviewProps = {
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
    onDotsClick?: () => void;
    qrCodeOnClick?: () => void;
    handleShareBoost?: () => void;
    customLinkedCredentialsComponent?: React.ReactNode;
    showEndorsementBadge?: boolean;
    existingEndorsements?: VC[];
};

const NonBoostPreview: React.FC<NonBoostPreviewProps> = ({
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
}) => {
    const { initWallet } = useWallet();
    const [vcVerifications, setVCVerifications] = useState<VerificationItem[]>([]);
    const [isFront, setIsFront] = useState(true);
    const { newModal, closeModal } = useModal();

    const { isMobile } = useDeviceTypeByWidth();

    useEffect(() => {
        const verify = async () => {
            const wallet = await initWallet();
            const verifications = await wallet?.invoke?.verifyCredential(credential, {}, true);
            setVCVerifications(verifications);
        };

        verify();
    }, [credential]);

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
                credential={
                    credential?.type.includes('ClrCredential')
                        ? credential?.credentialSubject?.verifiableCredential[0]
                        : credential
                }
                categoryType={categoryType}
                verificationItems={verifications}
                customLinkedCredentialsComponent={customLinkedCredentialsComponent}
                existingEndorsements={existingEndorsements}
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

    const verifications =
        showVerifications && verificationItems && verificationItems.length > 0
            ? verificationItems
            : showVerifications
            ? vcVerifications
            : [];

    const isCertificate = credential?.display?.displayType === 'certificate';
    const isID = credential?.display?.displayType === 'id' || categoryType === 'ID';

    const bgImage = credential?.display?.backgroundImager;
    const showBackground = bgImage && isCertificate;

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
                            <VCDisplayCardWrapper2
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
                                handleClose={isCertificate ? handleCloseModal : undefined}
                                onDotsClick={onDotsClick}
                                hideNavButtons
                                // isFrontOverride={isFront}
                                setIsFrontOverride={setIsFront}
                                customLinkedCredentialsComponent={customLinkedCredentialsComponent}
                                customBodyContentSlot={endorsementBadge}
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
                        useFullCloseButton={!isMobile}
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
                        existingEndorsements={existingEndorsements}
                    />
                )}
            </div>
        </IonPage>
    );
};

export default NonBoostPreview;
