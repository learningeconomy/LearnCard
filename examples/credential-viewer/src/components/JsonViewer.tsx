import React, { useMemo } from 'react';

interface JsonViewerProps {
    data: unknown;
    collapsed?: boolean;
}

type TokenType = 'key' | 'string' | 'number' | 'boolean' | 'null' | 'punctuation';

const TOKEN_COLORS: Record<TokenType, string> = {
    key: 'text-sky-300',
    string: 'text-emerald-300',
    number: 'text-amber-300',
    boolean: 'text-violet-400',
    null: 'text-gray-500',
    punctuation: 'text-gray-500',
};

const syntaxHighlight = (json: string): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    let i = 0;

    const regex =
        /("(?:\\.|[^"\\])*")\s*:|("(?:\\.|[^"\\])*")|(true|false)|(null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\]:,])/g;

    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = regex.exec(json)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(json.slice(lastIndex, match.index));
        }

        if (match[1] !== undefined) {
            // Key
            nodes.push(
                <span key={i++} className={TOKEN_COLORS.key}>
                    {match[1]}
                </span>
            );

            const colonIdx = json.indexOf(':', match.index + match[1].length);

            if (colonIdx !== -1 && colonIdx < match.index + match[0].length) {
                nodes.push(
                    <span key={i++} className={TOKEN_COLORS.punctuation}>
                        :
                    </span>
                );
            }
        } else if (match[2] !== undefined) {
            // String value
            const isUrl =
                match[2].includes('http://') ||
                match[2].includes('https://') ||
                match[2].includes('did:') ||
                match[2].includes('urn:uuid:');

            nodes.push(
                <span key={i++} className={isUrl ? 'text-cyan-400' : TOKEN_COLORS.string}>
                    {match[2]}
                </span>
            );
        } else if (match[3] !== undefined) {
            // Boolean
            nodes.push(
                <span key={i++} className={TOKEN_COLORS.boolean}>
                    {match[3]}
                </span>
            );
        } else if (match[4] !== undefined) {
            // Null
            nodes.push(
                <span key={i++} className={TOKEN_COLORS.null}>
                    null
                </span>
            );
        } else if (match[5] !== undefined) {
            // Number
            nodes.push(
                <span key={i++} className={TOKEN_COLORS.number}>
                    {match[5]}
                </span>
            );
        } else if (match[6] !== undefined) {
            // Punctuation
            nodes.push(
                <span key={i++} className={TOKEN_COLORS.punctuation}>
                    {match[6]}
                </span>
            );
        }

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < json.length) {
        nodes.push(json.slice(lastIndex));
    }

    return nodes;
};

export const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
    const highlighted = useMemo(() => {
        const json = JSON.stringify(data, null, 2);

        return syntaxHighlight(json);
    }, [data]);

    return (
        <pre className="font-mono text-sm leading-relaxed p-4 bg-gray-900 rounded-lg border border-gray-800 overflow-x-auto">
            <code>{highlighted}</code>
        </pre>
    );
};
