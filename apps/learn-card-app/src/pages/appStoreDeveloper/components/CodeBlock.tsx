import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

/**
 * Simple syntax highlighter for TypeScript/JavaScript code
 */
export const highlightCode = (code: string): React.ReactNode[] => {
    const tokens: { type: string; value: string }[] = [];
    let remaining = code;

    const patterns: { type: string; regex: RegExp }[] = [
        { type: 'comment', regex: /^(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/ },
        { type: 'string', regex: /^(`[\s\S]*?`|'[^']*'|"[^"]*")/ },
        { type: 'keyword', regex: /^(const|let|var|function|async|await|return|import|export|from|if|else|for|while|class|new|typeof|instanceof|try|catch|throw|finally)\b/ },
        { type: 'boolean', regex: /^(true|false|null|undefined)\b/ },
        { type: 'function', regex: /^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/ },
        { type: 'property', regex: /^(\.[a-zA-Z_$][a-zA-Z0-9_$]*)/ },
        { type: 'number', regex: /^(\d+\.?\d*)/ },
        { type: 'punctuation', regex: /^([{}[\]();:,])/ },
        { type: 'operator', regex: /^(=>|===|!==|==|!=|<=|>=|&&|\|\||\?\.|[+\-*/%=<>!&|?])/ },
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
        text: 'text-gray-100',
        whitespace: '',
    };

    return tokens.map((token, i) => (
        <span key={i} className={colorMap[token.type] || 'text-gray-100'}>
            {token.value}
        </span>
    ));
};

interface CodeBlockProps {
    code: string;
    language?: string;
    className?: string;
    maxHeight?: string;
}

/**
 * Reusable code block component with syntax highlighting and copy button
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({ 
    code, 
    language = 'typescript',
    className = '',
    maxHeight = '',
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`relative group ${className}`}>
            <pre className={`p-4 bg-gray-900 rounded-xl text-xs overflow-x-auto ${maxHeight}`}>
                <code className="font-mono">{highlightCode(code)}</code>
            </pre>

            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Copy code"
            >
                {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                ) : (
                    <Copy className="w-4 h-4 text-gray-300" />
                )}
            </button>
        </div>
    );
};

export default CodeBlock;
