import React, { useState } from 'react';
import { useImmer } from 'use-immer';
import { curriedStateSlice } from '@learncard/helpers';
import { Eye, Upload, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

import {
    ModalTypes,
    UploadRes,
    useModal,
    useToast,
    useWallet,
    useFilestack,
    ToastTypeEnum,
} from 'learn-card-base';
import { ConsentFlowContract } from '@learncard/types';
import { IMAGE_MIME_TYPES } from 'learn-card-base/filestack/constants/filestack';

import FullScreenConsentFlow from '../../consentFlow/FullScreenConsentFlow';
import FullScreenGameFlow from '../../consentFlow/GameFlow/FullScreenGameFlow';
import ContractCategoryMultiSelect from '../../hidden/ContractCategoryMultiSelect';

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
    const [showAdvanced, setShowAdvanced] = useState(false);

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

    const [contract, setContract] = useImmer<{
        contract: ConsentFlowContract;
        name: string;
        subtitle?: string;
        description?: string;
        image?: string;
        reasonForAccessing?: string;
        needsGuardianConsent?: boolean;
        redirectUrl?: string;
    }>(emptyContract);

    const updateSlice = curriedStateSlice(setContract);
    const updateContract = curriedStateSlice(updateSlice('contract'));
    const updateRead = curriedStateSlice(updateContract('read'));
    const updateReadCredentials = curriedStateSlice(updateRead('credentials'));
    const updateWrite = curriedStateSlice(updateContract('write'));
    const updateWriteCredentials = curriedStateSlice(updateWrite('credentials'));

    const { handleFileSelect: handleImageSelect, isLoading: imageUploading } = useFilestack({
        fileType: IMAGE_MIME_TYPES,
        onUpload: (_url, _file, data: UploadRes) => {
            updateSlice('image', data?.url);
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
        } catch (e: any) {
            presentToast(`Failed to create contract: ${e.message}`, {
                type: ToastTypeEnum.Error,
            });
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = () => {
        if (contract.needsGuardianConsent) {
            newModal(
                <FullScreenGameFlow contractDetails={contract as any} isPreview />,
                {},
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
        } else {
            newModal(
                <FullScreenConsentFlow contractDetails={contract as any} isPreview />,
                {},
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
        }
    };

    const hasReadCategories = Object.keys(contract.contract.read.credentials.categories).length > 0;
    const hasWriteCategories = Object.keys(contract.contract.write.credentials.categories).length > 0;

    return (
        <div className="w-full max-w-lg mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 mt-6">
                <h2 className="text-xl font-semibold text-gray-900">Create Consent Contract</h2>

                <button
                    onClick={closeModal}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-6">
                {/* Image Upload */}
                <div className="flex items-start gap-4">
                    <div className="relative">
                        <div
                            onClick={() => handleImageSelect()}
                            className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors overflow-hidden border-2 border-dashed border-gray-300"
                        >
                            {imageUploading ? (
                                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                            ) : contract.image ? (
                                <img
                                    src={contract.image}
                                    alt="Contract"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Upload className="w-6 h-6 text-gray-400" />
                            )}
                        </div>

                        {contract.image && (
                            <button
                                onClick={() => updateSlice('image', '')}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 space-y-3">
                        {/* Name */}
                        <input
                            type="text"
                            value={contract.name}
                            onChange={e => updateSlice('name', e.target.value)}
                            placeholder="Contract Name *"
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        />

                        {/* Subtitle */}
                        <input
                            type="text"
                            value={contract.subtitle || ''}
                            onChange={e => updateSlice('subtitle', e.target.value)}
                            placeholder="Subtitle (optional)"
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        />
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                        Description
                    </label>

                    <textarea
                        value={contract.description || ''}
                        onChange={e => updateSlice('description', e.target.value)}
                        placeholder="Describe what your app does and why it needs access..."
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 min-h-[80px] resize-none"
                    />
                </div>

                {/* Reason for Accessing */}
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                        Reason for Accessing
                    </label>

                    <input
                        type="text"
                        value={contract.reasonForAccessing || ''}
                        onChange={e => updateSlice('reasonForAccessing', e.target.value)}
                        placeholder="e.g., To verify your credentials"
                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                </div>

                {/* Read Terms */}
                <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center text-xs font-bold">
                            R
                        </span>
                        Read Access
                    </h3>

                    <p className="text-xs text-gray-500 mb-3">
                        What credential categories do you want to request access to read from users?
                    </p>

                    <ContractCategoryMultiSelect
                        values={contract.contract.read.credentials.categories}
                        onChange={updateReadCredentials('categories') as any}
                        setContract={setContract as any}
                        mode="read"
                    />
                </div>

                {/* Write Terms */}
                <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                            W
                        </span>
                        Write Access
                    </h3>

                    <p className="text-xs text-gray-500 mb-3">
                        What credential categories do you want permission to send to users?
                    </p>

                    <ContractCategoryMultiSelect
                        values={contract.contract.write.credentials.categories}
                        onChange={updateWriteCredentials('categories') as any}
                        setContract={setContract as any}
                        mode="write"
                    />
                </div>

                {/* Advanced Options */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                    >
                        <span className="text-sm font-medium text-gray-600">Advanced Options</span>

                        {showAdvanced ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                    </button>

                    {showAdvanced && (
                        <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
                            {/* Redirect URL */}
                            <div className="pt-4">
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Redirect URL
                                </label>

                                <input
                                    type="url"
                                    value={contract.redirectUrl || ''}
                                    onChange={e => updateSlice('redirectUrl', e.target.value)}
                                    placeholder="https://yourapp.com/callback"
                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                />

                                <p className="text-xs text-gray-400 mt-1">
                                    Where users will be redirected after consenting
                                </p>
                            </div>

                            {/* Guardian Consent Toggle */}
                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600">
                                        Guardian Consent Flow
                                    </label>

                                    <p className="text-xs text-gray-400">
                                        Require guardian approval for minors
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        updateSlice(
                                            'needsGuardianConsent',
                                            !contract.needsGuardianConsent
                                        )
                                    }
                                    className={`relative w-12 h-7 rounded-full transition-colors ${
                                        contract.needsGuardianConsent
                                            ? 'bg-cyan-500'
                                            : 'bg-gray-200'
                                    }`}
                                >
                                    <span
                                        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                            contract.needsGuardianConsent
                                                ? 'translate-x-5'
                                                : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}
            </div>

            {/* Footer Buttons */}
            <div className="mt-6 space-y-3">
                {/* Preview Button */}
                <button
                    type="button"
                    onClick={handlePreview}
                    disabled={!contract.name}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Eye className="w-4 h-4" />
                    Preview Contract
                </button>

                {/* Create Button */}
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !contract.name}
                    className="w-full px-4 py-3 bg-cyan-500 text-white rounded-xl text-sm font-semibold hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        'Create Contract'
                    )}
                </button>

                {/* Cancel Button */}
                <button
                    type="button"
                    onClick={closeModal}
                    className="w-full px-4 py-3 bg-white text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-200"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default CreateConsentContractModal;
