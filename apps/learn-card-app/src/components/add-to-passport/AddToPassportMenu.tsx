import React, { Suspense, lazy, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { getLogger, useModal, ModalTypes, QRCodeScannerStore } from 'learn-card-base';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

import ScanIcon from 'learn-card-base/svgs/ScanIcon';
import LinkOutlinedIcon from 'learn-card-base/svgs/LinkOutlinedIcon';
import UploadIcon from 'learn-card-base/svgs/UploadIcon';
import AddCredentialIcon from 'learn-card-base/svgs/AddCredentialIcon';

import CheckListUploadRawVC from '../learncard/checklist/checklist-steps/CheckListUploadRawVC';
import useBuildMyLearnCardModal from '../../pages/dashboard/hooks/useBuildMyLearnCardModal';

import * as m from '../../paraglide/messages.js';

const log = getLogger('add-to-passport');

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="text-xs font-semibold uppercase tracking-wide text-grayscale-500 px-2 mt-4 mb-1">
        {children}
    </p>
);

const MenuItem: React.FC<{
    Icon: React.FC<{ className?: string }>;
    label: string;
    onClick: () => void;
}> = ({ Icon, label, onClick }) => (
    <button className="w-full flex items-center justify-start p-2 rounded-[15px]" onClick={onClick}>
        <Icon className="w-[35px] h-[35px] text-grayscale-800 mr-2" />
        <h2 className="text-[18px] font-normal text-grayscale-800 ml-2 font-notoSans">{label}</h2>
    </button>
);

const importPasteOrUploadClaimModal = () =>
    import('../paste-or-upload-claim/PasteOrUploadClaimModal');

const LazyPasteOrUploadClaimModal = lazy(importPasteOrUploadClaimModal);

const PasteOrUploadClaimModalFallback: React.FC = () => (
    <IonPage>
        <IonContent>
            <div className="font-poppins flex items-center justify-center min-h-[360px] p-8">
                <IonSpinner name="crescent" className="text-grayscale-700" />
            </div>
        </IonContent>
    </IonPage>
);

export const AddToPassportMenu: React.FC<{ className?: string }> = ({ className }) => {
    const { newModal, closeModal } = useModal();
    const brandingConfig = useBrandingConfig();
    const { openBuildMyLearnCard } = useBuildMyLearnCardModal();

    useEffect(() => {
        void importPasteOrUploadClaimModal().catch(err => {
            log.error('[ClaimLink] Failed to preload PasteOrUploadClaimModal chunk:', err);
        });
    }, []);

    const handleScanQRCode = () => {
        closeModal();
        QRCodeScannerStore.set.showScanner(true);
    };

    const handleUseClaimLink = () => {
        closeModal();
        newModal(
            <Suspense fallback={<PasteOrUploadClaimModalFallback />}>
                <LazyPasteOrUploadClaimModal />
            </Suspense>,
            { hideButton: true, sectionClassName: '!max-w-[500px]' },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    const handleUploadCredential = () => {
        closeModal();
        newModal(
            <CheckListUploadRawVC />,
            { className: '!bg-transparent' },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    const handleBuild = () => {
        closeModal();
        void openBuildMyLearnCard();
    };

    return (
        <div className={`w-full flex flex-col justify-center p-4 ${className || ''}`}>
            <div className="mb-2 px-2">
                <h1 className="text-xl font-semibold text-grayscale-900 font-poppins mb-1">
                    {m['passport.wallet.addToPassport']()}
                </h1>
                <p className="text-sm text-grayscale-600">{m['addToPassport.subtitle']()}</p>
            </div>
            <div className="w-full flex flex-col justify-center">
                <SectionLabel>{m['addToPassport.receive']()}</SectionLabel>
                {Capacitor.isNativePlatform() && (
                    <MenuItem
                        Icon={ScanIcon}
                        label={m['passport.wallet.scanQrCode']()}
                        onClick={handleScanQRCode}
                    />
                )}
                <MenuItem
                    Icon={LinkOutlinedIcon}
                    label={m['launchpad.actions.useClaimLink']()}
                    onClick={handleUseClaimLink}
                />

                <SectionLabel>{m['addToPassport.addYourOwn']()}</SectionLabel>
                <MenuItem
                    Icon={UploadIcon}
                    label={m['addToPassport.uploadCredential']()}
                    onClick={handleUploadCredential}
                />
                <MenuItem
                    Icon={AddCredentialIcon}
                    label={m['addToPassport.buildMyBrand']({ brand: brandingConfig.name })}
                    onClick={handleBuild}
                />
            </div>
        </div>
    );
};

export default AddToPassportMenu;
