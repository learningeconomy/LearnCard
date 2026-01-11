import React, { useState, useMemo, useEffect } from 'react';
import { 
    FileText, 
    Link2, 
    Webhook, 
    Rocket, 
    ArrowRight, 
    ArrowLeft, 
    ExternalLink,
    CheckCircle2,
    Globe,
    Code,
    Key,
    Package,
    Zap,
    Award,
    Check,
    Database,
    Copy,
    Info,
    ChevronDown,
    ChevronUp,
    Loader2,
} from 'lucide-react';

import { useWallet } from 'learn-card-base';

import { StepProgress, GoLiveStep } from '../shared';
import { useGuideState } from '../shared/useGuideState';

import { ConsentFlowContractSelector } from '../../components/ConsentFlowContractSelector';
import { CodeBlock } from '../../components/CodeBlock';
import OBv3CredentialBuilder from '../../../../components/credentials/OBv3CredentialBuilder';
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

const STEPS = [
    { id: 'create-contract', title: 'Create Contract' },
    { id: 'redirect-handler', title: 'Redirect Handler' },
    { id: 'api-setup', title: 'API Setup' },
    { id: 'send-credentials', title: 'Send Credentials' },
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

            <CodeBlock
                code={`// Your Contract URI
const consentFlowContractURI = '${contractUri || 'lc:contract:YOUR_CONTRACT_URI'}';`}
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

                <CodeBlock
                    code={`// When user clicks "Connect with LearnCard"
const contractUri = '${contractUri || 'YOUR_CONTRACT_URI'}';
const redirectUri = '${redirectUrl || 'https://your-app.com/api/learncard/callback'}';

const consentUrl = \`https://learncard.app/consent-flow?contractUri=\${encodeURIComponent(contractUri)}&redirectUri=\${encodeURIComponent(redirectUri)}\`;

// Redirect the user
window.location.href = consentUrl;`}
                />
            </StepCard>

            <StepCard step={2} title="Handle the Callback" icon={<Code className="w-4 h-4 text-gray-400 ml-auto" />}>
                <p className="text-sm text-gray-600 mb-3">
                    Create an endpoint to handle the redirect. The user's DID and Delegate VP JWT 
                    will be included in the URL parameters.
                </p>

                <CodeBlock
                    code={`// Example: /api/learncard/callback

app.get('/api/learncard/callback', async (req, res) => {
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

    // API Token selector state
    const [authGrants, setAuthGrants] = useState<Partial<AuthGrant>[]>([]);
    const [loadingGrants, setLoadingGrants] = useState(false);
    const [selectedGrantId, setSelectedGrantId] = useState<string | null>(null);
    const [showTokenSelector, setShowTokenSelector] = useState(false);

    // Fetch auth grants on mount
    useEffect(() => {
        const fetchGrants = async () => {
            setLoadingGrants(true);
            try {
                const wallet = await initWallet();
                const grants = await wallet.invoke.getAuthGrants() || [];
                const activeGrants = grants.filter((g: Partial<AuthGrant>) => g.status === 'active');
                setAuthGrants(activeGrants);
            } catch (err) {
                console.error('Failed to fetch grants:', err);
            } finally {
                setLoadingGrants(false);
            }
        };
        fetchGrants();
    }, []);

    // Select a token
    const selectToken = async (grantId: string) => {
        try {
            const wallet = await initWallet();
            const token = await wallet.invoke.getAPITokenForAuthGrant(grantId);
            onTokenChange(token);
            setSelectedGrantId(grantId);
            setShowTokenSelector(false);
        } catch (err) {
            console.error('Failed to get token:', err);
        }
    };

    // Get selected grant name for display
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

            {/* API Token Selector */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Key className="w-5 h-5 text-indigo-600" />
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-700">API Token</p>

                            <p className="text-xs text-gray-500">
                                {apiToken ? (
                                    <span className="text-emerald-600 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        {displayTokenName}
                                    </span>
                                ) : (
                                    <span className="text-amber-600">Select a token to use</span>
                                )}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowTokenSelector(!showTokenSelector)}
                        className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
                    >
                        {showTokenSelector ? 'Hide' : apiToken ? 'Change' : 'Select'}
                        {showTokenSelector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>

                {showTokenSelector && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        {loadingGrants ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading tokens...
                            </div>
                        ) : authGrants.length === 0 ? (
                            <div className="text-sm text-gray-500">
                                <p className="mb-2">No API tokens found.</p>

                                <p className="text-xs text-gray-400">
                                    Go to <strong>Admin Tools → API Keys</strong> to create one, then come back here.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {authGrants.map((grant) => (
                                    <button
                                        key={grant.id}
                                        onClick={() => selectToken(grant.id!)}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                            selectedGrantId === grant.id
                                                ? 'bg-indigo-50 border-indigo-300'
                                                : 'bg-white border-gray-200 hover:border-indigo-300'
                                        }`}
                                    >
                                        <div className="text-left">
                                            <p className="text-sm font-medium text-gray-700">{grant.name}</p>

                                            <p className="text-xs text-gray-500">
                                                Created {new Date(grant.createdAt!).toLocaleDateString()}
                                            </p>
                                        </div>

                                        {selectedGrantId === grant.id && (
                                            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <StepCard step={1} title="Install LearnCard SDK" icon={<Package className="w-4 h-4 text-gray-400 ml-auto" />}>
                <p className="text-sm text-gray-600 mb-3">
                    Install the LearnCard SDK in your backend application:
                </p>

                <CodeBlock code="npm install @learncard/init" />
            </StepCard>

            <StepCard step={2} title="Initialize LearnCard" icon={<Zap className="w-4 h-4 text-gray-400 ml-auto" />}>
                <p className="text-sm text-gray-600 mb-3">
                    Initialize with your API token:
                </p>

                <CodeBlock
                    code={`import { initLearnCard } from '@learncard/init';

const learnCard = await initLearnCard({ 
    apiKey: '${apiToken || 'YOUR_API_TOKEN'}',
    network: true 
});

console.log('LearnCard DID:', learnCard.id.did());`}
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

// Step 4: Send Credentials
const SendCredentialsStep: React.FC<{
    onBack: () => void;
    onComplete: () => void;
    contractUri: string;
    apiToken?: string;
}> = ({ onBack, onComplete, contractUri, apiToken }) => {
    const [showCredentialBuilder, setShowCredentialBuilder] = useState(false);
    const [builtCredential, setBuiltCredential] = useState<Record<string, unknown> | null>(null);

    // Generate the code sample based on built credential or default
    const credentialCodeSample = useMemo(() => {
        if (builtCredential) {
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
    contractUri: '${contractUri || 'YOUR_CONTRACT_URI'}',
    template: {
        credential: ${credJson},
        name: 'Course Completion',
        category: 'Achievement',
    }
});`;
        }

        return `// Get the user's DID (stored from Step 2)
const userDID = await getUserLearnCardDID(userId);

// Send a credential to the user
await learnCard.invoke.send({
    type: 'boost',
    recipient: userDID,
    contractUri: '${contractUri || 'YOUR_CONTRACT_URI'}',
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
});`;
    }, [builtCredential, contractUri]);

    return (
        <div className="space-y-6">
            <OBv3CredentialBuilder
                isOpen={showCredentialBuilder}
                onClose={() => setShowCredentialBuilder(false)}
                onSave={(cred) => setBuiltCredential(cred)}
            />

            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Send Credentials to Users</h3>

                <p className="text-gray-600">
                    Now you can issue credentials to users who have connected with your app.
                </p>
            </div>

            <StepCard step={1} title="Build Your Credential" icon={<Award className="w-4 h-4 text-gray-400 ml-auto" />}>
                <p className="text-sm text-gray-600 mb-3">
                    Use the credential builder to create your badge or use the code template below.
                </p>

                <button
                    onClick={() => setShowCredentialBuilder(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-medium hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                    <Award className="w-4 h-4" />
                    Build Your Credential
                </button>

                {builtCredential && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600">
                        <Check className="w-3.5 h-3.5" />
                        <span>Custom credential added to code below</span>
                    </div>
                )}
            </StepCard>

            <StepCard step={2} title="Send Credentials" icon={<Zap className="w-4 h-4 text-gray-400 ml-auto" />}>
                <p className="text-sm text-gray-600 mb-3">
                    Use the simplified <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">send</code> method 
                    to create, sign, and deliver credentials in one call.
                </p>

                <CodeBlock code={credentialCodeSample} />

                <div className="mt-4 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                    <p className="text-xs text-cyan-800">
                        <strong>What this does:</strong> Creates a credential template, issues it to the user, 
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

                        <CodeBlock
                            code={`// Query all consent records for your contract
const queryOptions = { limit: 50 };

const consentData = await learnCard.invoke.getConsentFlowData(
    '${contractUri || 'YOUR_CONTRACT_URI'}',
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

            <div className="p-6 bg-gradient-to-br from-emerald-50 to-cyan-50 border border-emerald-200 rounded-2xl text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Rocket className="w-8 h-8 text-emerald-600" />
                </div>

                <h4 className="text-lg font-semibold text-gray-800 mb-2">Consent Flow Ready!</h4>

                <p className="text-gray-600">
                    Users can now securely connect and receive credentials from your application.
                </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex gap-2">
                    <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />

                    <div>
                        <h4 className="text-sm font-medium text-amber-800">Integration Tips</h4>

                        <ul className="text-xs text-amber-700 mt-1 space-y-1">
                            <li>• Store API keys in environment variables, never in code</li>
                            <li>• Test in sandbox mode before going live</li>
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
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors"
                >
                    Continue to Go Live
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// Main component
const ConsentFlowGuide: React.FC<GuideProps> = ({ selectedIntegration }) => {
    const guideState = useGuideState('consent-flow', STEPS.length, selectedIntegration);

    const [contractUri, setContractUri] = useState('');
    const [redirectUrl, setRedirectUrl] = useState('');
    const [apiToken, setApiToken] = useState('');

    const handleStepComplete = (stepId: string) => {
        guideState.markStepComplete(stepId);
        guideState.nextStep();
    };

    const renderStep = () => {
        switch (guideState.currentStep) {
            case 0:
                return (
                    <CreateContractStep
                        onComplete={() => handleStepComplete('create-contract')}
                        contractUri={contractUri}
                        setContractUri={setContractUri}
                    />
                );

            case 1:
                return (
                    <RedirectHandlerStep
                        onComplete={() => handleStepComplete('redirect-handler')}
                        onBack={guideState.prevStep}
                        contractUri={contractUri}
                        redirectUrl={redirectUrl}
                        setRedirectUrl={setRedirectUrl}
                    />
                );

            case 2:
                return (
                    <APISetupStep
                        onComplete={() => handleStepComplete('api-setup')}
                        onBack={guideState.prevStep}
                        apiToken={apiToken}
                        onTokenChange={setApiToken}
                    />
                );

            case 3:
                return (
                    <SendCredentialsStep
                        onBack={guideState.prevStep}
                        onComplete={() => handleStepComplete('send-credentials')}
                        contractUri={contractUri}
                        apiToken={apiToken}
                    />
                );

            case 4:
                return (
                    <GoLiveStep
                        integration={selectedIntegration}
                        guideType="consent-flow"
                        onBack={guideState.prevStep}
                        completedItems={[
                            'Created consent flow contract',
                            'Set up redirect handler',
                            'Configured API access',
                            'Tested sending credentials',
                        ]}
                        title="Ready to Connect!"
                        description="You've set up everything needed for consent-based data sharing. Activate your integration to start connecting with users."
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-4">
            <div className="mb-8">
                <StepProgress
                    currentStep={guideState.currentStep}
                    totalSteps={STEPS.length}
                    steps={STEPS}
                    completedSteps={guideState.state.completedSteps}
                    onStepClick={guideState.goToStep}
                />
            </div>

            {renderStep()}
        </div>
    );
};

export default ConsentFlowGuide;
