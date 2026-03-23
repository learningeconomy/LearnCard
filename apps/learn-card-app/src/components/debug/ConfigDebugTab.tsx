import React, { useState, useMemo, useCallback } from 'react';
import {
    Globe,
    Database,
    Link2,
    ToggleLeft,
    AlertTriangle,
    Eye,
    Smartphone,
    Copy,
    Check,
} from 'lucide-react';

import { useTenantConfig } from 'learn-card-base/config/TenantConfigProvider';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from 'learn-card-base/config/tenantDefaults';

import { KVRow, Section, truncate, useCopyToClipboard } from './debugComponents';

// ---------------------------------------------------------------------------
// Fields that should be unique per tenant (mirrors validate-tenant-configs.ts)
// ---------------------------------------------------------------------------

const TENANT_UNIQUE_FIELDS: Array<{ path: string; label: string }> = [
    { path: 'observability.sentryDsn', label: 'Sentry DSN' },
    { path: 'native.bundleId', label: 'Bundle ID' },
    { path: 'links.appStoreUrl', label: 'App Store URL' },
    { path: 'links.playStoreUrl', label: 'Play Store URL' },
    { path: 'observability.launchDarklyClientId', label: 'LaunchDarkly Client ID' },
    { path: 'observability.userflowToken', label: 'Userflow Token' },
    { path: 'auth.firebase.projectId', label: 'Firebase Project ID' },
];

const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
        if (current == null || typeof current !== 'object') return undefined;
        current = (current as Record<string, unknown>)[key];
    }

    return current;
};

// ---------------------------------------------------------------------------
// Config Debug Tab
// ---------------------------------------------------------------------------

