import React, { useState, useMemo } from 'react';
import { FileText, Copy, Check, Shield, Send, Info } from 'lucide-react';
import { Clipboard } from '@capacitor/clipboard';
import type { LCNIntegration } from '@learncard/types';

import { useToast } from 'learn-card-base/hooks/useToast';
import type { EmbedAppGuideConfig, GuideState } from '../../guides/types';

interface ConfiguredContract {
    uri: string;
    type: 'data-consent' | 'issue-credentials';
    name: string;
    description: string;
    feature: string;
}

interface ContractsTabProps {
    integration: LCNIntegration;
}

export const ContractsTab: React.FC<ContractsTabProps> = ({ integration }) => {
    const { presentToast } = useToast();
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // ============================================================
    // EXTRACT CONTRACTS FROM GUIDE STATE
    // ============================================================
    const configuredContracts = useMemo<ConfiguredContract[]>(() => {
        const contracts: ConfiguredContract[] = [];

        const guideState = integration?.guideState as GuideState | undefined;
        const savedConfig = guideState?.config?.embedAppConfig as EmbedAppGuideConfig | undefined;
        const featureConfig = savedConfig?.featureConfig || {};

        // Check for data consent contract
        const dataConsentConfig = featureConfig['request-data-consent'];
        if (dataConsentConfig?.contractUri) {
            contracts.push({
                uri: dataConsentConfig.contractUri,
                type: 'data-consent',
                name: 'Data Consent Contract',
                description: 'Used to request user consent for data access',
                feature: 'Request Data Consent',
            });
        }

        // Check for issue credentials contract (sync-wallet mode)
        const issueCredentialsConfig = featureConfig['issue-credentials'];
        if (issueCredentialsConfig?.contractUri) {
            contracts.push({
                uri: issueCredentialsConfig.contractUri,
                type: 'issue-credentials',
                name: 'Credential Issuance Contract',
                description: 'Used to sync credentials to user wallets via consent',
                feature: 'Issue Credentials (Sync Mode)',
            });
        }

        return contracts;
    }, [integration?.guideState]);

    const copyContractUri = async (uri: string) => {
        await Clipboard.write({ string: uri });
        setCopiedId(uri);
        setTimeout(() => setCopiedId(null), 2000);
        presentToast('Contract URI copied!', { hasDismissButton: true });
    };

    const getContractIcon = (type: string) => {
        switch (type) {
            case 'data-consent':
                return <Shield className="w-5 h-5 text-emerald-600" />;
            case 'issue-credentials':
                return <Send className="w-5 h-5 text-cyan-600" />;
            default:
                return <FileText className="w-5 h-5 text-gray-600" />;
        }
    };

    const getContractColor = (type: string) => {
        switch (type) {
            case 'data-consent':
                return 'bg-emerald-100';
            case 'issue-credentials':
                return 'bg-cyan-100';
            default:
                return 'bg-gray-100';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Consent Contracts</h2>
                <p className="text-sm text-gray-500">
                    Contracts configured during your integration setup
                </p>
            </div>

            {configuredContracts.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl bg-gray-50">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">No contracts configured</p>
                    <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
                        Contracts are configured when you enable features like "Request Data Consent" or 
                        "Issue Credentials (Sync Mode)" in the setup wizard.
                    </p>

                    <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg inline-block text-left">
                        <p className="text-xs text-gray-500">
                            <strong>How to add a contract:</strong>
                        </p>
                        <ol className="text-xs text-gray-400 mt-1 space-y-1 list-decimal list-inside">
                            <li>Go to the Integration Hub</li>
                            <li>Select "Request Data Consent" feature</li>
                            <li>Configure a ConsentFlow contract</li>
                        </ol>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {configuredContracts.map((contract) => (
                        <div
                            key={contract.uri}
                            className="p-4 border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 ${getContractColor(contract.type)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                        {getContractIcon(contract.type)}
                                    </div>

                                    <div className="min-w-0">
                                        <h3 className="font-medium text-gray-800">{contract.name}</h3>
                                        <p className="text-sm text-gray-500 mt-0.5">{contract.description}</p>

                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                {contract.feature}
                                            </span>
                                        </div>

                                        <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-400 mb-1">Contract URI:</p>
                                            <code className="text-xs text-gray-700 font-mono break-all">
                                                {contract.uri}
                                            </code>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => copyContractUri(contract.uri)}
                                    className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex-shrink-0"
                                    title="Copy URI"
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

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-700">
                            These contracts are referenced in your integration code. Users will see a consent prompt when your app requests access via these contracts.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
