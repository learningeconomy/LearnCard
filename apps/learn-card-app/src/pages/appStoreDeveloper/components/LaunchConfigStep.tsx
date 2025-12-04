import React, { useEffect, useState } from 'react';
import { AlertCircle, Code } from 'lucide-react';

import type { AppStoreListingCreate, LaunchConfig, AppPermission } from '../types';
import { PERMISSION_OPTIONS } from '../types';

interface LaunchConfigStepProps {
    data: Partial<AppStoreListingCreate>;
    onChange: (data: Partial<AppStoreListingCreate>) => void;
    errors: Record<string, string>;
}

export const LaunchConfigStep: React.FC<LaunchConfigStepProps> = ({ data, onChange, errors }) => {
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
                return (
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Contract URI</label>

                            <input
                                type="text"
                                value={config.contractUri || ''}
                                onChange={e => updateConfig({ contractUri: e.target.value })}
                                placeholder="lc:network:contract:your-contract-id"
                                className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 ${
                                    errors.contractUri ? 'border-red-300' : 'border-gray-200'
                                }`}
                            />

                            {errors.contractUri && (
                                <p className="text-sm text-red-500 mt-1">{errors.contractUri}</p>
                            )}

                            <p className="text-sm text-gray-400 mt-1">
                                The consent flow contract that defines what data your app can access.
                            </p>
                        </div>

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
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                Requested Scopes
                            </label>

                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {['profile:read', 'credentials:read', 'credentials:write', 'connections:read'].map(
                                    scope => (
                                        <label
                                            key={scope}
                                            className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={config.scopes?.includes(scope) || false}
                                                onChange={e => {
                                                    const current = config.scopes || [];
                                                    const newScopes = e.target.checked
                                                        ? [...current, scope]
                                                        : current.filter(s => s !== scope);
                                                    updateConfig({ scopes: newScopes });
                                                }}
                                                className="w-4 h-4 text-cyan-600 rounded"
                                            />

                                            <span className="text-sm text-gray-600">{scope}</span>
                                        </label>
                                    )
                                )}
                            </div>
                        </div>
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
        </div>
    );
};
