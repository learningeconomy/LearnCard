import React, { useState, useCallback, useEffect } from 'react';
import { 
    FileText, 
    Link2, 
    Webhook, 
    Rocket, 
    ArrowRight, 
    ArrowLeft, 
    ExternalLink,
    CheckCircle2,
    Plus,
    Loader2,
    Copy,
    Check,
} from 'lucide-react';

import { useWallet, useToast, ToastTypeEnum } from 'learn-card-base';
import { Clipboard } from '@capacitor/clipboard';

import { StepProgress, CodeOutputPanel, StatusIndicator } from '../shared';
import { useGuideState } from '../shared/useGuideState';

const STEPS = [
    { id: 'create-contract', title: 'Create Contract' },
    { id: 'redirect-setup', title: 'Set Up Redirect' },
    { id: 'handle-callback', title: 'Handle Callback' },
    { id: 'use-data', title: 'Use the Data' },
];

// Step 1: Create Contract
const CreateContractStep: React.FC<{
    onComplete: () => void;
    contractUri: string;
    setContractUri: (uri: string) => void;
}> = ({ onComplete, contractUri, setContractUri }) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();

    const [contracts, setContracts] = useState<Array<{ uri: string; name: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newContractName, setNewContractName] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [copiedUri, setCopiedUri] = useState<string | null>(null);

    const fetchContracts = useCallback(async () => {
        try {
            setLoading(true);
            const wallet = await initWallet();
            const result = await wallet.invoke.getConsentFlowContracts();

            const contractList = (result?.records || []).map((c: { uri: string; contract: { name: string } }) => ({
                uri: c.uri,
                name: c.contract?.name || 'Unnamed Contract',
            }));

            setContracts(contractList);
        } catch (err) {
            console.error('Failed to fetch contracts:', err);
        } finally {
            setLoading(false);
        }
    }, [initWallet]);

    useEffect(() => {
        fetchContracts();
    }, []);

    const createContract = async () => {
        if (!newContractName.trim()) return;

        try {
            setCreating(true);
            const wallet = await initWallet();

            const uri = await wallet.invoke.createConsentFlowContract({
                name: newContractName.trim(),
                subtitle: 'Created from Integration Guide',
                description: 'Consent flow for data sharing',
                needsGuardianConsent: false,
                redirectUrl: '',
                frontDoorBoostUri: '',
                reasonForAccessing: 'To provide personalized services',
                image: '',
                expiresAt: '',
                readers: {
                    anonymize: false,
                    credentials: { categories: {} },
                    personal: {},
                },
                writers: {
                    credentials: { categories: {} },
                    personal: {},
                },
            });

            setContractUri(uri);
            presentToast('Contract created!', { hasDismissButton: true });
            setNewContractName('');
            setShowCreate(false);
            fetchContracts();
        } catch (err) {
            console.error('Failed to create contract:', err);
            presentToast('Failed to create contract', { type: ToastTypeEnum.Error, hasDismissButton: true });
        } finally {
            setCreating(false);
        }
    };

    const copyUri = async (uri: string) => {
        await Clipboard.write({ string: uri });
        setCopiedUri(uri);
        setContractUri(uri);
        setTimeout(() => setCopiedUri(null), 2000);
        presentToast('Contract URI copied!', { hasDismissButton: true });
    };

    const hasContract = contracts.length > 0 || contractUri;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Create a Consent Contract</h3>

                <p className="text-gray-600">
                    A consent contract defines what data you're requesting and why. Users must accept 
                    the contract before sharing their data.
                </p>
            </div>

            <StatusIndicator
                status={loading ? 'loading' : hasContract ? 'ready' : 'warning'}
                label={loading ? 'Checking...' : hasContract ? `${contracts.length} contract${contracts.length !== 1 ? 's' : ''} available` : 'No contracts found'}
                description={hasContract ? 'Select one to use' : 'Create one to continue'}
            />

            {/* Contract list */}
            {!loading && contracts.length > 0 && (
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                    {contracts.slice(0, 5).map((contract) => (
                        <div
                            key={contract.uri}
                            className={`flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer ${contractUri === contract.uri ? 'bg-cyan-50' : ''}`}
                            onClick={() => setContractUri(contract.uri)}
                        >
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800">{contract.name}</p>

                                <p className="text-xs text-gray-500 font-mono truncate">{contract.uri}</p>
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); copyUri(contract.uri); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                {copiedUri === contract.uri ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Create form */}
            {showCreate && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contract Name</label>

                        <input
                            type="text"
                            value={newContractName}
                            onChange={(e) => setNewContractName(e.target.value)}
                            placeholder="e.g., My App Data Access"
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={createContract}
                            disabled={creating || !newContractName.trim()}
                            className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                        >
                            {creating ? 'Creating...' : 'Create Contract'}
                        </button>

                        <button
                            onClick={() => { setShowCreate(false); setNewContractName(''); }}
                            className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {!showCreate && (
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 text-gray-600 hover:border-emerald-400 hover:text-emerald-600 rounded-xl w-full justify-center font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Create New Contract
                </button>
            )}

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

// Step 2: Redirect Setup
const RedirectSetupStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
    contractUri: string;
    redirectUrl: string;
    setRedirectUrl: (url: string) => void;
}> = ({ onComplete, onBack, contractUri, redirectUrl, setRedirectUrl }) => {
    const consentUrl = `https://learncard.app/consent-flow?contractUri=${encodeURIComponent(contractUri)}&redirectUri=${encodeURIComponent(redirectUrl || 'https://your-app.com/callback')}`;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Set Up Redirect</h3>

                <p className="text-gray-600">
                    When users click "Connect with LearnCard" in your app, redirect them to the consent flow URL.
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Callback URL</label>

                <input
                    type="url"
                    value={redirectUrl}
                    onChange={(e) => setRedirectUrl(e.target.value)}
                    placeholder="https://your-app.com/callback"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />

                <p className="text-xs text-gray-500 mt-1">
                    Users will be redirected here after granting consent
                </p>
            </div>

            <CodeOutputPanel
                title="Redirect Code"
                snippets={{
                    typescript: `// When user clicks "Connect with LearnCard"
const contractUri = '${contractUri || 'YOUR_CONTRACT_URI'}';
const redirectUri = '${redirectUrl || 'https://your-app.com/callback'}';

const consentUrl = \`https://learncard.app/consent-flow?contractUri=\${encodeURIComponent(contractUri)}&redirectUri=\${encodeURIComponent(redirectUri)}\`;

// Redirect the user
window.location.href = consentUrl;`,
                    python: `# Flask example
from flask import redirect
from urllib.parse import urlencode

@app.route('/connect')
def connect_learncard():
    contract_uri = '${contractUri || 'YOUR_CONTRACT_URI'}'
    redirect_uri = '${redirectUrl || 'https://your-app.com/callback'}'
    
    params = urlencode({
        'contractUri': contract_uri,
        'redirectUri': redirect_uri
    })
    
    return redirect(f'https://learncard.app/consent-flow?{params}')`,
                }}
            />

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

// Step 3: Handle Callback
const HandleCallbackStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
    redirectUrl: string;
}> = ({ onComplete, onBack, redirectUrl }) => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Handle the Callback</h3>

                <p className="text-gray-600">
                    After the user grants consent, they'll be redirected back to your app with a <code className="bg-gray-100 px-1 rounded">transactionId</code>.
                </p>
            </div>

            <CodeOutputPanel
                title="Callback Handler"
                snippets={{
                    typescript: `// Handle the callback at ${redirectUrl || '/callback'}
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

function CallbackPage() {
    const [searchParams] = useSearchParams();
    
    useEffect(() => {
        const transactionId = searchParams.get('transactionId');
        
        if (transactionId) {
            // Send to your backend to fetch user data
            fetch('/api/complete-consent', {
                method: 'POST',
                body: JSON.stringify({ transactionId })
            });
        }
    }, []);
    
    return <div>Completing connection...</div>;
}`,
                    python: `# Flask callback handler
@app.route('/callback')
def handle_callback():
    transaction_id = request.args.get('transactionId')
    
    if transaction_id:
        # Store the transaction ID
        # You'll use this to fetch user data
        session['transaction_id'] = transaction_id
        
        return redirect('/dashboard')
    
    return 'Error: No transaction ID', 400`,
                }}
            />

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-medium text-blue-800 mb-2">Callback URL Format</h4>

                <p className="text-sm text-blue-700 font-mono break-all">
                    {redirectUrl || 'https://your-app.com/callback'}?transactionId=abc123...
                </p>
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

// Step 4: Use Data
const UseDataStep: React.FC<{
    onBack: () => void;
    contractUri: string;
}> = ({ onBack, contractUri }) => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Use the Shared Data</h3>

                <p className="text-gray-600">
                    Use the transaction ID to fetch the user's shared data from your backend.
                </p>
            </div>

            <CodeOutputPanel
                title="Fetch User Data (Backend)"
                snippets={{
                    typescript: `import { initLearnCard } from '@learncard/init';
import { getLearnCardNetworkPlugin } from '@learncard/network-plugin';

// On your backend
async function getUserData(transactionId: string) {
    const learnCard = await initLearnCard();
    const networkLC = await learnCard.addPlugin(
        await getLearnCardNetworkPlugin(learnCard, process.env.API_TOKEN!)
    );
    
    // Fetch the consent flow transaction
    const transaction = await networkLC.invoke.getConsentFlowTransaction(
        '${contractUri || 'YOUR_CONTRACT_URI'}',
        transactionId
    );
    
    // Access user data per your contract terms
    const userData = transaction.data;
    
    return {
        did: transaction.externalId,
        credentials: userData.credentials,
        profile: userData.personal
    };
}`,
                    python: `import learncard

async def get_user_data(transaction_id: str):
    lc = learncard.init(api_token=os.environ['API_TOKEN'])
    
    # Fetch the consent flow transaction
    transaction = await lc.get_consent_flow_transaction(
        contract_uri='${contractUri || 'YOUR_CONTRACT_URI'}',
        transaction_id=transaction_id
    )
    
    return {
        'did': transaction['externalId'],
        'credentials': transaction['data']['credentials'],
        'profile': transaction['data']['personal']
    }`,
                }}
            />

            <div className="p-6 bg-gradient-to-br from-emerald-50 to-cyan-50 border border-emerald-200 rounded-2xl text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Rocket className="w-8 h-8 text-emerald-600" />
                </div>

                <h4 className="text-lg font-semibold text-gray-800 mb-2">Consent flow ready!</h4>

                <p className="text-gray-600">
                    Users can now securely share their data with your application.
                </p>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <a
                    href="https://docs.learncard.com/guides/consent-flow"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                >
                    Full Documentation
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>
        </div>
    );
};

// Main component
const ConsentFlowGuide: React.FC<{ selectedIntegration?: unknown; setSelectedIntegration?: unknown }> = () => {
    const guideState = useGuideState('consent-flow', STEPS.length);

    const [contractUri, setContractUri] = useState('');
    const [redirectUrl, setRedirectUrl] = useState('');

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
                    <RedirectSetupStep
                        onComplete={() => handleStepComplete('redirect-setup')}
                        onBack={guideState.prevStep}
                        contractUri={contractUri}
                        redirectUrl={redirectUrl}
                        setRedirectUrl={setRedirectUrl}
                    />
                );

            case 2:
                return (
                    <HandleCallbackStep
                        onComplete={() => handleStepComplete('handle-callback')}
                        onBack={guideState.prevStep}
                        redirectUrl={redirectUrl}
                    />
                );

            case 3:
                return (
                    <UseDataStep
                        onBack={guideState.prevStep}
                        contractUri={contractUri}
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
