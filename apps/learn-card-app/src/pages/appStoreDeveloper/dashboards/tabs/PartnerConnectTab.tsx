/**
 * PartnerConnectTab - Partner Connect SDK Reference & Code Generator
 * 
 * For embed-app integrations: shows SDK installation, API reference,
 * and dynamic code generation for the @learncard/partner-connect SDK.
 * 
 * Mirrors functionality from EmbedAppGuide's UseApiStep and YourAppStep.
 */

import React, { useState, useMemo, useEffect } from 'react';
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
    Layout,
    Loader2,
} from 'lucide-react';
import type { LCNIntegration, AppStoreListing } from '@learncard/types';

import { useToast, ToastTypeEnum, useWallet } from 'learn-card-base';
import { useDeveloperPortal } from '../../useDeveloperPortal';
import type { EmbedAppGuideConfig, LLMIntegrationMetadata, TemplateMetadata, GuideState } from '../../guides/types';
import { Clipboard } from '@capacitor/clipboard';

import { CodeBlock } from '../../components/CodeBlock';
import { TemplateListManager } from '../../components/TemplateListManager';

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

interface BoostTemplate {
    uri: string;
    name: string;
    description?: string;
    type?: string;
    category?: string;
    image?: string;
    createdAt?: string;
}

const FEATURES = [
    { id: 'issue-credentials', title: 'Issue Credentials', icon: <Award className="w-4 h-4" /> },
    { id: 'peer-badges', title: 'Peer-to-Peer Badges', icon: <Send className="w-4 h-4" /> },
    { id: 'request-credentials', title: 'Request Credentials', icon: <FileSearch className="w-4 h-4" /> },
    { id: 'request-data-consent', title: 'Request Data Consent', icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: 'launch-feature', title: 'Launch Features', icon: <Navigation className="w-4 h-4" /> },
];

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
    selectedListing: externalSelectedListing,
}) => {
    const { presentToast } = useToast();
    const { initWallet } = useWallet();
    const { useListingsForIntegration } = useDeveloperPortal();

    // Fetch app listings for this integration
    const { data: appListings, isLoading: listingsLoading } = useListingsForIntegration(integration.id);

    // Local selected listing state (can be overridden by external prop)
    const [localSelectedListing, setLocalSelectedListing] = useState<AppStoreListing | null>(externalSelectedListing || null);

    // Use external selection if provided, otherwise use local
    const selectedListing = externalSelectedListing || localSelectedListing;

    // Auto-select first listing when listings load
    useEffect(() => {
        if (appListings && appListings.length > 0 && !localSelectedListing && !externalSelectedListing) {
            setLocalSelectedListing(appListings[0]);
        }
    }, [appListings, localSelectedListing, externalSelectedListing]);

    const [selectedMethodId, setSelectedMethodId] = useState('requestIdentity');
    const [copied, setCopied] = useState<string | null>(null);
    const [templates, setTemplates] = useState<BoostTemplate[]>([]);

    // Tab navigation state
    const [activeTab, setActiveTab] = useState<'templates' | 'code' | 'setup'>('templates');
    const [templateType, setTemplateType] = useState<'issue-credentials' | 'peer-badges'>('issue-credentials');

    // ============================================================
    // EXTRACT SAVED CONFIG FROM GUIDE STATE
    // ============================================================
    const guideState = integration?.guideState as GuideState | undefined;
    const savedConfig = guideState?.config?.embedAppConfig as EmbedAppGuideConfig | undefined;
    const selectedFeatures = savedConfig?.selectedFeatures || [];
    const featureConfig = savedConfig?.featureConfig || {};

    // Extract feature-specific configuration
    const issueCredentialsConfig = featureConfig['issue-credentials'];
    const requestDataConsentConfig = featureConfig['request-data-consent'];
    const requestCredentialsConfig = featureConfig['request-credentials'];

    const hasConfig = selectedFeatures.length > 0;

    // ============================================================
    // FETCH TEMPLATES - by both appListingId AND integrationId
    // ============================================================
    useEffect(() => {
        if (!selectedListing?.listing_id && !integration?.id) {
            setTemplates([]);
            return;
        }

        let cancelled = false;

        const fetchAllTemplates = async () => {
            try {
                const wallet = await initWallet();
                const allTemplates: BoostTemplate[] = [];
                const seenUris = new Set<string>();

                const addTemplates = (records: Record<string, unknown>[]) => {
                    for (const boost of records) {
                        const uri = boost.uri as string;

                        if (!seenUris.has(uri)) {
                            seenUris.add(uri);
                            allTemplates.push({
                                uri,
                                name: boost.name as string || 'Untitled Template',
                                description: boost.description as string,
                                type: boost.type as string,
                                category: boost.category as string,
                                image: boost.image as string,
                                createdAt: boost.createdAt as string,
                            });
                        }
                    }
                };

                // Fetch by appListingId
                if (selectedListing?.listing_id) {
                    const byListing = await wallet.invoke.getPaginatedBoosts({
                        limit: 100,
                        query: { meta: { appListingId: selectedListing.listing_id } }
                    });
                    addTemplates(byListing?.records || []);
                }

                // Fetch by integrationId
                if (integration?.id) {
                    const byIntegration = await wallet.invoke.getPaginatedBoosts({
                        limit: 100,
                        query: { meta: { integrationId: integration.id } }
                    });
                    addTemplates(byIntegration?.records || []);
                }

                if (!cancelled) {
                    setTemplates(allTemplates);
                }
            } catch (err) {
                console.error('Failed to fetch templates:', err);

                if (!cancelled) {
                    setTemplates([]);
                }
            }
        };

        fetchAllTemplates();

        return () => {
            cancelled = true;
        };
    }, [selectedListing?.listing_id, integration?.id, initWallet]);

    // ============================================================
    // GENERATE PERSONALIZED CODE
    // ============================================================
    const generatePersonalizedCode = useMemo(() => {
        const sections: string[] = [];

        // Build LLM-friendly metadata
        const dataConsentContractUri = requestDataConsentConfig?.contractUri || null;
        const issueContractUri = issueCredentialsConfig?.contractUri || null;

        const llmMetadata: LLMIntegrationMetadata = {
            app: {
                name: selectedListing?.display_name || 'Your App Name',
                listingId: selectedListing?.listing_id || '',
                integrationId: integration?.id || '',
            },
            features: selectedFeatures,
            templates: {
                peerBadges: templates.map(t => ({
                    uri: t.uri,
                    name: t.name,
                    description: t.description,
                    type: t.type,
                })),
                issueCredentials: templates.map(t => ({
                    uri: t.uri,
                    name: t.name,
                    description: t.description,
                    type: t.type,
                })),
            },
            contracts: {
                dataConsent: dataConsentContractUri,
                issueCredentials: issueContractUri,
            },
            permissions: ['request_identity', ...(selectedFeatures.includes('issue-credentials') ? ['send_credential'] : []), ...(selectedFeatures.includes('peer-badges') ? ['initiate_template_issuance'] : [])],
            generatedAt: new Date().toISOString(),
        };

        // HEADER
        sections.push(`/**
 * ================================================================
 * LEARNCARD EMBEDDED APP INTEGRATION
 * ================================================================
 * 
 * App: ${selectedListing?.display_name || 'Your App Name'}
 * Listing ID: ${selectedListing?.listing_id || 'NOT_SET'}
 * Integration ID: ${integration?.id || 'NOT_SET'}
 * Generated: ${new Date().toISOString()}
 * 
 * Features configured:
 * ${selectedFeatures.length > 0 ? selectedFeatures.map(id => `  - ${FEATURES.find(f => f.id === id)?.title || id}`).join('\n * ') : '  - None selected (complete the setup wizard first)'}
 * 
 * ================================================================
 * LLM INTEGRATION METADATA
 * ================================================================
 * The following JSON contains all configured URIs and settings.
 * Use these values directly - no placeholders to replace!
 * 
 * @llm-config
${JSON.stringify(llmMetadata, null, 2).split('\n').map(line => ' * ' + line).join('\n')}
 * 
 * ================================================================
 * QUICK REFERENCE
 * ================================================================
 * ${templates.length > 0 ? `Templates: ${templates.length} available` : 'Templates: None configured'}
 * ${dataConsentContractUri ? `Data Consent Contract: ${dataConsentContractUri}` : 'Data Consent Contract: Not configured'}
 * ${issueContractUri ? `Issue Credentials Contract: ${issueContractUri}` : 'Issue Credentials Contract: Not configured'}
 * 
 * Prerequisites:
 *   1. Install the SDK: npm install @learncard/partner-connect
 *   2. Your app must be served in an iframe within LearnCard
 *   3. Configure CORS headers to allow iframe embedding
 * 
 * Documentation: https://docs.learncard.com/sdks/partner-connect
 */`);

        // IMPORTS
        sections.push(`
// ============================================================
// IMPORTS
// ============================================================
import { createPartnerConnect } from '@learncard/partner-connect';`);

        // SDK INITIALIZATION
        sections.push(`
// ============================================================
// SDK INITIALIZATION
// ============================================================
const learnCard = createPartnerConnect({
    hostOrigin: 'https://learncard.app',
});`);

        // USER IDENTITY
        sections.push(`
// ============================================================
// USER IDENTITY
// ============================================================
async function getUserIdentity() {
    try {
        const identity = await learnCard.requestIdentity();
        
        console.log('User DID:', identity.did);
        console.log('Display Name:', identity.profile.displayName);
        console.log('Profile ID:', identity.profile.profileId);
        
        return identity;
    } catch (error) {
        console.error('Failed to get user identity:', error);
        throw error;
    }
}`);

        // ISSUE CREDENTIALS
        if (selectedFeatures.includes('issue-credentials')) {
            const mode = issueCredentialsConfig?.mode || 'prompt-claim';

            if (mode === 'prompt-claim') {
                sections.push(`
// ============================================================
// ISSUE CREDENTIALS - Prompt to Claim
// ============================================================
async function issueCredentialToUser() {
    const identity = await learnCard.requestIdentity();
    const recipientDid = identity.did;

    // Build credential (customize fields as needed)
    const credential = {
        "@context": [
            "https://www.w3.org/2018/credentials/v1",
            "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"
        ],
        "type": ["VerifiableCredential", "OpenBadgeCredential"],
        "name": "${issueCredentialsConfig?.credentialName || 'Achievement Badge'}",
        "issuer": {
            "id": "YOUR_ISSUER_DID", // Replace with your issuer DID
            "name": "${selectedListing?.display_name || 'Your Organization'}"
        },
        "credentialSubject": {
            "id": recipientDid,
            "achievement": {
                "type": ["Achievement"],
                "name": "${issueCredentialsConfig?.credentialName || 'Achievement Badge'}",
                "achievementType": "Badge"
            }
        }
    };

    // Send to your server for signing, then prompt user
    const response = await fetch('/api/issue-credential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, recipientDid })
    });

    const { issuedVC } = await response.json();

    const result = await learnCard.sendCredential({ credential: issuedVC });

    if (result.success) {
        console.log('Credential claimed!');
    }
}`);
            } else {
                // sync-wallet mode
                const firstTemplate = templates[0];
                const templateUri = firstTemplate?.uri || 'urn:lc:boost:YOUR_TEMPLATE_URI';
                const contractUri = issueContractUri || 'urn:lc:contract:YOUR_CONTRACT_URI';

                sections.push(`
// ============================================================
// ISSUE CREDENTIALS - Sync to Wallet (Server-Side)
// ============================================================
// Contract URI: ${contractUri}
// ${firstTemplate ? `Using template: "${firstTemplate.name}" (${templateUri})` : 'No templates configured'}

const CREDENTIAL_TEMPLATES = ${JSON.stringify(templates.map(t => ({ uri: t.uri, name: t.name, description: t.description || '' })), null, 4)};

async function requestUserConsent() {
    const result = await learnCard.requestConsent({
        contractUri: '${contractUri}',
    });
    
    if (result.granted) {
        await fetch('/api/consent-granted', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: result.userId, contractUri: '${contractUri}' })
        });
        return true;
    }
    return false;
}`);
            }
        }

        // PEER BADGES
        if (selectedFeatures.includes('peer-badges')) {
            const templateConfigJson = templates.length > 0
                ? JSON.stringify(templates.map(t => ({
                    id: t.uri.split(':').pop() || t.uri,
                    uri: t.uri,
                    name: t.name,
                    description: t.description || '',
                    type: t.type || 'achievement',
                })), null, 4)
                : '[]';

            sections.push(`
// ============================================================
// PEER-TO-PEER BADGES - Template Configuration
// ============================================================
// LLM INTEGRATION NOTE: Use these template URIs when calling sendPeerBadge().

const PEER_BADGE_TEMPLATES = ${templateConfigJson};

function findTemplate(query: string) {
    const q = query.toLowerCase();
    return PEER_BADGE_TEMPLATES.find(t =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q)
    );
}

async function sendPeerBadge(templateUri: string) {
    try {
        await learnCard.initiateTemplateIssuance({ boostUri: templateUri });
        console.log('Peer badge flow initiated with template:', templateUri);
    } catch (error) {
        console.error('Failed to initiate peer badge:', error);
        throw error;
    }
}

async function sendPeerBadgeByName(searchQuery: string) {
    const template = findTemplate(searchQuery);

    if (!template) {
        throw new Error(\`No template found matching: \${searchQuery}. Available: \${PEER_BADGE_TEMPLATES.map(t => t.name).join(', ')}\`);
    }

    return sendPeerBadge(template.uri);
}`);
        }

        // REQUEST CREDENTIALS
        if (selectedFeatures.includes('request-credentials')) {
            const queryTitle = requestCredentialsConfig?.queryTitle || 'Share Your Credentials';
            const queryReason = requestCredentialsConfig?.queryReason || 'Please share relevant credentials';

            sections.push(`
// ============================================================
// REQUEST CREDENTIALS
// ============================================================
async function requestUserCredentials() {
    try {
        const response = await learnCard.askCredentialSearch({
            title: "${queryTitle}",
            reason: "${queryReason}",
        });

        if (response.credentials?.length > 0) {
            console.log('User shared', response.credentials.length, 'credentials');
            return response.credentials;
        }
        return [];
    } catch (error) {
        console.error('Error requesting credentials:', error);
        throw error;
    }
}`);
        }

        // REQUEST DATA CONSENT
        if (selectedFeatures.includes('request-data-consent')) {
            const contractUri = dataConsentContractUri || 'urn:lc:contract:YOUR_CONTRACT_URI';

            sections.push(`
// ============================================================
// REQUEST DATA CONSENT
// ============================================================
// Contract URI: ${contractUri}

async function requestDataConsent() {
    try {
        const result = await learnCard.requestConsent({
            contractUri: '${contractUri}',
        });

        if (result.granted) {
            console.log('User granted consent! User ID:', result.userId);

            await fetch('/api/consent-granted', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: result.userId, contractUri: '${contractUri}' })
            });

            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to request consent:', error);
        throw error;
    }
}`);
        }

        // LAUNCH FEATURE
        if (selectedFeatures.includes('launch-feature')) {
            sections.push(`
// ============================================================
// LAUNCH WALLET FEATURES
// ============================================================
async function launchWalletFeature(path: string, description?: string) {
    await learnCard.launchFeature(path, description);
}

// Available paths:
// launchWalletFeature('/wallet', 'View your credentials');
// launchWalletFeature('/contacts', 'Manage connections');
// launchWalletFeature('/settings', 'Update preferences');`);
        }

        return sections.join('\n');
    }, [selectedFeatures, selectedListing, integration, templates, issueCredentialsConfig, requestDataConsentConfig, requestCredentialsConfig]);

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
        <div className="space-y-4">
            {/* Header with App Selector */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Partner Connect SDK</h2>
                    <p className="text-sm text-gray-500">
                        Manage templates and generate integration code
                    </p>
                </div>

                {/* App Listing Selector - Compact */}
                {appListings && appListings.length > 0 && (
                    <div className="flex items-center gap-2">
                        <Layout className="w-4 h-4 text-gray-400" />
                        <select
                            value={selectedListing?.listing_id || ''}
                            onChange={(e) => {
                                const listing = appListings.find(l => l.listing_id === e.target.value);
                                setLocalSelectedListing(listing || null);
                            }}
                            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        >
                            {appListings.map(listing => (
                                <option key={listing.listing_id} value={listing.listing_id}>
                                    {listing.display_name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {listingsLoading && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
                    <span className="text-gray-600">Loading app listings...</span>
                </div>
            )}

            {!listingsLoading && (!appListings || appListings.length === 0) && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-3">
                        <Info className="w-5 h-5 text-amber-600" />
                        <div>
                            <p className="text-sm text-amber-800 font-medium">No app listings found</p>
                            <p className="text-xs text-amber-700">
                                Create an app listing in the &quot;App Listings&quot; tab first.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Navigation */}
            {selectedListing && (
                <>
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('templates')}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'templates'
                                    ? 'border-cyan-500 text-cyan-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <Award className="w-4 h-4" />
                            Templates
                        </button>

                        <button
                            onClick={() => setActiveTab('code')}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'code'
                                    ? 'border-cyan-500 text-cyan-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <Code className="w-4 h-4" />
                            Code
                        </button>

                        <button
                            onClick={() => setActiveTab('setup')}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === 'setup'
                                    ? 'border-cyan-500 text-cyan-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <Package className="w-4 h-4" />
                            Setup
                        </button>
                    </div>

                    {/* ============================================================ */}
                    {/* TEMPLATES TAB */}
                    {/* ============================================================ */}
                    {activeTab === 'templates' && (
                        <div className="space-y-4">
                            {/* Template Type Toggle */}
                            <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                                <button
                                    onClick={() => setTemplateType('issue-credentials')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        templateType === 'issue-credentials'
                                            ? 'bg-white text-gray-800 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-800'
                                    }`}
                                >
                                    <Award className="w-4 h-4" />
                                    Issue Credentials
                                </button>

                                <button
                                    onClick={() => setTemplateType('peer-badges')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        templateType === 'peer-badges'
                                            ? 'bg-white text-gray-800 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-800'
                                    }`}
                                >
                                    <Send className="w-4 h-4" />
                                    Peer Badges
                                </button>
                            </div>

                            {/* Template Type Description */}
                            <div className={`p-3 rounded-lg text-sm ${
                                templateType === 'issue-credentials'
                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                                    : 'bg-violet-50 border border-violet-200 text-violet-800'
                            }`}>
                                {templateType === 'issue-credentials' ? (
                                    <>
                                        <strong>Issue Credentials:</strong> Templates for credentials your app issues to users via <code className="bg-emerald-100 px-1 rounded">sendCredential()</code>
                                    </>
                                ) : (
                                    <>
                                        <strong>Peer Badges:</strong> Templates users can send to each other via <code className="bg-violet-100 px-1 rounded">initiateTemplateIssuance()</code>
                                    </>
                                )}
                            </div>

                            {/* Template List Manager */}
                            <TemplateListManager
                                listingId={selectedListing.listing_id}
                                integrationId={integration?.id}
                                featureType={templateType}
                                showCodeSnippets={true}
                                editable={true}
                            />
                        </div>
                    )}

                    {/* ============================================================ */}
                    {/* CODE TAB */}
                    {/* ============================================================ */}
                    {activeTab === 'code' && (
                        <div className="space-y-4">
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-cyan-100 rounded-lg">
                                            <Code className="w-5 h-5 text-cyan-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-800">Your Integration Code</h3>
                                            <p className="text-xs text-gray-500">
                                                {templates.length} template{templates.length !== 1 ? 's' : ''} configured
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleCopy(generatePersonalizedCode, 'personalized')}
                                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors"
                                    >
                                        {copied === 'personalized' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {copied === 'personalized' ? 'Copied!' : 'Copy All'}
                                    </button>
                                </div>

                                <div className="p-4">
                                    <CodeBlock code={generatePersonalizedCode} maxHeight="max-h-[500px]" />

                                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <p className="text-sm text-amber-800">
                                            <strong>💡 LLM-Ready:</strong> Copy this code and paste it into an AI assistant (like ChatGPT or Claude) along with your requirements. The <code className="bg-amber-100 px-1 rounded">@llm-config</code> section contains all your template URIs and settings.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ============================================================ */}
                    {/* SETUP TAB */}
                    {/* ============================================================ */}
                    {activeTab === 'setup' && (
                        <div className="space-y-4">
                            {/* Installation */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="p-4 bg-gray-50 border-b border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <Package className="w-5 h-5 text-cyan-600" />
                                        <div>
                                            <h3 className="font-medium text-gray-800">Installation & Setup</h3>
                                            <p className="text-xs text-gray-500">Install the SDK and initialize it in your app</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 space-y-4">
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
                            </div>

                            {/* API Reference */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <div className="p-4 bg-gray-50 border-b border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <Code className="w-5 h-5 text-gray-600" />
                                        <div>
                                            <h3 className="font-medium text-gray-800">API Reference</h3>
                                            <p className="text-xs text-gray-500">Explore all available SDK methods</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4">
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
                    )}
                </>
            )}
        </div>
    );
};
