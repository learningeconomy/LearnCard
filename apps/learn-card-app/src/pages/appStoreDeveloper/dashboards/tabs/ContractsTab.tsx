import React, { useState } from 'react';
import { FileText, Copy, Check, Plus } from 'lucide-react';
import { Clipboard } from '@capacitor/clipboard';

import { useToast } from 'learn-card-base/hooks/useToast';

interface Contract {
    uri: string;
    id?: string;
    name?: string;
}

interface ContractsTabProps {
    contracts: Contract[];
    onRefresh: () => void;
}

export const ContractsTab: React.FC<ContractsTabProps> = ({ contracts, onRefresh }) => {
    const { presentToast } = useToast();
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const copyContractUri = async (uri: string, id: string) => {
        await Clipboard.write({ string: uri });
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        presentToast('Contract URI copied!', { hasDismissButton: true });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Consent Contracts</h2>
                    <p className="text-sm text-gray-500">Manage your data sharing agreements</p>
                </div>

                <a
                    href="/app-store/developer/guides/consent-flow"
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Create Contract
                </a>
            </div>

            {contracts.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No consent contracts</p>
                    <p className="text-sm text-gray-400 mt-1">Create a contract to define what data you're requesting</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {contracts.map((contract) => (
                        <div key={contract.uri || contract.id} className="p-4 border border-gray-200 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-emerald-600" />
                                    </div>

                                    <div>
                                        <h3 className="font-medium text-gray-800">{contract.name || 'Consent Contract'}</h3>
                                        <p className="text-xs text-gray-500 font-mono truncate max-w-xs">
                                            {contract.uri}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => copyContractUri(contract.uri, contract.uri)}
                                    className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                >
                                    {copiedId === contract.uri ? (
                                        <Check className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
