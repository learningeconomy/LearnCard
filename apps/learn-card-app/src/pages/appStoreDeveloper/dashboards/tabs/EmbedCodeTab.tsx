import React, { useState, useMemo, useEffect } from 'react';
import { Copy, Check, Award, ChevronDown } from 'lucide-react';
import { Clipboard } from '@capacitor/clipboard';
import type { LCNIntegration } from '@learncard/types';

import { useToast } from 'learn-card-base/hooks/useToast';
import type { CredentialTemplate } from '../types';
import { getResolvedTenantConfig } from '../../../../config/bootstrapTenantConfig';

interface EmbedClaimConfig {
    partnerName?: string;
    branding?: { primaryColor: string; accentColor: string; partnerLogoUrl?: string };
    requestBackgroundIssuance?: boolean;
}

interface EmbedCodeTabProps {
    integration: LCNIntegration;
    templates?: CredentialTemplate[];
}

/** Escape backslashes and single quotes in user-provided strings for safe JS string interpolation */
const safe = (str: string): string => str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

/**
 * Build the branding block for generated snippets, conditionally including partnerLogoUrl
 */
function buildBrandingBlock(branding: EmbedClaimConfig['branding'], indent: string): string {
    const primaryColor = branding?.primaryColor || '#1F51FF';
    const accentColor = branding?.accentColor || '#0F3BD9';
    const logoLine = branding?.partnerLogoUrl
        ? `${indent}  partnerLogoUrl: '${safe(branding.partnerLogoUrl)}',`
        : `${indent}  // partnerLogoUrl: "https://your-logo.png",`;

    return [
        `${indent}branding: {`,
        `${indent}  primaryColor: '${primaryColor}',`,
        `${indent}  accentColor: '${accentColor}',`,
        logoLine,
        `${indent}},`,
    ].join('\n');
}

function buildHtmlSnippet(
    credentialName: string,
    publishableKey: string,
    partnerName: string,
    branding: EmbedClaimConfig['branding'],
    requestBackgroundIssuance: boolean
): string {
    const brandingBlock = buildBrandingBlock(branding, '      ');

    return `<!-- LearnCard Claim Button -->
<div id="learncard-claim"></div>
<script src="https://cdn.jsdelivr.net/npm/@learncard/embed-sdk@latest/dist/learncard.js" defer></script>
<script>
  window.addEventListener('DOMContentLoaded', function() {
    LearnCard.init({
      target: '#learncard-claim',
      publishableKey: '${safe(publishableKey)}',
      partnerName: '${safe(partnerName)}',
      credential: { name: '${safe(credentialName)}' },
${brandingBlock}
      requestBackgroundIssuance: ${requestBackgroundIssuance},
      onSuccess: function(details) {
        console.log('Claimed!', details.credentialId);
      },
    });
  });
</script>`;
}

function buildReactSnippet(
    credentialName: string,
    publishableKey: string,
    partnerName: string,
    branding: EmbedClaimConfig['branding'],
    requestBackgroundIssuance: boolean
): string {
    const brandingBlock = buildBrandingBlock(branding, '      ');

    return `import { useRef, useEffect } from 'react';
import { init } from '@learncard/embed-sdk';

function ClaimButton() {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!targetRef.current) return;
    init({
      target: targetRef.current,
      publishableKey: '${safe(publishableKey)}',
      partnerName: '${safe(partnerName)}',
      credential: { name: '${safe(credentialName)}' },
${brandingBlock}
      requestBackgroundIssuance: ${requestBackgroundIssuance},
      onSuccess: (details) => {
        console.log('Claimed!', details.credentialId);
      },
    });
  }, []);

  return <div ref={targetRef} />;
}`;
}

