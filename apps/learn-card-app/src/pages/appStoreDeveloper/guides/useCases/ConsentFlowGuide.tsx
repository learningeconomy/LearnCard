import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Link2,
    ArrowRight,
    ArrowLeft,
    ExternalLink,
    CheckCircle2,
    Code,
    Package,
    Zap,
    Check,
    Database,
    Copy,
    Info,
    Send,
    Plus,
    Trash2,
} from 'lucide-react';

import { useWallet, useToast, ToastTypeEnum, useConfirmation } from 'learn-card-base';

import { StepProgress, CodeOutputPanel, StatusIndicator, GoLiveStep } from '../shared';
import { useGuideState } from '../shared/useGuideState';
import { useDeveloperPortal } from '../../useDeveloperPortal';

import { ConsentFlowContractSelector } from '../../components/ConsentFlowContractSelector';
import { TemplateListManager } from '../../components/TemplateListManager';
import type { ManagedTemplate } from '../../dashboards/hooks/useTemplateDetails';
import type { GuideProps } from '../GuidePage';

type AuthGrant = {
    id: string;
    name: string;
    challenge: string;
    createdAt: string;
    status: 'revoked' | 'active';
    scope: string;
    description?: string;
};

const SCOPE_OPTIONS = [
    { label: 'Full Access', value: '*:*', description: 'Complete access to all resources' },
    { label: 'Credentials Only', value: 'credential:* presentation:*', description: 'Issue and manage credentials' },
];

const STEPS = [
    { id: 'create-contract', title: 'Create Contract' },
    { id: 'redirect-handler', title: 'Redirect Handler' },
    { id: 'api-setup', title: 'API Setup' },
    { id: 'send-credentials', title: 'Send Credentials' },
    { id: 'test', title: 'Test It' },
    { id: 'go-live', title: 'Go Live' },
];

// Step Card component for consistent styling
const StepCard: React.FC<{
    step: number;
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}> = ({ step, title, icon, children }) => (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-200">
            <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center text-cyan-700 font-semibold text-sm">
                {step}
            </div>

            <h4 className="font-medium text-gray-800">{title}</h4>

            {icon}
        </div>

        <div className="p-4">{children}</div>
    </div>
);

// Step 1: Create Contract
const CreateContractStep: React.FC<{
    onComplete: () => void;
    contractUri: string;
    setContractUri: (uri: string) => void;
}> = ({ onComplete, contractUri, setContractUri }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (contractUri) {
            await navigator.clipboard.writeText(contractUri);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Create a Consent Flow Contract</h3>

                <p className="text-gray-600">
                    A consent contract defines what data you&apos;re requesting and why. Users must accept 
                    the contract before sharing their data.
                </p>
            </div>

            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                <p className="text-sm text-indigo-800">
                    <strong>Consent Redirect Flow:</strong> Collect user consent and credentials from your external application. 
                    Users will be redirected to LearnCard to grant permissions, then back to your app with their credentials.
                </p>
            </div>

            <ConsentFlowContractSelector
                value={contractUri}
                onChange={setContractUri}
            />

            {contractUri && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-emerald-800">Contract Selected</p>

                                <p className="text-xs text-emerald-600 font-mono truncate mt-1">{contractUri}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-200 transition-colors"
                        >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied ? 'Copied!' : 'Copy URI'}
                        </button>
                    </div>

                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-800">
                            <strong>Important:</strong> Save this Contract URI — you'll need it to send credentials later.
                        </p>
                    </div>
                </div>
            )}

            <CodeOutputPanel
                snippets={{
                    typescript: `// Your Contract URI
const consentFlowContractURI = '${contractUri || 'lc:contract:YOUR_CONTRACT_URI'}';`,
                }}
            />

            <button
                onClick={onComplete}
                disabled={!contractUri}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Continue
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );
};

