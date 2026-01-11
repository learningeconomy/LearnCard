/**
 * PartnerConnectTab - Partner Connect SDK Reference & Code Generator
 * 
 * For embed-app integrations: shows SDK installation, API reference,
 * and dynamic code generation for the @learncard/partner-connect SDK.
 * 
 * Mirrors functionality from EmbedAppGuide's UseApiStep and YourAppStep.
 */

import React, { useState, useMemo } from 'react';
import {
    Code,
    Copy,
    Check,
    ChevronRight,
    Terminal,
    User,
    Send,
    FileSearch,
    Key,
    FileText,
    Navigation,
    ClipboardCheck,
    Award,
    Zap,
    Package,
    ExternalLink,
    Info,
    ChevronDown,
} from 'lucide-react';
import type { LCNIntegration, AppStoreListing } from '@learncard/types';

import { useToast, ToastTypeEnum } from 'learn-card-base';
import { Clipboard } from '@capacitor/clipboard';

import { CodeBlock } from '../../components/CodeBlock';

interface ApiMethod {
    id: string;
    name: string;
    category: 'auth' | 'credentials' | 'navigation' | 'consent';
    icon: React.ReactNode;
    shortDescription: string;
    description: string;
    parameters: Array<{
        name: string;
        type: string;
        required: boolean;
        description: string;
    }>;
    returns: {
        type: string;
        description: string;
        example: string;
    };
    code: string;
    tips?: string[];
}

interface PartnerConnectTabProps {
    integration: LCNIntegration;
    selectedListing?: AppStoreListing | null;
}

