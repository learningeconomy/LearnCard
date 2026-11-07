import React, { useState } from 'react';
import { useImmer } from 'use-immer';
import { Eye, X, Loader2 } from 'lucide-react';

import * as m from '../../../paraglide/messages.js';

import { ModalTypes, useModal, useToast, useWallet, useImageUpload } from 'learn-card-base';
import type { UploadRes } from 'learn-card-base';
import type { ConsentFlowContractDetails } from '@learncard/types';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';

import FullScreenConsentFlow from '../../consentFlow/FullScreenConsentFlow';
import FullScreenGameFlow from '../../consentFlow/GameFlow/FullScreenGameFlow';
import ConsentContractForm from './ConsentContractForm';
import type { ConsentContractFormValue } from './consentContractForm.types';

type CreateConsentContractModalProps = {
    onSuccess?: (contractUri?: string) => void;
};

const CreateConsentContractModal: React.FC<CreateConsentContractModalProps> = ({ onSuccess }) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const emptyContract = {
        contract: {
            read: { anonymize: true, credentials: { categories: {} }, personal: {} },
            write: { credentials: { categories: {} }, personal: {} },
        },
        name: '',
        subtitle: '',
        description: '',
        image: '',
        reasonForAccessing: '',
        needsGuardianConsent: false,
        redirectUrl: '',
    };

    const [contract, setContract] = useImmer<ConsentContractFormValue>(emptyContract);

    const { handleFileSelect: handleImageSelect, isLoading: imageUploading } = useImageUpload({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data: UploadRes) => {
            setContract(draft => {
                draft.image = data?.url;
            });
        },
    });

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        if (!contract.name) {
            setLoading(false);
            setError('Please enter a contract name');
            return;
        }

        try {
            const wallet = await initWallet();
            const contractUri = await wallet.invoke.createContract({
                ...contract,
            });

            onSuccess?.(contractUri);
            presentToast(`Contract "${contract.name}" created successfully!`);
            closeModal();
        } catch {
            setError(m['consentUpdate.editor.createError']());
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = () => {
        if (contract.needsGuardianConsent) {
            newModal(
                <FullScreenGameFlow
                    contractDetails={contract as ConsentFlowContractDetails}
                    isPreview
                />,
                {},
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
        } else {
            newModal(
                <FullScreenConsentFlow
                    contractDetails={contract as ConsentFlowContractDetails}
                    isPreview
                />,
                {},
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-900">
                    {m[
                        'developerPortal.components.createConsentContractModal.createConsentContract'
                    ]()}
                </h2>

                <button
                    onClick={closeModal}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <ConsentContractForm
                value={contract}
                onChange={setContract}
                disabled={loading}
                imageUploading={imageUploading}
                onSelectImage={handleImageSelect}
            />
            {error && (
                <p role="alert" className="mt-4 text-sm text-red-700">
                    {error}
                </p>
            )}

            {/* Footer Buttons */}
            <div className="mt-6 space-y-v3-3">
                {/* Preview Button */}
                <button
                    type="button"
                    onClick={handlePreview}
                    disabled={loading || imageUploading || !contract.name}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-grayscale-100 text-grayscale-700 rounded-[20px] text-sm font-medium hover:bg-grayscale-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Eye className="w-4 h-4" />
                    {m['developerPortal.components.createConsentContractModal.previewContract']()}
                </button>

                {/* Create Button */}
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || imageUploading || !contract.name}
                    className="w-full px-4 py-3 bg-grayscale-900 text-white rounded-[20px] text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {m['developerPortal.components.createConsentContractModal.creating']()}
                        </>
                    ) : (
                        m['developerPortal.components.createConsentContractModal.createContract']()
                    )}
                </button>

                {/* Cancel Button */}
                <button
                    type="button"
                    onClick={closeModal}
                    className="w-full px-4 py-3 bg-white text-grayscale-700 rounded-[20px] text-sm font-medium hover:bg-grayscale-10 transition-colors border border-grayscale-300"
                >
                    {m['common.cancel']()}
                </button>
            </div>
        </div>
    );
};

export default CreateConsentContractModal;
