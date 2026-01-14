import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Clipboard } from '@capacitor/clipboard';
import type { LCNIntegration } from '@learncard/types';

import { useToast } from 'learn-card-base/hooks/useToast';

interface EmbedCodeTabProps {
    integration: LCNIntegration;
}

export const EmbedCodeTab: React.FC<EmbedCodeTabProps> = ({ integration }) => {
    const { presentToast } = useToast();
    const [copied, setCopied] = useState<string | null>(null);

    const publishableKey = integration.publishableKey;

    const htmlCode = `<!-- LearnCard Claim Button -->
<div id="learncard-claim"></div>
<script src="https://cdn.learncard.com/embed-sdk.js"></script>
<script>
  LearnCard.init({
    target: '#learncard-claim',
    publishableKey: '${publishableKey}',
    // Configure your credential here
  });
</script>`;

    const npmCode = `npm install @learncard/embed-sdk`;

    const reactCode = `import { LearnCardEmbed } from '@learncard/embed-sdk';

function ClaimButton() {
  return (
    <LearnCardEmbed
      publishableKey="${publishableKey}"
      // Configure your credential here
    />
  );
}`;

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
                <p className="text-sm text-gray-500">Add a claim button to your website</p>
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

            {/* HTML Snippet */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-800">HTML Snippet</h3>

                    <button
                        onClick={() => copyCode(htmlCode, 'html')}
                        className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
                    >
                        {copied === 'html' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied === 'html' ? 'Copied!' : 'Copy'}
                    </button>
                </div>

                <pre className="p-4 bg-gray-900 text-gray-100 rounded-xl text-sm overflow-x-auto">
                    <code>{htmlCode}</code>
                </pre>
            </div>

            {/* React/npm */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-800">React / npm</h3>

                    <button
                        onClick={() => copyCode(reactCode, 'react')}
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
                    <code>{reactCode}</code>
                </pre>
            </div>
        </div>
    );
};
