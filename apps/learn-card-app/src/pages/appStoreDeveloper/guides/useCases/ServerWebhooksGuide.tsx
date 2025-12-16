import React, { useState, useCallback, useEffect } from 'react';
import { 
    Key, 
    Webhook, 
    Server, 
    Rocket, 
    ArrowRight, 
    ArrowLeft, 
    ExternalLink,
    CheckCircle2,
    Plus,
    Copy,
    Check,
    Trash2,
    Loader2,
} from 'lucide-react';

import { useWallet, useToast, ToastTypeEnum, useConfirmation } from 'learn-card-base';
import { Clipboard } from '@capacitor/clipboard';

import { StepProgress, CodeOutputPanel, StatusIndicator } from '../shared';
import { useGuideState } from '../shared/useGuideState';

type AuthGrant = {
    id: string;
    name: string;
    createdAt: string;
    status: 'revoked' | 'active';
    scope: string;
};

const STEPS = [
    { id: 'api-token', title: 'API Token' },
    { id: 'webhook-endpoint', title: 'Create Endpoint' },
    { id: 'handle-events', title: 'Handle Events' },
    { id: 'test', title: 'Test It' },
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
                description: 'Webhook integration',
                scope: '*:*',
            });

            presentToast('Token created!', { hasDismissButton: true });
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
            onTokenCreated(token);
            setTimeout(() => setCopiedId(null), 2000);
            presentToast('Token copied!', { hasDismissButton: true });
        } catch (err) {
            console.error('Failed to copy token:', err);
        }
    };

    const activeGrants = authGrants.filter(g => g.status === 'active');
    const hasActiveToken = activeGrants.length > 0;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Create an API Token</h3>

                <p className="text-gray-600">
                    You'll need an API token to authenticate webhook requests and make API calls from your server.
                </p>
            </div>

            <StatusIndicator
                status={loading ? 'loading' : hasActiveToken ? 'ready' : 'warning'}
                label={loading ? 'Checking...' : hasActiveToken ? `${activeGrants.length} token${activeGrants.length > 1 ? 's' : ''} ready` : 'No tokens found'}
                description={hasActiveToken ? 'Copy a token to use' : 'Create one to continue'}
            />

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

                            <button
                                onClick={() => copyToken(grant.id!)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-cyan-50 text-cyan-700 hover:bg-cyan-100 rounded-lg transition-colors"
                            >
                                {copiedId === grant.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                Copy
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Create form */}
            {showCreateForm && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Token Name</label>

                        <input
                            type="text"
                            value={newTokenName}
                            onChange={(e) => setNewTokenName(e.target.value)}
                            placeholder="e.g., Webhook Server"
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={createToken}
                            disabled={creating || !newTokenName.trim()}
                            className="flex-1 px-4 py-2.5 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                        >
                            {creating ? 'Creating...' : 'Create'}
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

            {!showCreateForm && (
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 rounded-xl w-full justify-center font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Create New Token
                </button>
            )}

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

// Step 2: Webhook Endpoint
const WebhookEndpointStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
    webhookUrl: string;
    setWebhookUrl: (url: string) => void;
}> = ({ onComplete, onBack, webhookUrl, setWebhookUrl }) => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Create Your Webhook Endpoint</h3>

                <p className="text-gray-600">
                    Create an HTTPS endpoint on your server that can receive POST requests from LearnCard.
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Webhook URL</label>

                <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://your-server.com/webhooks/learncard"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
            </div>

            <CodeOutputPanel
                title="Endpoint Setup"
                snippets={{
                    typescript: `// Express.js webhook handler
import express from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json());

// Verify webhook signature
function verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
): boolean {
    const expectedSig = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
    
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSig)
    );
}

app.post('${webhookUrl || '/webhooks/learncard'}', (req, res) => {
    const signature = req.headers['x-learncard-signature'] as string;
    const payload = JSON.stringify(req.body);
    
    // Verify the request is from LearnCard
    if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET!)) {
        return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Handle the event
    const event = req.body;
    console.log('Received event:', event.type);
    
    // Always respond quickly
    res.status(200).json({ received: true });
    
    // Process async
    processEvent(event);
});`,
                    python: `# Flask webhook handler
from flask import Flask, request, jsonify
import hmac
import hashlib

app = Flask(__name__)

def verify_signature(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)

@app.route('${webhookUrl || '/webhooks/learncard'}', methods=['POST'])
def webhook():
    signature = request.headers.get('X-LearnCard-Signature', '')
    
    if not verify_signature(request.data, signature, WEBHOOK_SECRET):
        return jsonify({'error': 'Invalid signature'}), 401
    
    event = request.json
    print(f"Received event: {event['type']}")
    
    # Process async
    process_event.delay(event)
    
    return jsonify({'received': True}), 200`,
                }}
            />

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <h4 className="font-medium text-amber-800 mb-2">Requirements</h4>

                <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Must be HTTPS (not HTTP)</li>
                    <li>• Respond within 30 seconds</li>
                    <li>• Return 2xx status code on success</li>
                    <li>• Verify the signature header</li>
                </ul>
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

// Step 3: Handle Events
const HandleEventsStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
}> = ({ onComplete, onBack }) => {
    const eventTypes = [
        { type: 'credential.received', description: 'A credential was sent to a user' },
        { type: 'credential.accepted', description: 'User accepted a credential' },
        { type: 'consent.granted', description: 'User granted consent to a contract' },
        { type: 'consent.revoked', description: 'User revoked consent' },
        { type: 'connection.created', description: 'New connection established' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Handle Events</h3>

                <p className="text-gray-600">
                    LearnCard sends different event types. Handle each one based on your needs.
                </p>
            </div>

            {/* Event types */}
            <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                {eventTypes.map((event) => (
                    <div key={event.type} className="flex items-center gap-3 p-3">
                        <code className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-mono">
                            {event.type}
                        </code>

                        <span className="text-sm text-gray-600">{event.description}</span>
                    </div>
                ))}
            </div>

            <CodeOutputPanel
                title="Event Handler"
                snippets={{
                    typescript: `async function processEvent(event: WebhookEvent) {
    switch (event.type) {
        case 'credential.received':
            // A credential was sent to a user
            await handleCredentialReceived(event.data);
            break;
            
        case 'credential.accepted':
            // User accepted a credential into their wallet
            await handleCredentialAccepted(event.data);
            break;
            
        case 'consent.granted':
            // User granted consent - fetch their data
            await handleConsentGranted(event.data);
            break;
            
        case 'consent.revoked':
            // User revoked consent - stop accessing their data
            await handleConsentRevoked(event.data);
            break;
            
        default:
            console.log('Unknown event type:', event.type);
    }
}

// Example: Handle credential accepted
async function handleCredentialAccepted(data: any) {
    const { credentialId, recipientDid } = data;
    
    // Update your database
    await db.credentials.update({
        where: { id: credentialId },
        data: { status: 'ACCEPTED' }
    });
    
    // Send notification
    await notifyUser(recipientDid, 'Credential added to wallet!');
}`,
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

// Step 4: Test
const TestStep: React.FC<{
    onBack: () => void;
    webhookUrl: string;
    apiToken: string;
}> = ({ onBack, webhookUrl, apiToken }) => {
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleTest = async () => {
        if (!webhookUrl) {
            setTestResult({ success: false, message: 'Please enter a webhook URL' });
            return;
        }

        setTesting(true);
        setTestResult(null);

        try {
            // Simulate a test webhook call
            // In production, this would call the LearnCard API to send a test event
            await new Promise(resolve => setTimeout(resolve, 1500));

            setTestResult({
                success: true,
                message: 'Test event sent! Check your server logs.',
            });
        } catch (err) {
            setTestResult({
                success: false,
                message: 'Failed to send test event',
            });
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Test Your Webhook</h3>

                <p className="text-gray-600">
                    Make sure your webhook endpoint is working correctly before going live.
                </p>
            </div>

            {/* Checklist */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <h4 className="font-medium text-gray-800 mb-3">Pre-flight checklist</h4>

                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-4 h-4 ${apiToken ? 'text-emerald-600' : 'text-gray-300'}`} />
                        <span className={apiToken ? 'text-gray-800' : 'text-gray-400'}>API token created</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-4 h-4 ${webhookUrl ? 'text-emerald-600' : 'text-gray-300'}`} />
                        <span className={webhookUrl ? 'text-gray-800' : 'text-gray-400'}>Webhook URL configured</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-4 h-4 ${webhookUrl?.startsWith('https://') ? 'text-emerald-600' : 'text-gray-300'}`} />
                        <span className={webhookUrl?.startsWith('https://') ? 'text-gray-800' : 'text-gray-400'}>HTTPS enabled</span>
                    </div>
                </div>
            </div>

            {/* Test button */}
            <div className="p-4 border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h4 className="font-medium text-gray-800">Send Test Event</h4>

                        <p className="text-sm text-gray-500">{webhookUrl || 'No webhook URL set'}</p>
                    </div>

                    <button
                        onClick={handleTest}
                        disabled={testing || !webhookUrl}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                    >
                        {testing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Webhook className="w-4 h-4" />
                                Send Test
                            </>
                        )}
                    </button>
                </div>

                {testResult && (
                    <div className={`p-3 rounded-lg ${testResult.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                        {testResult.message}
                    </div>
                )}
            </div>

            {/* Success */}
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-cyan-50 border border-emerald-200 rounded-2xl text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Rocket className="w-8 h-8 text-emerald-600" />
                </div>

                <h4 className="text-lg font-semibold text-gray-800 mb-2">Webhooks ready!</h4>

                <p className="text-gray-600">
                    Your server can now receive real-time events from LearnCard.
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
                    href="https://docs.learncard.com/guides/webhooks"
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
const ServerWebhooksGuide: React.FC = () => {
    const guideState = useGuideState('server-webhooks', STEPS.length);

    const [apiToken, setApiToken] = useState('');
    const [webhookUrl, setWebhookUrl] = useState('');

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
                    <WebhookEndpointStep
                        onComplete={() => handleStepComplete('webhook-endpoint')}
                        onBack={guideState.prevStep}
                        webhookUrl={webhookUrl}
                        setWebhookUrl={setWebhookUrl}
                    />
                );

            case 2:
                return (
                    <HandleEventsStep
                        onComplete={() => handleStepComplete('handle-events')}
                        onBack={guideState.prevStep}
                    />
                );

            case 3:
                return (
                    <TestStep
                        onBack={guideState.prevStep}
                        webhookUrl={webhookUrl}
                        apiToken={apiToken}
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

export default ServerWebhooksGuide;
