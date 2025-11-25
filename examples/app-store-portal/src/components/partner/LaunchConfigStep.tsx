import React, { useEffect, useState } from 'react';
import { AlertCircle, Code } from 'lucide-react';
import type { AppStoreListingCreate, LaunchConfig, LaunchType } from '../../types/app-store';

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
                    <div className="space-y-6">
                        <div>
                            <label className="label">Embed URL</label>

                            <input
                                type="url"
                                value={config.url || ''}
                                onChange={e => updateConfig({ url: e.target.value })}
                                placeholder="https://yourapp.com/embed"
                                className={`input ${errors.url ? 'input-error' : ''}`}
                            />

                            {errors.url && <p className="text-sm text-red-500 mt-1">{errors.url}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Width</label>

                                <input
                                    type="text"
                                    value={config.width || ''}
                                    onChange={e => updateConfig({ width: e.target.value })}
                                    placeholder="100%"
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="label">Height</label>

                                <input
                                    type="text"
                                    value={config.height || ''}
                                    onChange={e => updateConfig({ height: e.target.value })}
                                    placeholder="600px"
                                    className="input"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">Sandbox Permissions</label>

                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {[
                                    'allow-scripts',
                                    'allow-same-origin',
                                    'allow-forms',
                                    'allow-popups',
                                    'allow-modals',
                                ].map(permission => (
                                    <label
                                        key={permission}
                                        className="flex items-center gap-2 p-3 bg-apple-gray-50 rounded-apple cursor-pointer hover:bg-apple-gray-100 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={config.sandbox?.includes(permission) || false}
                                            onChange={e => {
                                                const current = config.sandbox || [];
                                                const newSandbox = e.target.checked
                                                    ? [...current, permission]
                                                    : current.filter(p => p !== permission);
                                                updateConfig({ sandbox: newSandbox });
                                            }}
                                            className="w-4 h-4 text-apple-blue rounded"
                                        />

                                        <span className="text-sm text-apple-gray-600">{permission}</span>
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
                        <label className="label">Application URL</label>

                        <input
                            type="url"
                            value={config.url || ''}
                            onChange={e => updateConfig({ url: e.target.value })}
                            placeholder="https://yourapp.com"
                            className={`input ${errors.url ? 'input-error' : ''}`}
                        />

                        {errors.url && <p className="text-sm text-red-500 mt-1">{errors.url}</p>}

                        <p className="text-sm text-apple-gray-400 mt-2">
                            {data.launch_type === 'SECOND_SCREEN'
                                ? 'This URL will open in a new window when users launch your app.'
                                : 'Users will be redirected to this URL.'}
                        </p>
                    </div>
                );

            case 'CONSENT_REDIRECT':
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="label">Contract URI</label>

                            <input
                                type="text"
                                value={config.contractUri || ''}
                                onChange={e => updateConfig({ contractUri: e.target.value })}
                                placeholder="lc:network:contract:your-contract-id"
                                className={`input ${errors.contractUri ? 'input-error' : ''}`}
                            />

                            {errors.contractUri && (
                                <p className="text-sm text-red-500 mt-1">{errors.contractUri}</p>
                            )}

                            <p className="text-sm text-apple-gray-400 mt-2">
                                The consent flow contract that defines what data your app can access.
                            </p>
                        </div>

                        <div>
                            <label className="label">Redirect URI</label>

                            <input
                                type="url"
                                value={config.redirectUri || ''}
                                onChange={e => updateConfig({ redirectUri: e.target.value })}
                                placeholder="https://yourapp.com/callback"
                                className={`input ${errors.redirectUri ? 'input-error' : ''}`}
                            />

                            {errors.redirectUri && (
                                <p className="text-sm text-red-500 mt-1">{errors.redirectUri}</p>
                            )}
                        </div>

                        <div>
                            <label className="label">Requested Scopes</label>

                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {[
                                    'profile:read',
                                    'credentials:read',
                                    'credentials:write',
                                    'connections:read',
                                ].map(scope => (
                                    <label
                                        key={scope}
                                        className="flex items-center gap-2 p-3 bg-apple-gray-50 rounded-apple cursor-pointer hover:bg-apple-gray-100 transition-colors"
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
                                            className="w-4 h-4 text-apple-blue rounded"
                                        />

                                        <span className="text-sm text-apple-gray-600">{scope}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'SERVER_HEADLESS':
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="label">Webhook URL</label>

                            <input
                                type="url"
                                value={config.webhookUrl || ''}
                                onChange={e => updateConfig({ webhookUrl: e.target.value })}
                                placeholder="https://yourserver.com/webhooks/learncard"
                                className={`input ${errors.webhookUrl ? 'input-error' : ''}`}
                            />

                            {errors.webhookUrl && (
                                <p className="text-sm text-red-500 mt-1">{errors.webhookUrl}</p>
                            )}

                            <p className="text-sm text-apple-gray-400 mt-2">
                                LearnCard will send event notifications to this endpoint.
                            </p>
                        </div>

                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-apple">
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
        <div className="space-y-8 animate-fade-in">
            <div className="text-center mb-8">
                <h2 className="section-title">Launch Configuration</h2>

                <p className="section-subtitle mt-2">
                    Configure the technical details for your integration
                </p>
            </div>

            {renderConfigFields()}

            {/* JSON Preview */}
            <div className="mt-8">
                <div className="flex items-center gap-2 mb-3">
                    <Code className="w-4 h-4 text-apple-gray-400" />
                    <span className="text-sm font-medium text-apple-gray-500">
                        Configuration Preview
                    </span>
                </div>

                <pre className="p-4 bg-apple-gray-600 text-apple-gray-100 rounded-apple text-sm overflow-x-auto">
                    {JSON.stringify(config, null, 2) || '{}'}
                </pre>
            </div>
        </div>
    );
};
