import React from 'react';
import { Loader2, ShieldAlert, BookOpen, PenTool, Eye } from 'lucide-react';

import { useModal, ModalTypes, useWallet, contractCategoryNameToCategoryMetadata } from 'learn-card-base';
import { useQuery } from '@tanstack/react-query';

import FullScreenConsentFlow from '../../consentFlow/FullScreenConsentFlow';
import FullScreenGameFlow from '../../consentFlow/GameFlow/FullScreenGameFlow';
import type { ConsentFlowContractDetails } from '@learncard/types';

interface ConsentContractPreviewProps {
    contractUri: string;
}

export const ConsentContractPreview: React.FC<ConsentContractPreviewProps> = ({ contractUri }) => {
    const { newModal } = useModal();
    const { initWallet } = useWallet();

    const { data: selectedContract, isLoading: isLoadingContract } = useQuery<ConsentFlowContractDetails | null>({
        queryKey: ['getContract', contractUri],
        queryFn: async () => {
            if (!contractUri) return null;

            try {
                const wallet = await initWallet();
                return await wallet.invoke.getContract(contractUri);
            } catch (error) {
                console.error('Failed to fetch contract:', error);
                return null;
            }
        },
        enabled: !!contractUri,
    });

    const readCategories = selectedContract?.contract?.read?.credentials?.categories || {};
    const writeCategories = selectedContract?.contract?.write?.credentials?.categories || {};
    const hasReadCategories = Object.keys(readCategories).length > 0;
    const hasWriteCategories = Object.keys(writeCategories).length > 0;

    const handlePreviewContract = () => {
        if (!selectedContract) return;

        if (selectedContract.needsGuardianConsent) {
            newModal(
                <FullScreenGameFlow contractDetails={selectedContract} isPreview />,
                {},
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
        } else {
            newModal(
                <FullScreenConsentFlow contractDetails={selectedContract} isPreview />,
                {},
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-600">Consent Flow Contract</h3>

                {selectedContract && (
                    <button
                        onClick={handlePreviewContract}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-100 text-cyan-700 rounded-lg text-xs font-medium hover:bg-cyan-200 transition-colors"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        Preview Contract
                    </button>
                )}
            </div>

            {isLoadingContract ? (
                <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-500">Loading contract...</span>
                </div>
            ) : selectedContract ? (
                <div className="space-y-3">
                    {/* Contract Header */}
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                        {selectedContract.image ? (
                            <img
                                src={selectedContract.image}
                                alt={selectedContract.name}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                                <ShieldAlert className="w-5 h-5 text-cyan-600" />
                            </div>
                        )}

                        <div>
                            <p className="text-sm font-medium text-gray-700">{selectedContract.name}</p>
                            {selectedContract.subtitle && (
                                <p className="text-xs text-gray-400">{selectedContract.subtitle}</p>
                            )}
                        </div>
                    </div>

                    {/* Read Access */}
                    <div className="bg-cyan-50 border border-cyan-100 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="w-4 h-4 text-cyan-600" />
                            <span className="text-xs font-medium text-cyan-700">Read Access</span>
                        </div>

                        {hasReadCategories ? (
                            <div className="flex flex-wrap gap-1.5">
                                {Object.keys(readCategories).map(category => {
                                    const metadata = contractCategoryNameToCategoryMetadata(category);

                                    return (
                                        <span
                                            key={category}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-white text-cyan-700 rounded-full text-xs font-medium border border-cyan-200"
                                        >
                                            {metadata?.IconWithShape && (
                                                <metadata.IconWithShape className="w-3.5 h-3.5" />
                                            )}
                                            {metadata?.title || category}
                                        </span>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-cyan-600 italic">No read permissions requested</p>
                        )}
                    </div>

                    {/* Write Access */}
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <PenTool className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-medium text-emerald-700">Write Access</span>
                        </div>

                        {hasWriteCategories ? (
                            <div className="flex flex-wrap gap-1.5">
                                {Object.keys(writeCategories).map(category => {
                                    const metadata = contractCategoryNameToCategoryMetadata(category);

                                    return (
                                        <span
                                            key={category}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-white text-emerald-700 rounded-full text-xs font-medium border border-emerald-200"
                                        >
                                            {metadata?.IconWithShape && (
                                                <metadata.IconWithShape className="w-3.5 h-3.5" />
                                            )}
                                            {metadata?.title || category}
                                        </span>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-emerald-600 italic">No write permissions requested</p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="p-3 bg-gray-100 rounded-lg">
                    <p className="text-xs text-gray-500 font-mono break-all">{contractUri}</p>
                    <p className="text-xs text-gray-400 mt-1 italic">Contract details not available</p>
                </div>
            )}
        </div>
    );
};
