import React, { useState, useCallback, useEffect } from 'react';
import { X, Copy, Check, ExternalLink, ChevronRight, Code, Globe, Package, Zap, Key, Database, Plus, Trash2, MoreVertical, Eye, EyeOff } from 'lucide-react';
import { Clipboard } from '@capacitor/clipboard';

import { useWallet, useToast, ToastTypeEnum, useConfirmation } from 'learn-card-base';
import type { AppPermission } from '../types';

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
}

// Simple syntax highlighter for TypeScript/JavaScript
const highlightCode = (code: string): React.ReactNode[] => {
    const tokens: { type: string; value: string }[] = [];
    let remaining = code;

    const patterns: { type: string; regex: RegExp }[] = [
        { type: 'comment', regex: /^(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/ },
        { type: 'string', regex: /^(`[\s\S]*?`|'[^']*'|"[^"]*")/ },
        { type: 'keyword', regex: /^(const|let|var|function|async|await|return|import|export|from|if|else|for|while|class|new|typeof|instanceof)\b/ },
        { type: 'boolean', regex: /^(true|false|null|undefined)\b/ },
        { type: 'function', regex: /^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/ },
        { type: 'property', regex: /^(\.[a-zA-Z_$][a-zA-Z0-9_$]*)/ },
        { type: 'number', regex: /^(\d+\.?\d*)/ },
        { type: 'punctuation', regex: /^([{}[\]();:,])/ },
        { type: 'operator', regex: /^(=>|===|!==|==|!=|<=|>=|&&|\|\||[+\-*/%=<>!&|])/ },
        { type: 'text', regex: /^[^\s]+/ },
        { type: 'whitespace', regex: /^(\s+)/ },
    ];

    while (remaining.length > 0) {
        let matched = false;

        for (const { type, regex } of patterns) {
            const match = remaining.match(regex);

            if (match) {
                tokens.push({ type, value: match[0] });
                remaining = remaining.slice(match[0].length);
                matched = true;
                break;
            }
        }

        if (!matched) {
            tokens.push({ type: 'text', value: remaining[0] });
            remaining = remaining.slice(1);
        }
    }

    const colorMap: Record<string, string> = {
        keyword: 'text-purple-400',
        string: 'text-green-400',
        comment: 'text-gray-500 italic',
        function: 'text-yellow-300',
        property: 'text-cyan-300',
        number: 'text-orange-400',
        boolean: 'text-orange-400',
        punctuation: 'text-gray-400',
        operator: 'text-pink-400',
        text: 'text-gray-100',
        whitespace: '',
    };

    return tokens.map((token, i) => (
        <span key={i} className={colorMap[token.type] || 'text-gray-100'}>
            {token.value}
        </span>
    ));
};

const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language = 'typescript' }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group">
            <pre className="p-4 bg-gray-900 rounded-xl text-xs overflow-x-auto">
                <code className="font-mono">{highlightCode(code)}</code>
            </pre>

            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
                {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                ) : (
                    <Copy className="w-4 h-4 text-gray-300" />
                )}
            </button>
        </div>
    );
};

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
    { label: 'Full Access', value: '*:*', description: 'Complete access to all resources' },
    { label: 'Read Only', value: '*:read', description: 'Read access to all resources' },
    { label: 'Profile Management', value: 'profile:* profileManager:*', description: 'Manage profiles' },
    { label: 'Credential Management', value: 'credential:* presentation:* boosts:*', description: 'Manage credentials' },
    { label: 'Contracts', value: 'contracts:*', description: 'Manage contracts' },
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
            console.error('Failed to fetch auth grants:', err);
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
                description: 'Created from Integration Guide',
                scope: selectedScope,
            });

            presentToast('API Token created successfully', { hasDismissButton: true });
            setNewTokenName('');
            setShowCreateForm(false);
            fetchAuthGrants();
        } catch (err) {
            console.error('Failed to create token:', err);
            presentToast('Failed to create API Token', { type: ToastTypeEnum.Error, hasDismissButton: true });
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
            console.error('Failed to copy token:', err);
            presentToast('Failed to copy API Token', { type: ToastTypeEnum.Error, hasDismissButton: true });
        }
    };

    const revokeToken = async (grant: Partial<AuthGrant>) => {
        const confirmed = await confirm({
            text: `Are you sure you want to ${grant.status === 'active' ? 'revoke' : 'delete'} "${grant.name}"?`,
            onConfirm: async () => {},
            cancelButtonClassName: 'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px]',
            confirmButtonClassName: 'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
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
            console.error('Failed to revoke/delete token:', err);
            presentToast('Failed to update API Token', { type: ToastTypeEnum.Error, hasDismissButton: true });
        }
    };

    const activeGrants = authGrants.filter(g => g.status === 'active');

    return (
        <div className="space-y-3">
            {/* Header with create button */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">
                    {loading ? 'Loading...' : `${activeGrants.length} active token${activeGrants.length !== 1 ? 's' : ''}`}
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
                        <label className="block text-xs font-medium text-gray-700 mb-1">Token Name</label>
                        <input
                            type="text"
                            value={newTokenName}
                            onChange={(e) => setNewTokenName(e.target.value)}
                            placeholder="e.g., Production API"
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Scope / Permissions</label>
                        <select
                            value={selectedScope}
                            onChange={(e) => setSelectedScope(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            {SCOPE_OPTIONS.map((option) => (
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
                            {creating ? 'Creating...' : 'Create Token'}
                        </button>

                        <button
                            onClick={() => { setShowCreateForm(false); setNewTokenName(''); setSelectedScope('*:*'); }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Token list */}
            {!loading && activeGrants.length > 0 && (
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {activeGrants.map((grant) => (
                        <div key={grant.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{grant.name}</p>
                                <p className="text-xs text-gray-500">
                                    Created {new Date(grant.createdAt!).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => copyToken(grant.id!)}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Copy token"
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
                                    title="Revoke token"
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
                    <p className="text-sm text-gray-600">No API tokens yet</p>
                    <p className="text-xs text-gray-500 mt-1">Create one to authenticate your backend</p>
                </div>
            )}

            {/* Security note */}
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-800">
                    <strong>Security:</strong> Never expose your API key in client-side code.
                </p>
            </div>
        </div>
    );
};

// Map permissions to their corresponding API methods
const PERMISSION_TO_METHODS: Record<AppPermission, { method: string; description: string; code: string }> = {
    request_identity: {
        method: 'requestIdentity()',
        description: 'Returns user DID & profile',
        code: `const { did, profile } = await learnCard.requestIdentity();`,
    },
    send_credential: {
        method: 'sendCredential()',
        description: 'Send VC to wallet',
        code: `await learnCard.sendCredential({
    credential: myVerifiableCredential
});`,
    },
    launch_feature: {
        method: 'launchFeature()',
        description: 'Navigate host wallet',
        code: `await learnCard.launchFeature('/wallet', 'View your credentials');`,
    },
    credential_search: {
        method: 'askCredentialSearch()',
        description: 'Search user credentials',
        code: `const results = await learnCard.askCredentialSearch({
    type: ['VerifiableCredential', 'Achievement']
});`,
    },
    credential_by_id: {
        method: 'askCredentialSpecific()',
        description: 'Get specific credential',
        code: `const credential = await learnCard.askCredentialSpecific('credential-id-123');`,
    },
    request_consent: {
        method: 'requestConsent()',
        description: 'Request user consent',
        code: `const consent = await learnCard.requestConsent('contract-uri');`,
    },
    template_issuance: {
        method: 'initiateTemplateIssue()',
        description: 'Issue from template/boost',
        code: `await learnCard.initiateTemplateIssue('template-id', ['recipient@email.com']);`,
    },
};

const EmbeddedIframeGuide: React.FC<{ selectedPermissions?: AppPermission[] }> = ({ selectedPermissions = [] }) => {
    return (
    <div className="space-y-6">
        <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
            <p className="text-sm text-cyan-800">
                Create an embedded app that runs inside the LearnCard wallet. Your app can request user identity, send credentials, and more.
            </p>
        </div>

        <StepCard step={1} title="Set Up Your Website" icon={<Globe className="w-5 h-5 text-gray-500" />}>
            <p className="text-sm text-gray-600 mb-3">
                Create and host a website that can be embedded in an iframe. You'll need to configure CORS headers.
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                <p className="text-xs text-amber-800">
                    <strong>Important:</strong> Your server must include these response headers:
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

        <StepCard step={2} title="Install the SDK" icon={<Package className="w-5 h-5 text-gray-500" />}>
            <p className="text-sm text-gray-600 mb-3">
                Install the LearnCard Partner Connect SDK to communicate with the wallet.
            </p>

            <CodeBlock code={`npm install @learncard/partner-connect`} />

            <p className="text-xs text-gray-500 mt-3">
                Or use yarn: <code className="bg-gray-100 px-1.5 py-0.5 rounded">yarn add @learncard/partner-connect</code>
            </p>
        </StepCard>

        <StepCard step={3} title="Initialize Partner Connect" icon={<Code className="w-5 h-5 text-gray-500" />}>
            <p className="text-sm text-gray-600 mb-3">
                Set up the SDK in your application to communicate with the LearnCard wallet.
            </p>

            <CodeBlock
                code={`import { createPartnerConnect } from '@learncard/partner-connect';

// Initialize the SDK
const learnCard = createPartnerConnect({
    hostOrigin: 'https://learncard.app'
});

// Request user identity (SSO)
const identity = await learnCard.requestIdentity();
console.log('User DID:', identity.did);
console.log('User Profile:', identity.profile);`}
            />
        </StepCard>

        <StepCard step={4} title="Use the API" icon={<Zap className="w-5 h-5 text-gray-500" />}>
            <p className="text-sm text-gray-600 mb-4">
                {selectedPermissions.length > 0 
                    ? 'Based on your selected permissions, here are the methods you can use:'
                    : 'Select permissions above to see relevant API methods. Here are some common ones:'}
            </p>

            {selectedPermissions.length > 0 ? (
                <div className="space-y-3">
                    {selectedPermissions.map(permission => {
                        const methodInfo = PERMISSION_TO_METHODS[permission];
                        if (!methodInfo) return null;
                        return (
                            <div key={permission} className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <code className="text-xs font-mono text-cyan-700 bg-white px-2 py-1 rounded">{methodInfo.method}</code>
                                    <span className="text-xs text-cyan-600">{methodInfo.description}</span>
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
                            <code className="text-xs font-mono text-cyan-700 bg-cyan-50 px-2 py-1 rounded">requestIdentity()</code>
                            <span className="text-xs text-gray-500">Returns user DID & profile</span>
                        </div>
                        <CodeBlock code={`const { did, profile } = await learnCard.requestIdentity();`} />
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <code className="text-xs font-mono text-cyan-700 bg-cyan-50 px-2 py-1 rounded">sendCredential()</code>
                            <span className="text-xs text-gray-500">Send VC to wallet</span>
                        </div>
                        <CodeBlock code={`await learnCard.sendCredential({ credential: myVerifiableCredential });`} />
                    </div>
                </div>
            )}

            {selectedPermissions.length > 0 && (
                <p className="text-xs text-gray-500 mt-4 italic">
                    💡 Tip: You've selected {selectedPermissions.length} permission{selectedPermissions.length > 1 ? 's' : ''}. 
                    The methods above correspond to your selections.
                </p>
            )}
        </StepCard>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Full API Reference</h4>

            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="text-left py-2 pr-4 text-gray-600 font-medium">Method</th>
                            <th className="text-left py-2 pr-4 text-gray-600 font-medium">Description</th>
                            <th className="text-left py-2 text-gray-600 font-medium">Returns</th>
                        </tr>
                    </thead>

                    <tbody className="text-gray-600">
                        <tr className="border-b border-gray-100">
                            <td className="py-2 pr-4 font-mono text-cyan-700">requestIdentity()</td>
                            <td className="py-2 pr-4">Request user identity (SSO)</td>
                            <td className="py-2">IdentityResponse</td>
                        </tr>

                        <tr className="border-b border-gray-100">
                            <td className="py-2 pr-4 font-mono text-cyan-700">sendCredential(vc)</td>
                            <td className="py-2 pr-4">Send VC to user's wallet</td>
                            <td className="py-2">SendCredentialResponse</td>
                        </tr>

                        <tr className="border-b border-gray-100">
                            <td className="py-2 pr-4 font-mono text-cyan-700">launchFeature(path)</td>
                            <td className="py-2 pr-4">Launch feature in host</td>
                            <td className="py-2">void</td>
                        </tr>

                        <tr className="border-b border-gray-100">
                            <td className="py-2 pr-4 font-mono text-cyan-700">askCredentialSearch(vpr)</td>
                            <td className="py-2 pr-4">Request credentials by query</td>
                            <td className="py-2">CredentialSearchResponse</td>
                        </tr>

                        <tr className="border-b border-gray-100">
                            <td className="py-2 pr-4 font-mono text-cyan-700">askCredentialSpecific(id)</td>
                            <td className="py-2 pr-4">Request specific credential</td>
                            <td className="py-2">CredentialSpecificResponse</td>
                        </tr>

                        <tr className="border-b border-gray-100">
                            <td className="py-2 pr-4 font-mono text-cyan-700">requestConsent(uri)</td>
                            <td className="py-2 pr-4">Request user consent</td>
                            <td className="py-2">ConsentResponse</td>
                        </tr>

                        <tr className="border-b border-gray-100">
                            <td className="py-2 pr-4 font-mono text-cyan-700">initiateTemplateIssue(id)</td>
                            <td className="py-2 pr-4">Issue from template/boost</td>
                            <td className="py-2">TemplateIssueResponse</td>
                        </tr>

                        <tr>
                            <td className="py-2 pr-4 font-mono text-cyan-700">destroy()</td>
                            <td className="py-2 pr-4">Clean up SDK</td>
                            <td className="py-2">void</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <a
            href="https://docs.learncard.com/partner-connect"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full p-3 bg-cyan-500 text-white rounded-xl text-sm font-medium hover:bg-cyan-600 transition-colors"
        >
            View Full Documentation
            <ExternalLink className="w-4 h-4" />
        </a>
    </div>
    );
};

const ConsentRedirectGuide: React.FC<{ contractUri?: string }> = ({ contractUri }) => {
    const displayContractUri = contractUri || 'lc:contract:example123...';
    const hasContractUri = Boolean(contractUri);

    return (
    <div className="space-y-6">
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
            <p className="text-sm text-indigo-800">
                Use the Consent Redirect flow to collect user consent and credentials from your external application. 
                Users will be redirected to LearnCard to grant permissions, then back to your app with their credentials.
            </p>
        </div>

        <StepCard step={1} title="Create a Consent Flow Contract" icon={<Globe className="w-5 h-5 text-gray-500" />}>
            <p className="text-sm text-gray-600 mb-3">
                First, create or select a Consent Flow Contract that defines what permissions your app needs. 
                You can do this in the Developer Portal or via the API.
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                <p className="text-xs text-amber-800">
                    <strong>Important:</strong> Copy and save your Contract URI — you'll need it to send credentials later.
                </p>
            </div>

            {hasContractUri ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
                    <p className="text-xs text-green-800 mb-2">
                        <strong>✓ Contract Selected:</strong> Your consent flow contract URI:
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

        <StepCard step={2} title="Set Up Your Redirect Handler" icon={<Code className="w-5 h-5 text-gray-500" />}>
            <p className="text-sm text-gray-600 mb-3">
                Create an endpoint to handle the redirect from LearnCard. The user's DID and Delegate VP JWT 
                will be included in the URL parameters.
            </p>

            <CodeBlock
                code={`// Example: /api/learncard/callback or /auth/learncard/redirect

app.get('/api/learncard/callback', (req, res) => {
    // Extract the user's DID and Delegate VP from URL params
    const { did, delegateVpJwt } = req.query;
    
    // Store these with the user's account in your system
    await saveUserLearnCardCredentials(userId, {
        did: did,
        delegateVpJwt: delegateVpJwt
    });
    
    // Redirect to your app's success page
    res.redirect('/dashboard?connected=true');
});`}
            />

            <p className="text-xs text-gray-500 mt-3">
                Store the <code className="bg-gray-100 px-1.5 py-0.5 rounded">did</code> and{' '}
                <code className="bg-gray-100 px-1.5 py-0.5 rounded">delegateVpJwt</code> to identify and 
                send credentials to this user later.
            </p>
        </StepCard>

        <StepCard step={3} title="Create an API Key" icon={<Key className="w-5 h-5 text-gray-500" />}>
            <p className="text-sm text-gray-600 mb-4">
                Generate an API key to authenticate your backend with the LearnCard Network.
            </p>

            <InlineAPITokenManager />
        </StepCard>

        <StepCard step={4} title="Initialize LearnCard on Your Backend" icon={<Package className="w-5 h-5 text-gray-500" />}>
            <p className="text-sm text-gray-600 mb-3">
                Install and initialize the LearnCard SDK in your backend application.
            </p>

            <CodeBlock code={`npm install @learncard/init`} />

            <p className="text-xs text-gray-500 mt-3 mb-3">Then initialize with your API key:</p>

            <CodeBlock
                code={`import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard({ 
    apiKey: process.env.LEARNCARD_API_KEY,
    network: true 
});

console.log('LearnCard DID:', learnCard.id.did());`}
            />
        </StepCard>

        <StepCard step={5} title="Create a Boost Template" icon={<Code className="w-5 h-5 text-gray-500" />}>
            <p className="text-sm text-gray-600 mb-3">
                Create a reusable Boost (credential template) that you'll issue to users.
            </p>

            <CodeBlock
                code={`// Create your boost template
const boostTemplate = learnCard.invoke.newCredential({
    type: 'boost',
    boostName: 'Example Boost',
    boostImage: 'https://placehold.co/400x400?text=My+App',
    achievementType: 'Achievement',
    achievementName: 'Connected External App',
    achievementDescription: 'Awarded for connecting to our app.',
    achievementNarrative: 'Successfully connected and verified.',
    achievementImage: 'https://placehold.co/400x400?text=Badge',
});

// Create the boost and get its URI (do this once, reuse the URI)
const boostMetadata = {
    name: 'My App Connection Badge',
    description: 'Issued when users connect their LearnCard'
};

const boostUri = await learnCard.invoke.createBoost(
    boostTemplate, 
    boostMetadata
);

// Save boostUri for later use`}
            />
        </StepCard>

        <StepCard step={6} title="Issue Credentials to Users" icon={<Zap className="w-5 h-5 text-gray-500" />}>
            <p className="text-sm text-gray-600 mb-3">
                When you're ready to send a credential to a user, create and issue it via the consent flow contract.
            </p>

            <CodeBlock
                code={`// Get the user's DID (stored from Step 2)
const userDID = await getUserLearnCardDID(userId);

// Create the credential for this specific user
const credentialUnsigned = learnCard.invoke.newCredential({
    type: 'boost',
    did: learnCard.id.did(),           // Your app's DID (issuer)
    subject: userDID,                   // User's DID (recipient)
    boostName: 'Example Boost',
    boostImage: 'https://placehold.co/400x400?text=My+App',
    achievementType: 'Achievement',
    achievementName: 'Connected External App',
    achievementDescription: 'Awarded for connecting to our app.',
    achievementNarrative: 'Successfully connected and verified.',
    achievementImage: 'https://placehold.co/400x400?text=Badge',
});

// Sign the credential
const issuedCredential = await learnCard.invoke.issueCredential(
    credentialUnsigned
);

// Send it to the user via the consent flow contract
const credentialUri = await learnCard.invoke.writeCredentialToContract(
    userDID,                    // Recipient DID
    consentFlowContractURI,     // Your contract URI from Step 1
    issuedCredential,           // The signed credential
    boostUri                    // The boost template URI from Step 5
);

console.log('Credential sent:', credentialUri);`}
            />
        </StepCard>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Flow Summary</h4>
            
            <ol className="text-xs text-gray-600 space-y-2 list-decimal list-inside">
                <li>User clicks "Connect with LearnCard" in your app</li>
                <li>User is redirected to LearnCard to grant consent</li>
                <li>LearnCard redirects back to your app with their DID</li>
                <li>Your backend stores the user's DID</li>
                <li>When ready, your backend issues credentials to that DID</li>
            </ol>
        </div>

        <StepCard step={7} title="Additional Functions (Optional)" icon={<Database className="w-5 h-5 text-gray-500" />}>
            <p className="text-sm text-gray-600 mb-4">
                As the contract owner, you can also query consent data and transactions:
            </p>

            <div className="space-y-4">
                <div>
                    <p className="text-xs text-gray-500 mb-2 font-medium">Get all consented data for your contract:</p>
                    <CodeBlock
                        code={`// Query all consent records for your contract
const queryOptions = { limit: 50 };

const consentData = await learnCard.invoke.getConsentFlowData(
    consentFlowContractURI,
    queryOptions
);

console.log('Consented records:', consentData.records);`}
                    />
                </div>

                <div>
                    <p className="text-xs text-gray-500 mb-2 font-medium">Get consent data for a specific user:</p>
                    <CodeBlock
                        code={`// Query consent data involving a specific DID
const userConsentData = await learnCard.invoke.getConsentFlowDataForDid(
    userDID,
    queryOptions
);

console.log('User consent records:', userConsentData.records);`}
                    />
                </div>
            </div>
        </StepCard>

        <a
            href="https://docs.learncard.com/consent-flow"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full p-3 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors"
        >
            View Full Documentation
            <ExternalLink className="w-4 h-4" />
        </a>
    </div>
    );
};

export const IntegrationGuidePanel: React.FC<IntegrationGuidePanelProps> = ({
    isOpen,
    onClose,
    launchType,
    selectedPermissions = [],
    contractUri,
}) => {
    const renderGuideContent = () => {
        switch (launchType) {
            case 'EMBEDDED_IFRAME':
                return <EmbeddedIframeGuide selectedPermissions={selectedPermissions} />;
            case 'CONSENT_REDIRECT':
                return <ConsentRedirectGuide contractUri={contractUri} />;
            default:
                return (
                    <div className="p-8 text-center text-gray-500">
                        <p>Integration guide coming soon for this launch type.</p>
                    </div>
                );
        }
    };

    const getTitle = () => {
        switch (launchType) {
            case 'EMBEDDED_IFRAME':
                return 'Embedded Iframe Integration';
            case 'SECOND_SCREEN':
                return 'Second Screen Integration';
            case 'DIRECT_LINK':
                return 'Direct Link Integration';
            case 'CONSENT_REDIRECT':
                return 'Consent Flow Integration';
            case 'SERVER_HEADLESS':
                return 'Server Headless Integration';
            case 'AI_TUTOR':
                return 'AI Tutor Integration';
            default:
                return 'Integration Guide';
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
                            <p className="text-xs text-cyan-100">Step-by-step developer guide</p>
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
