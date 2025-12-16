import React, { useState, useCallback, useEffect } from 'react';
import { 
    Key, 
    Shield, 
    FileCode, 
    Rocket, 
    ArrowRight, 
    ArrowLeft, 
    Check, 
    Loader2,
    Plus,
    Copy,
    Trash2,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';

import { useWallet, useToast, ToastTypeEnum, useConfirmation } from 'learn-card-base';
import { Clipboard } from '@capacitor/clipboard';

import { StepProgress, CodeOutputPanel, StatusIndicator } from '../shared';
import { useGuideState } from '../shared/useGuideState';

type AuthGrant = {
    id: string;
    name: string;
    challenge: string;
    createdAt: string;
    status: 'revoked' | 'active';
    scope: string;
    description?: string;
};

const STEPS = [
    { id: 'api-token', title: 'Create API Token' },
    { id: 'signing-authority', title: 'Set Up Signing' },
    { id: 'build-credential', title: 'Build Credential' },
    { id: 'issue', title: 'Issue & Verify' },
];

const SCOPE_OPTIONS = [
    { label: 'Full Access', value: '*:*', description: 'Complete access to all resources' },
    { label: 'Credentials Only', value: 'credential:* presentation:*', description: 'Issue and manage credentials' },
];

// Step 1: API Token
const ApiTokenStep: React.FC<{
    onComplete: () => void;
    onTokenCreated: (token: string) => void;
}> = ({ onComplete, onTokenCreated }) => {
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

    const copyToken = async (id: string) => {
        try {
            const wallet = await initWallet();
            const token = await wallet.invoke.getAPITokenForAuthGrant(id);

            await Clipboard.write({ string: token });
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
            onTokenCreated(token);
            presentToast('Token copied!', { hasDismissButton: true });
        } catch (err) {
            console.error('Failed to copy token:', err);
            presentToast('Failed to copy token', { type: ToastTypeEnum.Error, hasDismissButton: true });
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

    const activeGrants = authGrants.filter(g => g.status === 'active');
    const hasActiveToken = activeGrants.length > 0;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Create an API Token</h3>

                <p className="text-gray-600">
                    Your server needs an API token to authenticate with LearnCard. This token should be kept secret 
                    and never exposed in client-side code.
                </p>
            </div>

            {/* Status */}
            <StatusIndicator
                status={loading ? 'loading' : hasActiveToken ? 'ready' : 'warning'}
                label={loading ? 'Checking...' : hasActiveToken ? `${activeGrants.length} token${activeGrants.length > 1 ? 's' : ''} ready` : 'No API tokens found'}
                description={hasActiveToken ? 'Copy a token to use in your code' : 'Create one to continue'}
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
            {!loading && activeGrants.length > 0 && (
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                    {activeGrants.map((grant) => (
                        <div key={grant.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800">{grant.name}</p>

                                <p className="text-sm text-gray-500">
                                    Created {new Date(grant.createdAt!).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => copyToken(grant.id!)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-cyan-50 text-cyan-700 hover:bg-cyan-100 rounded-lg transition-colors"
                                >
                                    {copiedId === grant.id ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                    Copy
                                </button>

                                <button
                                    onClick={() => revokeToken(grant)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
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

            {/* Continue button */}
            <button
                onClick={onComplete}
                disabled={!hasActiveToken}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Continue
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );
};

// Step 2: Signing Authority
const SigningAuthorityStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
}> = ({ onComplete, onBack }) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [primarySA, setPrimarySA] = useState<{ name: string; endpoint: string } | null>(null);

    const fetchSigningAuthority = useCallback(async () => {
        try {
            setLoading(true);
            const wallet = await initWallet();
            const primary = await wallet.invoke.getPrimaryRegisteredSigningAuthority();

            if (primary?.relationship) {
                setPrimarySA({
                    name: primary.relationship.name,
                    endpoint: primary.relationship.signingAuthorityEndpoint ?? '',
                });
            } else {
                setPrimarySA(null);
            }
        } catch (err) {
            console.error('Failed to fetch signing authority:', err);
            setPrimarySA(null);
        } finally {
            setLoading(false);
        }
    }, [initWallet]);

    useEffect(() => {
        fetchSigningAuthority();
    }, []);

    const createSigningAuthority = async () => {
        try {
            setCreating(true);
            const wallet = await initWallet();

            const authority = await wallet.invoke.createSigningAuthority('default-sa');

            if (!authority) {
                throw new Error('Failed to create signing authority');
            }

            await wallet.invoke.registerSigningAuthority(
                authority.endpoint!,
                authority.name,
                authority.did!
            );

            await wallet.invoke.setPrimaryRegisteredSigningAuthority(
                authority.endpoint!,
                authority.name
            );

            presentToast('Signing authority created!', { hasDismissButton: true });
            fetchSigningAuthority();
        } catch (err) {
            console.error('Failed to create signing authority:', err);
            presentToast('Failed to create signing authority', { type: ToastTypeEnum.Error, hasDismissButton: true });
        } finally {
            setCreating(false);
        }
    };

    const hasSigningAuthority = primarySA !== null;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Set Up Signing Authority</h3>

                <p className="text-gray-600">
                    A signing authority cryptographically signs your credentials, making them verifiable. 
                    This proves the credentials actually came from you.
                </p>
            </div>

            {/* Status */}
            <StatusIndicator
                status={loading ? 'loading' : hasSigningAuthority ? 'ready' : 'warning'}
                label={loading ? 'Checking...' : hasSigningAuthority ? 'Signing authority configured' : 'No signing authority found'}
                description={hasSigningAuthority ? `Using: ${primarySA?.name}` : 'Create one to sign credentials'}
            />

            {/* Create button if needed */}
            {!loading && !hasSigningAuthority && (
                <button
                    onClick={createSigningAuthority}
                    disabled={creating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                    {creating ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        <>
                            <Shield className="w-4 h-4" />
                            Create Signing Authority
                        </>
                    )}
                </button>
            )}

            {/* Info about what it does */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-medium text-blue-800 mb-2">What does this do?</h4>

                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Creates a cryptographic key pair for signing</li>
                    <li>• Registers the key with LearnCard's verification network</li>
                    <li>• Allows anyone to verify credentials you issue</li>
                </ul>
            </div>

            {/* Navigation */}
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
                    disabled={!hasSigningAuthority}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// Step 3: Build Credential
const BuildCredentialStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
    apiToken: string;
}> = ({ onComplete, onBack, apiToken }) => {
    const [credentialName, setCredentialName] = useState('Achievement Badge');
    const [credentialDescription, setCredentialDescription] = useState('Awarded for completing the course');
    const [recipientEmail, setRecipientEmail] = useState('');

    const codeSnippet = `// Install: npm install @learncard/network-plugin

import { initLearnCard } from '@learncard/init';
import { getLearnCardNetworkPlugin } from '@learncard/network-plugin';

// Initialize LearnCard with your API token
const learnCard = await initLearnCard();
const networkLC = await learnCard.addPlugin(
    await getLearnCardNetworkPlugin(learnCard, '${apiToken || 'YOUR_API_TOKEN'}')
);

// Build the credential
const credential = networkLC.invoke.newCredential({
    type: 'Achievement',
    name: '${credentialName}',
    description: '${credentialDescription}',
    criteria: 'Completed all required modules',
});

// Sign the credential
const signedCredential = await networkLC.invoke.issueCredential(credential);

// Send to recipient${recipientEmail ? `
await networkLC.invoke.sendCredential('${recipientEmail}', signedCredential);` : `
// await networkLC.invoke.sendCredential('recipient@example.com', signedCredential);`}

console.log('Credential issued!', signedCredential);`;

    const pythonSnippet = `# Install: pip install learncard

import learncard

# Initialize with your API token
lc = learncard.init(api_token="${apiToken || 'YOUR_API_TOKEN'}")

# Build the credential
credential = lc.new_credential(
    type="Achievement",
    name="${credentialName}",
    description="${credentialDescription}",
    criteria="Completed all required modules"
)

# Sign and issue
signed = lc.issue_credential(credential)

# Send to recipient${recipientEmail ? `
lc.send_credential("${recipientEmail}", signed)` : `
# lc.send_credential("recipient@example.com", signed)`}

print("Credential issued!", signed)`;

    const curlSnippet = `# Issue a credential via the API

curl -X POST https://api.learncard.com/credentials/issue \\
  -H "Authorization: Bearer ${apiToken || 'YOUR_API_TOKEN'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": ["VerifiableCredential", "Achievement"],
    "credentialSubject": {
      "name": "${credentialName}",
      "description": "${credentialDescription}"${recipientEmail ? `,
      "recipient": "${recipientEmail}"` : ''}
    }
  }'`;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Build Your Credential</h3>

                <p className="text-gray-600">
                    Customize the credential details below. The code will update automatically.
                </p>
            </div>

            {/* Credential form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Credential Name</label>

                    <input
                        type="text"
                        value={credentialName}
                        onChange={(e) => setCredentialName(e.target.value)}
                        placeholder="e.g., Course Completion"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Email (optional)</label>

                    <input
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="recipient@example.com"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>

                    <textarea
                        value={credentialDescription}
                        onChange={(e) => setCredentialDescription(e.target.value)}
                        placeholder="What is this credential for?"
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                    />
                </div>
            </div>

            {/* Code output */}
            <CodeOutputPanel
                title="Your Code"
                snippets={{
                    typescript: codeSnippet,
                    python: pythonSnippet,
                    curl: curlSnippet,
                }}
            />

            {/* Navigation */}
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

// Step 4: Issue & Verify
const IssueVerifyStep: React.FC<{
    onBack: () => void;
}> = ({ onBack }) => {
    const [verifyInput, setVerifyInput] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string } | null>(null);

    const { initWallet } = useWallet();

    const handleVerify = async () => {
        if (!verifyInput.trim()) return;

        setVerifying(true);
        setVerifyResult(null);

        try {
            const wallet = await initWallet();
            const credential = JSON.parse(verifyInput);

            const result = await wallet.invoke.verifyCredential(credential);

            if (result.warnings.length === 0 && result.errors.length === 0) {
                setVerifyResult({ success: true, message: 'Credential is valid!' });
            } else {
                const issues = [...result.warnings, ...result.errors].join(', ');
                setVerifyResult({ success: false, message: `Issues found: ${issues}` });
            }
        } catch (err) {
            console.error('Verification failed:', err);
            setVerifyResult({ success: false, message: 'Invalid credential format' });
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Issue & Verify</h3>

                <p className="text-gray-600">
                    Run your code to issue a credential, then paste it here to verify it works correctly.
                </p>
            </div>

            {/* Success state */}
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-cyan-50 border border-emerald-200 rounded-2xl text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Rocket className="w-8 h-8 text-emerald-600" />
                </div>

                <h4 className="text-lg font-semibold text-gray-800 mb-2">You're all set!</h4>

                <p className="text-gray-600 mb-4">
                    Run the code from the previous step in your application to issue your first credential.
                </p>

                <div className="flex items-center justify-center gap-2 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>API Token ready</span>
                </div>

                <div className="flex items-center justify-center gap-2 text-emerald-700 font-medium mt-1">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Signing authority configured</span>
                </div>
            </div>

            {/* Verification tool */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h4 className="font-medium text-gray-800">Test Verification</h4>

                    <p className="text-sm text-gray-500">Paste a credential to verify it</p>
                </div>

                <div className="p-4 space-y-4">
                    <textarea
                        value={verifyInput}
                        onChange={(e) => setVerifyInput(e.target.value)}
                        placeholder='{"@context": [...], "type": [...], ...}'
                        rows={6}
                        className="w-full px-4 py-3 bg-gray-900 text-gray-100 font-mono text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />

                    <button
                        onClick={handleVerify}
                        disabled={verifying || !verifyInput.trim()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                    >
                        {verifying ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            <>
                                <Shield className="w-4 h-4" />
                                Verify Credential
                            </>
                        )}
                    </button>

                    {verifyResult && (
                        <div className={`p-4 rounded-xl ${verifyResult.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                            <div className="flex items-center gap-2">
                                {verifyResult.success ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                )}

                                <span className={verifyResult.success ? 'text-emerald-800' : 'text-red-800'}>
                                    {verifyResult.message}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <a
                    href="https://docs.learncard.com/sdks/network-plugin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                >
                    View Full Documentation
                    <ArrowRight className="w-4 h-4" />
                </a>
            </div>
        </div>
    );
};

// Main component
const IssueCredentialsGuide: React.FC = () => {
    const guideState = useGuideState('issue-credentials', STEPS.length);

    const [apiToken, setApiToken] = useState('');

    const handleStepComplete = (stepId: string) => {
        guideState.markStepComplete(stepId);
        guideState.nextStep();
    };

    const renderStep = () => {
        switch (guideState.currentStep) {
            case 0:
                return (
                    <ApiTokenStep
                        onComplete={() => handleStepComplete('api-token')}
                        onTokenCreated={setApiToken}
                    />
                );

            case 1:
                return (
                    <SigningAuthorityStep
                        onComplete={() => handleStepComplete('signing-authority')}
                        onBack={guideState.prevStep}
                    />
                );

            case 2:
                return (
                    <BuildCredentialStep
                        onComplete={() => handleStepComplete('build-credential')}
                        onBack={guideState.prevStep}
                        apiToken={apiToken}
                    />
                );

            case 3:
                return (
                    <IssueVerifyStep
                        onBack={guideState.prevStep}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-4">
            {/* Progress */}
            <div className="mb-8">
                <StepProgress
                    currentStep={guideState.currentStep}
                    totalSteps={STEPS.length}
                    steps={STEPS}
                    completedSteps={guideState.state.completedSteps}
                    onStepClick={guideState.goToStep}
                />
            </div>

            {/* Current step content */}
            {renderStep()}
        </div>
    );
};

export default IssueCredentialsGuide;
