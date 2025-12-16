import React, { useState } from 'react';
import { 
    FileSearch, 
    Code, 
    Shield, 
    Rocket, 
    ArrowRight, 
    ArrowLeft, 
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    Loader2,
} from 'lucide-react';

import { useWallet } from 'learn-card-base';

import { StepProgress, CodeOutputPanel, StatusIndicator } from '../shared';
import { useGuideState } from '../shared/useGuideState';

const STEPS = [
    { id: 'understand', title: 'Understand VCs' },
    { id: 'request', title: 'Request Credentials' },
    { id: 'verify', title: 'Verify & Validate' },
    { id: 'test', title: 'Test It' },
];

// Step 1: Understand
const UnderstandStep: React.FC<{
    onComplete: () => void;
}> = ({ onComplete }) => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Understanding Verifiable Credentials</h3>

                <p className="text-gray-600">
                    Verifiable Credentials (VCs) are digital documents that prove something about a person — 
                    like a badge, certificate, or ID — that can be cryptographically verified.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <h4 className="font-medium text-blue-800 mb-2">What you can verify</h4>

                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• The credential hasn't been tampered with</li>
                        <li>• It was issued by who it claims</li>
                        <li>• It hasn't expired</li>
                        <li>• It hasn't been revoked</li>
                    </ul>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <h4 className="font-medium text-emerald-800 mb-2">Common use cases</h4>

                    <ul className="text-sm text-emerald-700 space-y-1">
                        <li>• Verify course completions</li>
                        <li>• Check professional certifications</li>
                        <li>• Validate identity documents</li>
                        <li>• Confirm memberships</li>
                    </ul>
                </div>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <h4 className="font-medium text-gray-800 mb-2">Example Credential Structure</h4>

                <pre className="text-xs text-gray-600 bg-white p-3 rounded-lg overflow-x-auto">
{`{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiableCredential", "Achievement"],
  "issuer": "did:web:university.edu",
  "issuanceDate": "2024-01-15T00:00:00Z",
  "credentialSubject": {
    "name": "Bachelor of Computer Science",
    "achievementType": "Degree"
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "verificationMethod": "did:web:university.edu#key-1",
    "proofValue": "z58DAdFfa9SkqZMVPxAQpic..."
  }
}`}
                </pre>
            </div>

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

