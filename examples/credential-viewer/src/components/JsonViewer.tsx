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

const isUrlLike = (s: string): boolean =>
    s.includes('http://') || s.includes('https://') || s.includes('did:') || s.includes('urn:uuid:');

const syntaxHighlight = (json: string): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    let key = 0;
    let pos = 0;
    const len = json.length;

    const pushWhitespace = () => {
        const start = pos;

        while (pos < len && (json[pos] === ' ' || json[pos] === '\n' || json[pos] === '\r' || json[pos] === '\t')) {
            pos++;
        }

        if (pos > start) {
            nodes.push(json.slice(start, pos));
        }
    };

    const readString = (): string => {
        let result = '"';

        pos++; // skip opening quote

        while (pos < len) {
            const ch = json[pos];

            if (ch === '\\') {
                result += json[pos] + (json[pos + 1] ?? '');
                pos += 2;
            } else if (ch === '"') {
                result += '"';
                pos++;
                return result;
            } else {
                result += ch;
                pos++;
            }
        }

        return result;
    };

    const readWord = (): string => {
        const start = pos;

        while (pos < len && /[a-zA-Z0-9.+\-eE]/.test(json[pos])) {
            pos++;
        }

        return json.slice(start, pos);
    };

    while (pos < len) {
        pushWhitespace();

        if (pos >= len) break;

        const ch = json[pos];

        if (ch === '"') {
            const str = readString();

            pushWhitespace();

            if (pos < len && json[pos] === ':') {
                // Key
                nodes.push(<span key={key++} className={TOKEN_COLORS.key}>{str}</span>);
                nodes.push(<span key={key++} className={TOKEN_COLORS.punctuation}>:</span>);
                pos++; // skip colon
            } else {
                // String value
                const colorClass = isUrlLike(str) ? 'text-cyan-400' : TOKEN_COLORS.string;

                nodes.push(<span key={key++} className={colorClass}>{str}</span>);
            }
        } else if (ch === '{' || ch === '}' || ch === '[' || ch === ']' || ch === ',' || ch === ':') {
            nodes.push(<span key={key++} className={TOKEN_COLORS.punctuation}>{ch}</span>);
            pos++;
        } else if (ch === 't' || ch === 'f') {
            const word = readWord();

            nodes.push(<span key={key++} className={TOKEN_COLORS.boolean}>{word}</span>);
        } else if (ch === 'n') {
            const word = readWord();

            nodes.push(<span key={key++} className={TOKEN_COLORS.null}>{word}</span>);
        } else if (ch === '-' || (ch >= '0' && ch <= '9')) {
            const word = readWord();

            nodes.push(<span key={key++} className={TOKEN_COLORS.number}>{word}</span>);
        } else {
            // Unexpected character — emit as-is
            nodes.push(ch);
            pos++;
        }
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
