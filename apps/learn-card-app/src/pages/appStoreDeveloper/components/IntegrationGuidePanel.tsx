import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, ChevronRight, Code, Globe, Package, Zap } from 'lucide-react';

import type { AppPermission } from '../types';

interface IntegrationGuidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    launchType: string;
    selectedPermissions?: AppPermission[];
}

const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language = 'typescript' }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group">
            <pre className="p-4 bg-gray-900 text-gray-100 rounded-xl text-xs overflow-x-auto">
                <code>{code}</code>
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

export const IntegrationGuidePanel: React.FC<IntegrationGuidePanelProps> = ({
    isOpen,
    onClose,
    launchType,
    selectedPermissions = [],
}) => {
    const renderGuideContent = () => {
        switch (launchType) {
            case 'EMBEDDED_IFRAME':
                return <EmbeddedIframeGuide selectedPermissions={selectedPermissions} />;
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
