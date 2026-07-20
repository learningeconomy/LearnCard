import React, { lazy, Suspense } from 'react';
import { Capacitor } from '@capacitor/core';
import { IonSpinner } from '@ionic/react';

import * as m from '../../../paraglide/messages.js';

import { ModalTypes, QRCodeScannerStore, useModal } from 'learn-card-base';

import SlimCaretRight from '../../svgs/SlimCaretRight';

const LazyPasteOrUploadClaimModal = lazy(
    () => import('../../paste-or-upload-claim/PasteOrUploadClaimModal')
);

type IntakeOptionProps = {
    title: string;
    description: string;
    onClick: () => void;
};

const IntakeOption: React.FC<IntakeOptionProps> = ({ title, description, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="w-full flex items-start gap-3 border-b border-grayscale-200 py-4 text-left transition-opacity hover:opacity-80 last:border-b-0"
    >
        <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-grayscale-900">{title}</span>
            <span className="mt-1 block text-sm text-grayscale-600 leading-relaxed">
                {description}
            </span>
        </span>
        <SlimCaretRight className="w-6 h-6 shrink-0 text-grayscale-400 mt-0.5" />
    </button>
);

export const CredentialIntakeOptions: React.FC = () => {
    const { closeModal, newModal } = useModal();
    const canScanWithCamera = Capacitor.isNativePlatform();

    const openClaimInput = (mode: 'claim-link' | 'qr-code') => {
        closeModal();
        newModal(
            <Suspense
                fallback={
                    <div className="font-poppins flex items-center justify-center min-h-[360px] p-8">
                        <IonSpinner name="crescent" className="text-grayscale-700" />
                    </div>
                }
            >
                <LazyPasteOrUploadClaimModal mode={mode} />
            </Suspense>,
            { hideButton: true, sectionClassName: '!max-w-[500px]' },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    const openCameraScanner = () => {
        closeModal();
        QRCodeScannerStore.set.showScanner(true);
    };

    return (
        <section className="w-full bg-white flex flex-col shadow-2xl p-5 mt-4 rounded-[20px]">
            <h4 className="text-xl font-semibold text-grayscale-900 leading-tight">
                {m['passport.buildMyLearnCard.intake.title']()}
            </h4>
            <p className="mt-1 text-sm text-grayscale-600 leading-relaxed">
                {m['passport.buildMyLearnCard.intake.description']()}
            </p>

            <div className="mt-5 flex flex-col">
                {canScanWithCamera && (
                    <IntakeOption
                        title={m['passport.buildMyLearnCard.intake.scanTitle']()}
                        description={m['passport.buildMyLearnCard.intake.scanDescription']()}
                        onClick={openCameraScanner}
                    />
                )}
                {!canScanWithCamera && (
                    <IntakeOption
                        title={m['passport.buildMyLearnCard.intake.uploadTitle']()}
                        description={m['passport.buildMyLearnCard.intake.uploadDescription']()}
                        onClick={() => openClaimInput('qr-code')}
                    />
                )}
                <IntakeOption
                    title={m['passport.buildMyLearnCard.intake.linkTitle']()}
                    description={m['passport.buildMyLearnCard.intake.linkDescription']()}
                    onClick={() => openClaimInput('claim-link')}
                />
            </div>
        </section>
    );
};

export default CredentialIntakeOptions;
