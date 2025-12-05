import React, { useEffect, useState, useCallback } from 'react';
import { AlertCircle, Code, Play, BookOpen, PenTool } from 'lucide-react';

import type { AppStoreListingCreate, LaunchConfig, AppPermission } from '../types';
import type { ConsentFlowContractDetails } from '@learncard/types';
import { PERMISSION_OPTIONS } from '../types';
import { ConsentFlowContractSelector } from './ConsentFlowContractSelector';
import { contractCategoryNameToCategoryMetadata } from 'learn-card-base';

interface LaunchConfigStepProps {
    data: Partial<AppStoreListingCreate>;
    onChange: (data: Partial<AppStoreListingCreate>) => void;
    errors: Record<string, string>;
    onPreview?: () => void;
}

export const LaunchConfigStep: React.FC<LaunchConfigStepProps> = ({ data, onChange, errors, onPreview }) => {
    const [selectedContract, setSelectedContract] = useState<ConsentFlowContractDetails | null>(null);

    const [config, setConfig] = useState<LaunchConfig>(() => {
        try {
            return data.launch_config_json ? JSON.parse(data.launch_config_json) : {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        try {
            const newConfig = data.launch_config_json ? JSON.parse(data.launch_config_json) : {};
            setConfig(newConfig);
        } catch {
            // Keep current config if JSON is invalid
        }
    }, [data.launch_type]);

    const updateConfig = (updates: Partial<LaunchConfig>) => {
        const newConfig = { ...config, ...updates };
        setConfig(newConfig);
        onChange({ ...data, launch_config_json: JSON.stringify(newConfig, null, 2) });
    };

    const renderConfigFields = () => {
        switch (data.launch_type) {
            case 'EMBEDDED_IFRAME':
                return (
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Embed URL</label>

                            <input
                                type="url"
                                value={config.url || ''}
                                onChange={e => updateConfig({ url: e.target.value })}
                                placeholder="https://yourapp.com/embed"
                                className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                                    errors.url ? 'border-red-300' : 'border-gray-200'
                                }`}
                            />

                            {errors.url && <p className="text-sm text-red-500 mt-1">{errors.url}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                Permissions Needed
                            </label>

                            <p className="text-xs text-gray-400 mb-2">
                                Select the capabilities your app requires from the wallet
                            </p>

                            <div className="space-y-2">
                                {PERMISSION_OPTIONS.map(permission => (
                                    <label
                                        key={permission.value}
                                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={config.permissions?.includes(permission.value) || false}
                                            onChange={e => {
                                                const current = config.permissions || [];
                                                const newPermissions = e.target.checked
                                                    ? [...current, permission.value]
                                                    : current.filter((p: AppPermission) => p !== permission.value);
                                                updateConfig({ permissions: newPermissions });
                                            }}
                                            className="w-4 h-4 text-cyan-600 rounded mt-0.5"
                                        />

                                        <div>
                                            <span className="text-sm font-medium text-gray-700">
                                                {permission.label}
                                            </span>

                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {permission.description}
                                            </p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'SECOND_SCREEN':
            case 'DIRECT_LINK':
                return (
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Application URL</label>

                        <input
                            type="url"
                            value={config.url || ''}
                            onChange={e => updateConfig({ url: e.target.value })}
                            placeholder="https://yourapp.com"
                            className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                                errors.url ? 'border-red-300' : 'border-gray-200'
                            }`}
                        />

                        {errors.url && <p className="text-sm text-red-500 mt-1">{errors.url}</p>}

                        <p className="text-sm text-gray-400 mt-2">
                            {data.launch_type === 'SECOND_SCREEN'
                                ? 'This URL will open in a new window when users launch your app.'
                                : 'Users will be redirected to this URL.'}
                        </p>
                    </div>
                );

            case 'CONSENT_REDIRECT':
                const readCategories = selectedContract?.contract?.read?.credentials?.categories || {};
                const writeCategories = selectedContract?.contract?.write?.credentials?.categories || {};
                const hasReadCategories = Object.keys(readCategories).length > 0;
                const hasWriteCategories = Object.keys(writeCategories).length > 0;

                return (
                    <div className="space-y-5">
                        <ConsentFlowContractSelector
                            value={config.contractUri || ''}
                            onChange={(uri) => updateConfig({ contractUri: uri })}
                            onContractChange={setSelectedContract}
                            error={errors.contractUri}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Redirect URI</label>

                            <input
                                type="url"
                                value={config.redirectUri || ''}
                                onChange={e => updateConfig({ redirectUri: e.target.value })}
                                placeholder="https://yourapp.com/callback"
                                className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                                    errors.redirectUri ? 'border-red-300' : 'border-gray-200'
                                }`}
                            />

                            {errors.redirectUri && (
                                <p className="text-sm text-red-500 mt-1">{errors.redirectUri}</p>
                            )}

                            <p className="text-sm text-gray-400 mt-1">
                                Where users will be redirected after granting consent. This can override the contract's redirect URL.
                            </p>
                        </div>

                        {/* Contract Permissions Display */}
                        {selectedContract && (
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-600">
                                    Contract Permissions
                                </label>

                                {/* Read Permissions */}
                                <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <BookOpen className="w-4 h-4 text-cyan-600" />
                                        <span className="text-sm font-medium text-cyan-700">Read Access</span>
                                    </div>

                                    {hasReadCategories ? (
                                        <div className="flex flex-wrap gap-2">
                                            {Object.keys(readCategories).map(category => {
                                                const metadata = contractCategoryNameToCategoryMetadata(category);
                                                return (
                                                    <span
                                                        key={category}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-cyan-700 rounded-full text-xs font-medium border border-cyan-200"
                                                    >
                                                        {metadata?.IconWithShape && (
                                                            <metadata.IconWithShape className="w-4 h-4" />
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

                                {/* Write Permissions */}
                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <PenTool className="w-4 h-4 text-emerald-600" />
                                        <span className="text-sm font-medium text-emerald-700">Write Access</span>
                                    </div>

                                    {hasWriteCategories ? (
                                        <div className="flex flex-wrap gap-2">
                                            {Object.keys(writeCategories).map(category => {
                                                const metadata = contractCategoryNameToCategoryMetadata(category);
                                                return (
                                                    <span
                                                        key={category}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-emerald-700 rounded-full text-xs font-medium border border-emerald-200"
                                                    >
                                                        {metadata?.IconWithShape && (
                                                            <metadata.IconWithShape className="w-4 h-4" />
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
                        )}

                        {!selectedContract && config.contractUri && (
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                <p className="text-sm text-gray-500 italic">
                                    Select a contract to view its permissions
                                </p>
                            </div>
                        )}
                    </div>
                );

            case 'SERVER_HEADLESS':
                return (
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Webhook URL</label>

                            <input
                                type="url"
                                value={config.webhookUrl || ''}
                                onChange={e => updateConfig({ webhookUrl: e.target.value })}
                                placeholder="https://yourserver.com/webhooks/learncard"
                                className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                                    errors.webhookUrl ? 'border-red-300' : 'border-gray-200'
                                }`}
                            />

                            {errors.webhookUrl && (
                                <p className="text-sm text-red-500 mt-1">{errors.webhookUrl}</p>
                            )}

                            <p className="text-sm text-gray-400 mt-1">
                                LearnCard will send event notifications to this endpoint.
                            </p>
                        </div>

                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />

                                <div className="text-sm text-amber-800">
                                    <p className="font-medium">Security Note</p>

                                    <p className="mt-1">
                                        Your webhook endpoint should verify the signature of incoming
                                        requests. API keys will be provided after approval.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-700">Launch Configuration</h2>

                <p className="text-sm text-gray-500 mt-1">
                    Configure the technical details for your integration
                </p>
            </div>

            {renderConfigFields()}

            {/* JSON Preview */}
            <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                    <Code className="w-4 h-4 text-gray-400" />

                    <span className="text-sm font-medium text-gray-500">Configuration Preview</span>
                </div>

                <pre className="p-4 bg-gray-800 text-gray-100 rounded-xl text-xs overflow-x-auto">
                    {JSON.stringify(config, null, 2) || '{}'}
                </pre>
            </div>

            {/* Preview Button */}
            {data.launch_type === 'EMBEDDED_IFRAME' && config.url && onPreview && (
                <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium text-indigo-800">Test Your Integration</h4>
                            <p className="text-xs text-indigo-600 mt-0.5">
                                Preview your app and validate partner-connect API calls
                            </p>
                        </div>

                        <button
                            onClick={onPreview}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors"
                        >
                            <Play className="w-4 h-4" />
                            Preview App
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
