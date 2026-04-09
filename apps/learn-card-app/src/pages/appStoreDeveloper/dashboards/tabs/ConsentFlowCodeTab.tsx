/**
 * ConsentFlowCodeTab - Code snippets & configuration for ConsentFlow integrations
 *
 * Provides developers with:
 * - Consent redirect URL builder with live preview
 * - Callback handler code (Node/Express)
 * - Credential sending after consent
 * - Consent data querying (getConsentFlowData)
 */

import React, { useState, useMemo } from 'react';
import {
    Copy,
    Check,
    ExternalLink,
    Webhook,
    Send,
    Database,
    Link2,
    Settings,
    Info,
} from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import { Clipboard } from '@capacitor/clipboard';
import { useToast, ToastTypeEnum } from 'learn-card-base';

import { useDeveloperPortal } from '../../useDeveloperPortal';
import { getAppBaseUrl } from '../../../../config/bootstrapTenantConfig';
import type { CredentialTemplate } from '../types';
import type { GuideState } from '../../guides/types';
import { CodeOutputPanel } from '../../guides/shared/CodeOutputPanel';

interface ConsentFlowCodeTabProps {
    integration: LCNIntegration;
    templates: CredentialTemplate[];
}

// Collapsible section component
const Section: React.FC<{
    icon: React.ElementType;
    iconColor: string;
    title: string;
    description: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}> = ({ icon: Icon, iconColor, title, description, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
            >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-opacity-10 ${iconColor.replace('text-', 'bg-')}`}>
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>

                <div className="flex-1 text-left">
                    <p className="font-medium text-gray-800 text-sm">{title}</p>
                    <p className="text-xs text-gray-500">{description}</p>
                </div>

                <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && <div className="px-4 pb-4 space-y-4">{children}</div>}
        </div>
    );
};

export const ConsentFlowCodeTab: React.FC<ConsentFlowCodeTabProps> = ({
    integration,
    templates,
}) => {
    const { presentToast } = useToast();
    const { useUpdateIntegration } = useDeveloperPortal();
    const updateIntegration = useUpdateIntegration();
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [editingCallbackUrl, setEditingCallbackUrl] = useState(false);
    const [callbackUrlDraft, setCallbackUrlDraft] = useState('');

    // Pull saved config from guide state
    const guideState = integration?.guideState as GuideState | undefined;
    const savedConfig = guideState?.config?.consentFlowConfig as {
        contractUri?: string;
        redirectUrl?: string;
        apiTokenGrantId?: string;
    } | undefined;

    const contractUri = savedConfig?.contractUri || '';
    const redirectUrl = savedConfig?.redirectUrl || '';
    const templateUri = templates[0]?.boostUri || '';

    const consentUrl = useMemo(() => {
        if (!contractUri) return '';
        const base = `${getAppBaseUrl()}/consent-flow`;
        const params = new URLSearchParams({ uri: contractUri });
        if (redirectUrl) params.set('returnTo', redirectUrl);
        return `${base}?${params.toString()}`;
    }, [contractUri, redirectUrl]);

    const handleCopy = async (text: string, id: string) => {
        try {
            await Clipboard.write({ string: text });
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            // Fallback for web
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        }
    };

    const CopyButton: React.FC<{ text: string; id: string; label?: string }> = ({ text, id, label }) => (
        <button
            onClick={() => handleCopy(text, id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
            {copiedId === id ? (
                <><Check className="w-3 h-3 text-emerald-500" />{label || 'Copied!'}</>
            ) : (
                <><Copy className="w-3 h-3" />{label || 'Copy'}</>
            )}
        </button>
    );

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Integration Code</h2>
                <p className="text-sm text-gray-500">
                    Code snippets and configuration for your consent flow integration
                </p>
            </div>

            {/* Consent URL Builder */}
            <Section
                icon={Link2}
                iconColor="text-cyan-600"
                title="Consent Redirect URL"
                description="The URL to redirect users to for granting consent"
            >
                {consentUrl ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500 font-medium">Live URL from your configuration:</p>
                            <CopyButton text={consentUrl} id="consent-url" />
                        </div>

                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <code className="text-xs text-gray-700 break-all">{consentUrl}</code>
                        </div>

                        <a
                            href={consentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Test Consent Flow
                        </a>
                    </div>
                ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-800">
                            <strong>Not configured:</strong> Complete the Build guide to set your contract URI and callback URL.
                        </p>
                    </div>
                )}

                <CodeOutputPanel
                    title="Build the consent URL"
                    snippets={{
                        typescript: `// Redirect the user to LearnCard's consent screen
const consentUrl = new URL('${getAppBaseUrl()}/consent-flow');
consentUrl.searchParams.set('uri', '${contractUri || 'YOUR_CONTRACT_URI'}');
consentUrl.searchParams.set('returnTo', '${redirectUrl || 'https://your-app.com/api/learncard/callback'}');

// Redirect (Express example)
res.redirect(consentUrl.toString());`,
                        curl: `# Consent URL format:
${getAppBaseUrl()}/consent-flow?uri=${encodeURIComponent(contractUri || 'YOUR_CONTRACT_URI')}&returnTo=${encodeURIComponent(redirectUrl || 'https://your-app.com/callback')}`,
                    }}
                />
            </Section>

            {/* Callback Handler */}
            <Section
                icon={Webhook}
                iconColor="text-violet-600"
                title="Callback Handler"
                description="Handle the redirect back from LearnCard after consent"
            >
                <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg">
                    <div className="flex gap-2">
                        <Info className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-violet-800">
                            After consent, LearnCard redirects to your <code className="bg-violet-100 px-1 rounded">returnTo</code> URL
                            with <code className="bg-violet-100 px-1 rounded">did</code> and <code className="bg-violet-100 px-1 rounded">vp</code> query parameters.
                        </p>
                    </div>
                </div>

                <CodeOutputPanel
                    title="Express callback handler"
                    snippets={{
                        typescript: `import { initLearnCard } from '@learncard/init';

// Initialize LearnCard with your API token (do this once at startup)
// Get your token from the API Tokens tab
const learnCard = await initLearnCard({
    apiKey: process.env.LEARNCARD_API_TOKEN!,
    network: true,
});

// Handle the consent callback
app.get('/api/learncard/callback', async (req, res) => {
    const { did, vp } = req.query;

    if (!did || !vp) {
        return res.status(400).json({ error: 'Missing did or vp parameter' });
    }

    // Verify the VP (optional but recommended)
    const verification = await learnCard.invoke.verifyPresentation(
        vp as string,
        { proofFormat: 'jwt' }
    );

    if (verification.errors.length > 0) {
        return res.status(401).json({ error: 'Invalid VP', details: verification.errors });
    }

    // Store the user's DID in your database
    await saveUserConsent({
        userId: req.session?.userId,
        learnCardDid: did as string,
        consentedAt: new Date(),
    });

    // Redirect to your app's success page
    res.redirect('/dashboard?consent=granted');
});`,
                        python: `from flask import Flask, request, redirect

app = Flask(__name__)

@app.route('/api/learncard/callback')
def learncard_callback():
    did = request.args.get('did')
    vp = request.args.get('vp')

    if not did or not vp:
        return {'error': 'Missing did or vp parameter'}, 400

    # Store the user's DID in your database
    save_user_consent(
        user_id=session.get('user_id'),
        learncard_did=did,
    )

    return redirect('/dashboard?consent=granted')`,
                    }}
                />
            </Section>

            {/* Send Credentials */}
            <Section
                icon={Send}
                iconColor="text-emerald-600"
                title="Send Credentials"
                description="Issue credentials to users who have consented"
            >
                <CodeOutputPanel
                    title="Send a credential after consent"
                    snippets={{
                        typescript: `// Get the user's DID (stored from the consent callback)
const userDID = await getUserLearnCardDID(userId);

// Send a credential to the user
const result = await learnCard.invoke.send({
    type: 'boost',
    recipient: userDID,
    contractUri: '${contractUri || 'YOUR_CONTRACT_URI'}',
    templateUri: '${templateUri || 'YOUR_TEMPLATE_URI'}',${integration.id ? `\n    integrationId: '${integration.id}',` : ''}
});

console.log('Credential sent:', result.credentialUri);`,
                        curl: `curl -X POST 'https://api.learncard.com/trpc/boost.send' \\
  -H 'Authorization: Bearer YOUR_API_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "type": "boost",
    "recipient": "did:web:...",
    "contractUri": "${contractUri || 'YOUR_CONTRACT_URI'}",
    "templateUri": "${templateUri || 'YOUR_TEMPLATE_URI'}"${integration.id ? `,\n    "integrationId": "${integration.id}"` : ''}
  }'`,
                    }}
                />

                {templates.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs text-gray-500 font-medium">Your Template URIs:</p>
                        {templates.filter(t => t.boostUri).map(t => (
                            <div key={t.id} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-700 truncate">{t.name}</p>
                                    <code className="text-xs text-gray-500 truncate block">{t.boostUri}</code>
                                </div>
                                <CopyButton text={t.boostUri!} id={`uri-${t.id}`} label="Copy URI" />
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            {/* Query Consent Data */}
            <Section
                icon={Database}
                iconColor="text-blue-600"
                title="Query Consent Data"
                description="Retrieve consent records and connected users"
                defaultOpen={false}
            >
                <CodeOutputPanel
                    title="Get all consent records for your contract"
                    snippets={{
                        typescript: `// Query all consent records
const consentData = await learnCard.invoke.getConsentFlowData(
    '${contractUri || 'YOUR_CONTRACT_URI'}',
    { limit: 50 }
);

console.log('Consented users:', consentData.records.length);
consentData.records.forEach(record => {
    console.log('  DID:', record.did);
    console.log('  Consented at:', record.date);
});`,
                    }}
                />

                <CodeOutputPanel
                    title="Get consent data for a specific user"
                    snippets={{
                        typescript: `// Query consent data for a specific DID
const userConsentData = await learnCard.invoke.getConsentFlowDataForDid(
    'did:web:...',
    { limit: 10 }
);

console.log('User consent records:', userConsentData.records);`,
                    }}
                />
            </Section>

            {/* Configuration Reference */}
            <Section
                icon={Settings}
                iconColor="text-gray-600"
                title="Settings"
                description="View and edit your integration configuration"
            >
                <div className="space-y-3">
                    {/* Integration ID (read-only) */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div>
                            <p className="text-xs text-gray-500">Integration ID</p>
                            <code className="text-xs text-gray-700 break-all">{integration.id}</code>
                        </div>
                        <CopyButton text={integration.id} id="config-integration-id" />
                    </div>

                    {/* Contract URI (read-only) */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div>
                            <p className="text-xs text-gray-500">Contract URI</p>
                            <code className="text-xs text-gray-700 break-all">{contractUri || '(not set)'}</code>
                        </div>
                        {contractUri && <CopyButton text={contractUri} id="config-contract-uri" />}
                    </div>

                    {/* Callback URL (editable) */}
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">Callback URL (returnTo)</p>
                            {!editingCallbackUrl && (
                                <button
                                    onClick={() => {
                                        setCallbackUrlDraft(redirectUrl || '');
                                        setEditingCallbackUrl(true);
                                    }}
                                    className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                                >
                                    Edit
                                </button>
                            )}
                        </div>

                        {editingCallbackUrl ? (
                            <div className="space-y-2">
                                <input
                                    type="url"
                                    value={callbackUrlDraft}
                                    onChange={(e) => setCallbackUrlDraft(e.target.value)}
                                    placeholder="https://your-app.com/api/learncard/callback"
                                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-mono"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={async () => {
                                            try {
                                                const currentGuideState = (integration.guideState || {}) as Record<string, any>;
                                                const currentConfig = currentGuideState.config || {};
                                                const currentCfConfig = currentConfig.consentFlowConfig || {};

                                                await updateIntegration.mutateAsync({
                                                    id: integration.id,
                                                    updates: {
                                                        guideState: {
                                                            ...currentGuideState,
                                                            config: {
                                                                ...currentConfig,
                                                                consentFlowConfig: {
                                                                    ...currentCfConfig,
                                                                    redirectUrl: callbackUrlDraft,
                                                                },
                                                            },
                                                        },
                                                    },
                                                });
                                                setEditingCallbackUrl(false);
                                                presentToast('Callback URL updated', { type: ToastTypeEnum.Success });
                                            } catch (err) {
                                                presentToast('Failed to update callback URL', { type: ToastTypeEnum.Error });
                                            }
                                        }}
                                        disabled={updateIntegration.isPending}
                                        className="px-3 py-1.5 text-xs bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 font-medium"
                                    >
                                        {updateIntegration.isPending ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => setEditingCallbackUrl(false)}
                                        className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <code className="text-xs text-gray-700 break-all block">
                                {redirectUrl || '(not set)'}
                            </code>
                        )}
                    </div>

                    {/* Templates count (read-only) */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div>
                            <p className="text-xs text-gray-500">Templates</p>
                            <code className="text-xs text-gray-700">{templates.filter(t => t.boostUri).length} saved</code>
                        </div>
                    </div>
                </div>
            </Section>
        </div>
    );
};
