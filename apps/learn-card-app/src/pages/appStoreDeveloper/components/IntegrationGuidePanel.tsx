import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    X,
    Copy,
    Check,
    ExternalLink,
    ChevronRight,
    Code,
    Globe,
    Package,
    Zap,
    Key,
    Database,
    Plus,
    Trash2,
    MoreVertical,
    Eye,
    EyeOff,
    Mail,
    Send,
    Server,
    Webhook,
    Shield,
    CheckCircle2,
    Loader2,
    Sparkles,
    Award,
} from 'lucide-react';
import { getLogger } from 'learn-card-base';
const log = getLogger('integration-guide-panel');

import * as m from '../../../paraglide/messages.js';
import { OBv3CredentialBuilder } from '../../../components/credentials/OBv3CredentialBuilder';
import { Clipboard } from '@capacitor/clipboard';
import { CodeBlock } from './CodeBlock';

import { useWallet, useToast, ToastTypeEnum, useConfirmation } from 'learn-card-base';
import type { AppPermission } from '../types';
import { getAppBaseUrl, getResolvedTenantConfig } from '../../../config/bootstrapTenantConfig';

type AuthGrant = {
    id: string;
    name: string;
    challenge: string;
    createdAt: string;
    status: 'revoked' | 'active';
    scope: string;
    description?: string;
    expiresAt?: string | null;
};

interface IntegrationGuidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    launchType: string;
    selectedPermissions?: AppPermission[];
    contractUri?: string;
    webhookUrl?: string;
}

// CodeBlock imported from ./CodeBlock

const StepCard: React.FC<{
    step: number;
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}> = ({ step, title, icon, children }) => (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-center w-8 h-8 bg-cyan-100 text-cyan-700 rounded-full text-sm font-bold">
                {step}
            </div>

            <div className="flex items-center gap-2">
                {icon}
                <h4 className="font-medium text-gray-800">{title}</h4>
            </div>
        </div>

        <div className="p-4">{children}</div>
    </div>
);

// Scope options for API tokens
const SCOPE_OPTIONS = [
    { label: m['developerPortal.integrationGuide.scopeOptions.fullAccess'](), value: '*:*', description: m['developerPortal.integrationGuide.scopeOptions.fullAccessDesc']() },
    { label: m['developerPortal.integrationGuide.scopeOptions.readOnly'](), value: '*:read', description: m['developerPortal.integrationGuide.scopeOptions.readOnlyDesc']() },
    {
        label: m['developerPortal.integrationGuide.scopeOptions.profileMgmt'](),
        value: 'profile:* profileManager:*',
        description: m['developerPortal.integrationGuide.scopeOptions.profileMgmtDesc'](),
    },
    {
        label: m['developerPortal.integrationGuide.scopeOptions.credMgmt'](),
        value: 'credential:* presentation:* boosts:*',
        description: m['developerPortal.integrationGuide.scopeOptions.credMgmtDesc'](),
    },
    { label: m['developerPortal.integrationGuide.scopeOptions.contracts'](), value: 'contracts:*', description: m['developerPortal.integrationGuide.scopeOptions.contractsDesc']() },
];