const METHODS: ApiMethod[] = [
    {
        id: 'requestIdentity',
        name: 'requestIdentity',
        category: 'auth',
        icon: <User className="w-4 h-4" />,
        shortDescription: 'SSO authentication',
        description: 'Request the user\'s identity for single sign-on. Since the user is already authenticated in the LearnCard wallet, this instantly returns their DID and profile information — no login flow required.',
        parameters: [],
        returns: {
            type: 'Promise<Identity>',
            description: 'User identity object with DID and profile',
            example: `{
  "did": "did:web:network.learncard.com:users:abc123",
  "profile": {
    "displayName": "Jane Smith",
    "profileId": "janesmith",
    "image": "https://cdn.learncard.com/avatars/abc123.png",
    "email": "jane@example.com"
  }
}`,
        },
        code: `import { createPartnerConnect } from '@learncard/partner-connect';

const learnCard = createPartnerConnect({
    hostOrigin: 'https://learncard.app'
});

// Get the authenticated user's identity
const identity = await learnCard.requestIdentity();

// Use the identity in your app
console.log('Welcome,', identity.profile.displayName);
console.log('User DID:', identity.did);

// You can use the DID as a unique user identifier
const userId = identity.did;`,
        tips: [
            'Call this on app load to immediately identify the user',
            'The DID is a unique, cryptographic identifier for the user',
            'Profile data may be partial depending on user privacy settings',
        ],
    },
    {
        id: 'sendCredential',
        name: 'sendCredential',
        category: 'credentials',
        icon: <Send className="w-4 h-4" />,
        shortDescription: 'Issue a credential',
        description: 'Send a Verifiable Credential directly to the user\'s wallet. The user will see a prompt to accept the credential. Use this for course completions, achievements, certificates, and more.',
        parameters: [
            {
                name: 'credential',
                type: 'VerifiableCredential',
                required: true,
                description: 'The W3C Verifiable Credential object to send',
            },
        ],
        returns: {
            type: 'Promise<{ success: boolean }>',
            description: 'Whether the credential was accepted',
            example: `{ "success": true }`,
        },
        code: `// Issue a credential when user completes something
const credential = {
    "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
    ],
    "type": ["VerifiableCredential", "OpenBadgeCredential"],
    "name": "JavaScript Fundamentals",
    "issuer": {
        "id": "did:web:your-app.com",
        "name": "Your App Name"
    },
    "credentialSubject": {
        "achievement": {
            "type": ["Achievement"],
            "name": "JavaScript Fundamentals",
            "description": "Completed the JavaScript fundamentals course",
            "achievementType": "Certificate"
        }
    }
};

const result = await learnCard.sendCredential({ credential });

if (result.success) {
    showSuccessMessage('Credential added to your wallet!');
}`,
        tips: [
            'Use Open Badges 3.0 format for maximum compatibility',
            'Include your issuer DID for credential verification',
            'The user can decline — always handle the rejection case',
        ],
    },
    {
        id: 'askCredentialSearch',
        name: 'askCredentialSearch',
        category: 'credentials',
        icon: <FileSearch className="w-4 h-4" />,
        shortDescription: 'Query user credentials',
        description: 'Request access to search the user\'s credential wallet. The user will see a consent prompt and can choose which credentials to share. Great for verification flows or importing existing credentials.',
        parameters: [
            {
                name: 'query',
                type: 'CredentialQuery',
                required: false,
                description: 'Optional filter criteria for credential types',
            },
        ],
        returns: {
            type: 'Promise<{ credentials: VerifiableCredential[] }>',
            description: 'Array of credentials the user chose to share',
            example: `{
  "credentials": [
    {
      "@context": [...],
      "type": ["VerifiableCredential", "OpenBadgeCredential"],
      "name": "Python Developer Certificate",
      ...
    }
  ]
}`,
        },
        code: `// Search for specific credential types
const result = await learnCard.askCredentialSearch({
    type: ['OpenBadgeCredential']
});

// User selects which credentials to share
if (result.credentials.length > 0) {
    console.log('User shared', result.credentials.length, 'credentials');
    
    // Process the shared credentials
    for (const cred of result.credentials) {
        console.log('Credential:', cred.name);
        // Verify, display, or store the credential
    }
} else {
    console.log('User declined or has no matching credentials');
}`,
        tips: [
            'Users control what they share — respect their privacy',
            'Filter by type to only request relevant credentials',
            'Credentials are cryptographically verifiable',
        ],
    },
    {
        id: 'initiateTemplateIssue',
        name: 'initiateTemplateIssue',
        category: 'credentials',
        icon: <FileText className="w-4 h-4" />,
        shortDescription: 'Issue from template',
        description: 'Issue a credential using a pre-defined boost template. Templates are configured in the LearnCard dashboard and ensure consistent credential formatting. Best for recurring credential types.',
        parameters: [
            {
                name: 'templateUri',
                type: 'string',
                required: true,
                description: 'The URI of the boost/template to issue from',
            },
            {
                name: 'recipientDid',
                type: 'string',
                required: false,
                description: 'DID of the recipient (defaults to current user)',
            },
        ],
        returns: {
            type: 'Promise<{ success: boolean, credentialId?: string }>',
            description: 'Result of the issuance',
            example: `{
  "success": true,
  "credentialId": "urn:uuid:new-cred-123..."
}`,
        },
        code: `// Issue from a pre-configured template
const templateUri = 'lc:boost:your-org:course-completion-template';

const result = await learnCard.initiateTemplateIssue({
    templateUri,
    // Optionally specify recipient (defaults to current user)
    // recipientDid: 'did:web:...'
});

if (result.success) {
    console.log('Credential issued:', result.credentialId);
    showSuccess('Achievement unlocked!');
}`,
        tips: [
            'Create templates in the Templates tab first',
            'Templates ensure consistent branding and fields',
            'Great for gamification with pre-defined achievements',
        ],
    },
    {
        id: 'launchFeature',
        name: 'launchFeature',
        category: 'navigation',
        icon: <Navigation className="w-4 h-4" />,
        shortDescription: 'Navigate host app',
        description: 'Navigate the LearnCard wallet to a specific feature or page. This allows your app to integrate with wallet features like viewing credentials, managing contacts, or accessing settings.',
        parameters: [
            {
                name: 'path',
                type: 'string',
                required: true,
                description: 'The wallet path to navigate to',
            },
            {
                name: 'description',
                type: 'string',
                required: false,
                description: 'Optional description shown during navigation',
            },
        ],
        returns: {
            type: 'Promise<void>',
            description: 'Resolves when navigation completes',
            example: `// No return value`,
        },
        code: `// Navigate to the user's credential wallet
await learnCard.launchFeature('/wallet', 'View your credentials');

// Open the contacts/connections page
await learnCard.launchFeature('/contacts', 'Find and connect with others');

// Open settings
await learnCard.launchFeature('/settings', 'Manage your preferences');

// Open a specific credential detail
await learnCard.launchFeature('/credential/abc123', 'View credential details');

// Available paths:
// /wallet     - Credential wallet
// /contacts   - Connections & contacts
// /settings   - User settings
// /profile    - User profile
// /activity   - Activity feed`,
        tips: [
            'Use this to complement your app\'s features with wallet features',
            'The description appears as a toast or transition message',
            'Navigation happens within the wallet, not your iframe',
        ],
    },
    {
        id: 'requestConsent',
        name: 'requestConsent',
        category: 'consent',
        icon: <ClipboardCheck className="w-4 h-4" />,
        shortDescription: 'Request permissions',
        description: 'Request user consent for specific permissions or data access. Consent is tied to a contract URI that defines what access is being granted. Use this for ongoing data access agreements.',
        parameters: [
            {
                name: 'contractUri',
                type: 'string',
                required: true,
                description: 'The URI of the consent contract',
            },
            {
                name: 'options',
                type: 'ConsentOptions',
                required: false,
                description: 'Additional options like scope and duration',
            },
        ],
        returns: {
            type: 'Promise<{ granted: boolean, consentId?: string }>',
            description: 'Whether consent was granted',
            example: `{
  "granted": true,
  "consentId": "consent:abc123..."
}`,
        },
        code: `// Request consent for a data sharing agreement
const result = await learnCard.requestConsent('lc:contract:your-app:data-access', {
    scope: ['profile', 'credentials'],
    duration: '30d' // 30 days
});

if (result.granted) {
    console.log('Consent granted! ID:', result.consentId);
    
    // Store the consent ID for future reference
    await saveUserConsent(userId, result.consentId);
    
    // Now you can access data per the contract terms
    enablePremiumFeatures();
} else {
    console.log('User declined consent');
    showLimitedFeatures();
}`,
        tips: [
            'Be clear about what access you\'re requesting',
            'Users can revoke consent at any time',
            'Store consent IDs to track active agreements',
        ],
    },
];