export const ConfigDebugTab: React.FC = () => {
    const config = useTenantConfig();
    const [copied, setCopied] = useCopyToClipboard();
    const [showRawJson, setShowRawJson] = useState(false);

    const isLearnCard = config.tenantId === 'learncard';

    // Detect fields still matching LearnCard defaults
    const inheritedDefaults = useMemo(() => {
        if (isLearnCard) return [];

        return TENANT_UNIQUE_FIELDS.filter(({ path }) => {
            const current = getNestedValue(config as unknown as Record<string, unknown>, path);
            const defaultVal = getNestedValue(DEFAULT_LEARNCARD_TENANT_CONFIG as unknown as Record<string, unknown>, path);

            return current != null && defaultVal != null && current === defaultVal;
        });
    }, [config, isLearnCard]);

    // Feature flags as a flat list
    const featureFlags = useMemo(() => {
        const flags: Array<{ key: string; value: boolean }> = [];

        for (const [key, val] of Object.entries(config.features)) {
            if (typeof val === 'boolean') {
                flags.push({ key, value: val });
            }
        }

        return flags.sort((a, b) => a.key.localeCompare(b.key));
    }, [config.features]);

    const handleCopyFullConfig = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
            setCopied('full-config', config);
        } catch { /* ignore */ }
    }, [config, setCopied]);

    return (
        <div className="space-y-2">
            {/* ── Tenant identity ── */}
            <div className="rounded-lg p-3 bg-indigo-950/40 ring-1 ring-indigo-700">
                <div className="flex items-center gap-2 mb-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-sm font-bold text-indigo-400">{config.tenantId}</span>

                    <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-indigo-500/20 text-indigo-400">
                        v{config.schemaVersion ?? '?'}
                    </span>
                </div>

                <KVRow label="Tenant ID" value={config.tenantId} copied={copied} onCopy={setCopied} />
                <KVRow label="Domain" value={config.domain} copied={copied} onCopy={setCopied} />
                <KVRow label="Dev Domain" value={config.devDomain ?? '—'} copied={copied} onCopy={setCopied} />
                <KVRow label="Branding Name" value={config.branding.name} mono={false} copied={copied} onCopy={setCopied} />
                <KVRow label="Default Theme" value={config.branding.defaultTheme} copied={copied} onCopy={setCopied} />
                <KVRow label="Allowed Themes" value={config.branding.allowedThemes?.join(', ') ?? '(all)'} mono={false} copied={copied} onCopy={setCopied} />
            </div>

            {/* ── Inherited default warnings ── */}
            {inheritedDefaults.length > 0 && (
                <div className="rounded-lg p-2.5 bg-yellow-950/30 ring-1 ring-yellow-700/50">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <AlertTriangle className="w-3 h-3 text-yellow-400" />
                        <span className="text-[10px] font-semibold text-yellow-400">
                            {inheritedDefaults.length} field{inheritedDefaults.length > 1 ? 's' : ''} inherited from LearnCard defaults
                        </span>
                    </div>

                    <div className="space-y-0">
                        {inheritedDefaults.map(({ path, label }) => (
                            <div key={path} className="flex items-center justify-between text-[10px] py-[2px] border-t border-yellow-800/30">
                                <span className="text-yellow-500/80">{label}</span>
                                <span className="text-yellow-400/60 font-mono text-[9px]">{path}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── API Endpoints ── */}
            <Section
                title="API Endpoints"
                icon={<Database className="w-3 h-3 text-gray-500" />}
            >
                <KVRow label="Brain URL" value={config.apis.brainUrl ? truncate(config.apis.brainUrl, 40) : '—'} copied={copied} onCopy={setCopied} />
                <KVRow label="Cache URL" value={config.apis.cacheUrl ? truncate(config.apis.cacheUrl, 40) : '—'} copied={copied} onCopy={setCopied} />
                <KVRow label="Upload URL" value={config.apis.uploadUrl ? truncate(config.apis.uploadUrl, 40) : '—'} copied={copied} onCopy={setCopied} />
            </Section>

            {/* ── Links ── */}
            <Section
                title="External Links"
                icon={<Link2 className="w-3 h-3 text-gray-500" />}
            >
                <KVRow label="App Store" value={config.links.appStoreUrl ? truncate(config.links.appStoreUrl, 40) : '—'} copied={copied} onCopy={setCopied} />
                <KVRow label="Play Store" value={config.links.playStoreUrl ? truncate(config.links.playStoreUrl, 40) : '—'} copied={copied} onCopy={setCopied} />
                <KVRow label="Support" value={config.links.supportUrl ?? '—'} copied={copied} onCopy={setCopied} />
                <KVRow label="Privacy" value={config.links.privacyUrl ?? '—'} copied={copied} onCopy={setCopied} />
                <KVRow label="Terms" value={config.links.termsUrl ?? '—'} copied={copied} onCopy={setCopied} />
            </Section>

            {/* ── Feature Flags ── */}
            <Section
                title="Feature Flags"
                icon={<ToggleLeft className="w-3 h-3 text-gray-500" />}
                badge={
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-gray-700 text-gray-400">
                        {featureFlags.filter(f => f.value).length}/{featureFlags.length} on
                    </span>
                }
            >
                {featureFlags.map(({ key, value }) => (
                    <div key={key} className="flex items-center justify-between text-[11px] py-[3px] border-t border-gray-700/40">
                        <span className="text-gray-500">{key}</span>
                        <span className={`text-[10px] font-mono ${value ? 'text-emerald-400' : 'text-red-400'}`}>
                            {value ? 'on' : 'off'}
                        </span>
                    </div>
                ))}
            </Section>

            {/* ── Observability ── */}
            <Section
                title="Observability"
                icon={<Eye className="w-3 h-3 text-gray-500" />}
            >
                <KVRow label="Sentry DSN" value={config.observability.sentryDsn ? truncate(config.observability.sentryDsn, 36) : '—'} copied={copied} onCopy={setCopied} />
                <KVRow label="LaunchDarkly" value={config.observability.launchDarklyClientId ? truncate(config.observability.launchDarklyClientId, 20) : '—'} copied={copied} onCopy={setCopied} />
                <KVRow label="Userflow" value={config.observability.userflowToken ? truncate(config.observability.userflowToken, 20) : '—'} copied={copied} onCopy={setCopied} />
            </Section>

            {/* ── Native Config ── */}
            {config.native && (
                <Section
                    title="Native Config"
                    icon={<Smartphone className="w-3 h-3 text-gray-500" />}
                >
                    <KVRow label="Bundle ID" value={config.native.bundleId ?? '—'} copied={copied} onCopy={setCopied} />
                    <KVRow label="Display Name" value={config.native.displayName ?? '—'} mono={false} copied={copied} onCopy={setCopied} />
                    <KVRow label="Deep Link Domains" value={config.native.deepLinkDomains?.join(', ') ?? '—'} mono={false} copied={copied} onCopy={setCopied} />
                </Section>
            )}

            {/* ── Raw JSON ── */}
            <div className="bg-gray-800/80 rounded-lg overflow-hidden">
                <button
                    onClick={() => setShowRawJson(!showRawJson)}
                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-700/40 transition-colors text-left"
                >
                    <span className="text-[11px] font-semibold text-gray-200">Raw Config JSON</span>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleCopyFullConfig(); }}
                            className="p-1 rounded hover:bg-gray-600 transition-colors"
                            title="Copy full config JSON"
                        >
                            {copied === 'full-config'
                                ? <Check className="w-3 h-3 text-emerald-400" />
                                : <Copy className="w-3 h-3 text-gray-500" />}
                        </button>
                    </div>
                </button>

                {showRawJson && (
                    <div className="px-3 pb-2">
                        <pre className="text-[8px] text-gray-500 bg-gray-950 rounded p-2 overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-words">
                            {JSON.stringify(config, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};
