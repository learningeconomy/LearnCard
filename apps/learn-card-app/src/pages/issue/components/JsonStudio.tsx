import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, BadgeCheck, Check, Copy, Loader2 } from 'lucide-react';

import { getLogger } from 'learn-card-base';

import type { CredentialIdentity } from './useCredentialIdentity';
import * as m from '../../../paraglide/messages.js';

const log = getLogger('json-studio');

interface JsonStudioProps {
    credential: Record<string, unknown>;
    identity: CredentialIdentity;
    onChange: (json: Record<string, unknown>) => void;
    onParseError: (error: string | null) => void;
}

const friendlyJsonError = (text: string, error: unknown): string => {
    const message = error instanceof Error ? error.message : String(error);
    const positionMatch = message.match(/position (\d+)/i);
    if (positionMatch) {
        const position = Number(positionMatch[1]);
        const line = text.slice(0, position).split('\n').length;
        return m['issueFlow.invalidJsonLine']({ line });
    }
    return m['issueFlow.invalidJson']();
};

const IdentityBadge: React.FC<{ identity: CredentialIdentity }> = ({ identity }) => {
    if (identity.status === 'empty') return null;

    if (identity.status === 'checking') {
        return (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-grayscale-100 border border-grayscale-200">
                <Loader2 className="w-3.5 h-3.5 text-grayscale-500 animate-spin" />
                <span className="text-xs font-medium text-grayscale-600">
                    {m['issueFlow.checking']()}
                </span>
            </span>
        );
    }

    if (identity.status === 'invalid') {
        return (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-100">
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs font-medium text-red-700">{identity.reason}</span>
            </span>
        );
    }

    return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
            <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-700">
                {m['issueFlow.valid']()} · {identity.label}
            </span>
        </span>
    );
};

export const JsonStudio: React.FC<JsonStudioProps> = ({
    credential,
    identity,
    onChange,
    onParseError,
}) => {
    const [text, setText] = useState(() => JSON.stringify(credential, null, 2));
    const [copied, setCopied] = useState(false);

    // While the textarea is focused the user's text is the sole source of truth:
    // we never reseed it from upstream (which re-normalizes the JSON and would
    // yank the content out from under the cursor). External loads only land while
    // unfocused. The debounce defers parse + emit until typing pauses, so the
    // identity badge waits for a complete edit instead of flickering per keystroke.
    const focused = useRef(false);
    const syncTimer = useRef<ReturnType<typeof setTimeout>>();

    const sync = useCallback(
        (value: string) => {
            try {
                const parsed = JSON.parse(value);
                if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                    onParseError(m['issueFlow.mustBeJsonObject']());
                    return;
                }
                onParseError(null);
                onChange(parsed as Record<string, unknown>);
            } catch (e) {
                onParseError(friendlyJsonError(value, e));
            }
        },
        [onChange, onParseError]
    );

    useEffect(() => {
        if (focused.current) return;
        const incoming = JSON.stringify(credential, null, 2);
        setText(prev => (prev === incoming ? prev : incoming));
        onParseError(null);
    }, [credential, onParseError]);

    useEffect(() => () => clearTimeout(syncTimer.current), []);

    const handleChange = useCallback(
        (value: string) => {
            setText(value);
            clearTimeout(syncTimer.current);
            syncTimer.current = setTimeout(() => sync(value), 500);
        },
        [sync]
    );

    const handleBlur = useCallback(() => {
        focused.current = false;
        clearTimeout(syncTimer.current);
        sync(text);
    }, [sync, text]);

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            log.error('json-studio.copy_failed', e);
        }
    }, [text]);

    const lineCount = useMemo(() => text.split('\n').length, [text]);

    return (
        <div className="animate-fade-in-up">
            <div className="flex items-center justify-between gap-3 mb-3">
                <IdentityBadge identity={identity} />
                <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200 text-xs font-medium transition-colors shrink-0"
                >
                    {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                        <Copy className="w-3.5 h-3.5" />
                    )}
                    {copied ? m['issueFlow.copied']() : m['issueFlow.copy']()}
                </button>
            </div>
            <textarea
                value={text}
                onChange={e => handleChange(e.target.value)}
                onFocus={() => {
                    focused.current = true;
                }}
                onBlur={handleBlur}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                rows={Math.min(Math.max(lineCount + 1, 12), 32)}
                className={`w-full p-4 rounded-2xl bg-grayscale-900 text-grayscale-100 font-mono text-xs leading-relaxed resize-y focus:outline-none focus:ring-2 ${
                    identity.status === 'invalid' ? 'focus:ring-red-500' : 'focus:ring-emerald-500'
                }`}
            />
            <p className="mt-2 text-xs text-grayscale-400 leading-relaxed">
                {m['issueFlow.jsonStudioHint']()}
            </p>
        </div>
    );
};
