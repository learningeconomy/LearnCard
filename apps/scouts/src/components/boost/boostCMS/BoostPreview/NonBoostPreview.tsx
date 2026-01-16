import React, { useEffect, useState, useMemo } from 'react';

import BoostFooter from 'learn-card-base/components/boost/boostFooter/BoostFooter';
import VCDisplayCardWrapper2 from 'learn-card-base/components/vcmodal/VCDisplayCardWrapper2';
import { IonContent, IonFooter, IonPage, IonRow, IonToolbar } from '@ionic/react';

import { VC, VerificationItem } from '@learncard/types';
import { useWallet, BoostCategoryOptionsEnum } from 'learn-card-base';
import { useHighlightedCredentials } from '../../../../hooks/useHighlightedCredentials';
import { getRoleFromCred, getScoutsNounForRole } from '../../../../helpers/troop.helpers';
import X from 'learn-card-base/svgs/X';
import FatArrow from 'learn-card-base/svgs/FatArrow';

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
    hideQRCode?: boolean;
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
    hideQRCode,
}) => {
    const { initWallet } = useWallet();
    const boostIssuer = (credential as any)?.boostCredential?.issuer;
    const boostIssuerDid =
        typeof boostIssuer === 'string' ? boostIssuer : boostIssuer?.id;
    // Extract user ID from DID (e.g., "jpgclub" from "did:web:localhost%3A4000:users:jpgclub")
    const profileID = boostIssuerDid?.split(':').pop();

    const [vcVerifications, setVCVerifications] = useState<VerificationItem[]>([]);
    const [isFront, setIsFront] = useState(true);
    const { credentials: highlightedCreds } = useHighlightedCredentials(profileID);

    const unknownVerifierTitle = useMemo(() => {
        if (!highlightedCreds || highlightedCreds.length === 0) return undefined;

        const role = getRoleFromCred(highlightedCreds[0]);
        return getScoutsNounForRole(role); // Just the role, no "Verified" prefix
    }, [highlightedCreds]);

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
    const isID = credential?.display?.displayType === 'id' || categoryType === 'ID';

    const bgImage = credential?.display?.backgroundImager;
    const showBackground = bgImage && isCertificate;

    return (
        <IonPage>
            <IonContent
                fullscreen
                className={`flex items-center justify-center ion-padding boost-cms-preview transition-colors [&::part(scroll)]:px-0 gradient-mask-b-90`}
            >
                <IonRow
                    className={`flex flex-col items-center justify-center px-1 overflow-x-auto pb-32 ${boostPreviewWrapperCustomClass} ${
                        isCertificate ? 'pt-14 md:pt-20' : ''
                    } ${isID ? '!px-0 safe-area-top-margin mt-[20px]' : ''}`}
                >
                    <section className="px-6 w-full">
                        <div className="flex items-center justify-center mb-2 vc-preview-modal-safe-area" />
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
                            isFrontOverride={isFront}
                            setIsFrontOverride={setIsFront}
                            qrCodeOnClick={qrCodeOnClick}
                            hideQRCode={hideQRCode}
                            unknownVerifierTitle={unknownVerifierTitle}
                        />
                    </section>
                </IonRow>
            </IonContent>
            <IonFooter
                mode="ios"
                className="w-full flex justify-center items-center p-[15px] ion-no-border absolute bottom-0"
            >
                <IonToolbar color="transparent" mode="ios">
                    <IonRow className="relative z-10 w-full flex justify-center items-center gap-8">
                        <button
                            className="bg-grayscale-900 text-[24px] tracking-[.75px] text-white py-[15px] px-[20px] rounded-[20px] flex justify-center items-center gap-[5px] border-[3px] border-solid border-white"
                            onClick={() => setIsFront(!isFront)}
                        >
                            {isFront ? (
                                <>
                                    Details <FatArrow direction="right" />
                                </>
                            ) : (
                                <>
                                    <FatArrow direction="left" /> Back
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleCloseModal}
                            className="w-[50px] h-[50px] bg-white rounded-full flex items-center justify-center shadow-3xl"
                        >
                            <X className="text-black w-[30px]" />
                        </button>
                    </IonRow>
                </IonToolbar>
            </IonFooter>
        </IonPage>
    );
};

export default NonBoostPreview;
