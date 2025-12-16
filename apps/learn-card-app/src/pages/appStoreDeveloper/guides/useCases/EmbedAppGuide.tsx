import React, { useState } from 'react';
import { 
    Globe, 
    Package, 
    Code, 
    Rocket, 
    ArrowRight, 
    ArrowLeft, 
    ExternalLink,
    CheckCircle2,
} from 'lucide-react';

import { StepProgress, CodeOutputPanel, StatusIndicator } from '../shared';
import { useGuideState } from '../shared/useGuideState';

const STEPS = [
    { id: 'setup-website', title: 'Set Up Website' },
    { id: 'install-sdk', title: 'Install SDK' },
    { id: 'initialize', title: 'Initialize' },
    { id: 'use-api', title: 'Use the API' },
];

// Step 1: Setup Website
const SetupWebsiteStep: React.FC<{
    onComplete: () => void;
    appUrl: string;
    setAppUrl: (url: string) => void;
}> = ({ onComplete, appUrl, setAppUrl }) => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Set Up Your Website</h3>

                <p className="text-gray-600">
                    Your app will run inside an iframe in the LearnCard wallet. You'll need to configure 
                    your server to allow iframe embedding.
                </p>
            </div>

            {/* URL input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your App URL</label>

                <input
                    type="url"
                    value={appUrl}
                    onChange={(e) => setAppUrl(e.target.value)}
                    placeholder="https://your-app.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />

                <p className="text-xs text-gray-500 mt-1">
                    This URL will be embedded in the wallet
                </p>
            </div>

            {/* Required headers */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <h4 className="font-medium text-amber-800 mb-2">Required Response Headers</h4>

                <p className="text-sm text-amber-700 mb-3">
                    Your server must return these headers to allow iframe embedding:
                </p>

                <CodeOutputPanel
                    title="Server Headers"
                    snippets={{
                        typescript: `// Express.js example
app.use((req, res, next) => {
    // Allow iframe embedding from any origin
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Content-Security-Policy', "frame-ancestors *");
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    next();
});`,
                        curl: `# Nginx configuration
location / {
    add_header X-Frame-Options "ALLOWALL";
    add_header Content-Security-Policy "frame-ancestors *";
    add_header Access-Control-Allow-Origin "*";
}`,
                    }}
                    defaultLanguage="typescript"
                />
            </div>

            {/* Continue */}
            <button
                onClick={onComplete}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
            >
                Continue
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );
};

// Step 2: Install SDK
const InstallSdkStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
}> = ({ onComplete, onBack }) => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Install the SDK</h3>

                <p className="text-gray-600">
                    The Partner Connect SDK lets your embedded app communicate with the LearnCard wallet.
                </p>
            </div>

            <CodeOutputPanel
                title="Installation"
                snippets={{
                    typescript: `# npm
npm install @learncard/partner-connect

# yarn
yarn add @learncard/partner-connect

# pnpm
pnpm add @learncard/partner-connect`,
                }}
            />

            {/* What you get */}
            <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
                <h4 className="font-medium text-cyan-800 mb-3">What's included</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-cyan-800">Single Sign-On</p>
                            <p className="text-xs text-cyan-600">Get user identity instantly</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-cyan-800">Send Credentials</p>
                            <p className="text-xs text-cyan-600">Issue VCs to the wallet</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-cyan-800">Request Credentials</p>
                            <p className="text-xs text-cyan-600">Search user's wallet</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-cyan-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-cyan-800">Navigation</p>
                            <p className="text-xs text-cyan-600">Launch wallet features</p>
                        </div>
                    </div>
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

