import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';

import 'katex/dist/katex.min.css';

import CodeHighlighter, { isInlineCode } from './CodeHighlighter';

interface MarkdownRendererProps {
    children?: string | null;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ children }) => {
    return (
        <ReactMarkdown
            rehypePlugins={[rehypeKatex]}
            remarkPlugins={[remarkMath, remarkGfm]}
            components={{
                code({ children: codeChildren, className, node, ...rest }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isText = match?.[1] === 'text' || !match?.[1];
                    const isInline = node && isInlineCode(node);

                    if (isInline) {
                        return (
                            <code
                                className={`${className} not-prose bg-gray-100 p-0.5 rounded`}
                                {...rest}
                                children={String(codeChildren).replace(/\n$/, '')}
                            />
                        );
                    }

                    return (
                        <CodeHighlighter
                            showLanguage={!isText}
                            language={match?.[1] || 'text'}
                        >
                            {String(codeChildren).replace(/\n$/, '')}
                        </CodeHighlighter>
                    );
                },
            }}
        >
            {children}
        </ReactMarkdown>
    );
};

export default MarkdownRenderer;