// Step 2: Redirect Handler Setup
const RedirectHandlerStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
    contractUri: string;
    redirectUrl: string;
    setRedirectUrl: (url: string) => void;
}> = ({ onComplete, onBack, contractUri, redirectUrl, setRedirectUrl }) => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Set Up Your Redirect Handler</h3>

                <p className="text-gray-600">
                    When users click "Connect with LearnCard" in your app, they'll be redirected to LearnCard to grant consent,
                    then back to your app with their DID and credentials.
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Callback URL</label>

                <input
                    type="url"
                    value={redirectUrl}
                    onChange={(e) => setRedirectUrl(e.target.value)}
                    placeholder="https://your-app.com/api/learncard/callback"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />

                <p className="text-xs text-gray-500 mt-1">
                    Users will be redirected here after granting consent
                </p>
            </div>

            <StepCard step={1} title="Generate Consent URL" icon={<Link2 className="w-4 h-4 text-gray-400 ml-auto" />}>
                <p className="text-sm text-gray-600 mb-3">
                    Create a button that redirects users to the consent flow:
                </p>

                <CodeOutputPanel
                    snippets={{
                        typescript: `// When user clicks "Connect with LearnCard"
const contractUri = '${contractUri || 'YOUR_CONTRACT_URI'}';
const returnTo = '${redirectUrl || 'https://your-app.com/api/learncard/callback'}';

const consentUrl = \`https://learncard.app/consent-flow?uri=\${encodeURIComponent(contractUri)}&returnTo=\${encodeURIComponent(returnTo)}\`;

// Redirect the user
window.location.href = consentUrl;`,
                    }}
                />
            </StepCard>

            <StepCard step={2} title="Handle the Callback" icon={<Code className="w-4 h-4 text-gray-400 ml-auto" />}>
                <p className="text-sm text-gray-600 mb-3">
                    Create an endpoint to handle the redirect. The user&apos;s DID and a VP JWT
                    (containing a delegate credential) will be included in the URL parameters.
                </p>

                <CodeOutputPanel
                    snippets={{
                        typescript: `// Example: /api/learncard/callback

app.get('/api/learncard/callback', async (req, res) => {
    // Extract the user's DID and delegate VP JWT from URL params
    const { did, vp } = req.query;

    // Store these with the user's account in your system
    await saveUserLearnCardCredentials(userId, {
        did: did as string,
        vp: vp as string, // VP JWT containing a delegate credential
    });

    // Redirect to your app's success page
    res.redirect('/dashboard?connected=true');
});`,
                    }}
                />

                <p className="text-xs text-gray-500 mt-3">
                    Store the <code className="bg-gray-100 px-1.5 py-0.5 rounded">did</code> and{' '}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded">vp</code> (a VP JWT containing a delegate credential)
                    to identify and send credentials to this user later.
                </p>
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

            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <button
                    onClick={onComplete}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// Step 3: API Setup
const APISetupStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
    apiToken: string;
    onTokenChange: (token: string) => void;
}> = ({ onComplete, onBack, apiToken, onTokenChange }) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const confirm = useConfirmation();

    const [authGrants, setAuthGrants] = useState<Partial<AuthGrant>[]>([]);
    const [loadingGrants, setLoadingGrants] = useState(false);
    const [selectedGrantId, setSelectedGrantId] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [newTokenName, setNewTokenName] = useState('');
    const [selectedScope, setSelectedScope] = useState('*:*');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [copiedToken, setCopiedToken] = useState(false);

    const fetchAuthGrants = useCallback(async () => {
        setLoadingGrants(true);
        setFetchError(null);
        try {
            const wallet = await initWallet();
            const grants = await wallet.invoke.getAuthGrants() || [];
            const activeGrants = grants.filter((g: Partial<AuthGrant>) => g.status === 'active');
            setAuthGrants(activeGrants);
        } catch (err) {
            console.error('Failed to fetch grants:', err);
            setFetchError('Failed to load API tokens. Please try refreshing the page.');
        } finally {
            setLoadingGrants(false);
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
                description: 'Created from Connect Website Guide',
                scope: selectedScope,
            });
            presentToast('API Token created!', { hasDismissButton: true });
            setNewTokenName('');
            setShowCreateForm(false);
            fetchAuthGrants();
        } catch (err) {
            console.error('Failed to create token:', err);
            presentToast('Failed to create token', { type: ToastTypeEnum.Error, hasDismissButton: true });
        } finally {
            setCreating(false);
        }
    };

    const selectToken = async (grantId: string) => {
        try {
            const wallet = await initWallet();
            const token = await wallet.invoke.getAPITokenForAuthGrant(grantId);
            onTokenChange(token);
            setSelectedGrantId(grantId);
        } catch (err) {
            console.error('Failed to select token:', err);
            presentToast('Failed to retrieve API token', { type: ToastTypeEnum.Error, hasDismissButton: true });
        }
    };

    const revokeToken = async (grant: Partial<AuthGrant>) => {
        const confirmed = await confirm({
            text: `Delete "${grant.name}"?`,
            onConfirm: async () => {},
            cancelButtonClassName: 'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px]',
            confirmButtonClassName: 'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
        });
        if (!confirmed) return;
        try {
            const wallet = await initWallet();
            if (grant.status === 'active') {
                await wallet.invoke.revokeAuthGrant(grant.id!);
            } else {
                await wallet.invoke.deleteAuthGrant(grant.id!);
            }
            presentToast('Token removed', { hasDismissButton: true });
            fetchAuthGrants();
        } catch (err) {
            console.error('Failed to remove token:', err);
        }
    };

    const hasActiveToken = authGrants.length > 0;
    const selectedGrant = authGrants.find(g => g.id === selectedGrantId);
    const displayTokenName = selectedGrant?.name || (apiToken ? 'Selected Token' : 'No token selected');

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Set Up Your Backend</h3>

                <p className="text-gray-600">
                    Initialize the LearnCard SDK on your backend to send credentials and query consent data.
                </p>
            </div>

            <StatusIndicator
                status={apiToken ? 'ready' : loadingGrants ? 'loading' : fetchError ? 'warning' : hasActiveToken ? 'incomplete' : 'warning'}
                label={apiToken ? `Token: ${displayTokenName}` : loadingGrants ? 'Checking...' : hasActiveToken ? `${authGrants.length} token${authGrants.length > 1 ? 's' : ''} ready` : 'No API tokens found'}
                description={fetchError || (apiToken ? 'Ready to use' : hasActiveToken ? 'Select a token to use in your code' : 'Create one to continue')}
            />

            {/* Create form */}
            {showCreateForm && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Token Name</label>

                        <input
                            type="text"
                            value={newTokenName}
                            onChange={(e) => setNewTokenName(e.target.value)}
                            placeholder="e.g., Production Server"
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>

                        <select
                            value={selectedScope}
                            onChange={(e) => setSelectedScope(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {SCOPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>

                        <p className="text-xs text-gray-500 mt-1">
                            {SCOPE_OPTIONS.find(o => o.value === selectedScope)?.description}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={createToken}
                            disabled={creating || !newTokenName.trim()}
                            className="flex-1 px-4 py-2.5 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                        >
                            {creating ? 'Creating...' : 'Create Token'}
                        </button>

                        <button
                            onClick={() => { setShowCreateForm(false); setNewTokenName(''); }}
                            className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Token list */}
            {!loadingGrants && authGrants.length > 0 && (
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                    {authGrants.map((grant) => (
                        <button
                            key={grant.id}
                            onClick={() => selectToken(grant.id!)}
                            className={`w-full flex items-center justify-between p-4 transition-colors ${
                                selectedGrantId === grant.id
                                    ? 'bg-indigo-50'
                                    : 'hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    selectedGrantId === grant.id
                                        ? 'border-indigo-600 bg-indigo-600'
                                        : 'border-gray-300'
                                }`}>
                                    {selectedGrantId === grant.id && (
                                        <Check className="w-3 h-3 text-white" />
                                    )}
                                </div>

                                <div className="text-left">
                                    <p className="font-medium text-gray-800">{grant.name}</p>

                                    <p className="text-sm text-gray-500">
                                        Created {new Date(grant.createdAt!).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); revokeToken(grant); }}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </button>
                    ))}
                </div>
            )}

            {/* Selected token display */}
            {apiToken && selectedGrantId && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-indigo-700">Your API Token</p>

                        <button
                            onClick={async () => {
                                await navigator.clipboard.writeText(apiToken);
                                setCopiedToken(true);
                                setTimeout(() => setCopiedToken(false), 2000);
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                        >
                            {copiedToken ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copiedToken ? 'Copied!' : 'Copy'}
                        </button>
                    </div>

                    <p className="text-xs font-mono text-indigo-900 bg-indigo-100 p-2 rounded-lg break-all select-all">
                        {apiToken}
                    </p>
                </div>
            )}

            {/* Create button */}
            {!showCreateForm && (
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 rounded-xl w-full justify-center font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Create New Token
                </button>
            )}

            {/* Security warning */}
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800">
                    <strong>Security:</strong> Never expose your API token in client-side code or commit it to version control.
                </p>
            </div>

            <StepCard step={1} title="Install LearnCard SDK" icon={<Package className="w-4 h-4 text-gray-400 ml-auto" />}>
                <p className="text-sm text-gray-600 mb-3">
                    Install the LearnCard SDK in your backend application:
                </p>

                <CodeOutputPanel snippets={{ curl: 'npm install @learncard/init' }} />
            </StepCard>

            <StepCard step={2} title="Initialize LearnCard" icon={<Zap className="w-4 h-4 text-gray-400 ml-auto" />}>
                <p className="text-sm text-gray-600 mb-3">
                    Initialize with your API token:
                </p>

                <CodeOutputPanel
                    snippets={{
                        typescript: `import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard({
    apiKey: '${apiToken || 'YOUR_API_TOKEN'}',
    network: true
});

console.log('LearnCard DID:', learnCard.id.did());`,
                    }}
                />

                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800">
                        <strong>Security:</strong> Store your API token in environment variables, never commit it to code.
                    </p>
                </div>
            </StepCard>

            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <button
                    onClick={onComplete}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// Step 4: Create & Send Credentials
const SendCredentialsStep: React.FC<{
    onBack: () => void;
    onComplete: () => void;
    contractUri: string;
    apiToken?: string;
    integrationId?: string;
    templates: ManagedTemplate[];
    onTemplatesChange: (templates: ManagedTemplate[]) => void;
}> = ({ onBack, onComplete, contractUri, apiToken, integrationId, templates, onTemplatesChange }) => {
    const selectedTemplate = templates[0];
    const templateUri = selectedTemplate?.boostUri || 'YOUR_TEMPLATE_URI';

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Create Credential Templates</h3>

                <p className="text-gray-600">
                    Create credential templates that you&apos;ll issue to users who connect with your app.
                    Templates are saved and reusable across multiple issuances.
                </p>
            </div>

            <TemplateListManager
                integrationId={integrationId}
                featureType="issue-credentials"
                showCodeSnippets={false}
                editable={true}
                onTemplateChange={onTemplatesChange}
            />

            <StepCard step={2} title="Send Credentials via API" icon={<Send className="w-4 h-4 text-gray-400 ml-auto" />}>
                <p className="text-sm text-gray-600 mb-3">
                    Use the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">send</code> method
                    to issue credentials to users who have connected with your app:
                </p>

                <CodeOutputPanel
                    snippets={{
                        typescript: `// Get the user's DID (stored from the consent callback)
const userDID = await getUserLearnCardDID(userId);

// Send a credential to the user
await learnCard.invoke.send({
    type: 'boost',
    recipient: userDID,
    contractUri: '${contractUri || 'YOUR_CONTRACT_URI'}',
    templateUri: '${templateUri}',
    integrationId: '${integrationId || 'YOUR_INTEGRATION_ID'}',
});`,
                        curl: `curl -X POST 'https://api.learncard.com/api/boost/send' \\
  -H 'Authorization: Bearer ${apiToken || 'YOUR_API_TOKEN'}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "type": "boost",
    "recipient": "did:web:...",
    "contractUri": "${contractUri || 'YOUR_CONTRACT_URI'}",
    "templateUri": "${templateUri}",
    "integrationId": "${integrationId || 'YOUR_INTEGRATION_ID'}"
  }'`,
                    }}
                />

                <div className="mt-4 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                    <p className="text-xs text-cyan-800">
                        <strong>What this does:</strong> Issues the credential from your template to the user
                        and writes it to your consent flow contract — all in one call.
                    </p>
                </div>
            </StepCard>

            <StepCard step={3} title="Query Consent Data (Optional)" icon={<Database className="w-4 h-4 text-gray-400 ml-auto" />}>
                <p className="text-sm text-gray-600 mb-3">
                    As the contract owner, you can query consent data and transactions:
                </p>

                <div className="space-y-4">
                    <div>
                        <p className="text-xs text-gray-500 mb-2 font-medium">Get all consented data for your contract:</p>

                        <CodeOutputPanel
                            snippets={{
                                typescript: `// Query all consent records for your contract
const queryOptions = { limit: 50 };

const consentData = await learnCard.invoke.getConsentFlowData(
    '${contractUri || 'YOUR_CONTRACT_URI'}',
    queryOptions
);

console.log('Consented records:', consentData.records);`,
                            }}
                        />
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 mb-2 font-medium">Get consent data for a specific user:</p>

                        <CodeOutputPanel
                            snippets={{
                                typescript: `// Query consent data involving a specific DID
const userConsentData = await learnCard.invoke.getConsentFlowDataForDid(
    userDID,
    queryOptions
);

console.log('User consent records:', userConsentData.records);`,
                            }}
                        />
                    </div>
                </div>
            </StepCard>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex gap-2">
                    <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />

                    <div>
                        <h4 className="text-sm font-medium text-amber-800">Integration Tips</h4>

                        <ul className="text-xs text-amber-700 mt-1 space-y-1">
                            <li>• Store API keys in environment variables, never in code</li>
                            <li>• Use <code className="bg-amber-100 px-1 rounded">templateUri</code> to reference saved templates instead of inline credentials</li>
                            <li>• Store user DIDs securely with their account data</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <button
                    onClick={onComplete}
                    disabled={templates.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Continue to Testing
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// Step 5: Test the Integration
const TestStep: React.FC<{
    onBack: () => void;
    onComplete: () => void;
    contractUri: string;
    redirectUrl: string;
    apiToken: string;
    templates: ManagedTemplate[];
    integrationId?: string;
}> = ({ onBack, onComplete, contractUri, redirectUrl, apiToken, templates, integrationId }) => {
    const selectedTemplate = templates[0];
    const templateUri = selectedTemplate?.boostUri || 'YOUR_TEMPLATE_URI';

    const consentUrl = contractUri && redirectUrl
        ? `https://learncard.app/consent-flow?uri=${encodeURIComponent(contractUri)}&returnTo=${encodeURIComponent(redirectUrl)}`
        : '';

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Test Your Integration</h3>

                <p className="text-gray-600">
                    Verify your consent flow works end-to-end before going live.
                </p>
            </div>

            <StepCard step={1} title="Test the Consent Redirect" icon={<ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />}>
                <p className="text-sm text-gray-600 mb-3">
                    Click the button below to test the consent redirect with your actual contract and callback URL.
                    You should be redirected to LearnCard to grant consent, then back to your callback URL.
                </p>

                {consentUrl ? (
                    <div className="space-y-3">
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1 font-medium">Consent URL:</p>

                            <p className="text-xs text-gray-700 font-mono break-all">{consentUrl}</p>
                        </div>

                        <a
                            href={consentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-white rounded-xl text-sm font-medium hover:bg-cyan-600 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Open Consent Flow
                        </a>
                    </div>
                ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-800">
                            <strong>Missing configuration:</strong> Go back and ensure you&apos;ve set both
                            a contract URI (Step 1) and callback URL (Step 2).
                        </p>
                    </div>
                )}
            </StepCard>

            <StepCard step={2} title="Verify Callback Parameters" icon={<Code className="w-4 h-4 text-gray-400 ml-auto" />}>
                <p className="text-sm text-gray-600 mb-3">
                    After the user grants consent, LearnCard redirects them to your callback URL with these query parameters:
                </p>

                <div className="space-y-2">
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-start gap-2">
                            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-semibold text-gray-700">did</code>

                            <p className="text-xs text-gray-600">
                                The user&apos;s decentralized identifier (DID). Use this to send credentials to them.
                            </p>
                        </div>
                    </div>

                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-start gap-2">
                            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-semibold text-gray-700">vp</code>

                            <p className="text-xs text-gray-600">
                                A VP JWT containing a delegate credential. This proves the user authorized
                                your app to act on their behalf for this contract.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Example callback URL your server will receive:</p>

                    <CodeOutputPanel
                        snippets={{
                            curl: `GET ${redirectUrl || 'https://your-app.com/api/learncard/callback'}?did=did:web:...&vp=eyJhbGciOiJFZDI1NTE5...`,
                        }}
                    />
                </div>
            </StepCard>

            <StepCard step={3} title="Test Credential Delivery" icon={<Send className="w-4 h-4 text-gray-400 ml-auto" />}>
                <p className="text-sm text-gray-600 mb-3">
                    After receiving the callback, run the send command from your backend to issue a credential:
                </p>

                <CodeOutputPanel
                    snippets={{
                        typescript: `// After receiving the callback with { did, vp }
const userDID = 'did:web:...'; // From the callback

await learnCard.invoke.send({
    type: 'boost',
    recipient: userDID,
    contractUri: '${contractUri || 'YOUR_CONTRACT_URI'}',
    templateUri: '${templateUri}',
    integrationId: '${integrationId || 'YOUR_INTEGRATION_ID'}',
});

console.log('Credential sent successfully!');`,
                    }}
                />

                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-xs text-emerald-800">
                        <strong>Verify:</strong> The recipient should see the credential in their LearnCard wallet.
                        Check the dashboard Connections tab to confirm delivery.
                    </p>
                </div>
            </StepCard>

            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <button
                    onClick={onComplete}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
                >
                    Continue to Go Live
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// Config interface for state persistence
interface ConsentFlowGuideConfig {
    contractUri?: string;
    redirectUrl?: string;
    apiTokenGrantId?: string;
    templateUris?: string[];
}

// Main component
const ConsentFlowGuide: React.FC<GuideProps> = ({ selectedIntegration }) => {
    const { useUpdateIntegration } = useDeveloperPortal();
    const updateIntegrationMutation = useUpdateIntegration();
    const guideState = useGuideState('consent-flow', STEPS.length, selectedIntegration);

    // Ensure guideType is set to 'consent-flow' when entering this guide
    useEffect(() => {
        if (selectedIntegration && selectedIntegration.guideType !== 'consent-flow') {
            updateIntegrationMutation.mutate({
                id: selectedIntegration.id,
                updates: { guideType: 'consent-flow' },
            });
        }
    }, [selectedIntegration?.id, selectedIntegration?.guideType]);

    // Restore persisted config on mount
    const savedConfig = guideState.getConfig<ConsentFlowGuideConfig>('consentFlowConfig');

    const [contractUri, setContractUri] = useState(savedConfig?.contractUri ?? '');
    const [redirectUrl, setRedirectUrl] = useState(savedConfig?.redirectUrl ?? '');
    const [apiToken, setApiToken] = useState(savedConfig?.apiTokenGrantId ?? '');
    const [templates, setTemplates] = useState<ManagedTemplate[]>([]);

    // Persist config changes
    const savedConfigRef = useRef(savedConfig);
    savedConfigRef.current = savedConfig;

    useEffect(() => {
        if (contractUri) {
            guideState.updateConfig('consentFlowConfig', {
                ...savedConfigRef.current,
                contractUri,
            });
        }
    }, [contractUri]);

    useEffect(() => {
        if (redirectUrl) {
            guideState.updateConfig('consentFlowConfig', {
                ...savedConfigRef.current,
                redirectUrl,
            });
        }
    }, [redirectUrl]);

    useEffect(() => {
        if (apiToken) {
            guideState.updateConfig('consentFlowConfig', {
                ...savedConfigRef.current,
                apiTokenGrantId: apiToken,
            });
        }
    }, [apiToken]);

    useEffect(() => {
        const uris = templates.map(t => t.boostUri).filter(Boolean) as string[];
        if (uris.length > 0) {
            guideState.updateConfig('consentFlowConfig', {
                ...savedConfigRef.current,
                templateUris: uris,
            });
        }
    }, [templates]);

    const [isTransitioning, setIsTransitioning] = useState(false);
    const guideTopRef = useRef<HTMLDivElement>(null);

    const scrollToTop = useCallback(() => {
        setTimeout(() => {
            guideTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    }, []);

    const handleStepComplete = useCallback((stepId: string) => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        guideState.markStepComplete(stepId);
        guideState.nextStep();
        scrollToTop();
        // Brief debounce to prevent double-clicks during step transition
        setTimeout(() => setIsTransitioning(false), 150);
    }, [isTransitioning, guideState, scrollToTop]);

    const handleBack = useCallback(() => {
        guideState.prevStep();
        scrollToTop();
    }, [guideState, scrollToTop]);

    const handleStepClick = useCallback((step: number) => {
        guideState.goToStep(step);
        scrollToTop();
    }, [guideState, scrollToTop]);

    // Integration selection guard — placed after all hooks to respect Rules of Hooks
    if (!selectedIntegration) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Please select an integration from the header dropdown to continue.</p>
            </div>
        );
    }

    // Allow navigating to current step, any completed step, or any earlier step.
    // Forward navigation requires all previous steps to be complete.
    const canNavigateToStep = useCallback((index: number) => {
        if (index === guideState.currentStep) return true;
        if (index < guideState.currentStep) return true;
        if (guideState.isStepComplete(STEPS[index].id)) return true;
        for (let i = 0; i < index; i++) {
            if (!guideState.isStepComplete(STEPS[i].id)) return false;
        }
        return true;
    }, [guideState.currentStep, guideState.isStepComplete]);

    return (
        <div ref={guideTopRef} className="max-w-3xl mx-auto py-4">
            <div className="mb-8">
                <StepProgress
                    currentStep={guideState.currentStep}
                    totalSteps={STEPS.length}
                    steps={STEPS}
                    completedSteps={guideState.state.completedSteps}
                    onStepClick={handleStepClick}
                    isStepNavigable={canNavigateToStep}
                />
            </div>

            {/* All steps rendered but only active one visible — prevents re-mount/re-fetch lag */}
            <div style={{ display: guideState.currentStep === 0 ? 'block' : 'none' }}>
                <CreateContractStep
                    onComplete={() => handleStepComplete('create-contract')}
                    contractUri={contractUri}
                    setContractUri={setContractUri}
                />
            </div>
            <div style={{ display: guideState.currentStep === 1 ? 'block' : 'none' }}>
                <RedirectHandlerStep
                    onComplete={() => handleStepComplete('redirect-handler')}
                    onBack={handleBack}
                    contractUri={contractUri}
                    redirectUrl={redirectUrl}
                    setRedirectUrl={setRedirectUrl}
                />
            </div>
            <div style={{ display: guideState.currentStep === 2 ? 'block' : 'none' }}>
                <APISetupStep
                    onComplete={() => handleStepComplete('api-setup')}
                    onBack={handleBack}
                    apiToken={apiToken}
                    onTokenChange={setApiToken}
                />
            </div>
            <div style={{ display: guideState.currentStep === 3 ? 'block' : 'none' }}>
                <SendCredentialsStep
                    onBack={handleBack}
                    onComplete={() => handleStepComplete('send-credentials')}
                    contractUri={contractUri}
                    apiToken={apiToken}
                    integrationId={selectedIntegration?.id}
                    templates={templates}
                    onTemplatesChange={setTemplates}
                />
            </div>
            <div style={{ display: guideState.currentStep === 4 ? 'block' : 'none' }}>
                <TestStep
                    onBack={handleBack}
                    onComplete={() => handleStepComplete('test')}
                    contractUri={contractUri}
                    redirectUrl={redirectUrl}
                    apiToken={apiToken}
                    templates={templates}
                    integrationId={selectedIntegration?.id}
                />
            </div>
            <div style={{ display: guideState.currentStep === 5 ? 'block' : 'none' }}>
                <GoLiveStep
                    integration={selectedIntegration}
                    guideType="consent-flow"
                    onBack={handleBack}
                    completedItems={[
                        'Created consent flow contract',
                        'Set up redirect handler',
                        'Configured API access',
                        'Created credential templates',
                        'Tested consent flow integration',
                    ]}
                    title="Ready to Connect!"
                    description="You've set up everything needed for consent-based data sharing. Activate your integration to start connecting with users."
                />
            </div>
        </div>
    );
};

export default ConsentFlowGuide;