export const EmbedCodeTab: React.FC<EmbedCodeTabProps> = ({ integration, templates = [] }) => {
    const { presentToast } = useToast();

    const [copied, setCopied] = useState<string | null>(null);
    const [selectedTemplateIdx, setSelectedTemplateIdx] = useState<number>(0);

    // Read persisted config from integration guideState
    const guideState = integration.guideState as
        | { config?: { embedClaimConfig?: EmbedClaimConfig } }
        | undefined;
    const config = guideState?.config?.embedClaimConfig;

    const publishableKey = integration.publishableKey || 'YOUR_PUBLISHABLE_KEY';
    const partnerName = config?.partnerName || '';
    const branding = config?.branding;
    const requestBackgroundIssuance = config?.requestBackgroundIssuance ?? false;

    // Build snippets per template, or a generic one if no templates exist
    const snippets = useMemo(() => {
        if (templates.length > 0) {
            return templates.map(t => ({
                name: t.name,
                htmlCode: buildHtmlSnippet(t.name, publishableKey, partnerName, branding, requestBackgroundIssuance),
                reactCode: buildReactSnippet(t.name, publishableKey, partnerName, branding, requestBackgroundIssuance),
            }));
        }

        return [{
            name: 'My Credential',
            htmlCode: buildHtmlSnippet('My Credential', publishableKey, partnerName, branding, requestBackgroundIssuance),
            reactCode: buildReactSnippet('My Credential', publishableKey, partnerName, branding, requestBackgroundIssuance),
        }];
    }, [templates, publishableKey, partnerName, branding, requestBackgroundIssuance]);

    // Reset index when templates array shrinks below current selection
    useEffect(() => {
        if (selectedTemplateIdx >= snippets.length) {
            setSelectedTemplateIdx(0);
        }
    }, [snippets.length, selectedTemplateIdx]);

    const currentSnippet = snippets[selectedTemplateIdx] || snippets[0];
    const npmCode = `npm install @learncard/embed-sdk`;

    const copyCode = async (code: string, id: string) => {
        await Clipboard.write({ string: code });
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
        presentToast('Code copied!', { hasDismissButton: true });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Embed Code</h2>
                <p className="text-sm text-gray-500">Copy and paste into your website to add a claim button</p>
            </div>

            {/* Publishable Key */}
            <div className="p-4 bg-pink-50 border border-pink-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-pink-800">Your Publishable Key</label>
                    <button
                        onClick={() => copyCode(publishableKey, 'key')}
                        className="text-xs text-pink-700 hover:text-pink-800 flex items-center gap-1"
                    >
                        {copied === 'key' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied === 'key' ? 'Copied!' : 'Copy'}
                    </button>
                </div>
                <div className="px-3 py-2 bg-white border border-pink-200 rounded-lg font-mono text-sm text-gray-700 break-all">
                    {publishableKey}
                </div>
            </div>

            {/* Template Selector */}
            {snippets.length > 1 && (
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Select Template
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {snippets.map((snippet, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedTemplateIdx(idx)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                                    idx === selectedTemplateIdx
                                        ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                                        : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <Award className="w-3.5 h-3.5" />
                                {snippet.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* HTML Snippet */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-800">
                        HTML Snippet
                        {snippets.length > 1 && (
                            <span className="text-sm font-normal text-gray-500 ml-2">
                                ({currentSnippet.name})
                            </span>
                        )}
                    </h3>
                    <button
                        onClick={() => copyCode(currentSnippet.htmlCode, 'html')}
                        className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
                    >
                        {copied === 'html' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied === 'html' ? 'Copied!' : 'Copy'}
                    </button>
                </div>
                <pre className="p-4 bg-gray-900 text-gray-100 rounded-xl text-sm overflow-x-auto">
                    <code>{currentSnippet.htmlCode}</code>
                </pre>
            </div>

            {/* React/npm */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-800">
                        React / npm
                        {snippets.length > 1 && (
                            <span className="text-sm font-normal text-gray-500 ml-2">
                                ({currentSnippet.name})
                            </span>
                        )}
                    </h3>
                    <button
                        onClick={() => copyCode(currentSnippet.reactCode, 'react')}
                        className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
                    >
                        {copied === 'react' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied === 'react' ? 'Copied!' : 'Copy'}
                    </button>
                </div>
                <div className="mb-2">
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm">{npmCode}</code>
                </div>
                <pre className="p-4 bg-gray-900 text-gray-100 rounded-xl text-sm overflow-x-auto">
                    <code>{currentSnippet.reactCode}</code>
                </pre>
            </div>

            {/* SDK Reference */}
            <details className="group rounded-xl border border-gray-200 bg-gray-50">
                <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-medium text-gray-700 select-none [&::-webkit-details-marker]:hidden list-none">
                    <span>SDK Reference &mdash; <code className="text-xs font-normal text-gray-500">InitOptions</code></span>
                    <ChevronDown className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-4 pb-4">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 text-left text-gray-500">
                                <th className="py-1.5 pr-2 font-medium">Prop</th>
                                <th className="py-1.5 pr-2 font-medium">Type</th>
                                <th className="py-1.5 font-medium">Description</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            <tr className="border-b border-gray-100">
                                <td className="py-1.5 pr-2 font-mono">target<span className="text-red-500">*</span></td>
                                <td className="py-1.5 pr-2 font-mono text-gray-500">string | HTMLElement</td>
                                <td className="py-1.5">CSS selector or DOM element to render the claim button into.</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-1.5 pr-2 font-mono">credential<span className="text-red-500">*</span></td>
                                <td className="py-1.5 pr-2 font-mono text-gray-500">{`{ name: string }`}</td>
                                <td className="py-1.5">Credential template to issue. Use the template name — the server resolves it.</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-1.5 pr-2 font-mono">publishableKey</td>
                                <td className="py-1.5 pr-2 font-mono text-gray-500">string</td>
                                <td className="py-1.5">Your integration&apos;s publishable key.</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-1.5 pr-2 font-mono">partnerName</td>
                                <td className="py-1.5 pr-2 font-mono text-gray-500">string</td>
                                <td className="py-1.5">Displayed in the claim modal header.</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-1.5 pr-2 font-mono">branding</td>
                                <td className="py-1.5 pr-2 font-mono text-gray-500">BrandingTokens</td>
                                <td className="py-1.5">
                                    <code>primaryColor</code>, <code>accentColor</code>, <code>partnerLogoUrl</code>, <code>logoUrl</code>, <code>walletUrl</code>.
                                </td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-1.5 pr-2 font-mono text-nowrap">requestBackgroundIssuance</td>
                                <td className="py-1.5 pr-2 font-mono text-gray-500">boolean</td>
                                <td className="py-1.5">If true, asks user for consent to issue future credentials without email verification.</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-1.5 pr-2 font-mono">onSuccess</td>
                                <td className="py-1.5 pr-2 font-mono text-gray-500">{`(details) => void`}</td>
                                <td className="py-1.5">
                                    Called after a successful claim. Receives <code>credentialId</code>, <code>consentGiven</code>, and <code>handoffUrl</code>.
                                </td>
                            </tr>
                            <tr>
                                <td className="py-1.5 pr-2 font-mono">apiBaseUrl</td>
                                <td className="py-1.5 pr-2 font-mono text-gray-500">string</td>
                                <td className="py-1.5">Override the API endpoint. Defaults to <code>{getResolvedTenantConfig().apis.brainServiceApi}</code>.</td>
                            </tr>
                        </tbody>
                    </table>
                    <p className="mt-2 text-xs text-gray-400">
                        <span className="text-red-500">*</span> Required. All other props are optional.
                    </p>
                </div>
            </details>
        </div>
    );
};
