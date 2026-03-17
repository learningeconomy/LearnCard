import React, { useState, useEffect, useMemo } from 'react';
import { Globe, X, Plus, Palette, Settings, Upload, Loader2, Award } from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import { useToast, useFilestack, ToastTypeEnum, useGetCurrentLCNUser } from 'learn-card-base';
import { LEARNCARD_NETWORK_API_URL } from 'learn-card-base/constants/Networks';
import { EmbedPreview } from '../../components/EmbedPreview';
import { useDeveloperPortal } from '../../useDeveloperPortal';
import { useGuideState } from '../../guides/shared/useGuideState';
import type { CredentialTemplate } from '../types';

declare const LCN_API_URL: string | undefined;

interface EmbedClaimConfig {
    partnerName?: string;
    branding?: { primaryColor: string; accentColor: string; partnerLogoUrl?: string };
    requestBackgroundIssuance?: boolean;
}

interface EmbedConfigTabProps {
    integration: LCNIntegration;
    templates?: CredentialTemplate[];
}

export const EmbedConfigTab: React.FC<EmbedConfigTabProps> = ({ integration, templates = [] }) => {
    const { presentToast } = useToast();
    const { useUpdateIntegration } = useDeveloperPortal();
    const updateIntegrationMutation = useUpdateIntegration();
    const { currentLCNUser } = useGetCurrentLCNUser();

    const guideState = useGuideState('embed-claim', 6, integration);

    // Read persisted config
    const savedConfig = useMemo(() => {
        return guideState.getConfig<EmbedClaimConfig>('embedClaimConfig');
    }, [guideState]);

    const [partnerName, setPartnerName] = useState(savedConfig?.partnerName || '');
    const [branding, setBranding] = useState(
        savedConfig?.branding || { primaryColor: '#1F51FF', accentColor: '#0F3BD9', partnerLogoUrl: '' }
    );
    const [requestBackgroundIssuance, setRequestBackgroundIssuance] = useState(
        savedConfig?.requestBackgroundIssuance ?? false
    );
    const [selectedTemplateIdx, setSelectedTemplateIdx] = useState(0);
    const [domainInput, setDomainInput] = useState('');

    // Persist config changes
    useEffect(() => {
        guideState.updateConfig('embedClaimConfig', {
            partnerName,
            branding,
            requestBackgroundIssuance,
        });
    }, [partnerName, branding, requestBackgroundIssuance]);

    // Logo upload
    const { handleFileSelect: handleLogoUpload, isLoading: isUploadingLogo } = useFilestack({
        onUpload: (url: string) => {
            setBranding({ ...branding, partnerLogoUrl: url });
        },
        fileType: 'image/*',
    });

    // Whitelisted domains
    const whitelistedDomains = integration.whitelistedDomains || [];

    const addDomain = () => {
        const domain = domainInput.trim().toLowerCase();
        if (!domain || whitelistedDomains.includes(domain)) return;
        updateIntegrationMutation.mutate(
            { id: integration.id, updates: { whitelistedDomains: [...whitelistedDomains, domain] } },
            {
                onSuccess: () => {
                    setDomainInput('');
                    presentToast('Domain added', { type: ToastTypeEnum.Success, hasDismissButton: true });
                },
            }
        );
    };

    const removeDomain = (domain: string) => {
        updateIntegrationMutation.mutate(
            { id: integration.id, updates: { whitelistedDomains: whitelistedDomains.filter(d => d !== domain) } },
            {
                onSuccess: () => {
                    presentToast('Domain removed', { hasDismissButton: true });
                },
            }
        );
    };

    // Live preview credential
    const safeIdx = Math.min(selectedTemplateIdx, Math.max(0, templates.length - 1));
    const selectedTemplate = templates[safeIdx];
    const credential = useMemo(
        () => ({
            name: selectedTemplate?.name || 'Untitled Template',
            ...(selectedTemplate || {}),
        }),
        [selectedTemplate]
    );

    const publishableKey = integration.publishableKey || '';
    const apiBaseUrl = LCN_API_URL || LEARNCARD_NETWORK_API_URL;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Embed Configuration</h2>
                <p className="text-sm text-gray-500">Configure branding, preview, and domain settings for your embed</p>
            </div>

            {/* Live Preview */}
            {publishableKey && templates.length > 0 && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <h3 className="text-sm font-medium text-indigo-800 mb-3">Live Preview</h3>

                    <p className="text-xs text-indigo-600 mb-4">
                        This is the actual claim button your users will see. Click it to test the full flow.
                    </p>

                    {/* Template selector for preview */}
                    {templates.length > 1 && (
                        <div className="mb-4">
                            <label className="text-xs font-medium text-indigo-700 mb-1.5 block">Preview Template</label>
                            <div className="flex flex-wrap gap-2">
                                {templates.map((t, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedTemplateIdx(idx)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                                            idx === selectedTemplateIdx
                                                ? 'bg-indigo-200 text-indigo-800 border border-indigo-300'
                                                : 'bg-white text-indigo-600 border border-indigo-200 hover:border-indigo-300'
                                        }`}
                                    >
                                        <Award className="w-3 h-3" />
                                        {t.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <EmbedPreview
                        publishableKey={publishableKey}
                        partnerName={partnerName}
                        credential={credential}
                        branding={branding}
                        requestBackgroundIssuance={requestBackgroundIssuance}
                        apiBaseUrl={apiBaseUrl}
                        issuerName={currentLCNUser?.displayName || ''}
                        issuerLogoUrl={currentLCNUser?.image || undefined}
                    />
                </div>
            )}

            {/* Branding & Advanced Options */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
                {/* Modal Branding */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Palette className="w-4 h-4 text-indigo-500" />
                        Modal Branding
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Primary Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={branding.primaryColor}
                                    onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                                    className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={branding.primaryColor}
                                    onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                                    placeholder="#1F51FF"
                                    className="flex-1 px-3 py-2 text-sm font-mono bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Accent Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={branding.accentColor}
                                    onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                                    className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={branding.accentColor}
                                    onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                                    placeholder="#0F3BD9"
                                    className="flex-1 px-3 py-2 text-sm font-mono bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Partner Name */}
                    <div className="pt-3 border-t border-gray-100">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Partner Name <span className="text-gray-400 font-normal">(Optional)</span></label>
                        <input
                            type="text"
                            value={partnerName}
                            onChange={(e) => setPartnerName(e.target.value)}
                            placeholder="Your company name"
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            style={{ colorScheme: 'light' }}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Shown alongside your logo in the claim modal. Not included on the issued credential.
                        </p>
                    </div>

                    {/* Partner Logo */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Partner Logo <span className="text-gray-400 font-normal">(Optional)</span></label>
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={branding.partnerLogoUrl}
                                onChange={(e) => setBranding({ ...branding, partnerLogoUrl: e.target.value })}
                                placeholder="https://example.com/logo.png"
                                className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                disabled={isUploadingLogo}
                                style={{ colorScheme: 'light' }}
                            />
                            <button
                                type="button"
                                onClick={() => handleLogoUpload()}
                                disabled={isUploadingLogo}
                                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                                title="Upload image"
                            >
                                {isUploadingLogo ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                        {branding.partnerLogoUrl && (
                            <img
                                src={branding.partnerLogoUrl}
                                alt="Logo preview"
                                className="mt-2 h-12 object-contain rounded border border-gray-200"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        )}
                    </div>
                </div>

                {/* Advanced Settings */}
                <div className="space-y-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Settings className="w-4 h-4 text-emerald-500" />
                        Advanced Settings
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={requestBackgroundIssuance}
                            onChange={(e) => setRequestBackgroundIssuance(e.target.checked)}
                            className="mt-1 w-4 h-4 text-cyan-500 border-gray-300 rounded focus:ring-cyan-500"
                        />
                        <div>
                            <span className="text-sm font-medium text-gray-700">Request Background Issuance Consent</span>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Ask the user for permission to issue future credentials without requiring email verification each time.
                            </p>
                        </div>
                    </label>
                </div>
            </div>

            {/* Whitelisted Domains */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-700">Whitelisted Domains</label>
                </div>

                <p className="text-xs text-gray-500 mb-3">
                    Add the domains where you'll embed this claim button.
                </p>

                <div className="flex gap-2 mb-3">
                    <input
                        type="text"
                        value={domainInput}
                        onChange={e => setDomainInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDomain(); } }}
                        placeholder="e.g., yourcompany.com"
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        style={{ colorScheme: 'light' }}
                    />
                    <button
                        type="button"
                        onClick={addDomain}
                        disabled={!domainInput.trim() || updateIntegrationMutation.isPending}
                        className="px-3 py-1.5 bg-cyan-500 text-white text-sm rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add
                    </button>
                </div>

                {whitelistedDomains.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {whitelistedDomains.map(domain => (
                            <span
                                key={domain}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700"
                            >
                                {domain}
                                <button
                                    type="button"
                                    onClick={() => removeDomain(domain)}
                                    className="text-gray-400 hover:text-gray-700 ml-0.5"
                                    aria-label={`Remove ${domain}`}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-amber-600">
                        No domains whitelisted yet. The embed will not work until you add at least one domain.
                    </p>
                )}
            </div>
        </div>
    );
};
