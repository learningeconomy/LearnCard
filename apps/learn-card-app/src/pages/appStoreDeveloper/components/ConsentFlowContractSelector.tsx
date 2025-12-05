import React, { useState, useCallback, useEffect } from 'react';
import { FileText, Plus, ChevronDown, Check, Eye } from 'lucide-react';
import { IonSpinner } from '@ionic/react';

import { useModal, useGetContracts, ModalTypes } from 'learn-card-base';
import type { ConsentFlowContractDetails } from '@learncard/types';

import CreateConsentContractModal from './CreateConsentContractModal';
import FullScreenConsentFlow from '../../consentFlow/FullScreenConsentFlow';
import FullScreenGameFlow from '../../consentFlow/GameFlow/FullScreenGameFlow';

interface ConsentFlowContractSelectorProps {
    value: string;
    onChange: (uri: string) => void;
    onContractChange?: (contract: ConsentFlowContractDetails | null) => void;
    error?: string;
}

export const ConsentFlowContractSelector: React.FC<ConsentFlowContractSelectorProps> = ({
    value,
    onChange,
    onContractChange,
    error,
}) => {
    const { newModal } = useModal({ desktop: ModalTypes.Center, mobile: ModalTypes.Center });
    const { data: contractsData, isLoading: isLoadingContracts, refetch } = useGetContracts();

    // useGetContracts returns PaginatedConsentFlowContracts which has { records, hasMore, cursor }
    // Handle both array and paginated object cases
    const contracts: ConsentFlowContractDetails[] = Array.isArray(contractsData)
        ? contractsData
        : (contractsData as { records?: ConsentFlowContractDetails[] })?.records ?? [];

    const [isOpen, setIsOpen] = useState(false);

    const selectedContract = contracts.find(c => c.uri === value);

    // Notify parent when selected contract changes
    useEffect(() => {
        onContractChange?.(selectedContract ?? null);
    }, [selectedContract, onContractChange]);

    const handlePreview = useCallback(() => {
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
    }, [selectedContract, newModal]);

    const handleSelect = (contract: ConsentFlowContractDetails) => {
        onChange(contract.uri);
        setIsOpen(false);
    };

    const openCreateContractModal = useCallback(() => {
        setIsOpen(false);

        newModal(
            <CreateConsentContractModal
                onSuccess={(contractUri?: string) => {
                    if (contractUri) {
                        onChange(contractUri);
                    }
                    refetch();
                }}
            />
        );
    }, [newModal, onChange, refetch]);

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-gray-600 mb-1">Contract URI</label>

            <div className="flex gap-2">
                {/* Custom dropdown trigger */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex-1 flex items-center justify-between px-4 py-3 bg-white border rounded-xl text-left transition-colors ${
                        error ? 'border-red-300' : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {isLoadingContracts ? (
                        <>
                            <IonSpinner name="crescent" className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-400">Loading contracts...</span>
                        </>
                    ) : selectedContract ? (
                        <>
                            {selectedContract.image ? (
                                <img
                                    src={selectedContract.image}
                                    alt={selectedContract.name}
                                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-4 h-4 text-cyan-600" />
                                </div>
                            )}

                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">
                                    {selectedContract.name}
                                </p>

                                {selectedContract.subtitle && (
                                    <p className="text-xs text-gray-400 truncate">
                                        {selectedContract.subtitle}
                                    </p>
                                )}
                            </div>
                        </>
                    ) : value ? (
                        <>
                            <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-500 truncate">{value}</span>
                        </>
                    ) : (
                        <>
                            <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-400">
                                Select or create a contract...
                            </span>
                        </>
                    )}
                </div>

                <ChevronDown
                        className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                        }`}
                    />
                </button>

                {/* Preview button */}
                <button
                    type="button"
                    onClick={handlePreview}
                    disabled={!selectedContract}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Preview contract"
                >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Preview</span>
                </button>
            </div>

            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

            {/* Dropdown menu */}
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-auto">
                    {/* Create new option */}
                    <button
                        type="button"
                        onClick={openCreateContractModal}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100"
                    >
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <Plus className="w-4 h-4 text-emerald-600" />
                        </div>

                        <div>
                            <p className="text-sm font-medium text-emerald-700">
                                Create New Contract
                            </p>

                            <p className="text-xs text-gray-400">
                                Set up a new consent flow contract
                            </p>
                        </div>
                    </button>

                    {/* Manual entry option */}
                    <div className="px-4 py-3 border-b border-gray-100">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                            Or enter URI manually
                        </label>

                        <input
                            type="text"
                            value={value}
                            onChange={e => onChange(e.target.value)}
                            placeholder="lc:network:contract:..."
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                            onClick={e => e.stopPropagation()}
                        />
                    </div>

                    {/* Existing contracts */}
                    {contracts.length > 0 && (
                        <div className="py-1">
                            <p className="px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Your Contracts
                            </p>

                            {contracts.map(contract => (
                                <button
                                    key={contract.uri}
                                    type="button"
                                    onClick={() => handleSelect(contract)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                                >
                                    {contract.image ? (
                                        <img
                                            src={contract.image}
                                            alt={contract.name}
                                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-4 h-4 text-cyan-600" />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-700 truncate">
                                            {contract.name}
                                        </p>

                                        {contract.subtitle && (
                                            <p className="text-xs text-gray-400 truncate">
                                                {contract.subtitle}
                                            </p>
                                        )}
                                    </div>

                                    {contract.uri === value && (
                                        <Check className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {contracts.length === 0 && !isLoadingContracts && (
                        <div className="px-4 py-6 text-center">
                            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">No contracts found</p>
                            <p className="text-xs text-gray-400 mt-1">
                                Create one above to get started
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Click outside to close */}
            {isOpen && (
                <div className="fixed inset-0 z-0" onClick={() => setIsOpen(false)} />
            )}
        </div>
    );
};