// Step 2: Request
const RequestStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
}> = ({ onComplete, onBack }) => {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Requesting Credentials</h3>

                <p className="text-gray-600">
                    You can request credentials from users in different ways depending on your integration type.
                </p>
            </div>

            <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-xl">
                    <h4 className="font-medium text-gray-800 mb-2">Option 1: Embedded App (Partner Connect)</h4>

                    <CodeOutputPanel
                        title="Request via SDK"
                        snippets={{
                            typescript: `// In your embedded app
const result = await learnCard.askCredentialSearch({
    type: ['VerifiableCredential', 'Achievement']
});

// User selects which credentials to share
const credentials = result.credentials;

// Verify each credential
for (const vc of credentials) {
    const verification = await verifyCredential(vc);
    console.log('Valid:', verification.valid);
}`,
                        }}
                    />
                </div>

                <div className="p-4 border border-gray-200 rounded-xl">
                    <h4 className="font-medium text-gray-800 mb-2">Option 2: Direct Presentation</h4>

                    <p className="text-sm text-gray-600 mb-3">
                        Accept credentials posted directly to your API endpoint.
                    </p>

                    <CodeOutputPanel
                        title="API Endpoint"
                        snippets={{
                            typescript: `// Express.js endpoint
app.post('/api/verify-credential', async (req, res) => {
    const { credential } = req.body;
    
    // Verify the credential (see next step)
    const result = await verifyCredential(credential);
    
    res.json({
        valid: result.valid,
        errors: result.errors
    });
});`,
                        }}
                    />
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
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors"
                >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// Step 3: Verify
const VerifyStep: React.FC<{
    onComplete: () => void;
    onBack: () => void;
}> = ({ onComplete, onBack }) => {
    const verifyCode = `import { initLearnCard } from '@learncard/init';

async function verifyCredential(credential: any) {
    // Initialize LearnCard (no auth needed for verification)
    const learnCard = await initLearnCard();
    
    // Verify the credential
    const result = await learnCard.invoke.verifyCredential(credential);
    
    return {
        valid: result.warnings.length === 0 && result.errors.length === 0,
        warnings: result.warnings,
        errors: result.errors,
        checks: result.checks
    };
}

// Usage
const credential = { /* received from user */ };
const result = await verifyCredential(credential);

if (result.valid) {
    console.log('Credential is valid!');
    console.log('Issuer:', credential.issuer);
    console.log('Subject:', credential.credentialSubject);
} else {
    console.log('Verification failed:', result.errors);
}`;

    const checksExplanation = `// What gets checked:
{
  "checks": [
    "proof",           // Cryptographic signature is valid
    "expiration",      // Not expired (if expirationDate set)
    "issuanceDate",    // Issued in the past, not future
    "credentialStatus" // Not revoked (if status method set)
  ],
  "warnings": [],      // Non-critical issues
  "errors": []         // Critical failures
}`;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Verifying Credentials</h3>

                <p className="text-gray-600">
                    Use the LearnCard SDK to cryptographically verify credentials. No API key required for verification.
                </p>
            </div>

            <CodeOutputPanel
                title="Verification Code"
                snippets={{
                    typescript: verifyCode,
                    curl: `# Verify via API
curl -X POST https://api.learncard.com/credentials/verify \\
  -H "Content-Type: application/json" \\
  -d '{
    "credential": {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      "type": ["VerifiableCredential"],
      ...
    }
  }'`,
                }}
            />

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <h4 className="font-medium text-gray-800 mb-2">What Gets Checked</h4>

                <pre className="text-xs text-gray-600 bg-white p-3 rounded-lg overflow-x-auto">
                    {checksExplanation}
                </pre>
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

// Step 4: Test
const TestStep: React.FC<{
    onBack: () => void;
}> = ({ onBack }) => {
    const { initWallet } = useWallet();

    const [testInput, setTestInput] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [result, setResult] = useState<{
        valid: boolean;
        checks: string[];
        warnings: string[];
        errors: string[];
    } | null>(null);

    const handleVerify = async () => {
        if (!testInput.trim()) return;

        setVerifying(true);
        setResult(null);

        try {
            const wallet = await initWallet();
            const credential = JSON.parse(testInput);

            const verifyResult = await wallet.invoke.verifyCredential(credential);

            setResult({
                valid: verifyResult.warnings.length === 0 && verifyResult.errors.length === 0,
                checks: verifyResult.checks || [],
                warnings: verifyResult.warnings,
                errors: verifyResult.errors,
            });
        } catch (err) {
            console.error('Verification failed:', err);
            setResult({
                valid: false,
                checks: [],
                warnings: [],
                errors: ['Invalid JSON or credential format'],
            });
        } finally {
            setVerifying(false);
        }
    };

    const sampleCredential = `{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiableCredential"],
  "issuer": "did:web:example.com",
  "issuanceDate": "2024-01-01T00:00:00Z",
  "credentialSubject": {
    "id": "did:example:user123",
    "name": "Test Achievement"
  }
}`;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Test Verification</h3>

                <p className="text-gray-600">
                    Try verifying a credential right here. Paste a credential JSON below.
                </p>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <span className="font-medium text-gray-800">Credential Input</span>

                    <button
                        onClick={() => setTestInput(sampleCredential)}
                        className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                    >
                        Use Sample
                    </button>
                </div>

                <textarea
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    placeholder='{"@context": [...], "type": [...], ...}'
                    rows={8}
                    className="w-full p-4 bg-gray-900 text-gray-100 font-mono text-sm focus:outline-none resize-none"
                />

                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={handleVerify}
                        disabled={verifying || !testInput.trim()}
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
                </div>
            </div>

            {/* Result */}
            {result && (
                <div className={`p-4 rounded-xl border ${result.valid ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-3">
                        {result.valid ? (
                            <>
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                <span className="font-medium text-emerald-800">Credential is valid!</span>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                <span className="font-medium text-red-800">Verification failed</span>
                            </>
                        )}
                    </div>

                    {result.checks.length > 0 && (
                        <div className="mb-2">
                            <span className="text-xs font-medium text-gray-600">Checks passed:</span>

                            <div className="flex flex-wrap gap-1 mt-1">
                                {result.checks.map((check, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                                        {check}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {result.errors.length > 0 && (
                        <div>
                            <span className="text-xs font-medium text-red-600">Errors:</span>

                            <ul className="text-sm text-red-700 mt-1">
                                {result.errors.map((err, i) => (
                                    <li key={i}>• {err}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Success state */}
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-cyan-50 border border-emerald-200 rounded-2xl text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Rocket className="w-8 h-8 text-emerald-600" />
                </div>

                <h4 className="text-lg font-semibold text-gray-800 mb-2">Ready to verify!</h4>

                <p className="text-gray-600">
                    You can now accept and verify credentials from users.
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
                    href="https://docs.learncard.com/guides/verification"
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
const VerifyCredentialsGuide: React.FC = () => {
    const guideState = useGuideState('verify-credentials', STEPS.length);

    const handleStepComplete = (stepId: string) => {
        guideState.markStepComplete(stepId);
        guideState.nextStep();
    };

    const renderStep = () => {
        switch (guideState.currentStep) {
            case 0:
                return <UnderstandStep onComplete={() => handleStepComplete('understand')} />;

            case 1:
                return (
                    <RequestStep
                        onComplete={() => handleStepComplete('request')}
                        onBack={guideState.prevStep}
                    />
                );

            case 2:
                return (
                    <VerifyStep
                        onComplete={() => handleStepComplete('verify')}
                        onBack={guideState.prevStep}
                    />
                );

            case 3:
                return <TestStep onBack={guideState.prevStep} />;

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

export default VerifyCredentialsGuide;