const CATEGORIES = [
    { id: 'auth', name: 'Authentication', icon: <User className="w-4 h-4" /> },
    { id: 'credentials', name: 'Credentials', icon: <Award className="w-4 h-4" /> },
    { id: 'navigation', name: 'Navigation', icon: <Navigation className="w-4 h-4" /> },
    { id: 'consent', name: 'Consent', icon: <ClipboardCheck className="w-4 h-4" /> },
];

export const PartnerConnectTab: React.FC<PartnerConnectTabProps> = ({
    integration,
    selectedListing,
}) => {
    const { presentToast } = useToast();
    const [selectedMethodId, setSelectedMethodId] = useState('requestIdentity');
    const [showInstall, setShowInstall] = useState(true);
    const [copied, setCopied] = useState<string | null>(null);

    const selectedMethod = useMemo(
        () => METHODS.find(m => m.id === selectedMethodId) || METHODS[0],
        [selectedMethodId]
    );

    const handleCopy = async (code: string, id: string) => {
        await Clipboard.write({ string: code });
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
        presentToast('Copied!', { hasDismissButton: true });
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'auth': return 'text-violet-600 bg-violet-100';
            case 'credentials': return 'text-cyan-600 bg-cyan-100';
            case 'navigation': return 'text-amber-600 bg-amber-100';
            case 'consent': return 'text-emerald-600 bg-emerald-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const installCode = `npm install @learncard/partner-connect`;

    const initCode = `import { createPartnerConnect } from '@learncard/partner-connect';

const learnCard = createPartnerConnect({
    hostOrigin: 'https://learncard.app'
});

// Get user identity (SSO - no login needed!)
const identity = await learnCard.requestIdentity();
console.log('User:', identity.profile.displayName);`;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Partner Connect SDK</h2>
                <p className="text-sm text-gray-500">
                    Integration code for your embedded app
                </p>
            </div>

            {/* Installation Section */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                    onClick={() => setShowInstall(!showInstall)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-cyan-600" />
                        <div className="text-left">
                            <h3 className="font-medium text-gray-800">Installation & Setup</h3>
                            <p className="text-xs text-gray-500">Install the SDK and initialize it in your app</p>
                        </div>
                    </div>

                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showInstall ? 'rotate-180' : ''}`} />
                </button>

                {showInstall && (
                    <div className="p-4 border-t border-gray-200 space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">1. Install the SDK</span>
                                <button
                                    onClick={() => handleCopy(installCode, 'install')}
                                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                >
                                    {copied === 'install' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                    {copied === 'install' ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <CodeBlock code={installCode} />
                            <p className="text-xs text-gray-500 mt-1">
                                Also works with <code className="bg-gray-100 px-1 rounded">yarn add</code> or <code className="bg-gray-100 px-1 rounded">pnpm add</code>
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">2. Initialize</span>
                                <button
                                    onClick={() => handleCopy(initCode, 'init')}
                                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                >
                                    {copied === 'init' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                    {copied === 'init' ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <CodeBlock code={initCode} />
                        </div>

                        <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl">
                            <p className="text-sm text-cyan-800">
                                <strong>That's it!</strong> Users are already logged in when inside the wallet, so <code className="bg-cyan-100 px-1 rounded">requestIdentity()</code> returns instantly with their profile.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* API Reference */}
            <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">API Reference</h3>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Method Navigation */}
                    <div className="lg:col-span-4 space-y-3">
                        {CATEGORIES.map(category => {
                            const categoryMethods = METHODS.filter(m => m.category === category.id);

                            return (
                                <div key={category.id}>
                                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        {category.icon}
                                        {category.name}
                                    </div>

                                    <div className="space-y-1">
                                        {categoryMethods.map(method => (
                                            <button
                                                key={method.id}
                                                onClick={() => setSelectedMethodId(method.id)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                                                    selectedMethodId === method.id
                                                        ? 'bg-cyan-50 border border-cyan-200 text-cyan-700'
                                                        : 'hover:bg-gray-50 text-gray-700'
                                                }`}
                                            >
                                                <span className={`p-1.5 rounded-md ${getCategoryColor(method.category)}`}>
                                                    {method.icon}
                                                </span>

                                                <div className="flex-1 min-w-0">
                                                    <div className="font-mono text-sm font-medium truncate">
                                                        {method.name}()
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate">
                                                        {method.shortDescription}
                                                    </div>
                                                </div>

                                                {selectedMethodId === method.id && (
                                                    <ChevronRight className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Method Details */}
                    <div className="lg:col-span-8 space-y-4">
                        {/* Method Header */}
                        <div className="p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl ${getCategoryColor(selectedMethod.category)}`}>
                                    {selectedMethod.icon}
                                </div>

                                <div className="flex-1">
                                    <h4 className="text-lg font-mono font-semibold text-gray-800">
                                        learnCard.{selectedMethod.name}()
                                    </h4>
                                    <p className="mt-2 text-gray-600 text-sm leading-relaxed">
                                        {selectedMethod.description}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Parameters */}
                        {selectedMethod.parameters.length > 0 && (
                            <div>
                                <h5 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                    <Code className="w-4 h-4 text-gray-500" />
                                    Parameters
                                </h5>

                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    {selectedMethod.parameters.map((param, idx) => (
                                        <div
                                            key={param.name}
                                            className={`p-3 ${idx > 0 ? 'border-t border-gray-200' : ''}`}
                                        >
                                            <div className="flex items-start gap-2 flex-wrap">
                                                <code className="px-2 py-0.5 bg-gray-100 rounded text-sm font-mono text-gray-800">
                                                    {param.name}
                                                </code>
                                                <code className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                                                    {param.type}
                                                </code>
                                                {param.required && (
                                                    <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-medium">
                                                        required
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-sm text-gray-600">{param.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Returns */}
                        <div>
                            <h5 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                                Returns
                            </h5>

                            <div className="p-3 border border-gray-200 rounded-xl">
                                <code className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-sm">
                                    {selectedMethod.returns.type}
                                </code>
                                <p className="mt-1 text-sm text-gray-600">{selectedMethod.returns.description}</p>

                                <div className="mt-2">
                                    <CodeBlock code={selectedMethod.returns.example} maxHeight="max-h-32" />
                                </div>
                            </div>
                        </div>

                        {/* Code Example */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-gray-500" />
                                    Example
                                </h5>
                                <button
                                    onClick={() => handleCopy(selectedMethod.code, 'example')}
                                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                >
                                    {copied === 'example' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                    {copied === 'example' ? 'Copied!' : 'Copy'}
                                </button>
                            </div>

                            <CodeBlock code={selectedMethod.code} maxHeight="max-h-72" />
                        </div>

                        {/* Tips */}
                        {selectedMethod.tips && selectedMethod.tips.length > 0 && (
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                <h5 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    Pro Tips
                                </h5>
                                <ul className="space-y-1">
                                    {selectedMethod.tips.map((tip, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-amber-700">
                                            <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Resources */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                <a
                    href="https://docs.learncard.com/sdks/partner-connect"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                    <FileText className="w-4 h-4" />
                    SDK Documentation
                    <ExternalLink className="w-3 h-3" />
                </a>

                <a
                    href="https://github.com/learningeconomy/LearnCard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                    <Code className="w-4 h-4" />
                    GitHub Examples
                    <ExternalLink className="w-3 h-3" />
                </a>
            </div>
        </div>
    );
};
