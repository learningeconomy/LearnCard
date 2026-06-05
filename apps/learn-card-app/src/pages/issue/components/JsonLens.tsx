import React, { useCallback, useMemo, useState } from 'react';
import { BadgeCheck, Check, Copy } from 'lucide-react';

import { getLogger } from 'learn-card-base';

const log = getLogger('json-lens');

interface JsonLensProps {
    credential: Record<string, unknown>;
}

const JsonHighlighter: React.FC<{ json: string }> = ({ json }) => {
    const highlighted = useMemo(
        () =>
            json
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"([^"]+)":/g, '<span class="text-cyan-400">"$1"</span>:')
                .replace(/: "([^"]*)"/g, ': <span class="text-emerald-400">"$1"</span>')
                .replace(/: (\d+)/g, ': <span class="text-amber-400">$1</span>')
                .replace(/: (true|false|null)/g, ': <span class="text-rose-400">$1</span>'),
        [json]
    );

    return <code dangerouslySetInnerHTML={{ __html: highlighted }} />;
};

export const JsonLens: React.FC<JsonLensProps> = ({ credential }) => {
    const [copied, setCopied] = useState(false);
    const json = useMemo(() => JSON.stringify(credential, null, 2), [credential]);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(json);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            log.error('json-lens.copy_failed', e);
        }
    }, [json]);

    return (
        <div className="animate-fade-in-up">
            <div className="flex items-center justify-between gap-3 mb-3">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-700">
                        Standards-compliant · OBv3 · VC 2.0
                    </span>
                </span>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200 text-xs font-medium transition-colors"
                >
                    {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                        <Copy className="w-3.5 h-3.5" />
                    )}
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <pre className="p-4 rounded-2xl bg-grayscale-900 text-grayscale-100 font-mono text-xs leading-relaxed overflow-auto max-h-[60vh]">
                <JsonHighlighter json={json} />
            </pre>
        </div>
    );
};