// Inline API Token Manager component
const InlineAPITokenManager: React.FC = () => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const confirm = useConfirmation();

    const [authGrants, setAuthGrants] = useState<Partial<AuthGrant>[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newTokenName, setNewTokenName] = useState('');
    const [selectedScope, setSelectedScope] = useState('*:*');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const fetchAuthGrants = useCallback(async () => {
        try {
            const wallet = await initWallet();
            setLoading(true);
            const grants = await wallet.invoke.getAuthGrants();
            setAuthGrants(grants || []);
        } catch (err) {
            log.error('Failed to fetch auth grants:', err);
        } finally {
            setLoading(false);
        }
    }, [initWallet]);

    useEffect(() => {
        fetchAuthGrants();
    }, []);

    const createToken = async () => {
        if (!newTokenName.trim()) return;

        try {
            setCreating(true);
            const wallet = await initWallet();
            await wallet.invoke.addAuthGrant({
                name: newTokenName.trim(),
                description: m['developerPortal.integrationGuide.apiTokens.createdFromGuide'](),
                scope: selectedScope,
            });

            presentToast('API Token created successfully', { hasDismissButton: true });
            setNewTokenName('');
            setShowCreateForm(false);
            fetchAuthGrants();
        } catch (err) {
            log.error('Failed to create token:', err);
            presentToast('Failed to create API Token', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            setCreating(false);
        }
    };

    const copyToken = async (id: string) => {
        try {
            const wallet = await initWallet();
            const token = await wallet.invoke.getAPITokenForAuthGrant(id);
            await Clipboard.write({ string: token });
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
            presentToast('API Token copied to clipboard', { hasDismissButton: true });
        } catch (err) {
            log.error('Failed to copy token:', err);
            presentToast('Failed to copy API Token', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const revokeToken = async (grant: Partial<AuthGrant>) => {
        const confirmed = await confirm({
            text: grant.status === 'active'
                ? m['developerPortal.integrationGuide.apiTokens.confirmRevoke']({ name: grant.name! })
                : m['developerPortal.integrationGuide.apiTokens.confirmDelete']({ name: grant.name! }),
            onConfirm: async () => {},
            cancelButtonClassName:
                'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px]',
            confirmButtonClassName:
                'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
        });

        if (!confirmed) return;

        try {
            const wallet = await initWallet();

            if (grant.status === 'active') {
                await wallet.invoke.revokeAuthGrant(grant.id!);
                presentToast('API Token revoked', { hasDismissButton: true });
            } else {
                await wallet.invoke.deleteAuthGrant(grant.id!);
                presentToast('API Token deleted', { hasDismissButton: true });
            }

            fetchAuthGrants();
        } catch (err) {
            log.error('Failed to revoke/delete token:', err);
            presentToast('Failed to update API Token', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const activeGrants = authGrants.filter(g => g.status === 'active');

    return (
        <div className="space-y-3">
            {/* Header with create button */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">
                    {loading
                        ? m['common.loading']()
                        : m['developerPortal.integrationGuide.apiTokens.activeTokens']({
                              count: activeGrants.length,
                          })}
                </p>

                {!showCreateForm && (
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-medium hover:bg-indigo-600 transition-colors"
                    >
                        <Plus className="w-3 h-3" />
                        New Token
                    </button>
                )}
            </div>

            {/* Create form */}
            {showCreateForm && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            {m['developerPortal.integrationGuide.apiTokens.tokenName']()}
                        </label>
                        <input
                            type="text"
                            value={newTokenName}
                            onChange={e => setNewTokenName(e.target.value)}
                            placeholder={m['developerPortal.integrationGuide.apiTokens.tokenNamePlaceholder']()}
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            {m['developerPortal.integrationGuide.apiTokens.scopePermissions']()}
                        </label>
                        <select
                            value={selectedScope}
                            onChange={e => setSelectedScope(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            {SCOPE_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            {SCOPE_OPTIONS.find(o => o.value === selectedScope)?.description}
                        </p>
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button
                            onClick={createToken}
                            disabled={creating || !newTokenName.trim()}
                            className="flex-1 px-3 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50"
                        >
                            {creating ? m['developerPortal.integrationGuide.apiTokens.creating']() : m['developerPortal.integrationGuide.apiTokens.createToken']()}
                        </button>

                        <button
                            onClick={() => {
                                setShowCreateForm(false);
                                setNewTokenName('');
                                setSelectedScope('*:*');
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                        >
                            {m['common.cancel']()}
                        </button>
                    </div>
                </div>
            )}

            {/* Token list */}
            {!loading && activeGrants.length > 0 && (
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {activeGrants.map(grant => (
                        <div
                            key={grant.id}
                            className="flex items-center justify-between p-3 hover:bg-gray-50"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">
                                    {grant.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {m['developerPortal.integrationGuide.apiTokens.createdOn']()} {new Date(grant.createdAt!).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => copyToken(grant.id!)}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                    title={m['developerPortal.integrationGuide.common.copyToken']()}
                                >
                                    {copiedId === grant.id ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <Copy className="w-4 h-4 text-gray-500" />
                                    )}
                                </button>

                                <button
                                    onClick={() => revokeToken(grant)}
                                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                    title={m['developerPortal.integrationGuide.common.revokeToken']()}
                                >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && activeGrants.length === 0 && !showCreateForm && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                    <Key className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">{m['developerPortal.integrationGuide.apiTokens.noTokensYet']()}</p>
                    <p className="text-xs text-gray-500 mt-1">
                        {m['developerPortal.integrationGuide.apiTokens.noTokensHint']()}
                    </p>
                </div>
            )}

            {/* Security note */}
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-800">
                    <strong>{m['developerPortal.integrationGuide.common.security']()}:</strong> {m['developerPortal.integrationGuide.apiTokens.securityNote']()}
                </p>
            </div>
        </div>
    );
};

// Inline Signing Authority Setup component
const InlineSigningAuthoritySetup: React.FC = () => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [primarySAName, setPrimarySAName] = useState<string | null>(null);

    const fetchSigningAuthority = useCallback(async () => {
        try {
            setLoading(true);
            const wallet = await initWallet();
            const primary = await wallet.invoke.getPrimaryRegisteredSigningAuthority();
            setPrimarySAName(primary?.relationship?.name ?? null);
        } catch (err) {
            log.error('Failed to fetch signing authority:', err);
            setPrimarySAName(null);
        } finally {
            setLoading(false);
        }
    }, [initWallet]);

    useEffect(() => {
        fetchSigningAuthority();
    }, []);

    const createDefaultSigningAuthority = async () => {
        try {
            setCreating(true);
            const wallet = await initWallet();

            // Create and register signing authority with default name
            const authority = await wallet.invoke.createSigningAuthority('integration-sa');

            if (!authority) {
                throw new Error('Failed to create signing authority');
            }

            await wallet.invoke.registerSigningAuthority(
                authority.endpoint!,
                authority.name,
                authority.did!
            );

            // Set as primary/default
            await wallet.invoke.setPrimaryRegisteredSigningAuthority(
                authority.endpoint!,
                authority.name
            );

            presentToast(m['developerPortal.integrationGuide.signingAuthority.createdSuccess'](), { hasDismissButton: true });
            fetchSigningAuthority();
        } catch (err) {
            log.error('Failed to create signing authority:', err);
            presentToast(m['developerPortal.integrationGuide.signingAuthority.createdFailed'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">{m['developerPortal.integrationGuide.signingAuthority.checking']()}</span>
                </div>
            </div>
        );
    }

    if (primarySAName) {
        return (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>

                    <div className="flex-1">
                        <p className="text-sm font-medium text-emerald-800">
                            {m['developerPortal.integrationGuide.signingAuthority.configured']()}
                        </p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                            {m['developerPortal.integrationGuide.signingAuthority.using']({ name: primarySAName })}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-amber-600" />
                </div>

                <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">{m['developerPortal.integrationGuide.signingAuthority.notFound']()}</p>
                    <p className="text-xs text-amber-700 mt-1">
                        {m['developerPortal.integrationGuide.signingAuthority.notFoundDesc']()}
                    </p>

                    <button
                        onClick={createDefaultSigningAuthority}
                        disabled={creating}
                        className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
                    >
                        {creating ? (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                {m['developerPortal.integrationGuide.signingAuthority.creating']()}
                            </>
                        ) : (
                            <>
                                <Plus className="w-3 h-3" />
                                {m['developerPortal.integrationGuide.signingAuthority.createDefault']()}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Map permissions to their corresponding API methods
const PERMISSION_TO_METHODS: Record<
    AppPermission,
    { method: string; description: string; code: string }
> = {
    request_identity: {
        method: 'requestIdentity()',
        description: m['developerPortal.integrationGuide.permMethods.requestIdentity'](),
        code: `const { did, profile } = await learnCard.requestIdentity();`,
    },
    send_credential: {
        method: 'sendCredential()',
        description: m['developerPortal.integrationGuide.permMethods.sendCredential'](),
        code: `await learnCard.sendCredential({
    credential: myVerifiableCredential
});`,
    },
    launch_feature: {
        method: 'launchFeature()',
        description: m['developerPortal.integrationGuide.permMethods.launchFeature'](),
        code: `await learnCard.launchFeature('/wallet', 'View your credentials');`,
    },
    credential_search: {
        method: 'askCredentialSearch()',
        description: m['developerPortal.integrationGuide.permMethods.credentialSearch'](),
        code: `const results = await learnCard.askCredentialSearch({
    type: ['VerifiableCredential', 'Achievement']
});`,
    },
    credential_by_id: {
        method: 'askCredentialSpecific()',
        description: m['developerPortal.integrationGuide.permMethods.credentialById'](),
        code: `const credential = await learnCard.askCredentialSpecific('credential-id-123');`,
    },
    request_consent: {
        method: 'requestConsent()',
        description: m['developerPortal.integrationGuide.permMethods.requestConsent'](),
        code: `const consent = await learnCard.requestConsent('contract-uri');`,
    },
    template_issuance: {
        method: 'initiateTemplateIssue()',
        description: m['developerPortal.integrationGuide.permMethods.templateIssuance'](),
        code: `await learnCard.initiateTemplateIssue('template-id', ['recipient@email.com']);`,
    },
};

const EmbeddedIframeGuide: React.FC<{ selectedPermissions?: AppPermission[] }> = ({
    selectedPermissions = [],
}) => {
    return (
        <div className="space-y-6">
            <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
                <p className="text-sm text-cyan-800">
                    {m['developerPortal.integrationGuide.iframe.intro']()}
                </p>
            </div>

            <StepCard
                step={1}
                title={m['developerPortal.integrationGuide.iframe.step1Title']()}
                icon={<Globe className="w-5 h-5 text-gray-500" />}
            >
                <p className="text-sm text-gray-600 mb-3">
                    {m['developerPortal.integrationGuide.iframe.step1Desc']()}
                </p>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                    <p className="text-xs text-amber-800">
                        <span className="font-semibold">{m['developerPortal.integrationGuide.common.important']()}:</span> {m['developerPortal.integrationGuide.iframe.step1Important']()}
                    </p>
                </div>

                <CodeBlock
                    code={`// Required headers for iframe embedding
// Use * to allow embedding from native apps and web
X-Frame-Options: ALLOWALL
Content-Security-Policy: frame-ancestors *

// CORS headers
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type`}
                />
            </StepCard>

            <StepCard
                step={2}
                title={m['developerPortal.integrationGuide.iframe.step2Title']()}
                icon={<Package className="w-5 h-5 text-gray-500" />}
            >
                <p className="text-sm text-gray-600 mb-3">
                    {m['developerPortal.integrationGuide.iframe.step2Desc']()}
                </p>

                <CodeBlock code={`npm install @learncard/partner-connect`} />

                <p className="text-xs text-gray-500 mt-3">
                    {m['developerPortal.integrationGuide.iframe.step2OrYarn']()} 
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded">
                        yarn add @learncard/partner-connect
                    </code>
                </p>
            </StepCard>

            <StepCard
                step={3}
                title={m['developerPortal.integrationGuide.iframe.step3Title']()}
                icon={<Code className="w-5 h-5 text-gray-500" />}
            >
                <p className="text-sm text-gray-600 mb-3">
                    {m['developerPortal.integrationGuide.iframe.step3Desc']()}
                </p>

                <CodeBlock
                    code={`import { createPartnerConnect } from '@learncard/partner-connect';

// Initialize the SDK
const learnCard = createPartnerConnect({
    hostOrigin: '${getAppBaseUrl()}'
});

// Request user identity (SSO)
const identity = await learnCard.requestIdentity();
log.info('User DID:', identity.did);
log.info('User Profile:', identity.profile);`}
                />
            </StepCard>

            <StepCard step={4} title={m['developerPortal.integrationGuide.iframe.step4Title']()} icon={<Zap className="w-5 h-5 text-gray-500" />}>
                <p className="text-sm text-gray-600 mb-4">
                    {selectedPermissions.length > 0
                        ? m['developerPortal.integrationGuide.iframe.step4DescHasPerms']()
                        : m['developerPortal.integrationGuide.iframe.step4DescNoPerms']()}
                </p>

                {selectedPermissions.length > 0 ? (
                    <div className="space-y-3">
                        {selectedPermissions.map(permission => {
                            const methodInfo = PERMISSION_TO_METHODS[permission];
                            if (!methodInfo) return null;
                            return (
                                <div
                                    key={permission}
                                    className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <code className="text-xs font-mono text-cyan-700 bg-white px-2 py-1 rounded">
                                            {methodInfo.method}
                                        </code>
                                        <span className="text-xs text-cyan-600">
                                            {methodInfo.description}
                                        </span>
                                    </div>
                                    <CodeBlock code={methodInfo.code} />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <code className="text-xs font-mono text-cyan-700 bg-cyan-50 px-2 py-1 rounded">
                                    requestIdentity()
                                </code>
                                <span className="text-xs text-gray-500">
                                    {m['developerPortal.integrationGuide.permMethods.requestIdentity']()}
                                </span>
                            </div>
                            <CodeBlock
                                code={`const { did, profile } = await learnCard.requestIdentity();`}
                            />
                        </div>

                        <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <code className="text-xs font-mono text-cyan-700 bg-cyan-50 px-2 py-1 rounded">
                                    sendCredential()
                                </code>
                                <span className="text-xs text-gray-500">{m['developerPortal.integrationGuide.permMethods.sendCredential']()}</span>
                            </div>
                            <CodeBlock
                                code={`await learnCard.sendCredential({ credential: myVerifiableCredential });`}
                            />
                        </div>
                    </div>
                )}

                {selectedPermissions.length > 0 && (
                    <p className="text-xs text-gray-500 mt-4 italic">
                        {m['developerPortal.integrationGuide.iframe.step4Tip']({
                              count: selectedPermissions.length,
                          })}
                    </p>
                )}
            </StepCard>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <h4 className="text-sm font-medium text-gray-700 mb-2">{m['developerPortal.integrationGuide.iframe.apiRefTitle']()}</h4>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-2 pr-4 text-gray-600 font-medium">
                                    {m['developerPortal.integrationGuide.common.method']()}
                                </th>
                                <th className="text-left py-2 pr-4 text-gray-600 font-medium">
                                    {m['developerPortal.integrationGuide.common.description']()}
                                </th>
                                <th className="text-left py-2 text-gray-600 font-medium">
                                    {m['developerPortal.integrationGuide.common.returns']()}
                                </th>
                            </tr>
                        </thead>

                        <tbody className="text-gray-600">
                            <tr className="border-b border-gray-100">
                                <td className="py-2 pr-4 font-mono text-cyan-700">
                                    requestIdentity()
                                </td>
                                <td className="py-2 pr-4">{m['developerPortal.integrationGuide.iframe.apiRefRowIdentity']()}</td>
                                <td className="py-2">IdentityResponse</td>
                            </tr>

                            <tr className="border-b border-gray-100">
                                <td className="py-2 pr-4 font-mono text-cyan-700">
                                    sendCredential(vc)
                                </td>
                                <td className="py-2 pr-4">{m['developerPortal.integrationGuide.iframe.apiRefRowSendCred']()}</td>
                                <td className="py-2">SendCredentialResponse</td>
                            </tr>

                            <tr className="border-b border-gray-100">
                                <td className="py-2 pr-4 font-mono text-cyan-700">
                                    launchFeature(path)
                                </td>
                                <td className="py-2 pr-4">{m['developerPortal.integrationGuide.iframe.apiRefRowLaunch']()}</td>
                                <td className="py-2">void</td>
                            </tr>

                            <tr className="border-b border-gray-100">
                                <td className="py-2 pr-4 font-mono text-cyan-700">
                                    askCredentialSearch(vpr)
                                </td>
                                <td className="py-2 pr-4">{m['developerPortal.integrationGuide.iframe.apiRefRowSearch']()}</td>
                                <td className="py-2">CredentialSearchResponse</td>
                            </tr>

                            <tr className="border-b border-gray-100">
                                <td className="py-2 pr-4 font-mono text-cyan-700">
                                    askCredentialSpecific(id)
                                </td>
                                <td className="py-2 pr-4">{m['developerPortal.integrationGuide.iframe.apiRefRowSpecific']()}</td>
                                <td className="py-2">CredentialSpecificResponse</td>
                            </tr>

                            <tr className="border-b border-gray-100">
                                <td className="py-2 pr-4 font-mono text-cyan-700">
                                    requestConsent(uri)
                                </td>
                                <td className="py-2 pr-4">{m['developerPortal.integrationGuide.iframe.apiRefRowConsent']()}</td>
                                <td className="py-2">ConsentResponse</td>
                            </tr>

                            <tr className="border-b border-gray-100">
                                <td className="py-2 pr-4 font-mono text-cyan-700">
                                    initiateTemplateIssue(id)
                                </td>
                                <td className="py-2 pr-4">{m['developerPortal.integrationGuide.iframe.apiRefRowIssue']()}</td>
                                <td className="py-2">TemplateIssueResponse</td>
                            </tr>

                            <tr>
                                <td className="py-2 pr-4 font-mono text-cyan-700">destroy()</td>
                                <td className="py-2 pr-4">{m['developerPortal.integrationGuide.iframe.apiRefRowDestroy']()}</td>
                                <td className="py-2">void</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <a
                href="https://docs.learncard.com/sdks/partner-connect"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full p-3 bg-cyan-500 text-white rounded-xl text-sm font-medium hover:bg-cyan-600 transition-colors"
            >
                {m['developerPortal.integrationGuide.common.viewFullDocs']()}
                <ExternalLink className="w-4 h-4" />
            </a>
        </div>
    );
};

const ConsentRedirectGuide: React.FC<{ contractUri?: string }> = ({ contractUri }) => {
    const displayContractUri = contractUri || 'lc:contract:example123...';
    const hasContractUri = Boolean(contractUri);

    const [showCredentialBuilder, setShowCredentialBuilder] = useState(false);
    const [builtCredential, setBuiltCredential] = useState<Record<string, unknown> | null>(null);

    // Generate the code sample based on built credential or default
    const credentialCodeSample = useMemo(() => {
        if (builtCredential) {
            // Format the credential nicely for the code block
            const credJson = JSON.stringify(builtCredential, null, 12)
                .split('\n')
                .map((line, i) => (i === 0 ? line : `            ${line}`))
                .join('\n');

            return `// Get the user's DID (stored from Step 2)
const userDID = await getUserLearnCardDID(userId);

// Send a credential to the user
await learnCard.invoke.send({
    type: 'boost',
    recipient: userDID,
    contractUri: consentFlowContractURI,
    template: {
        credential: ${credJson},
        name: 'Course Completion',
        category: 'Achievement',
    }
})`;
        }

        return `// Get the user's DID (stored from Step 2)
const userDID = await getUserLearnCardDID(userId);

// Send a credential to the user
await learnCard.invoke.send({
    type: 'boost',
    recipient: userDID,
    contractUri: consentFlowContractURI,
    template: {
        credential: {
            // Open Badges 3.0 credential
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json'
            ],
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            name: 'Course Completion',
            credentialSubject: {
                achievement: {
                    name: 'Connected External App',
                    description: 'Awarded for connecting to our app.',
                    achievementType: 'Achievement',
                    image: 'https://placehold.co/400x400?text=Badge'
                }
            }
        },
        name: 'Course Completion',
        category: 'Achievement',
    }
})`;
    }, [builtCredential]);

    return (
        <div className="space-y-6">
            <OBv3CredentialBuilder
                isOpen={showCredentialBuilder}
                onClose={() => setShowCredentialBuilder(false)}
                onSave={cred => setBuiltCredential(cred)}
            />
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                <p className="text-sm text-indigo-800">
                    Use the Consent Redirect flow to collect user consent and credentials from your
                    external application. Users will be redirected to LearnCard to grant
                    permissions, then back to your app with their credentials.
                </p>
            </div>

            <StepCard
                step={1}
                title={m['developerPortal.integrationGuide.consent.step1Title']()}
                icon={<Globe className="w-5 h-5 text-gray-500" />}
            >
                <p className="text-sm text-gray-600 mb-3">
                    First, create or select a Consent Flow Contract that defines what permissions
                    your app needs. You can do this in the Developer Portal or via the API.
                </p>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                    <p className="text-xs text-amber-800">
                        <strong>Important:</strong> Copy and save your Contract URI — you'll need it
                        to send credentials later.
                    </p>
                </div>

                {hasContractUri ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
                        <p className="text-xs text-green-800 mb-2">
                            <span className="font-semibold">{m['developerPortal.integrationGuide.consent.step1ContractSelected']()}</span>
                        </p>
                        <code className="text-xs bg-green-100 px-2 py-1 rounded break-all block">
                            {contractUri}
                        </code>
                    </div>
                ) : (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg mb-3">
                        <p className="text-xs text-gray-600">
                            Select a consent flow contract above to see your URI here.
                        </p>
                    </div>
                )}

                <CodeBlock
                    code={`// Your Contract URI
const consentFlowContractURI = '${displayContractUri}';`}
                />
            </StepCard>

            <StepCard
                step={2}
                title={m['developerPortal.integrationGuide.consent.step2Title']()}
                icon={<Code className="w-5 h-5 text-gray-500" />}
            >
                <p className="text-sm text-gray-600 mb-3">
                    {m['developerPortal.integrationGuide.consent.step2Desc']()}
                </p>

                <CodeBlock
                    code={`// Example: /api/learncard/callback or /auth/learncard/redirect

app.get('/api/learncard/callback', async (req, res) => {
    // Extract the user's DID and delegate VP JWT from URL params
    const { did, vp } = req.query;

    // Store these with the user's account in your system
    await saveUserLearnCardCredentials(userId, {
        did: did,
        vp: vp, // VP JWT containing a delegate credential
    });

    // Redirect to your app's success page
    res.redirect('/dashboard?connected=true');
});`}
                />

                <p className="text-xs text-gray-500 mt-3">
                    {m['developerPortal.integrationGuide.consent.step2Note']()}
                </p>
            </StepCard>

            <StepCard
                step={3}
                title={m['developerPortal.integrationGuide.consent.step3Title']()}
                icon={<Key className="w-5 h-5 text-gray-500" />}
            >
                <p className="text-sm text-gray-600 mb-4">
                    {m['developerPortal.integrationGuide.consent.step3Desc']()}
                </p>

                <InlineAPITokenManager />
            </StepCard>

            <StepCard
                step={4}
                title={m['developerPortal.integrationGuide.consent.step4Title']()}
                icon={<Package className="w-5 h-5 text-gray-500" />}
            >
                <p className="text-sm text-gray-600 mb-3">
                    {m['developerPortal.integrationGuide.consent.step4Desc']()}
                </p>

                <CodeBlock code={`npm install @learncard/init`} />

                <p className="text-xs text-gray-500 mt-3 mb-3">
                    Then initialize with your API key:
                </p>

                <CodeBlock
                    code={`import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard({ 
    apiKey: process.env.LEARNCARD_API_KEY,
    network: true 
});

log.info('LearnCard DID:', learnCard.id.did());`}
                />
            </StepCard>

            <StepCard
                step={5}
                title={m['developerPortal.integrationGuide.consent.step5Title']()}
                icon={<Zap className="w-5 h-5 text-gray-500" />}
            >
                <p className="text-sm text-gray-600 mb-3">
                    {m['developerPortal.integrationGuide.consent.step5Desc']()}
                </p>

                {/* Credential Builder Button */}
                <div className="mb-4">
                    <button
                        onClick={() => setShowCredentialBuilder(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-medium hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                    >
                        <Award className="w-4 h-4" />
                        {m['developerPortal.integrationGuide.consent.step5BuildCred']()}
                    </button>

                    {builtCredential && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600">
                            <Check className="w-3.5 h-3.5" />
                            <span>{m['developerPortal.integrationGuide.consent.step5CredAdded']()}</span>
                        </div>
                    )}
                </div>

                <CodeBlock code={credentialCodeSample} />

                <div className="mt-4 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                    <p className="text-xs text-cyan-800">
                        <span className="font-semibold">{m['developerPortal.integrationGuide.common.whatThisDoes']()}:</span> {m['developerPortal.integrationGuide.consent.step5WhatsThis']()}
                    </p>
                </div>
            </StepCard>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <h4 className="text-sm font-medium text-gray-700 mb-2">{m['developerPortal.integrationGuide.common.flowSummary']()}</h4>

                <ol className="text-xs text-gray-600 space-y-2 list-decimal list-inside">
                    <li>{m['developerPortal.integrationGuide.consent.flowStep1']()}</li>
                    <li>{m['developerPortal.integrationGuide.consent.flowStep2']()}</li>
                    <li>{m['developerPortal.integrationGuide.consent.flowStep3']()}</li>
                    <li>{m['developerPortal.integrationGuide.consent.flowStep4']()}</li>
                    <li>{m['developerPortal.integrationGuide.consent.flowStep5']()}</li>
                </ol>
            </div>

            <StepCard
                step={6}
                title={m['developerPortal.integrationGuide.consent.step6Title']()}
                icon={<Database className="w-5 h-5 text-gray-500" />}
            >
                <p className="text-sm text-gray-600 mb-4">
                    {m['developerPortal.integrationGuide.consent.step6Desc']()}
                </p>

                <div className="space-y-4">
                    <div>
                        <p className="text-xs text-gray-500 mb-2 font-medium">
                            {m['developerPortal.integrationGuide.consent.step6AllData']()}
                        </p>
                        <CodeBlock
                            code={`// Query all consent records for your contract
const queryOptions = { limit: 50 };

const consentData = await learnCard.invoke.getConsentFlowData(
    consentFlowContractURI,
    queryOptions
);

log.info('Consented records:', consentData.records);`}
                        />
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 mb-2 font-medium">
                            {m['developerPortal.integrationGuide.consent.step6UserData']()}
                        </p>
                        <CodeBlock
                            code={`// Query consent data involving a specific DID
const userConsentData = await learnCard.invoke.getConsentFlowDataForDid(
    userDID,
    queryOptions
);

log.info('User consent records:', userConsentData.records);`}
                        />
                    </div>
                </div>
            </StepCard>

            <a
                href="https://docs.learncard.com/core-concepts/consent-and-permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full p-3 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors"
            >
                {m['developerPortal.integrationGuide.common.viewFullDocs']()}
                <ExternalLink className="w-4 h-4" />
            </a>
        </div>
    );
};

// Server Headless Guide - using Universal Inbox
const ServerHeadlessGuide: React.FC<{ webhookUrl?: string }> = ({ webhookUrl }) => {
    return (
        <div className="space-y-6">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-sm text-emerald-800">
                    {m['developerPortal.integrationGuide.server.intro']()}
                </p>
            </div>

            <StepCard
                step={1}
                title={m['developerPortal.integrationGuide.server.step1Title']()}
                icon={<Shield className="w-5 h-5 text-gray-500" />}
            >
                <p className="text-sm text-gray-600 mb-4">
                    {m['developerPortal.integrationGuide.server.step1Desc']()}
                </p>

                <InlineSigningAuthoritySetup />
            </StepCard>

            <StepCard
                step={2}
                title={m['developerPortal.integrationGuide.server.step2Title']()}
                icon={<Key className="w-5 h-5 text-gray-500" />}
            >
                <p className="text-sm text-gray-600 mb-4">
                    {m['developerPortal.integrationGuide.server.step2Desc']()}
                </p>

                <InlineAPITokenManager />
            </StepCard>

            <StepCard
                step={3}
                title={m['developerPortal.integrationGuide.server.step3Title']()}
                icon={<Package className="w-5 h-5 text-gray-500" />}
            >
                <p className="text-sm text-gray-600 mb-3">
                    {m['developerPortal.integrationGuide.server.step3Desc']()}
                </p>

                <CodeBlock code={`npm install @learncard/init`} />

                <p className="text-xs text-gray-500 mt-3 mb-3">
                    {m['developerPortal.integrationGuide.server.step3Init']()}
                </p>

                <CodeBlock
                    code={`import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard({ 
    apiKey: process.env.LEARNCARD_API_KEY,
    network: true 
});`}
                />
            </StepCard>

            <StepCard
                step={4}
                title={m['developerPortal.integrationGuide.server.step4Title']()}
                icon={<Send className="w-5 h-5 text-gray-500" />}
            >
                <p className="text-sm text-gray-600 mb-3">
                    {m['developerPortal.integrationGuide.server.step4Desc']()}
                </p>

                <CodeBlock
                    code={`// Issue a credential to a user's email
const result = await learnCard.invoke.inbox.issue({
    // Recipient - just need email or phone!
    recipient: { 
        type: 'email', 
        value: 'user@example.com' 
    },
    
    // Your credential (unsigned - we'll sign it for you)
    credential: {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json'
        ],
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        name: 'Course Completion Badge',
        credentialSubject: {
            achievement: {
                name: 'Introduction to AI',
                description: 'Successfully completed the course',
                achievementType: 'Certificate',
                image: 'https://yoursite.com/badge.png'
            }
        }
    },
    
    // Optional configuration
    configuration: {
        webhookUrl: '${webhookUrl || 'https://yoursite.com/webhooks/learncard'}',
        delivery: {
            template: {
                model: {
                    issuer: { 
                        name: 'Your Organization',
                        logoUrl: 'https://yoursite.com/logo.png'
                    }
                }
            }
        }
    }
});

// Response
log.info(result);
// {
//   issuanceId: 'abc123',
//   status: 'ISSUED' | 'PENDING',
//   claimUrl: 'https://...',  // If user doesn't have wallet yet
//   recipientDid: 'did:...'   // If user already has wallet
// }`}
                />

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                    <p className="text-xs text-blue-800">
                        <span className="font-semibold">{m['developerPortal.integrationGuide.common.whatHappens']()}:</span> {m['developerPortal.integrationGuide.server.step4WhatsThis']()}
                    </p>
                </div>
            </StepCard>

            <StepCard
                step={5}
                title={m['developerPortal.integrationGuide.server.step5Title']()}
                icon={<Webhook className="w-5 h-5 text-gray-500" />}
            >
                <p className="text-sm text-gray-600 mb-3">
                    {m['developerPortal.integrationGuide.server.step5Desc']()}
                </p>

                <CodeBlock
                    code={`// Express webhook handler
app.post('/webhooks/learncard', (req, res) => {
    const { type, data } = req.body;
    
    switch (type) {
        case 'ISSUANCE_DELIVERED':
            log.info('Credential delivered!', {
                issuanceId: data.inbox.issuanceId,
                status: data.inbox.status,
                recipient: data.inbox.recipient
            });
            break;
    }
    
    res.json({ received: true });
});`}
                />
            </StepCard>

            <StepCard
                step={6}
                title={m['developerPortal.integrationGuide.server.step6Title']()}
                icon={<Server className="w-5 h-5 text-gray-500" />}
            >
                <p className="text-sm text-gray-600 mb-3">
                    {m['developerPortal.integrationGuide.server.step6Desc']()}
                </p>

                <CodeBlock
                    code={`curl -X POST ${getResolvedTenantConfig().apis.lcaApi.replace(
                        '/trpc',
                        ''
                    )}/api/inbox/issue \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipient": {
        "type": "email",
        "value": "user@example.com"
    },
    "credential": {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        "type": ["VerifiableCredential", "OpenBadgeCredential"],
        "name": "Course Completion",
        "credentialSubject": {
            "achievement": {
                "name": "Course Name",
                "description": "Completed the course"
            }
        }
    }
}'`}
                />
            </StepCard>

            <div className="p-4 bg-gray-100 rounded-xl">
                <h4 className="text-sm font-medium text-gray-700 mb-2">{m['developerPortal.integrationGuide.common.flowSummary']()}</h4>

                <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-medium">
                            1
                        </div>
                        <span>{m['developerPortal.integrationGuide.server.flowStep1']()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-medium">
                            2
                        </div>
                        <span>{m['developerPortal.integrationGuide.server.flowStep2']()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-medium">
                            3
                        </div>
                        <span>{m['developerPortal.integrationGuide.server.flowStep3']()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-medium">
                            4
                        </div>
                        <span>{m['developerPortal.integrationGuide.server.flowStep4']()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-medium">
                            5
                        </div>
                        <span>{m['developerPortal.integrationGuide.server.flowStep5']()}</span>
                    </div>
                </div>
            </div>

            <a
                href="https://docs.learncard.com/how-to-guides/send-credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full p-3 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
            >
                {m['developerPortal.integrationGuide.server.viewDocs']()}
                <ExternalLink className="w-4 h-4" />
            </a>
        </div>
    );
};

// Direct Link Guide
const DirectLinkGuide: React.FC<{ url?: string }> = ({ url }) => {
    return (
        <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-800">
                    {m['developerPortal.integrationGuide.directLink.intro']()}
                </p>
            </div>

            <StepCard
                step={1}
                title={m['developerPortal.integrationGuide.directLink.step1Title']()}
                icon={<Globe className="w-5 h-5 text-gray-500" />}
            >
                <p className="text-sm text-gray-600 mb-3">
                    {m['developerPortal.integrationGuide.directLink.step1Desc']()}
                </p>

                <CodeBlock code={url || 'https://yourapp.com'} />

                <p className="text-xs text-gray-500 mt-3">
                    {m['developerPortal.integrationGuide.directLink.step1Note']()}
                </p>
            </StepCard>

            <StepCard
                step={2}
                title={m['developerPortal.integrationGuide.directLink.step2Title']()}
                icon={<Code className="w-5 h-5 text-gray-500" />}
            >
                <p className="text-sm text-gray-600 mb-3">
                    {m['developerPortal.integrationGuide.directLink.step2Desc']()}
                </p>

                <CodeBlock
                    code={`// Your app receives:
${url || 'https://yourapp.com'}?did=did:web:user.learncard.com

// Extract the DID in your app
const urlParams = new URLSearchParams(window.location.search);
const userDid = urlParams.get('did');

if (userDid) {
    // User is authenticated via LearnCard
    log.info('User DID:', userDid);
}`}
                />
            </StepCard>

            <StepCard
                step={3}
                title={m['developerPortal.integrationGuide.directLink.step3Title']()}
                icon={<Key className="w-5 h-5 text-gray-500" />}
            >
                <p className="text-sm text-gray-600 mb-3">
                    {m['developerPortal.integrationGuide.directLink.step3Desc']()}
                </p>

                <CodeBlock
                    code={`import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard({ network: true });

// Resolve the user's DID document
const didDocument = await learnCard.invoke.resolveDid(userDid);
log.info('User Profile:', didDocument);`}
                />
            </StepCard>

            <div className="p-4 bg-gray-100 rounded-xl">
                <h4 className="text-sm font-medium text-gray-700 mb-2">{m['developerPortal.integrationGuide.directLink.whenToUse']()}</h4>

                <ul className="space-y-1 text-xs text-gray-600">
                    <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {m['developerPortal.integrationGuide.directLink.useCase1']()}
                    </li>

                    <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {m['developerPortal.integrationGuide.directLink.useCase2']()}
                    </li>

                    <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {m['developerPortal.integrationGuide.directLink.useCase3']()}
                    </li>
                </ul>
            </div>
        </div>
    );
};

// AI Tutor Guide
const AITutorGuide: React.FC<{ aiTutorUrl?: string }> = ({ aiTutorUrl }) => {
    return (
        <div className="space-y-6">
            <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl">
                <p className="text-sm text-violet-800">
                    {m['developerPortal.integrationGuide.aiTutor.intro']()}
                </p>
            </div>

            <StepCard
                step={1}
                title={m['developerPortal.integrationGuide.aiTutor.step1Title']()}
                icon={<Sparkles className="w-5 h-5 text-gray-500" />}
            >
                <p className="text-sm text-gray-600 mb-3">
                    {m['developerPortal.integrationGuide.aiTutor.step1Desc']()}
                </p>

                <CodeBlock code={aiTutorUrl || 'https://yourtutor.com'} />

                <p className="text-xs text-gray-500 mt-3">
                    {m['developerPortal.integrationGuide.aiTutor.step1Redirect']()} {' '}
                    <code className="bg-gray-100 px-1 rounded">
                        {aiTutorUrl || 'https://yourtutor.com'}/chats?did=...&topic=...
                    </code>
                </p>
            </StepCard>

            <StepCard
                step={2}
                title={m['developerPortal.integrationGuide.aiTutor.step2Title']()}
                icon={<Code className="w-5 h-5 text-gray-500" />}
            >
                <p className="text-sm text-gray-600 mb-3">
                    {m['developerPortal.integrationGuide.aiTutor.step2Desc']()}
                </p>

                <CodeBlock
                    code={`// Extract parameters from URL
const urlParams = new URLSearchParams(window.location.search);
const userDid = urlParams.get('did');
const topic = urlParams.get('topic');

log.info('Starting session for:', { userDid, topic });

// Initialize your AI tutor with the topic
initTutorSession({
    userDid,
    topic,
    // Your tutor configuration...
});`}
                />
            </StepCard>

            <StepCard
                step={3}
                title={m['developerPortal.integrationGuide.aiTutor.step3Title']()}
                icon={<Database className="w-5 h-5 text-gray-500" />}
            >
                <p className="text-sm text-gray-600 mb-3">
                    {m['developerPortal.integrationGuide.aiTutor.step3Desc']()}
                </p>

                <CodeBlock
                    code={`// After a learning milestone is achieved
await learnCard.invoke.send({
    type: 'boost',
    recipient: userDid,
    template: {
        credential: {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json'
            ],
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            name: topic,
            credentialSubject: {
                achievement: {
                    name: topic,
                    description: 'Completed AI tutoring session',
                    achievementType: 'Achievement'
                }
            }
        },
        name: topic,
        category: 'Achievement',
    }
});`}
                />
            </StepCard>

            <div className="p-4 bg-gray-100 rounded-xl">
                <h4 className="text-sm font-medium text-gray-700 mb-2">{m['developerPortal.integrationGuide.aiTutor.userFlow']()}</h4>

                <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-medium">
                            1
                        </div>
                        <span>{m['developerPortal.integrationGuide.aiTutor.flowStep1']()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-medium">
                            2
                        </div>
                        <span>{m['developerPortal.integrationGuide.aiTutor.flowStep2']()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-medium">
                            3
                        </div>
                        <span>{m['developerPortal.integrationGuide.aiTutor.flowStep3']()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-medium">
                            4
                        </div>
                        <span>{m['developerPortal.integrationGuide.aiTutor.flowStep4']()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-medium">
                            5
                        </div>
                        <span>{m['developerPortal.integrationGuide.aiTutor.flowStep5']()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const IntegrationGuidePanel: React.FC<IntegrationGuidePanelProps> = ({
    isOpen,
    onClose,
    launchType,
    selectedPermissions = [],
    contractUri,
    webhookUrl,
}) => {
    const renderGuideContent = () => {
        switch (launchType) {
            case 'EMBEDDED_IFRAME':
                return <EmbeddedIframeGuide selectedPermissions={selectedPermissions} />;
            case 'CONSENT_REDIRECT':
                return <ConsentRedirectGuide contractUri={contractUri} />;
            case 'SERVER_HEADLESS':
                return <ServerHeadlessGuide webhookUrl={webhookUrl} />;
            case 'DIRECT_LINK':
                return <DirectLinkGuide />;
            case 'AI_TUTOR':
                return <AITutorGuide />;
            default:
                return (
                    <div className="p-8 text-center text-gray-500">
                        <p>{m['developerPortal.integrationGuide.panel.comingSoon']()}</p>
                    </div>
                );
        }
    };

    const getTitle = () => {
        switch (launchType) {
            case 'EMBEDDED_IFRAME':
                return m['developerPortal.integrationGuide.panel.iframeTitle']();
            case 'SECOND_SCREEN':
                return m['developerPortal.integrationGuide.panel.consentTitle']();
            case 'DIRECT_LINK':
                return m['developerPortal.integrationGuide.panel.directLinkTitle']();
            case 'CONSENT_REDIRECT':
                return m['developerPortal.integrationGuide.panel.consentTitle']();
            case 'SERVER_HEADLESS':
                return m['developerPortal.integrationGuide.panel.serverTitle']();
            case 'AI_TUTOR':
                return m['developerPortal.integrationGuide.panel.aiTutorTitle']();
            default:
                return m['developerPortal.integrationGuide.panel.title']();
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998] transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            />

            {/* Slide-out Panel - positioned below header */}
            <div
                className={`fixed top-16 right-0 h-[calc(100%-64px)] w-full max-w-lg bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ease-out rounded-tl-2xl ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-tl-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Code className="w-5 h-5 text-white" />
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-white">{getTitle()}</h3>
                            <p className="text-xs text-cyan-100">{m['developerPortal.integrationGuide.panel.subtitle']()}</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto h-[calc(100%-80px)] p-6">
                    {renderGuideContent()}
                </div>
            </div>
        </>
    );
};
