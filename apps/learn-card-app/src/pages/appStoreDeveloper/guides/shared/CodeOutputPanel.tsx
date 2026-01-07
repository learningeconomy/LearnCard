import React, { useState, useMemo } from 'react';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

type Language = 'typescript' | 'python' | 'curl';

interface CodeOutputPanelProps {
    snippets: {
        typescript?: string;
        python?: string;
        curl?: string;
    };
    title?: string;
    defaultLanguage?: Language;
    collapsible?: boolean;
    defaultExpanded?: boolean;
}

// Simple syntax highlighter
const highlightCode = (code: string): React.ReactNode[] => {
    const tokens: { type: string; value: string }[] = [];
    let remaining = code;

    const patterns: { type: string; regex: RegExp }[] = [
        { type: 'comment', regex: /^(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)/ },
        { type: 'string', regex: /^(`[\s\S]*?`|'[^']*'|"[^"]*")/ },
        { type: 'keyword', regex: /^(const|let|var|function|async|await|return|import|export|from|if|else|for|while|class|new|typeof|instanceof|def|import|from|as|try|except|with|async|await)\b/ },
        { type: 'boolean', regex: /^(true|false|null|undefined|None|True|False)\b/ },
        { type: 'function', regex: /^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/ },
        { type: 'property', regex: /^(\.[a-zA-Z_$][a-zA-Z0-9_$]*)/ },
        { type: 'number', regex: /^(\d+\.?\d*)/ },
        { type: 'punctuation', regex: /^([{}[\]();:,])/ },
        { type: 'operator', regex: /^(=>|===|!==|==|!=|<=|>=|&&|\|\||[+\-*/%=<>!&|])/ },
        { type: 'flag', regex: /^(-{1,2}[a-zA-Z][a-zA-Z0-9-]*)/ },
        { type: 'text', regex: /^[^\s]+/ },
        { type: 'whitespace', regex: /^(\s+)/ },
    ];

    while (remaining.length > 0) {
        let matched = false;

        for (const { type, regex } of patterns) {
            const match = remaining.match(regex);

            if (match) {
                tokens.push({ type, value: match[0] });
                remaining = remaining.slice(match[0].length);
                matched = true;
                break;
            }
        }

        if (!matched) {
            tokens.push({ type: 'text', value: remaining[0] });
            remaining = remaining.slice(1);
        }
    }

    const colorMap: Record<string, string> = {
        keyword: 'text-purple-400',
        string: 'text-green-400',
        comment: 'text-gray-500 italic',
        function: 'text-yellow-300',
        property: 'text-cyan-300',
        number: 'text-orange-400',
        boolean: 'text-orange-400',
        punctuation: 'text-gray-400',
        operator: 'text-pink-400',
        flag: 'text-cyan-400',
        text: 'text-gray-100',
        whitespace: '',
    };

    return tokens.map((token, i) => (
        <span key={i} className={colorMap[token.type] || 'text-gray-100'}>
            {token.value}
        </span>
    ));
};

const LANGUAGE_LABELS: Record<Language, string> = {
    typescript: 'TypeScript',
    python: 'Python',
    curl: 'cURL',
};

export const CodeOutputPanel: React.FC<CodeOutputPanelProps> = ({
    snippets,
    title = 'Code',
    defaultLanguage = 'typescript',
    collapsible = false,
    defaultExpanded = true,
}) => {
    const availableLanguages = useMemo(() => {
        return (Object.keys(snippets) as Language[]).filter(lang => snippets[lang]);
    }, [snippets]);

    const [selectedLanguage, setSelectedLanguage] = useState<Language>(
        availableLanguages.includes(defaultLanguage) ? defaultLanguage : availableLanguages[0]
    );

    const [copied, setCopied] = useState(false);
    const [expanded, setExpanded] = useState(defaultExpanded);

    const currentCode = snippets[selectedLanguage] || '';

    const handleCopy = async () => {
        await navigator.clipboard.writeText(currentCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (availableLanguages.length === 0) return null;

    return (
        <div className="border border-gray-700 rounded-xl overflow-hidden bg-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-3">
                    {collapsible && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="p-1 hover:bg-gray-700 rounded transition-colors"
                        >
                            {expanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                        </button>
                    )}

                    <span className="text-sm font-medium text-gray-300">{title}</span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Language selector */}
                    {availableLanguages.length > 1 && (
                        <div className="flex items-center bg-gray-700 rounded-lg p-0.5">
                            {availableLanguages.map(lang => (
                                <button
                                    key={lang}
                                    onClick={() => setSelectedLanguage(lang)}
                                    className={`
                                        px-2 py-1 text-xs font-medium rounded-md transition-colors
                                        ${selectedLanguage === lang
                                            ? 'bg-gray-600 text-white'
                                            : 'text-gray-400 hover:text-gray-200'
                                        }
                                    `}
                                >
                                    {LANGUAGE_LABELS[lang]}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Copy button */}
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3.5 h-3.5 text-green-400" />
                                <span className="text-green-400">Copied</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Code content */}
            {expanded && (
                <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
                    <code className="font-mono">{highlightCode(currentCode)}</code>
                </pre>
            )}
        </div>
    );
};

export default CodeOutputPanel;