// Step 3: Initialize
const InitializeStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
}> = ({ onComplete, onBack }) => {
    const initCode = `import { createPartnerConnect } from '@learncard/partner-connect';

// Initialize the SDK
const learnCard = createPartnerConnect({
    hostOrigin: 'https://learncard.app'
});

// Request user identity (like SSO)
const identity = await learnCard.requestIdentity();

console.log('User DID:', identity.did);
console.log('User Profile:', identity.profile);
// profile contains: displayName, profileId, image, etc.`;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Initialize the SDK</h3>

                <p className="text-gray-600">
                    Set up the SDK when your app loads. You can immediately request the user's identity — 
                    no login required since they're already in the wallet.
                </p>
            </div>

            <CodeOutputPanel
                title="Initialization Code"
                snippets={{ typescript: initCode }}
            />

            {/* Identity response example */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <h4 className="font-medium text-gray-800 mb-2">Example Response</h4>

                <pre className="text-sm text-gray-600 bg-white p-3 rounded-lg overflow-x-auto">
{`{
  "did": "did:web:network.learncard.com:users:abc123",
  "profile": {
    "displayName": "John Doe",
    "profileId": "johndoe",
    "image": "https://..."
  }
}`}
                </pre>
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
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// Step 4: Use API
const UseApiStep: React.FC<{
    onBack: () => void;
}> = ({ onBack }) => {
    const [selectedMethod, setSelectedMethod] = useState('sendCredential');

    const methods = [
        {
            id: 'sendCredential',
            name: 'sendCredential()',
            description: 'Send a credential to the user\'s wallet',
            code: `// Send a credential to the wallet
const result = await learnCard.sendCredential({
    credential: {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        "type": ["VerifiableCredential", "Achievement"],
        "issuer": "did:web:your-app.com",
        "credentialSubject": {
            "name": "Course Completion",
            "description": "Completed JavaScript 101"
        }
    }
});

if (result.success) {
    console.log('Credential saved to wallet!');
}`,
        },
        {
            id: 'askCredentialSearch',
            name: 'askCredentialSearch()',
            description: 'Search for credentials in the wallet',
            code: `// Search user's credentials
const results = await learnCard.askCredentialSearch({
    type: ['VerifiableCredential', 'Achievement']
});

// User will be prompted to select credentials to share
console.log('Shared credentials:', results.credentials);`,
        },
        {
            id: 'launchFeature',
            name: 'launchFeature()',
            description: 'Navigate the wallet to a specific page',
            code: `// Open the wallet's credential view
await learnCard.launchFeature('/wallet', 'View your credentials');

// Or open contacts
await learnCard.launchFeature('/contacts', 'Find connections');`,
        },
        {
            id: 'requestConsent',
            name: 'requestConsent()',
            description: 'Request consent for data sharing',
            code: `// Request user consent for a contract
const consent = await learnCard.requestConsent('lc:contract:abc123');

if (consent.granted) {
    console.log('User granted consent!');
    // Now you can access data per the contract terms
}`,
        },
    ];

    const selectedMethodData = methods.find(m => m.id === selectedMethod);

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Use the API</h3>

                <p className="text-gray-600">
                    Now you can interact with the wallet. Select a method below to see how it works.
                </p>
            </div>

            {/* Method selector */}
            <div className="flex flex-wrap gap-2">
                {methods.map(method => (
                    <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedMethod === method.id
                                ? 'bg-cyan-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {method.name}
                    </button>
                ))}
            </div>

            {/* Selected method */}
            {selectedMethodData && (
                <div className="space-y-3">
                    <p className="text-gray-600">{selectedMethodData.description}</p>

                    <CodeOutputPanel
                        title={selectedMethodData.name}
                        snippets={{ typescript: selectedMethodData.code }}
                    />
                </div>
            )}

            {/* Success state */}
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-cyan-50 border border-emerald-200 rounded-2xl text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Rocket className="w-8 h-8 text-emerald-600" />
                </div>

                <h4 className="text-lg font-semibold text-gray-800 mb-2">Ready to build!</h4>

                <p className="text-gray-600 mb-4">
                    You have everything you need to build an embedded LearnCard app.
                </p>
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
                    href="https://docs.learncard.com/sdks/partner-connect"
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
const EmbedAppGuide: React.FC = () => {
    const guideState = useGuideState('embed-app', STEPS.length);
    const [appUrl, setAppUrl] = useState('');

    const handleStepComplete = (stepId: string) => {
        guideState.markStepComplete(stepId);
        guideState.nextStep();
    };

    const renderStep = () => {
        switch (guideState.currentStep) {
            case 0:
                return (
                    <SetupWebsiteStep
                        onComplete={() => handleStepComplete('setup-website')}
                        appUrl={appUrl}
                        setAppUrl={setAppUrl}
                    />
                );

            case 1:
                return (
                    <InstallSdkStep
                        onComplete={() => handleStepComplete('install-sdk')}
                        onBack={guideState.prevStep}
                    />
                );

            case 2:
                return (
                    <InitializeStep
                        onComplete={() => handleStepComplete('initialize')}
                        onBack={guideState.prevStep}
                    />
                );

            case 3:
                return (
                    <UseApiStep
                        onBack={guideState.prevStep}
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

export default EmbedAppGuide;
